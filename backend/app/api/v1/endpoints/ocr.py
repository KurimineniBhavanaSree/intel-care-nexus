"""
OCR API endpoints for text extraction from medical documents and images.

Endpoints:
- POST /ocr/extract-from-pdf - Extract text from PDF
- POST /ocr/extract-from-image - Extract text from image using OCR
- POST /ocr/extract-prescription - Extract prescription data
- POST /ocr/extract-medical-report - Extract medical report data
"""

import logging

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form
from sqlalchemy.orm import Session

from app.core.security import verify_token
from app.db.database import get_db
from app.services.ocr_service import OCRService
from app.schemas.schemas import OCRResponse
from app.utils.file_handler import FileHandler

router = APIRouter(prefix="/ocr", tags=["OCR"])
logger = logging.getLogger(__name__)


@router.post("/extract-from-pdf", response_model=OCRResponse)
async def extract_text_from_pdf(
    file: UploadFile = File(...),
    current_user_id: int = Depends(verify_token),
    db: Session = Depends(get_db)
) -> dict:
    """
    Extract text from PDF file.

    Args:
        file: PDF file to process
        current_user_id: Current authenticated user ID

    Returns:
        OCRResponse with extracted text
    """
    try:
        # Validate file
        if not file.filename or not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="File must be a PDF")

        # Save uploaded file
        file_path, _ = await FileHandler.save_upload_file_from_upload(
            file,
            category="ocr/pdf"
        )
        logger.info(f"Processing PDF: {file_path}")

        # Extract text
        text, confidence = await OCRService.extract_text_from_pdf(file_path)

        if not text:
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")

        return {
            "request_id": "",
            "status": "success",
            "extracted_data": {
                "raw_text": text,
                "confidence": confidence,
                "extraction_method": "pdfplumber"
            },
            "confidence": confidence,
            "abnormal_values": [],
            "processing_time": 0.0,
            "message": "Text extracted successfully from PDF"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")


@router.post("/extract-from-image", response_model=OCRResponse)
async def extract_text_from_image(
    file: UploadFile = File(...),
    current_user_id: int = Depends(verify_token),
    db: Session = Depends(get_db)
) -> dict:
    """
    Extract text from image using Tesseract OCR.

    Args:
        file: Image file to process
        current_user_id: Current authenticated user ID

    Returns:
        OCRResponse with extracted text and regions
    """
    try:
        # Validate file
        if not file.filename or not any(
            file.filename.lower().endswith(ext)
            for ext in [".png", ".jpg", ".jpeg", ".tiff", ".bmp"]
        ):
            raise HTTPException(status_code=400, detail="File must be an image")

        # Save uploaded file
        file_path, _ = await FileHandler.save_upload_file_from_upload(
            file,
            category="ocr/image"
        )
        logger.info(f"Processing image: {file_path}")

        # Extract text
        text, regions, confidence = await OCRService.extract_text_from_image(file_path)

        return {
            "request_id": "",
            "status": "success",
            "extracted_data": {
                "detected_text": text,
                "text_regions": regions,
                "confidence": confidence,
                "processing_method": "tesseract"
            },
            "confidence": confidence,
            "abnormal_values": [],
            "processing_time": 0.0,
            "message": "Text extracted successfully from image"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")


@router.post("/extract-prescription", response_model=OCRResponse)
async def extract_prescription_data(
    file: UploadFile = File(...),
    highlight_abnormal: bool = Form(True),
    current_user_id: int = Depends(verify_token),
    db: Session = Depends(get_db)
) -> dict:
    """
    Extract prescription data from file (PDF or image).

    Args:
        file: Prescription file (PDF or image)
        highlight_abnormal: Whether to highlight abnormal values
        current_user_id: Current authenticated user ID

    Returns:
        OCRResponse with extracted prescription data
    """
    try:
        # Save file
        file_path, _ = await FileHandler.save_upload_file_from_upload(
            file,
            category="ocr/prescription"
        )
        logger.info(f"Processing prescription: {file_path}")

        # Extract text based on file type
        if file.filename.lower().endswith(".pdf"):
            text, _ = await OCRService.extract_text_from_pdf(file_path)
        else:
            text, _, _ = await OCRService.extract_text_from_image(file_path)

        if not text:
            raise HTTPException(status_code=400, detail="Could not extract text from prescription")

        # Extract prescription data
        prescription_data = await OCRService.extract_prescription_data(text, highlight_abnormal)
        abnormal = prescription_data.pop("abnormal_values", [])

        return {
            "request_id": "",
            "status": "success",
            "extracted_data": prescription_data,
            "abnormal_values": abnormal,
            "processing_time": 0.0,
            "message": "Prescription data extracted successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing prescription: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing prescription: {str(e)}")


@router.post("/extract-medical-report", response_model=OCRResponse)
async def extract_medical_report_data(
    file: UploadFile = File(...),
    report_type: str = Form("General"),
    highlight_abnormal: bool = Form(True),
    current_user_id: int = Depends(verify_token),
    db: Session = Depends(get_db)
) -> dict:
    """
    Extract medical report data from file (PDF or image).

    Args:
        file: Medical report file (PDF or image)
        report_type: Type of report (CBC, Blood Test, X-ray, etc.)
        highlight_abnormal: Whether to highlight abnormal values
        current_user_id: Current authenticated user ID

    Returns:
        OCRResponse with extracted report data and abnormal values
    """
    try:
        # Save file
        file_path, _ = await FileHandler.save_upload_file_from_upload(
            file,
            category="ocr/report"
        )
        logger.info(f"Processing medical report: {file_path}")

        # Extract text based on file type
        if file.filename.lower().endswith(".pdf"):
            text, _ = await OCRService.extract_text_from_pdf(file_path)
        else:
            text, _, _ = await OCRService.extract_text_from_image(file_path)

        if not text:
            raise HTTPException(status_code=400, detail="Could not extract text from report")

        # Extract report data
        report_data = await OCRService.extract_medical_report_data(
            text, report_type, highlight_abnormal
        )
        abnormal = report_data.pop("abnormal_values", [])

        return {
            "request_id": "",
            "status": "success",
            "extracted_data": report_data,
            "abnormal_values": abnormal,
            "processing_time": 0.0,
            "message": "Medical report data extracted successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing medical report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing medical report: {str(e)}")


# Health check
@router.get("/health")
async def health_check():
    """Check OCR service health."""
    return {"status": "OCR service is operational"}
