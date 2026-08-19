"""
Chat API endpoints.
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas import ChatMessageCreate, ChatMessageResponse, ChatResponse, Citation
from app.models import ChatMessage
from app.core.security import verify_token
from app.utils.logger import get_logger

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
        # Save user message
        user_message = ChatMessage(
            user_id=current_user_id,
            role="user",
            content=message_data.content
        )
        db.add(user_message)
        db.commit()
        db.refresh(user_message)

        # Generate AI response (placeholder - integrate with LLM/RAG)
        ai_response_text = generate_ai_response(message_data.content)
        citations = extract_citations(ai_response_text)

        # Save assistant message
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
            "message": assistant_message,
            "citations": citations
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


def generate_ai_response(user_message: str) -> str:
    """
    Generate AI response using LLM and RAG.
    This is a placeholder - integrate with OpenAI/LangChain in production.
    """
    # TODO: Integrate with LLM + RAG pipeline
    return "Based on your recent lab results and the ACC/AHA cholesterol guideline, I'd recommend a Mediterranean-style diet, 150 minutes/week of moderate aerobic activity, and a follow-up lipid panel in 8–12 weeks."


def extract_citations(response_text: str) -> List[Citation]:
    """
    Extract citations from AI response.
    This is a placeholder - implement proper citation extraction.
    """
    # TODO: Implement citation extraction logic
    return [
        {
            "title": "ACC/AHA 2018 Cholesterol Guideline",
            "source": "acc.org"
        }
    ]
