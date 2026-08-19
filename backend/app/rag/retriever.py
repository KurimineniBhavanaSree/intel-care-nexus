"""
Retriever for finding relevant documents.

Handles:
- Query retrieval
- Ranking
- Filtering
- Post-processing
"""

import logging
from typing import List, Tuple, Optional, Dict, Any

from langchain_core.documents import Document
import numpy as np

logger = logging.getLogger(__name__)


class Retriever:
    """Retrieve relevant documents from vector store."""

    def __init__(self, vector_store, embeddings_manager, k: int = 5):
        """
        Initialize retriever.

        Args:
            vector_store: VectorStoreManager instance
            embeddings_manager: EmbeddingsManager instance
            k: Number of documents to retrieve
        """
        self.vector_store = vector_store
        self.embeddings_manager = embeddings_manager
        self.k = k

    async def retrieve(
        self,
        query: str,
        k: Optional[int] = None,
        similarity_threshold: float = 0.3,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Tuple[Document, float]]:
        """
        Retrieve relevant documents.

        Args:
            query: Query string
            k: Number of results (overrides default)
            similarity_threshold: Minimum similarity score
            filters: Metadata filters

        Returns:
            List of (Document, similarity_score) tuples
        """
        logger.info(f"Retrieving documents for query: {query[:100]}")

        k = k or self.k

        try:
            # Generate query embedding
            query_embedding = await self.embeddings_manager.embed_query(query)

            # Search vector store
            results = self.vector_store.search_by_similarity(
                query_embedding,
                k=k,
                threshold=similarity_threshold
            )

            # Apply filters if provided
            if filters:
                results = self._apply_filters(results, filters)

            logger.info(f"Retrieved {len(results)} documents")
            return results

        except Exception as e:
            logger.error(f"Error retrieving documents: {str(e)}")
            return []

    async def retrieve_with_context(
        self,
        query: str,
        k: int = 5,
        context_window: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Retrieve documents with context.

        Args:
            query: Query string
            k: Number of results
            context_window: Number of surrounding chunks to include

        Returns:
            List of documents with context
        """
        logger.info(f"Retrieving documents with context for: {query[:100]}")

        results = await self.retrieve(query, k=k)
        results_with_context = []

        for doc, score in results:
            result_dict = {
                "document": doc,
                "score": score,
                "content": doc.page_content,
                "metadata": doc.metadata,
                "context_before": None,
                "context_after": None
            }

            # Try to get context
            if "chunk_index" in doc.metadata and "source" in doc.metadata:
                chunk_idx = doc.metadata.get("chunk_index", 0)
                total_chunks = doc.metadata.get("total_chunks", 1)

                # Get surrounding chunks (if available)
                # This would require access to the document store
                # Simplified implementation for now

            results_with_context.append(result_dict)

        return results_with_context

    def _apply_filters(
        self,
        results: List[Tuple[Document, float]],
        filters: Dict[str, Any]
    ) -> List[Tuple[Document, float]]:
        """
        Apply metadata filters to results.

        Args:
            results: Retrieved documents
            filters: Filter criteria

        Returns:
            Filtered results
        """
        filtered = []

        for doc, score in results:
            match = True

            for filter_key, filter_value in filters.items():
                doc_value = doc.metadata.get(filter_key)

                if isinstance(filter_value, list):
                    if doc_value not in filter_value:
                        match = False
                        break
                else:
                    if doc_value != filter_value:
                        match = False
                        break

            if match:
                filtered.append((doc, score))

        logger.debug(f"Filters reduced results from {len(results)} to {len(filtered)}")
        return filtered

    async def retrieve_by_metadata(
        self,
        filters: Dict[str, Any],
        k: Optional[int] = None
    ) -> List[Document]:
        """
        Retrieve documents by metadata.

        Args:
            filters: Metadata filters
            k: Maximum number of results

        Returns:
            List of matching documents
        """
        logger.info(f"Retrieving documents by metadata: {filters}")

        k = k or self.k
        matching_docs = []

        # Iterate through all documents
        for i in range(self.vector_store.get_document_count()):
            doc = self.vector_store.get_document_by_id(i)

            if not doc:
                continue

            match = True
            for filter_key, filter_value in filters.items():
                doc_value = doc.metadata.get(filter_key)

                if isinstance(filter_value, list):
                    if doc_value not in filter_value:
                        match = False
                        break
                else:
                    if doc_value != filter_value:
                        match = False
                        break

            if match:
                matching_docs.append(doc)
                if len(matching_docs) >= k:
                    break

        logger.info(f"Found {len(matching_docs)} matching documents")
        return matching_docs

    async def retrieve_sources(
        self,
        query: str,
        k: int = 5
    ) -> Dict[str, List[str]]:
        """
        Retrieve unique sources for a query.

        Args:
            query: Query string
            k: Number of results

        Returns:
            Dict of sources with their documents
        """
        results = await self.retrieve(query, k=k)

        sources = {}
        for doc, score in results:
            source = doc.metadata.get("source", "Unknown")

            if source not in sources:
                sources[source] = []

            sources[source].append({
                "content": doc.page_content[:200],
                "score": score,
                "metadata": doc.metadata
            })

        logger.info(f"Retrieved documents from {len(sources)} unique sources")
        return sources


__all__ = ["Retriever"]
