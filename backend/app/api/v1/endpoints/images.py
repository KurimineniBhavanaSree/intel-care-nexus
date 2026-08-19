"""
Medical Image API endpoints.
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, File, Form, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.security import verify_token
from app.db import get_db
from app.schemas import MedicalImageAnalysis, MedicalImageResponse
from app.services import ImageService
from app.utils.logger import get_logger

logger = get_logger("image_routes")

router = APIRouter(prefix="/images", tags=["Medical Images"])


@router.post("/upload", response_model=MedicalImageResponse, status_code=status.HTTP_201_CREATED)
async def upload_image(
    file: UploadFile = File(...),
    image_type: str = Form("General"),
    current_user_id: int = Depends(verify_token),
    db: Session = Depends(get_db),
):
    """Upload a medical image and persist metadata in PostgreSQL."""
    try:
        image = ImageService.create_image(
            db=db,
            user_id=current_user_id,
            upload_file=file,
            image_type=image_type,
        )
        return ImageService.serialize(image)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.error("Error uploading image: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error uploading image",
        ) from exc


@router.get("", response_model=List[MedicalImageResponse])
async def list_images(
    current_user_id: int = Depends(verify_token),
    db: Session = Depends(get_db),
):
    """List all medical images for current user."""
    images = ImageService.get_user_images(db, current_user_id)
    return [ImageService.serialize(image) for image in images]


@router.get("/{image_id}", response_model=MedicalImageResponse)
async def get_image(
    image_id: int,
    current_user_id: int = Depends(verify_token),
    db: Session = Depends(get_db),
):
    """Get medical image by ID."""
    try:
        image = ImageService.get_image_or_404(db, image_id, current_user_id)
        return ImageService.serialize(image)
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        ) from exc
    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized",
        ) from exc


@router.get("/{image_id}/file")
async def get_image_file(
    image_id: int,
    current_user_id: int = Depends(verify_token),
    db: Session = Depends(get_db),
):
    """Stream the uploaded image file for preview or download."""
    try:
        image = ImageService.get_image_or_404(db, image_id, current_user_id)
        file_path, media_type = ImageService.get_file_response_path(image)
        if not file_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Image file not found",
            )

        return FileResponse(
            path=str(file_path),
            media_type=media_type,
            filename=image.original_filename or image.filename,
        )
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        ) from exc
    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized",
        ) from exc


@router.post("/{image_id}/analyze", response_model=MedicalImageAnalysis)
async def analyze_image(
    image_id: int,
    current_user_id: int = Depends(verify_token),
    db: Session = Depends(get_db),
):
    """Run the analysis pipeline placeholder for an uploaded image."""
    try:
        image = ImageService.get_image_or_404(db, image_id, current_user_id)
        return ImageService.analyze_image(db, image)
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        ) from exc
    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized",
        ) from exc
    except (ValueError, FileNotFoundError, RuntimeError) as exc:
        db.rollback()
        logger.error("Error analyzing image: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        db.rollback()
        logger.error("Error analyzing image: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error analyzing image",
        ) from exc


@router.delete("/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_image(
    image_id: int,
    current_user_id: int = Depends(verify_token),
    db: Session = Depends(get_db),
):
    """Delete a medical image and its file from disk."""
    try:
        image = ImageService.get_image_or_404(db, image_id, current_user_id)
        ImageService.delete_image(db, image)
        logger.info("Image %s deleted", image_id)
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        ) from exc
    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized",
        ) from exc
    except Exception as exc:
        db.rollback()
        logger.error("Error deleting image: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting image",
        ) from exc
