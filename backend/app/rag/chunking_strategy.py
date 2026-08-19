"""
Text Chunking strategies for medical documents.

Implements:
- Recursive text chunking
- Semantic chunking
- Overlap handling
- Metadata preservation
"""

import logging
import re
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

from langchain_text_splitters import RecursiveCharacterTextSplitter, CharacterTextSplitter
from langchain_core.documents import Document

logger = logging.getLogger(__name__)


@dataclass
class ChunkConfig:
    """Configuration for text chunking."""
    chunk_size: int = 500
    chunk_overlap: int = 100
    separator: Optional[str] = None
    keep_separator: bool = True


class TextChunker:
    """Text chunking for medical documents."""

    def __init__(self, config: ChunkConfig = None):
        """
        Initialize text chunker.

        Args:
            config: ChunkConfig instance
        """
        self.config = config or ChunkConfig()
        self.chunks = []

    def chunk_documents(self, documents: List[Document], config: Optional[ChunkConfig] = None) -> List[Document]:
        """
        Chunk documents using recursive character splitting.

        Args:
            documents: List of Document objects
            config: ChunkConfig instance

        Returns:
            List of chunked Document objects
        """
        config = config or self.config
        logger.info(f"Chunking {len(documents)} documents with chunk_size={config.chunk_size}")

        chunked_docs = []

        # Use recursive character splitter
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=config.chunk_size,
            chunk_overlap=config.chunk_overlap,
            separators=["\n\n", "\n", " ", ""],
            keep_separator=config.keep_separator
        )

        for doc in documents:
            try:
                # Split text
                texts = splitter.split_text(doc.page_content)

                # Create documents with preserved metadata
                for i, text in enumerate(texts):
                    chunked_doc = Document(
                        page_content=text,
                        metadata={
                            **doc.metadata,
                            "chunk_index": i,
                            "total_chunks": len(texts),
                            "chunk_size": len(text)
                        }
                    )
                    chunked_docs.append(chunked_doc)

                logger.debug(f"Document chunked into {len(texts)} chunks")

            except Exception as e:
                logger.error(f"Error chunking document: {str(e)}")
                # Add original document if chunking fails
                chunked_docs.append(doc)

        logger.info(f"Generated {len(chunked_docs)} chunks from {len(documents)} documents")
        self.chunks = chunked_docs
        return chunked_docs

    def chunk_by_sentences(self, documents: List[Document]) -> List[Document]:
        """
        Chunk documents by sentences.

        Args:
            documents: List of Document objects

        Returns:
            List of chunked Document objects
        """
        logger.info(f"Chunking {len(documents)} documents by sentences")

        chunked_docs = []

        for doc in documents:
            try:
                # Split by sentences
                sentences = re.split(r'(?<=[.!?])\s+', doc.page_content)

                # Group sentences into chunks
                current_chunk = []
                current_size = 0

                for sentence in sentences:
                    sentence_size = len(sentence)

                    if current_size + sentence_size > self.config.chunk_size and current_chunk:
                        # Create chunk
                        chunk_text = " ".join(current_chunk)
                        chunked_doc = Document(
                            page_content=chunk_text,
                            metadata={**doc.metadata, "chunking_method": "sentences"}
                        )
                        chunked_docs.append(chunked_doc)

                        # Reset
                        current_chunk = [sentence]
                        current_size = sentence_size
                    else:
                        current_chunk.append(sentence)
                        current_size += sentence_size

                # Add remaining chunk
                if current_chunk:
                    chunk_text = " ".join(current_chunk)
                    chunked_doc = Document(
                        page_content=chunk_text,
                        metadata={**doc.metadata, "chunking_method": "sentences"}
                    )
                    chunked_docs.append(chunked_doc)

            except Exception as e:
                logger.error(f"Error chunking by sentences: {str(e)}")
                chunked_docs.append(doc)

        logger.info(f"Generated {len(chunked_docs)} chunks by sentences")
        return chunked_docs

    def chunk_by_sections(self, documents: List[Document]) -> List[Document]:
        """
        Chunk documents by sections/headers.

        Args:
            documents: List of Document objects

        Returns:
            List of chunked Document objects
        """
        logger.info(f"Chunking {len(documents)} documents by sections")

        chunked_docs = []
        section_pattern = r'^#+\s+(.+)$'  # Markdown headers

        for doc in documents:
            try:
                lines = doc.page_content.split('\n')
                current_section = None
                current_content = []

                for line in lines:
                    match = re.match(section_pattern, line)

                    if match:
                        # Save previous section
                        if current_content:
                            chunk_text = '\n'.join(current_content)
                            chunked_doc = Document(
                                page_content=chunk_text,
                                metadata={
                                    **doc.metadata,
                                    "section": current_section,
                                    "chunking_method": "sections"
                                }
                            )
                            chunked_docs.append(chunked_doc)

                        # Start new section
                        current_section = match.group(1)
                        current_content = [line]
                    else:
                        current_content.append(line)

                # Add final section
                if current_content:
                    chunk_text = '\n'.join(current_content)
                    chunked_doc = Document(
                        page_content=chunk_text,
                        metadata={
                            **doc.metadata,
                            "section": current_section,
                            "chunking_method": "sections"
                        }
                    )
                    chunked_docs.append(chunked_doc)

            except Exception as e:
                logger.error(f"Error chunking by sections: {str(e)}")
                chunked_docs.append(doc)

        logger.info(f"Generated {len(chunked_docs)} chunks by sections")
        return chunked_docs

    def get_chunks(self) -> List[Document]:
        """Get generated chunks."""
        return self.chunks


# Recommended configurations for medical documents
CONFIGS = {
    "default": ChunkConfig(chunk_size=500, chunk_overlap=100),
    "small": ChunkConfig(chunk_size=256, chunk_overlap=50),
    "large": ChunkConfig(chunk_size=1024, chunk_overlap=200),
    "fine": ChunkConfig(chunk_size=300, chunk_overlap=75),
    "coarse": ChunkConfig(chunk_size=2000, chunk_overlap=500),
}


__all__ = ["TextChunker", "ChunkConfig", "CONFIGS"]
