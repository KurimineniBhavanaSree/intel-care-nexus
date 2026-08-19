"""
Prompt templates for medical RAG system.

Includes:
- Chat prompts
- Medical context prompts
- Citation prompts
- System prompts
"""

import logging
from typing import Dict, List, Optional

from langchain_core.prompts import PromptTemplate, ChatPromptTemplate
from langchain_core.messages import SystemMessage, HumanMessage

logger = logging.getLogger(__name__)


class PromptTemplates:
    """Medical RAG prompt templates."""

    # System prompt for medical assistant
    MEDICAL_SYSTEM_PROMPT = """You are an expert medical assistant with knowledge of:
- Clinical diagnosis and treatment
- Medical test interpretation
- Drug information and interactions
- WHO guidelines and standards
- Recent medical research

You provide:
- Accurate, evidence-based medical information
- Clear explanations of medical concepts
- Relevant citations from medical sources
- Important disclaimers about medical advice
- Recommendations to consult healthcare professionals

Always:
1. Cite your sources
2. Provide balanced information
3. Avoid definitive diagnoses
4. Include relevant warnings
5. Suggest professional consultation when appropriate"""

    # Chat prompt template
    CHAT_TEMPLATE = """Based on the following medical context:

{context}

Answer the user's question: {question}

Provide:
1. Direct answer
2. Relevant details from the context
3. Any important caveats or warnings
4. Sources (from the context provided)

If the context doesn't contain relevant information, acknowledge this and provide general knowledge if appropriate."""

    # Medical question answering template
    QA_TEMPLATE = """Given the medical documents below:

{context}

Question: {question}

Instructions:
1. Answer based on the provided medical context
2. Be specific and cite relevant information
3. Include any important clinical implications
4. Note any limitations or uncertainties
5. Recommend professional consultation if needed

Answer:"""

    # Prescription analysis template
    PRESCRIPTION_ANALYSIS_TEMPLATE = """Analyze this prescription information:

Medicines: {medicines}
Dosages: {dosages}
Timing: {timing}

Against medical guidelines provided:
{context}

Provide:
1. Appropriateness of the prescription
2. Potential drug interactions
3. Important warnings or precautions
4. Adherence recommendations
5. Any relevant medical context

Remember: This is for informational purposes only. Always consult with a healthcare provider."""

    # Lab result interpretation template
    LAB_RESULTS_TEMPLATE = """Interpret these lab results:

{results}

Using reference guidelines:
{context}

Provide:
1. Interpretation of each result
2. Which values are abnormal
3. Possible causes of abnormalities
4. Clinical significance
5. Recommendations for follow-up

Note: Professional medical interpretation is essential."""

    # Citation template
    CITATION_TEMPLATE = """Source: {source}
Title: {title}
Type: {type}
Relevance Score: {score}

Relevant excerpt:
{excerpt}"""

    @staticmethod
    def get_system_prompt() -> str:
        """Get system prompt for medical assistant."""
        return PromptTemplates.MEDICAL_SYSTEM_PROMPT

    @staticmethod
    def get_chat_prompt() -> PromptTemplate:
        """Get chat prompt template."""
        return PromptTemplate(
            input_variables=["context", "question"],
            template=PromptTemplates.CHAT_TEMPLATE
        )

    @staticmethod
    def get_qa_prompt() -> PromptTemplate:
        """Get QA prompt template."""
        return PromptTemplate(
            input_variables=["context", "question"],
            template=PromptTemplates.QA_TEMPLATE
        )

    @staticmethod
    def get_prescription_prompt() -> PromptTemplate:
        """Get prescription analysis prompt."""
        return PromptTemplate(
            input_variables=["medicines", "dosages", "timing", "context"],
            template=PromptTemplates.PRESCRIPTION_ANALYSIS_TEMPLATE
        )

    @staticmethod
    def get_lab_prompt() -> PromptTemplate:
        """Get lab results interpretation prompt."""
        return PromptTemplate(
            input_variables=["results", "context"],
            template=PromptTemplates.LAB_RESULTS_TEMPLATE
        )

    @staticmethod
    def format_context(documents: List[Dict]) -> str:
        """
        Format retrieved documents as context.

        Args:
            documents: List of document dicts

        Returns:
            Formatted context string
        """
        context_parts = []

        for i, doc in enumerate(documents, 1):
            source = doc.get("metadata", {}).get("source", "Unknown")
            content = doc.get("content", "")[:500]  # Limit length
            score = doc.get("score", 0)

            context_parts.append(f"""
Document {i} (Relevance: {score:.2f}):
Source: {source}
Content: {content}
""")

        return "\n".join(context_parts)

    @staticmethod
    def format_citations(documents: List[Dict]) -> List[str]:
        """
        Format citations from documents.

        Args:
            documents: List of document dicts

        Returns:
            List of citation strings
        """
        citations = []

        for doc in documents:
            metadata = doc.get("metadata", {})
            source = metadata.get("source", "Unknown")
            title = metadata.get("title", "")
            doc_type = metadata.get("file_type", "document")

            citation = f"[{source}"
            if title:
                citation += f": {title}"
            citation += f" ({doc_type})]"

            citations.append(citation)

        return citations

    @staticmethod
    def build_medical_prompt(
        question: str,
        context: str,
        prompt_type: str = "chat"
    ) -> str:
        """
        Build a medical prompt.

        Args:
            question: User question
            context: Medical context
            prompt_type: Type of prompt

        Returns:
            Formatted prompt
        """
        if prompt_type == "chat":
            template = PromptTemplates.get_chat_prompt()
            return template.format(context=context, question=question)
        elif prompt_type == "qa":
            template = PromptTemplates.get_qa_prompt()
            return template.format(context=context, question=question)
        else:
            return f"Context: {context}\n\nQuestion: {question}"

    @staticmethod
    def build_safety_disclaimer() -> str:
        """Build safety disclaimer for medical information."""
        return """
⚠️ MEDICAL DISCLAIMER:
This information is provided for educational purposes only and should not be considered medical advice. 
Always consult with qualified healthcare professionals for:
- Diagnosis of medical conditions
- Treatment decisions
- Medication recommendations
- Emergency medical issues

In case of emergency, please contact emergency services immediately.
"""


class MedicalPromptBuilder:
    """Build complex medical prompts."""

    def __init__(self):
        """Initialize prompt builder."""
        self.templates = PromptTemplates()

    def build_diagnostic_prompt(
        self,
        symptoms: List[str],
        medical_history: Optional[str],
        test_results: Optional[str],
        context: str
    ) -> str:
        """
        Build diagnostic prompt.

        Args:
            symptoms: List of symptoms
            medical_history: Patient medical history
            test_results: Test results
            context: Medical context

        Returns:
            Formatted prompt
        """
        prompt = """Given the following patient information:

Symptoms:
"""
        for symptom in symptoms:
            prompt += f"- {symptom}\n"

        if medical_history:
            prompt += f"\nMedical History:\n{medical_history}\n"

        if test_results:
            prompt += f"\nTest Results:\n{test_results}\n"

        prompt += f"\nUsing medical context:\n{context}\n"

        prompt += """Provide:
1. Possible differential diagnoses
2. Supporting and contradicting findings
3. Recommended further testing
4. When to seek immediate care

Remember: This is for informational purposes. Consult a healthcare provider for diagnosis."""

        return prompt

    def build_treatment_prompt(
        self,
        condition: str,
        patient_info: Optional[str],
        contraindications: Optional[str],
        context: str
    ) -> str:
        """
        Build treatment recommendation prompt.

        Args:
            condition: Medical condition
            patient_info: Patient information
            contraindications: Known contraindications
            context: Medical context

        Returns:
            Formatted prompt
        """
        prompt = f"""For the condition: {condition}\n"""

        if patient_info:
            prompt += f"Patient: {patient_info}\n"

        if contraindications:
            prompt += f"Contraindications: {contraindications}\n"

        prompt += f"\nMedical context:\n{context}\n"

        prompt += """Provide:
1. Evidence-based treatment options
2. First-line vs. alternative treatments
3. Expected outcomes
4. Important warnings or interactions
5. Follow-up recommendations

Note: Always discuss treatment options with a healthcare provider."""

        return prompt


__all__ = ["PromptTemplates", "MedicalPromptBuilder"]
