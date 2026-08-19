"""
Document Loader for medical documents and guidelines.

Supports:
- PDF files (medical papers, reports)
- Text files (guidelines, documentation)
- URLs (PubMed, WHO resources)
- Web scraping (medical websites)
"""

import logging
from typing import List, Dict, Any, Optional
from pathlib import Path
import asyncio

from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader, TextLoader
from langchain_core.documents import Document

logger = logging.getLogger(__name__)


class DocumentLoader:
    """Load and process medical documents from various sources."""

    def __init__(self, data_dir: Optional[str] = None):
        """
        Initialize document loader.

        Args:
            data_dir: Directory containing documents
        """
        self.data_dir = Path(data_dir) if data_dir else Path("app/rag/data")
        self.documents = []

    async def load_pdf(self, file_path: str) -> List[Document]:
        """
        Load PDF file.

        Args:
            file_path: Path to PDF file

        Returns:
            List of Document objects
        """
        try:
            logger.info(f"Loading PDF: {file_path}")
            loader = PyPDFLoader(file_path)
            pages = await asyncio.to_thread(loader.load)

            # Add source metadata
            for page in pages:
                page.metadata["source"] = file_path
                page.metadata["file_type"] = "pdf"

            logger.info(f"Loaded {len(pages)} pages from {file_path}")
            return pages

        except Exception as e:
            logger.error(f"Error loading PDF {file_path}: {str(e)}")
            return []

    async def load_text_file(self, file_path: str) -> List[Document]:
        """
        Load text file.

        Args:
            file_path: Path to text file

        Returns:
            List of Document objects
        """
        try:
            logger.info(f"Loading text file: {file_path}")
            loader = TextLoader(file_path)
            docs = await asyncio.to_thread(loader.load)

            # Add source metadata
            for doc in docs:
                doc.metadata["source"] = file_path
                doc.metadata["file_type"] = "text"

            logger.info(f"Loaded text file: {file_path}")
            return docs

        except Exception as e:
            logger.error(f"Error loading text file {file_path}: {str(e)}")
            return []

    async def load_directory(self, directory: str, file_pattern: str = "**/*.pdf") -> List[Document]:
        """
        Load all documents from directory.

        Args:
            directory: Path to directory
            file_pattern: File pattern to search for

        Returns:
            List of Document objects
        """
        try:
            dir_path = Path(directory)
            logger.info(f"Loading documents from {directory} with pattern {file_pattern}")

            all_docs = []

            # Load PDFs
            if "pdf" in file_pattern:
                pdf_loader = DirectoryLoader(
                    directory,
                    glob="**/*.pdf",
                    loader_cls=PyPDFLoader
                )
                pdfs = await asyncio.to_thread(pdf_loader.load)
                for pdf in pdfs:
                    pdf.metadata["file_type"] = "pdf"
                all_docs.extend(pdfs)
                logger.info(f"Loaded {len(pdfs)} PDF pages")

            # Load text files
            if "txt" in file_pattern or "text" in file_pattern:
                txt_files = list(dir_path.glob("**/*.txt"))
                for txt_file in txt_files:
                    docs = await self.load_text_file(str(txt_file))
                    all_docs.extend(docs)
                logger.info(f"Loaded {len(txt_files)} text files")

            logger.info(f"Total documents loaded: {len(all_docs)}")
            return all_docs

        except Exception as e:
            logger.error(f"Error loading directory {directory}: {str(e)}")
            return []

    async def load_who_guidelines(self) -> List[Document]:
        """
        Load WHO guidelines from embedded resources.

        Returns:
            List of Document objects
        """
        logger.info("Loading WHO guidelines")

        who_docs = []

        # Create document for common WHO guidelines
        who_guidelines = {
            "Hypertension Management": """
            WHO Guidelines on Hypertension:
            - Normal: < 120/80 mmHg
            - Elevated: 120-129 / < 80 mmHg
            - Stage 1 Hypertension: 130-139 / 80-89 mmHg
            - Stage 2 Hypertension: ≥ 140 / ≥ 90 mmHg
            
            Treatment:
            1. Lifestyle modifications
            2. Pharmacotherapy if indicated
            3. Regular monitoring
            """,
            "Diabetes Management": """
            WHO Guidelines on Diabetes:
            - Fasting glucose: < 100 mg/dL (normal)
            - Fasting glucose: 100-125 mg/dL (impaired fasting glucose)
            - Fasting glucose: ≥ 126 mg/dL (diabetes diagnosis)
            
            Management:
            1. Lifestyle changes
            2. Metformin therapy
            3. Insulin if needed
            4. Regular monitoring
            """,
            "Cholesterol Guidelines": """
            WHO Cholesterol Guidelines:
            - Total cholesterol: < 200 mg/dL (desirable)
            - LDL cholesterol: < 100 mg/dL (optimal)
            - HDL cholesterol: > 40 mg/dL (men), > 50 mg/dL (women)
            - Triglycerides: < 150 mg/dL (normal)
            
            Risk reduction:
            1. Dietary changes
            2. Statins for high-risk patients
            3. Regular monitoring
            """,
        }

        for title, content in who_guidelines.items():
            doc = Document(
                page_content=content,
                metadata={
                    "source": "WHO Guidelines",
                    "title": title,
                    "file_type": "guideline",
                    "organization": "WHO"
                }
            )
            who_docs.append(doc)

        logger.info(f"Loaded {len(who_docs)} WHO guideline documents")
        return who_docs

    async def load_medical_knowledge_base(self) -> List[Document]:
        """
        Load medical knowledge base.

        Returns:
            List of Document objects
        """
        logger.info("Loading medical knowledge base")

        kb_docs = []

        # Common medical conditions
        conditions = {
            "Anemia": """
            Anemia is a condition characterized by low hemoglobin levels.
            Normal ranges:
            - Men: 13.5-17.5 g/dL
            - Women: 12.0-15.5 g/dL
            
            Types:
            1. Iron-deficiency anemia
            2. Vitamin B12 deficiency anemia
            3. Hemolytic anemia
            4. Aplastic anemia
            
            Treatment depends on cause and severity.
            """,
            "Hypertension": """
            Hypertension is elevated blood pressure.
            Stages:
            - Normal: < 120/80 mmHg
            - Elevated: 120-129 / < 80 mmHg
            - Stage 1: 130-139 / 80-89 mmHg
            - Stage 2: ≥ 140 / ≥ 90 mmHg
            
            Risk factors: Age, family history, obesity, stress, high sodium intake
            """,
            "Type 2 Diabetes": """
            Type 2 diabetes is characterized by insulin resistance.
            Diagnosis: Fasting glucose ≥ 126 mg/dL or HbA1c ≥ 6.5%
            
            Management:
            1. Weight loss and exercise
            2. Medication (Metformin, GLP-1 agonists)
            3. Regular monitoring
            4. Lifestyle changes
            """,
        }

        for condition, info in conditions.items():
            doc = Document(
                page_content=info,
                metadata={
                    "source": "Medical Knowledge Base",
                    "condition": condition,
                    "file_type": "knowledge_base"
                }
            )
            kb_docs.append(doc)

        logger.info(f"Loaded {len(kb_docs)} medical knowledge documents")
        return kb_docs

    async def load_all_documents(self) -> List[Document]:
        """
        Load all available documents.

        Returns:
            List of all Document objects
        """
        logger.info("Loading all documents")

        all_docs = []

        # Load from directory if it exists
        if self.data_dir.exists():
            dir_docs = await self.load_directory(str(self.data_dir))
            all_docs.extend(dir_docs)

        # Load WHO guidelines
        who_docs = await self.load_who_guidelines()
        all_docs.extend(who_docs)

        # Load medical knowledge base
        kb_docs = await self.load_medical_knowledge_base()
        all_docs.extend(kb_docs)

        logger.info(f"Total documents loaded: {len(all_docs)}")
        self.documents = all_docs
        return all_docs

    def get_documents(self) -> List[Document]:
        """Get loaded documents."""
        return self.documents

    async def add_custom_documents(self, documents: List[Dict[str, str]]) -> List[Document]:
        """
        Add custom documents programmatically.

        Args:
            documents: List of dicts with 'content' and 'metadata'

        Returns:
            List of Document objects
        """
        custom_docs = []

        for doc_data in documents:
            doc = Document(
                page_content=doc_data.get("content", ""),
                metadata=doc_data.get("metadata", {})
            )
            custom_docs.append(doc)

        self.documents.extend(custom_docs)
        logger.info(f"Added {len(custom_docs)} custom documents")
        return custom_docs


__all__ = ["DocumentLoader"]
