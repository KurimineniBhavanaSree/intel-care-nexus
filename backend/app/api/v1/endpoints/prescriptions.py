"""
Prescription API endpoints.
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Prescription
from app.schemas import PrescriptionResponse, FileUploadResponse
from app.core.security import verify_token
from app.utils.file_handler import FileHandler
from app.utils.logger import get_logger
from app.services.ocr_service import OCRService

logger = get_logger("prescription_routes")

router = APIRouter(prefix="/prescriptions", tags=["Prescriptions"])


@router.post("/upload", response_model=FileUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_prescription(
    file: UploadFile = File(...),
    current_user_id: int = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Upload a prescription image and extract data using OCR.
    
    Supports:
    - PDF prescriptions
    - Image files (PNG, JPG, JPEG, TIFF)
    - Automatic extraction of medicines, dosages, dates
    - Abnormal value detection
    """
    try:
        # Validate file
        file_content = await file.read()
        file_size = len(file_content)
        await file.seek(0)

        is_valid, error_msg = FileHandler.validate_file(file.filename, file_size)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg
            )

        # Save file
        file_path, _ = await FileHandler.save_upload_file_from_upload(
            file,
            category="prescriptions"
        )
        logger.info(f"Processing prescription: {file_path}")

        # Extract prescription data using OCR
        result = await OCRService.process_ocr_request(
            file_path,
            extraction_type="prescription",
            highlight_abnormal=True
        )

        if result["status"] != "success":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Failed to extract prescription data")
            )

        # Extract medicines from OCR result
        extracted_data = result.get("extracted_data", {})
        medicines = extracted_data.get("medicines", [])
        doctor_name = extracted_data.get("doctor_name")
        prescription_date = extracted_data.get("prescription_date")

        # Create prescription record
        prescription = Prescription(
            user_id=current_user_id,
            filename=file.filename,
            file_path=file_path,
            file_size=file_size,
            medicines=medicines,
            doctor_name=doctor_name,
            prescription_date=prescription_date
        )

        db.add(prescription)
        db.commit()
        db.refresh(prescription)

        logger.info(f"Prescription uploaded and processed: {prescription.id}")

        return {
            "filename": file.filename,
            "file_size": file_size,
            "file_path": file_path,
            "upload_id": str(prescription.id)
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error uploading prescription: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error uploading and processing prescription"
        )


@router.get("", response_model=List[PrescriptionResponse])
async def list_prescriptions(
    current_user_id: int = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    List all prescriptions for current user.
    
    Returns:
        List of prescriptions with extracted data
    """
    try:
        prescriptions = db.query(Prescription).filter(
            Prescription.user_id == current_user_id
        ).order_by(Prescription.created_at.desc()).all()

        return prescriptions

    except Exception as e:
        logger.error(f"Error listing prescriptions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving prescriptions"
        )


@router.get("/{prescription_id}", response_model=PrescriptionResponse)
async def get_prescription(
    prescription_id: int,
    current_user_id: int = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Get prescription by ID.
    
    Args:
        prescription_id: Prescription ID
        
    Returns:
        Prescription with extracted data
    """
    try:
        prescription = db.query(Prescription).filter(
            Prescription.id == prescription_id
        ).first()

        if not prescription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prescription not found"
            )

        if prescription.user_id != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this prescription"
            )

        return prescription

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving prescription: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving prescription"
        )


@router.delete("/{prescription_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_prescription(
    prescription_id: int,
    current_user_id: int = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Delete a prescription.
    
    Args:
        prescription_id: Prescription ID to delete
    """
    try:
        prescription = db.query(Prescription).filter(
            Prescription.id == prescription_id
        ).first()

        if not prescription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prescription not found"
            )

        if prescription.user_id != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this prescription"
            )

        # Delete file
        try:
            FileHandler.delete_file(prescription.file_path)
        except Exception as e:
            logger.warning(f"Could not delete file: {str(e)}")

        # Delete record
        db.delete(prescription)
        db.commit()
        logger.info(f"Prescription {prescription_id} deleted")

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting prescription: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting prescription"
        )
