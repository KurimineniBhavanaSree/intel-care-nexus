"""
Embeddings manager using Sentence Transformers.

Handles:
- Embedding generation
- Caching
- Dimension handling
- Normalization
"""

import logging
from typing import List, Optional, Tuple
import asyncio
import hashlib
import re

from sentence_transformers import SentenceTransformer
import numpy as np
from langchain_core.documents import Document

logger = logging.getLogger(__name__)


class EmbeddingsManager:
    """Manage embeddings generation and caching."""

    # Available models optimized for medical domain
    AVAILABLE_MODELS = {
        "default": "all-MiniLM-L6-v2",  # Fast, general purpose
        "medical": "sentence-transformers/all-mpnet-base-v2",  # Better for medical
        "fast": "all-MiniLM-L6-v2",  # Fastest
        "accurate": "sentence-transformers/all-mpnet-base-v2",  # Most accurate
    }

    def __init__(self, model_name: str = "default", use_gpu: bool = True):
        """
        Initialize embeddings manager.

        Args:
            model_name: Model to use (key from AVAILABLE_MODELS)
            use_gpu: Use GPU for embeddings
        """
        self.model_name = self.AVAILABLE_MODELS.get(model_name, "all-MiniLM-L6-v2")
        self.use_gpu = use_gpu
        self.embeddings_cache = {}
        self._fallback_mode = False

        # Load model
        logger.info(f"Loading embeddings model: {self.model_name}")
        try:
            device = "cuda" if use_gpu else "cpu"
            self.model = SentenceTransformer(self.model_name, device=device)
            self.embedding_dim = self.model.get_sentence_embedding_dimension()
            logger.info(f"Model loaded. Embedding dimension: {self.embedding_dim}")
        except Exception as e:
            logger.warning("Falling back to deterministic embeddings: %s", e)
            self.model = None
            self.embedding_dim = 384
            self._fallback_mode = True

    @staticmethod
    def _fallback_embed(text: str, dim: int = 384) -> np.ndarray:
        tokens = re.findall(r"[a-z0-9]+", text.lower())
        vector = np.zeros(dim, dtype=np.float32)
        if not tokens:
            return vector

        for token in tokens:
            digest = hashlib.sha256(token.encode("utf-8")).digest()
            idx = int.from_bytes(digest[:4], "little") % dim
            sign = 1.0 if digest[4] % 2 == 0 else -1.0
            vector[idx] += sign

        norm = np.linalg.norm(vector)
        if norm > 0:
            vector /= norm
        return vector

    async def embed_documents(self, texts: List[str], batch_size: int = 32) -> np.ndarray:
        """
        Generate embeddings for documents.

        Args:
            texts: List of texts to embed
            batch_size: Batch size for embedding

        Returns:
            Array of embeddings (n_texts, embedding_dim)
        """
        logger.info(f"Embedding {len(texts)} texts with batch_size={batch_size}")

        try:
            # Check cache
            uncached_texts = [t for t in texts if t not in self.embeddings_cache]

            if uncached_texts:
                if self._fallback_mode or self.model is None:
                    embeddings = np.array([self._fallback_embed(text, self.embedding_dim) for text in uncached_texts])
                else:
                    embeddings = await asyncio.to_thread(
                        lambda: self.model.encode(
                            uncached_texts,
                            batch_size=batch_size,
                            convert_to_numpy=True,
                            normalize_embeddings=True
                        )
                    )

                # Cache embeddings
                for text, embedding in zip(uncached_texts, embeddings):
                    self.embeddings_cache[text] = embedding

            # Return embeddings
            result = np.array([
                self.embeddings_cache.get(t) for t in texts
            ])

            logger.info(f"Generated embeddings with shape: {result.shape}")
            return result

        except Exception as e:
            logger.error(f"Error embedding documents: {str(e)}")
            raise

    async def embed_query(self, query: str) -> np.ndarray:
        """
        Generate embedding for query.

        Args:
            query: Query text

        Returns:
            Query embedding (embedding_dim,)
        """
        try:
            # Check cache
            if query in self.embeddings_cache:
                return self.embeddings_cache[query]

            if self._fallback_mode or self.model is None:
                embedding = self._fallback_embed(query, self.embedding_dim)
            else:
                embedding = await asyncio.to_thread(
                    lambda: self.model.encode(
                        query,
                        convert_to_numpy=True,
                        normalize_embeddings=True
                    )
                )

            # Cache
            self.embeddings_cache[query] = embedding

            logger.debug(f"Generated query embedding with shape: {embedding.shape}")
            return embedding

        except Exception as e:
            logger.error(f"Error embedding query: {str(e)}")
            raise

    async def embed_documents_batch(self, documents: List[Document]) -> Tuple[List[str], np.ndarray]:
        """
        Generate embeddings for documents.

        Args:
            documents: List of Document objects

        Returns:
            Tuple of (document_texts, embeddings)
        """
        texts = [doc.page_content for doc in documents]
        embeddings = await self.embed_documents(texts)
        return texts, embeddings

    def get_embedding_dimension(self) -> int:
        """Get embedding dimension."""
        return self.embedding_dim

    def clear_cache(self):
        """Clear embeddings cache."""
        self.embeddings_cache.clear()
        logger.info("Embeddings cache cleared")

    def get_cache_size(self) -> int:
        """Get cache size."""
        return len(self.embeddings_cache)

    async def test_embedding(self, text: str = "This is a test sentence.") -> np.ndarray:
        """
        Test embedding functionality.

        Args:
            text: Test text

        Returns:
            Test embedding
        """
        logger.info("Testing embeddings...")
        embedding = await self.embed_query(text)
        logger.info(f"Test embedding shape: {embedding.shape}")
        logger.info(f"Test embedding norm: {np.linalg.norm(embedding):.4f}")
        return embedding


__all__ = ["EmbeddingsManager"]
