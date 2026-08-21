"""
Chat API endpoints.
"""
import asyncio
import json
import re
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas import ChatMessageCreate, ChatMessageResponse, ChatResponse, Citation
from app.models import ChatMessage, MedicalReport, MedicalImage
from app.core.security import verify_token
from app.utils.logger import get_logger

try:
    from app.services.report_analysis_service import MedicalReportAnalysisService, GeminiService
    from google.genai import types
except Exception:
    MedicalReportAnalysisService = None
    GeminiService = None
    types = None

logger = get_logger("chat_routes")

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("", response_model=ChatResponse)
async def send_message(
    message_data: ChatMessageCreate,
    current_user_id: int = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Send a chat message and get AI response."""
    try:
        report_id = getattr(message_data, "report_id", None)
        image_id = getattr(message_data, "image_id", None)

        user_message = ChatMessage(
            user_id=current_user_id,
            role="user",
            content=message_data.content
        )
        db.add(user_message)
        db.commit()
        db.refresh(user_message)

        ai_response_text, citations, follow_up_questions = await generate_ai_response(
            user_question=message_data.content,
            report_id=report_id,
            image_id=image_id,
            db=db,
            current_user_id=current_user_id,
        )

        assistant_message = ChatMessage(
            user_id=current_user_id,
            role="assistant",
            content=ai_response_text,
            citations=citations
        )
        db.add(assistant_message)
        db.commit()
        db.refresh(assistant_message)

        logger.info(f"Chat message processed for user {current_user_id}")

        return {
            "message": {
                "id": assistant_message.id,
                "role": assistant_message.role,
                "content": assistant_message.content,
                "citations": citations,
                "created_at": assistant_message.created_at.isoformat() if assistant_message.created_at else None,
            },
            "citations": citations,
            "follow_up_questions": follow_up_questions,
        }

    except Exception as e:
        db.rollback()
        logger.error(f"Error processing chat message: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing message"
        )


@router.get("/history", response_model=List[ChatMessageResponse])
async def get_chat_history(
    session_id: str = None,
    current_user_id: int = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get chat history for current user."""
    messages = db.query(ChatMessage).filter(
        ChatMessage.user_id == current_user_id
    ).order_by(ChatMessage.created_at).all()

    return messages


@router.get("/count")
async def get_chat_count(
    current_user_id: int = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get chat message count for current user."""
    count = db.query(ChatMessage).filter(
        ChatMessage.user_id == current_user_id
    ).count()
    return {"count": count}


@router.delete("/clear", status_code=status.HTTP_204_NO_CONTENT)
async def clear_chat_history(
    current_user_id: int = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Clear chat history for current user."""
    try:
        db.query(ChatMessage).filter(
            ChatMessage.user_id == current_user_id
        ).delete()
        db.commit()
        logger.info(f"Chat history cleared for user {current_user_id}")
    except Exception as e:
        db.rollback()
        logger.error(f"Error clearing chat history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error clearing chat history"
        )


async def _call_gemini(
    gemini: GeminiService,
    prompt: str,
    system_instruction: str,
) -> str:
    """Call Gemini and return text."""
    response = await asyncio.to_thread(
        gemini.client.models.generate_content,
        model=gemini.model,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.2,
        ),
    )
    return getattr(response, "text", "") or ""


async def generate_ai_response(
    user_question: str,
    report_id: Optional[int],
    image_id: Optional[int],
    db: Session,
    current_user_id: int,
) -> tuple[str, List[dict[str, str]], List[str]]:
    if not MedicalReportAnalysisService or not GeminiService:
        return (
            "AI chat is not configured.",
            [{"title": "Configuration", "source": "MedIntel"}],
        )

    analysis_service = MedicalReportAnalysisService()
    selected_context = ""
    context_type = ""
    analysis: dict[str, Any] = {}
    image_context: dict[str, Any] = {}

    if report_id is not None:
        report = db.query(MedicalReport).filter(
            MedicalReport.id == report_id,
            MedicalReport.user_id == current_user_id,
        ).first()
        if not report:
            return ("Report not found or not accessible.", [])
        analysis = await analysis_service.get_analysis(db, report)
        selected_context = json.dumps(analysis, ensure_ascii=False, default=str)
        context_type = "medical_report"

    elif image_id is not None:
        image = db.query(MedicalImage).filter(
            MedicalImage.id == image_id,
            MedicalImage.user_id == current_user_id,
        ).first()
        if not image:
            return ("Medical image not found or not accessible.", [])
        image_context = {
            "filename": image.original_filename,
            "image_type": image.image_type,
            "status": image.status.value if hasattr(image.status, "value") else str(image.status),
            "analysis_status": image.analysis_status,
            "detected_condition": image.detected_condition,
            "confidence": image.confidence,
            "findings": image.findings or [],
            "recommendations": image.recommendations or [],
        }
        selected_context = json.dumps(image_context, ensure_ascii=False, default=str)
        context_type = "medical_image"
        if not image.analysis_status or image.analysis_status.lower() in {"uploaded", "pending", "processing", "failed"}:
            selected_context += "\n\nIMPORTANT: This image has not been sufficiently analyzed. Do not invent findings. Tell the user the image analysis is not available and suggest discussing it with a clinician."

    else:
        selected_context = "No specific report or image selected."
        context_type = "general"

    try:
        evidence_sources, _ = await analysis_service.embedding_store.retrieve([user_question])
    except Exception as exc:
        logger.warning("Chat RAG retrieval failed: %s", exc)
        evidence_sources = []

    evidence_context = "\n\n".join(
        f"SOURCE ID: {s.citation_id}\nTITLE: {s.title}\nORGANIZATION: {s.organization}\nYEAR: {s.year}\nTYPE: {s.source_type}\nURL: {s.url}\nEVIDENCE: {s.excerpt}"
        for s in evidence_sources[:5]
    )

    system_instruction = (
        "You are MedIntel AI, a medical information assistant.\n\n"
        "Your goal is to answer the user's CURRENT question using the currently selected medical report/image as the authoritative patient-specific context.\n\n"
        "RULES:\n"
        "1. Do not invent patient information, values, diagnoses, or test results.\n"
        "2. Clearly distinguish facts from the selected report/image from general medical information.\n"
        "3. Answer the specific question directly. Do not repeat the entire report unless explicitly asked.\n"
        "4. Do not present possible conditions as confirmed diagnoses.\n"
        "5. Do not prescribe medication or recommend dosage changes.\n"
        "6. Include a brief disclaimer only when giving medical interpretation: 'This is educational information, not medical advice.'\n"
        "7. NEVER expose internal citation IDs such as [nih_cbc], [acc_aha_2018], etc. in the user-facing answer. Do not include SOURCE IDs in your answer text.\n"
        "8. If you reference a source, describe it naturally, for example: 'According to NIH guidance on complete blood count...'\n\n"
        "FORMAT:\n"
        "- Be concise and conversational.\n"
        "- Use short paragraphs.\n"
        "- Use simple bullet lists only when they improve readability.\n"
        "- Do not generate a full report structure (Patient / Key Findings / Interpretation / Recommendations) unless explicitly asked.\n"
        "- Explain medical terminology in plain language when helpful.\n"
    )

    prompt = (
        f"SELECTED MEDICAL CONTEXT ({context_type}):\n{selected_context[:8000]}\n\n"
        f"RETRIEVED MEDICAL EVIDENCE:\n{evidence_context[:4000]}\n\n"
        f"USER QUESTION:\n{user_question}\n\n"
        "Answer the question conversationally using the provided context and evidence. "
        "Do not expose internal citation IDs in your answer."
    )

    gemini = GeminiService()
    if not gemini.enabled or gemini.client is None:
        return (
            "AI analysis is not configured. Please set GEMINI_API_KEY in the backend environment.",
            [{"title": s.title, "source": s.organization} for s in evidence_sources[:3]],
        )

    try:
        response_text = await _call_gemini(
            gemini=gemini,
            prompt=prompt,
            system_instruction=system_instruction,
        )
        response_text = re.sub(r"\[[a-zA-Z0-9_]{2,}\]", "", response_text)
        response_text = re.sub(r"\s{2,}", " ", response_text).strip()
    except Exception as exc:
        logger.error("Gemini chat generation failed: %s", exc)
        return (
            "AI analysis could not be completed. Please try again later.",
            [{"title": s.title, "source": s.organization} for s in evidence_sources[:3]],
        )

    if not response_text.strip():
        return (
            "AI analysis could not be completed. Please try again later.",
            [{"title": s.title, "source": s.organization} for s in evidence_sources[:3]],
        )

    citations = [
        {"title": s.title, "source": s.organization or s.url}
        for s in evidence_sources[:3]
    ]

    follow_up_questions = _generate_follow_up_questions(
        context_type=context_type,
        user_question=user_question,
        response_text=response_text.strip(),
        evidence_sources=evidence_sources,
        analysis=analysis if report_id is not None else {},
        image_context=image_context if image_id is not None else {},
    )

    return (response_text.strip(), citations, follow_up_questions)


def _generate_follow_up_questions(
    context_type: str,
    user_question: str,
    response_text: str,
    evidence_sources: List[Any],
    analysis: dict[str, Any],
    image_context: dict[str, Any],
) -> List[str]:
    """Generate simple context-aware follow-up questions without extra LLM calls."""
    questions: List[str] = []
    lower_question = user_question.lower()
    findings = analysis.get("findings", []) or []
    abnormal = [f for f in findings if str(f.get("status", "")).upper() in {"HIGH", "LOW", "ABNORMAL"}]
    recommendations = analysis.get("recommendations", []) or []

    if context_type == "medical_report":
        if "summarize" in lower_question or "summary" in lower_question:
            if abnormal:
                questions.append("What abnormalities were found?")
            questions.extend([
                "Explain the abnormal findings",
                "What should I discuss with my doctor?",
                "Explain this in simple terms",
            ])
        elif "abnormal" in lower_question:
            if any("LDL" in str(f.get("test_name", "")) or "triglyceride" in str(f.get("test_name", "")).lower() for f in abnormal):
                questions.extend([
                    "What does my LDL level mean?",
                    "Why might my triglycerides be high?",
                    "What lifestyle changes could help?",
                    "What should I ask my doctor?",
                ])
            elif any("glucose" in str(f.get("test_name", "")).lower() or "hba1c" in str(f.get("test_name", "")).lower() for f in abnormal):
                questions.extend([
                    "Why is glucose abnormal?",
                    "What does this mean for my health?",
                    "What follow-up tests might be considered?",
                    "What should I discuss with my doctor?",
                ])
            elif any("lymphocyte" in str(f.get("test_name", "")).lower() or "monocyte" in str(f.get("test_name", "")).lower() or "mchc" in str(f.get("test_name", "")).lower() for f in abnormal):
                questions.extend([
                    "What do these abnormal values mean?",
                    "Are these findings usually significant?",
                    "What should I discuss with my doctor?",
                ])
            else:
                questions.extend([
                    "Explain these findings in simple terms",
                    "What should I discuss with my doctor?",
                ])
        elif "why" in lower_question:
            questions.extend([
                "What does this finding mean?",
                "What follow-up tests might a doctor consider?",
                "What should I ask my doctor?",
            ])
        else:
            questions.extend([
                "What abnormalities were found?",
                "Explain this in simple terms",
                "What should I ask my doctor?",
            ])
    elif context_type == "medical_image":
        questions.extend([
            "What does this finding mean?",
            "How significant is this finding?",
            "What additional information might help interpret it?",
            "What should I ask my doctor?",
        ])
    else:
        questions.extend([
            "What abnormalities were found?",
            "Explain this in simple terms",
            "What should I discuss with my doctor?",
        ])

    seen = set()
    unique: List[str] = []
    for q in questions:
        if q not in seen:
            seen.add(q)
            unique.append(q)
    return unique[:4]
