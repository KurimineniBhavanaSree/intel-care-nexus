"""
Vector Store Manager using FAISS.

Handles:
- Vector storage with FAISS
- Similarity search
- Index persistence
- Document retrieval
"""

import logging
from typing import List, Tuple, Optional, Dict, Any
import pickle
import os
from pathlib import Path
import asyncio

import numpy as np
import faiss
from langchain_core.documents import Document

logger = logging.getLogger(__name__)


class VectorStoreManager:
    """Manage vector store with FAISS."""

    def __init__(self, index_dir: Optional[str] = None, embedding_dim: int = 384):
        """
        Initialize vector store.

        Args:
            index_dir: Directory to store index files
            embedding_dim: Embedding dimension
        """
        self.index_dir = Path(index_dir) if index_dir else Path("app/rag/indices")
        self.embedding_dim = embedding_dim
        self.index = None
        self.documents = []
        self.texts = []

        # Create directory if needed
        self.index_dir.mkdir(parents=True, exist_ok=True)

    def create_index(self) -> faiss.IndexFlatL2:
        """
        Create FAISS index.

        Returns:
            FAISS index object
        """
        logger.info(f"Creating FAISS index with dimension {self.embedding_dim}")

        # Create flat L2 index (exact search)
        # For large-scale, use IndexIVFFlat or other indexing strategies
        index = faiss.IndexFlatL2(self.embedding_dim)

        # Optional: Wrap with IDMap for ID management
        index = faiss.IndexIDMap(index)

        self.index = index
        logger.info("FAISS index created")
        return index

    def add_documents(self, documents: List[Document], embeddings: np.ndarray):
        """
        Add documents to vector store.

        Args:
            documents: List of Document objects
            embeddings: Array of embeddings (n_docs, embedding_dim)
        """
        if self.index is None:
            self.create_index()

        logger.info(f"Adding {len(documents)} documents to vector store")

        try:
            # Convert to float32 for FAISS
            embeddings_fp32 = embeddings.astype('float32')

            # Generate IDs
            start_id = len(self.documents)
            ids = np.arange(start_id, start_id + len(documents), dtype=np.int64)

            # Add to index
            self.index.add_with_ids(embeddings_fp32, ids)

            # Store documents and texts
            self.documents.extend(documents)
            self.texts.extend([doc.page_content for doc in documents])

            logger.info(f"Added {len(documents)} documents. Total: {len(self.documents)}")

        except Exception as e:
            logger.error(f"Error adding documents: {str(e)}")
            raise

    def search(self, query_embedding: np.ndarray, k: int = 5) -> Tuple[List[Document], List[float]]:
        """
        Search for similar documents.

        Args:
            query_embedding: Query embedding
            k: Number of results

        Returns:
            Tuple of (documents, distances)
        """
        if self.index is None or len(self.documents) == 0:
            logger.warning("Index is empty or not created")
            return [], []

        try:
            # Convert to float32
            query_fp32 = query_embedding.astype('float32').reshape(1, -1)

            # Search
            distances, indices = self.index.search(query_fp32, min(k, len(self.documents)))

            # Get documents
            results = []
            for idx, distance in zip(indices[0], distances[0]):
                if idx >= 0 and idx < len(self.documents):
                    results.append((self.documents[int(idx)], float(distance)))

            logger.debug(f"Search returned {len(results)} results")
            return results

        except Exception as e:
            logger.error(f"Error searching: {str(e)}")
            return []

    def search_by_similarity(self, query_embedding: np.ndarray, k: int = 5, threshold: float = 0.5) -> Tuple[List[Document], List[float]]:
        """
        Search with similarity threshold.

        Args:
            query_embedding: Query embedding
            k: Number of results
            threshold: Similarity threshold

        Returns:
            Tuple of (documents, similarities)
        """
        results = self.search(query_embedding, k)

        # Convert L2 distances to similarity scores
        # similarity = 1 / (1 + distance)
        filtered = []
        for doc, distance in results:
            similarity = 1.0 / (1.0 + distance)
            if similarity >= threshold:
                filtered.append((doc, similarity))

        return filtered

    def save_index(self, name: str = "default"):
        """
        Save index to disk.

        Args:
            name: Index name
        """
        try:
            logger.info(f"Saving index: {name}")

            index_path = self.index_dir / f"{name}.index"
            docs_path = self.index_dir / f"{name}_docs.pkl"

            # Save index
            if self.index:
                faiss.write_index(self.index, str(index_path))
                logger.info(f"Index saved to {index_path}")

            # Save documents
            with open(docs_path, 'wb') as f:
                pickle.dump({
                    'documents': self.documents,
                    'texts': self.texts,
                    'embedding_dim': self.embedding_dim
                }, f)
                logger.info(f"Documents saved to {docs_path}")

        except Exception as e:
            logger.error(f"Error saving index: {str(e)}")
            raise

    async def load_index(self, name: str = "default") -> bool:
        """
        Load index from disk.

        Args:
            name: Index name

        Returns:
            True if successful
        """
        try:
            logger.info(f"Loading index: {name}")

            index_path = self.index_dir / f"{name}.index"
            docs_path = self.index_dir / f"{name}_docs.pkl"

            if not index_path.exists() or not docs_path.exists():
                logger.warning(f"Index files not found: {name}")
                return False

            # Load index
            self.index = await asyncio.to_thread(
                lambda: faiss.read_index(str(index_path))
            )
            logger.info(f"Index loaded from {index_path}")

            # Load documents
            with open(docs_path, 'rb') as f:
                data = pickle.load(f)
                self.documents = data['documents']
                self.texts = data['texts']
                self.embedding_dim = data['embedding_dim']
                logger.info(f"Documents loaded from {docs_path}")

            logger.info(f"Loaded {len(self.documents)} documents")
            return True

        except Exception as e:
            logger.error(f"Error loading index: {str(e)}")
            return False

    def get_document_count(self) -> int:
        """Get number of documents in store."""
        return len(self.documents)

    def get_document_by_id(self, doc_id: int) -> Optional[Document]:
        """Get document by ID."""
        if 0 <= doc_id < len(self.documents):
            return self.documents[doc_id]
        return None

    def reset(self):
        """Reset vector store."""
        logger.info("Resetting vector store")
        self.index = None
        self.documents = []
        self.texts = []

    def index_exists(self, name: str = "default") -> bool:
        """Check if index exists."""
        index_path = self.index_dir / f"{name}.index"
        return index_path.exists()


__all__ = ["VectorStoreManager"]
