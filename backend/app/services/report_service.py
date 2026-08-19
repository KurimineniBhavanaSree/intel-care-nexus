"""
Medical Report service for handling report uploads and analysis.
"""
from typing import Optional, Tuple, List
from sqlalchemy.orm import Session
from sqlalchemy import inspect, text

from app.models import MedicalReport, ReportStatus
from app.schemas import MedicalReportCreate
from app.db.database import engine
from app.utils.logger import get_logger

logger = get_logger("report_service")


class ReportService:
    """Service for medical report operations."""

    _schema_synced = False

    @staticmethod
    def sync_schema() -> None:
        """Add missing columns to the medical_reports table when needed."""
        if ReportService._schema_synced:
            return

        inspector = inspect(engine)
        if "medical_reports" not in inspector.get_table_names():
            return

        existing_columns = {column["name"] for column in inspector.get_columns("medical_reports")}
        column_definitions = {
            "processing_stage": "VARCHAR(50) DEFAULT 'UPLOADED'",
            "extracted_text": "TEXT",
            "extracted_data": "JSON",
            "retrieval_queries": "JSON",
            "evidence_sources": "JSON",
            "analysis_payload": "JSON",
            "processing_message": "TEXT",
        }

        statements: list[str] = []
        for column_name, ddl in column_definitions.items():
            if column_name not in existing_columns:
                statements.append(f'ALTER TABLE medical_reports ADD COLUMN "{column_name}" {ddl}')

        if statements:
            with engine.begin() as connection:
                for statement in statements:
                    try:
                        connection.execute(text(statement))
                    except Exception as exc:  # pragma: no cover - defensive fallback
                        logger.warning("Could not add column with statement %s: %s", statement, exc)

        ReportService._schema_synced = True

    @staticmethod
    def create_report(
        db: Session,
        user_id: int,
        filename: str,
        file_path: str,
        file_size: int,
        report_data: MedicalReportCreate,
    ) -> Tuple[Optional[MedicalReport], Optional[str]]:
        """Create a new medical report entry."""
        try:
            report = MedicalReport(
                user_id=user_id,
                filename=filename,
                file_path=file_path,
                file_size=file_size,
                report_type=report_data.report_type,
                patient_name=report_data.patient_name,
                status=ReportStatus.PENDING,
                processing_stage="UPLOADED",
            )

            db.add(report)
            db.commit()
            db.refresh(report)

            logger.info(f"Report created: {report.id} for user {user_id}")
            return report, None

        except Exception as e:
            db.rollback()
            logger.error(f"Error creating report: {str(e)}")
            return None, str(e)

    @staticmethod
    def get_report(db: Session, report_id: int) -> Optional[MedicalReport]:
        """Get report by ID."""
        return db.query(MedicalReport).filter(MedicalReport.id == report_id).first()

    @staticmethod
    def get_user_reports(db: Session, user_id: int) -> List[MedicalReport]:
        """Get all reports for a user."""
        return db.query(MedicalReport).filter(MedicalReport.user_id == user_id).order_by(MedicalReport.uploaded_at.desc()).all()

    @staticmethod
    def update_report_status(
        db: Session,
        report_id: int,
        status: ReportStatus,
        analysis_data: Optional[dict] = None,
    ) -> Tuple[Optional[MedicalReport], Optional[str]]:
        """Update report status and analysis data."""
        try:
            report = db.query(MedicalReport).filter(MedicalReport.id == report_id).first()
            if not report:
                return None, "Report not found"

            report.status = status

            if analysis_data:
                report.summary = analysis_data.get("summary")
                report.key_findings = analysis_data.get("key_findings")
                report.detected_conditions = analysis_data.get("detected_conditions")
                report.recommendations = analysis_data.get("recommendations")
                report.medical_terms = analysis_data.get("medical_terms")

                if status == ReportStatus.ANALYZED:
                    from datetime import datetime
                    report.analyzed_at = datetime.utcnow()

            db.commit()
            db.refresh(report)

            logger.info(f"Report {report_id} status updated to {status}")
            return report, None

        except Exception as e:
            db.rollback()
            logger.error(f"Error updating report: {str(e)}")
            return None, str(e)

    @staticmethod
    def delete_report(db: Session, report_id: int) -> Tuple[bool, Optional[str]]:
        """Delete a report."""
        try:
            report = db.query(MedicalReport).filter(MedicalReport.id == report_id).first()
            if not report:
                return False, "Report not found"

            # Delete bookmarks first
            from app.models import Bookmark
            db.query(Bookmark).filter(Bookmark.report_id == report_id).delete()

            db.delete(report)
            db.commit()

            logger.info(f"Report {report_id} deleted")
            return True, None

        except Exception as e:
            db.rollback()
            logger.error(f"Error deleting report: {str(e)}")
            return False, str(e)
