"""
LLM Manager for Gemini integration.

Handles:
- LLM initialization
- Request processing
- Response streaming
- Error handling
"""

import logging
import os
from typing import Optional, List, Dict, Any, AsyncGenerator

from langchain_google_genai import ChatGoogleGenerativeAI

logger = logging.getLogger(__name__)


class LLMManager:
    """Manage LLM interactions with Gemini."""

    def __init__(self, api_key: Optional[str] = None, model_name: str = "gemini-pro"):
        """
        Initialize LLM manager.

        Args:
            api_key: Google API key (from env if not provided)
            model_name: Model to use
        """
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY")
        self.model_name = model_name
        self.llm = None
        self.temperature = 0.3  # Lower for medical accuracy
        self.max_tokens = 1024

        if not self.api_key:
            logger.warning("GOOGLE_API_KEY not set")
        else:
            self._initialize_llm()

    def _initialize_llm(self):
        """Initialize LLM."""
        try:
            logger.info(f"Initializing Gemini LLM: {self.model_name}")

            # Initialize LLM
            self.llm = ChatGoogleGenerativeAI(
                model=self.model_name,
                temperature=self.temperature,
                top_p=0.8,
                top_k=40,
                max_output_tokens=self.max_tokens,
                google_api_key=self.api_key
            )

            logger.info("LLM initialized successfully")

        except Exception as e:
            logger.error(f"Error initializing LLM: {str(e)}")
            self.llm = None

    async def generate(self, prompt: str, temperature: Optional[float] = None) -> str:
        """
        Generate response from LLM.

        Args:
            prompt: Prompt text
            temperature: Override default temperature

        Returns:
            Generated response
        """
        if not self.llm:
            logger.error("LLM not initialized")
            return "Error: LLM not initialized"

        try:
            logger.debug(f"Generating response for prompt: {prompt[:100]}")

            # Create message
            from langchain_core.messages import HumanMessage

            message = HumanMessage(content=prompt)

            # Generate
            response = await self.llm.agenerate(
                messages=[[message]],
                temperature=temperature or self.temperature
            )

            # Extract text
            if response.generations and response.generations[0]:
                text = response.generations[0][0].text
                logger.debug(f"Generated response length: {len(text)}")
                return text
            else:
                logger.warning("Empty response from LLM")
                return ""

        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            raise

    async def chat(self, messages: List[Dict[str, str]]) -> str:
        """
        Chat with LLM.

        Args:
            messages: List of messages with 'role' and 'content'

        Returns:
            Response text
        """
        if not self.llm:
            logger.error("LLM not initialized")
            return "Error: LLM not initialized"

        try:
            from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage, AIMessage

            # Convert messages
            langchain_messages = []
            for msg in messages:
                role = msg.get("role", "user")
                content = msg.get("content", "")

                if role == "system":
                    langchain_messages.append(SystemMessage(content=content))
                elif role == "assistant":
                    langchain_messages.append(AIMessage(content=content))
                else:
                    langchain_messages.append(HumanMessage(content=content))

            # Generate response
            response = await self.llm.agenerate([langchain_messages])

            if response.generations and response.generations[0]:
                return response.generations[0][0].text
            else:
                logger.warning("Empty response from chat")
                return ""

        except Exception as e:
            logger.error(f"Error in chat: {str(e)}")
            raise

    async def summarize(self, text: str, max_length: int = 200) -> str:
        """
        Summarize text.

        Args:
            text: Text to summarize
            max_length: Maximum summary length

        Returns:
            Summary
        """
        prompt = f"""Summarize the following medical text in {max_length} words or less:

{text}

Summary:"""

        return await self.generate(prompt)

    async def extract_entities(self, text: str) -> Dict[str, List[str]]:
        """
        Extract medical entities from text.

        Args:
            text: Input text

        Returns:
            Dictionary with extracted entities
        """
        prompt = f"""Extract medical entities from this text. Return as JSON:
- diseases: List of diseases mentioned
- medications: List of medications mentioned
- symptoms: List of symptoms mentioned
- tests: List of medical tests mentioned

Text: {text}

JSON:"""

        try:
            response = await self.generate(prompt)

            # Try to parse JSON
            import json
            import re

            # Extract JSON from response
            json_match = re.search(r'```json(.*?)```', response, re.DOTALL)
            if json_match:
                json_str = json_match.group(1).strip()
            else:
                json_str = response

            entities = json.loads(json_str)
            return entities

        except Exception as e:
            logger.error(f"Error extracting entities: {str(e)}")
            return {
                "diseases": [],
                "medications": [],
                "symptoms": [],
                "tests": []
            }

    async def check_grammar(self, text: str) -> str:
        """
        Check and fix grammar.

        Args:
            text: Text to check

        Returns:
            Corrected text
        """
        prompt = f"""Correct any grammar or spelling errors in this medical text.
Return only the corrected text:

{text}"""

        return await self.generate(prompt)

    def get_model_info(self) -> Dict[str, Any]:
        """Get model information."""
        return {
            "model": self.model_name,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "initialized": self.llm is not None
        }

    async def test_connection(self) -> bool:
        """Test LLM connection."""
        try:
            logger.info("Testing LLM connection")
            response = await self.generate("Say 'Connected' if you can read this.")
            logger.info(f"LLM connection test successful: {response[:50]}")
            return "Connected" in response or len(response) > 0
        except Exception as e:
            logger.error(f"LLM connection test failed: {str(e)}")
            return False


class SimpleLLMFallback:
    """Simple fallback for when Gemini is unavailable."""

    @staticmethod
    async def generate(prompt: str) -> str:
        """Generate simple response."""
        logger.warning("Using fallback LLM")

        # Extract key information from prompt
        if "medication" in prompt.lower():
            return "Please consult with a healthcare professional about medication recommendations."
        elif "diagnosis" in prompt.lower():
            return "I cannot provide a diagnosis. Please consult with a qualified healthcare professional."
        elif "test" in prompt.lower():
            return "Please discuss test results with your healthcare provider for accurate interpretation."
        else:
            return "I can provide general medical information. For specific medical advice, please consult a healthcare professional."


__all__ = ["LLMManager", "SimpleLLMFallback"]
