"""
File handling utilities for uploads and processing.
"""
import os
from datetime import datetime
from pathlib import Path
from typing import Optional

from app.core.config import settings
from app.utils.logger import get_logger

logger = get_logger("file_handler")


class FileHandler:
    """Handles file uploads and management."""

    @staticmethod
    def save_upload_file(
        file_content: bytes,
        filename: str,
        category: str = "general"
    ) -> tuple[str, str]:
        """
        Save uploaded file to disk.
        Returns tuple of (file_path, file_id)
        """
        try:
            # Create category directory if not exists
            category_dir = Path(settings.UPLOAD_DIR) / category / datetime.now().strftime("%Y/%m/%d")
            category_dir.mkdir(parents=True, exist_ok=True)

            # Generate unique filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            name, ext = os.path.splitext(filename)
            unique_filename = f"{name}_{timestamp}{ext}"
            file_path = category_dir / unique_filename

            # Save file
            with open(file_path, "wb") as f:
                f.write(file_content)

            logger.info(f"File saved: {file_path}")
            return str(file_path), unique_filename

        except Exception as e:
            logger.error(f"Error saving file: {str(e)}")
            raise

    @staticmethod
    async def save_upload_file_from_upload(
        file,
        category: str = "general"
    ) -> tuple[str, str]:
        """Save a FastAPI UploadFile to disk."""
        file_content = await file.read()
        await file.seek(0)
        return FileHandler.save_upload_file(file_content, file.filename, category=category)

    @staticmethod
    def delete_file(file_path: str) -> bool:
        """Delete a file."""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"File deleted: {file_path}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error deleting file: {str(e)}")
            return False

    @staticmethod
    def get_file_size(file_path: str) -> int:
        """Get file size in bytes."""
        try:
            return os.path.getsize(file_path)
        except Exception as e:
            logger.error(f"Error getting file size: {str(e)}")
            return 0

    @staticmethod
    def validate_file(
        filename: str,
        file_size: int,
        allowed_extensions: Optional[list] = None
    ) -> tuple[bool, Optional[str]]:
        """
        Validate file upload.
        Returns tuple of (is_valid, error_message)
        """
        if allowed_extensions is None:
            allowed_extensions = settings.ALLOWED_EXTENSIONS

        # Check file extension
        _, ext = os.path.splitext(filename)
        ext = ext.lstrip(".").lower()

        if ext not in allowed_extensions:
            return False, f"File type '{ext}' is not allowed"

        # Check file size
        if file_size > settings.MAX_UPLOAD_SIZE:
            max_mb = settings.MAX_UPLOAD_SIZE / (1024 * 1024)
            return False, f"File size exceeds {max_mb}MB limit"

        return True, None
