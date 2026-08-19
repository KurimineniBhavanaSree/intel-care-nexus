"""
Medical Report API endpoints.
"""
from typing import List
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas import (
    EvidenceSource,
    FileUploadResponse,
    MedicalReportCreate,
    MedicalReportResponse,
    ReportAnalysisDetail,
)
from app.services import MedicalReportAnalysisService, ReportService
from app.core.security import verify_token
from app.utils.file_handler import FileHandler
from app.utils.logger import get_logger

logger = get_logger("report_routes")

router = APIRouter(prefix="/reports", tags=["Medical Reports"])
analysis_service = MedicalReportAnalysisService()


@router.post("/upload", response_model=FileUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_report(
    file: UploadFile = File(...),
    report_type: str = "General",
    patient_name: str = None,
    current_user_id: int = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Upload a medical report."""
    try:
        # Read file content
        content = await file.read()
        file_size = len(content)

        # Validate file
        is_valid, error_msg = FileHandler.validate_file(file.filename, file_size)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg
            )

        # Save file
        file_path, unique_filename = FileHandler.save_upload_file(
            content,
            file.filename,
            category="reports"
        )

        # Create report record
        report_data = MedicalReportCreate(
            report_type=report_type,
            patient_name=patient_name
        )

        report, error = ReportService.create_report(
            db,
            current_user_id,
            unique_filename,
            file_path,
            file_size,
            report_data
        )

        if error:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error
            )

        logger.info(f"Report uploaded successfully: {report.id}")

        return {
            "filename": unique_filename,
            "file_size": file_size,
            "file_path": file_path,
            "upload_id": str(report.id)
            ,
            "status": report.status.value if hasattr(report.status, "value") else report.status,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading report: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error uploading file"
        )


@router.get("", response_model=List[MedicalReportResponse])
async def list_reports(
    current_user_id: int = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """List all reports for current user."""
    reports = ReportService.get_user_reports(db, current_user_id)
    return reports


@router.get("/{report_id}", response_model=MedicalReportResponse)
async def get_report(
    report_id: int,
    current_user_id: int = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get report by ID."""
    report = ReportService.get_report(db, report_id)

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )

    # Verify ownership
    if report.user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this report"
        )

    return report


@router.post("/{report_id}/extract", response_model=dict)
async def extract_report(
    report_id: int,
    current_user_id: int = Depends(verify_token),
    db: Session = Depends(get_db),
):
    """Extract text and lab findings from a medical report."""
    report = ReportService.get_report(db, report_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    if report.user_id != current_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this report")

    result = await analysis_service.extract_report(db, report)
    if result.get("status") == "failed":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.get("message", "Extraction failed"))
    return result


@router.post("/{report_id}/analyze", response_model=dict)
async def analyze_report(
    report_id: int,
    current_user_id: int = Depends(verify_token),
    db: Session = Depends(get_db),
):
    """Run extraction, trusted-source retrieval, and Gemini generation."""
    report = ReportService.get_report(db, report_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    if report.user_id != current_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this report")

    return await analysis_service.analyze_report(db, report)


@router.get("/{report_id}/analysis", response_model=ReportAnalysisDetail)
async def get_report_analysis(
    report_id: int,
    current_user_id: int = Depends(verify_token),
    db: Session = Depends(get_db),
):
    """Return the stored or freshly generated analysis for a report."""
    report = ReportService.get_report(db, report_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    if report.user_id != current_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this report")

    analysis = await analysis_service.get_analysis(db, report)
    return analysis


@router.get("/{report_id}/sources", response_model=List[EvidenceSource])
async def get_report_sources(
    report_id: int,
    current_user_id: int = Depends(verify_token),
    db: Session = Depends(get_db),
):
    """Return the retrieved evidence sources for a report."""
    report = ReportService.get_report(db, report_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    if report.user_id != current_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this report")

    sources = await analysis_service.get_sources(db, report)
    return sources


@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_report(
    report_id: int,
    current_user_id: int = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Delete a report."""
    report = ReportService.get_report(db, report_id)

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )

    # Verify ownership
    if report.user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this report"
        )

    # Delete file
    FileHandler.delete_file(report.file_path)

    # Delete from database
    success, error = ReportService.delete_report(db, report_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error
        )


@router.get("/{report_id}/file")
async def get_report_file(
    report_id: int,
    current_user_id: int = Depends(verify_token),
    db: Session = Depends(get_db),
):
    """Download or preview the stored report file."""
    report = ReportService.get_report(db, report_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    if report.user_id != current_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this report")

    file_path = Path(report.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report file not found")

    return FileResponse(path=str(file_path), filename=report.filename)
