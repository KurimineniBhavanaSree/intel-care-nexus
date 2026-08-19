"""
Medical image service for upload, retrieval, and analysis flow.
"""
from __future__ import annotations

import json
import tempfile
import zipfile
from io import BytesIO
from datetime import datetime
from functools import lru_cache
from pathlib import Path
from typing import Any, Optional

import numpy as np
from PIL import Image, UnidentifiedImageError
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from app.db.database import engine
from app.models import MedicalImage, ReportStatus
from app.utils.file_handler import FileHandler
from app.utils.logger import get_logger

logger = get_logger("image_service")

MODEL_DIR = Path(__file__).resolve().parents[2] / "medical_image_model"
MODEL_PATH = MODEL_DIR / "medical_image_model.keras"
CLASS_NAMES_PATH = MODEL_DIR / "class_names.json"
MODEL_INPUT_SIZE = (224, 224)


class ImageService:
    """Service layer for medical image operations."""

    _schema_synced = False

    @staticmethod
    def sync_schema() -> None:
        """Add missing medical_images columns for the current application schema."""
        if ImageService._schema_synced:
            return

        inspector = inspect(engine)
        if "medical_images" not in inspector.get_table_names():
            return

        existing_columns = {column["name"] for column in inspector.get_columns("medical_images")}
        statements: list[str] = []

        column_definitions = {
            "original_filename": "VARCHAR(255)",
            "stored_filename": "VARCHAR(255)",
            "mime_type": "VARCHAR(100)",
            "analysis_status": "VARCHAR(50) DEFAULT 'Uploaded'",
            "upload_time": "TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()",
        }

        for column_name, ddl in column_definitions.items():
            if column_name not in existing_columns:
                statements.append(
                    f'ALTER TABLE medical_images ADD COLUMN IF NOT EXISTS "{column_name}" {ddl}'
                )

        if statements:
            with engine.begin() as connection:
                for statement in statements:
                    connection.execute(text(statement))

        current_columns = existing_columns | set(column_definitions.keys())
        with engine.begin() as connection:
            if "original_filename" in current_columns:
                connection.execute(
                    text(
                        "UPDATE medical_images "
                        "SET original_filename = COALESCE(original_filename, filename) "
                        "WHERE original_filename IS NULL"
                    )
                )
            if "stored_filename" in current_columns:
                connection.execute(
                    text(
                        "UPDATE medical_images "
                        "SET stored_filename = COALESCE(stored_filename, filename) "
                        "WHERE stored_filename IS NULL"
                    )
                )
            if "analysis_status" in current_columns:
                connection.execute(
                    text(
                        "UPDATE medical_images "
                        "SET analysis_status = COALESCE(analysis_status, "
                        "CASE "
                        "WHEN status::text = 'analyzed' THEN 'Completed' "
                        "WHEN status::text = 'processing' THEN 'Processing' "
                        "ELSE 'Uploaded' "
                        "END)"
                        " WHERE analysis_status IS NULL"
                    )
                )

        ImageService._schema_synced = True
        logger.info("Medical image schema synced successfully")

    @staticmethod
    def _preview_url(image_id: int) -> str:
        return f"/api/v1/images/{image_id}/file"

    @staticmethod
    def _strip_serialization_keys(value: Any) -> Any:
        """Remove Keras keys that break loading across version boundaries."""
        if isinstance(value, dict):
            return {
                key: ImageService._strip_serialization_keys(item)
                for key, item in value.items()
                if key != "quantization_config"
            }
        if isinstance(value, list):
            return [ImageService._strip_serialization_keys(item) for item in value]
        return value

    @staticmethod
    def initialize() -> None:
        """Warm the cached model and class metadata at startup."""
        ImageService._load_class_names()
        ImageService._load_model()

    @staticmethod
    @lru_cache(maxsize=1)
    def _load_class_names() -> list[str]:
        """Load class labels exported alongside the model."""
        if not CLASS_NAMES_PATH.exists():
            raise FileNotFoundError(f"Class names file not found: {CLASS_NAMES_PATH}")

        with CLASS_NAMES_PATH.open("r", encoding="utf-8") as handle:
            class_names = json.load(handle)

        if not isinstance(class_names, list) or not class_names:
            raise ValueError("Invalid class names export")

        return [str(name) for name in class_names]

    @staticmethod
    @lru_cache(maxsize=1)
    def _load_model():
        """Load and cache the exported Keras model."""
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")

        try:
            import keras
        except ImportError as exc:  # pragma: no cover - dependency guard
            raise RuntimeError(
                "Keras/TensorFlow is required for medical image analysis"
            ) from exc

        with tempfile.TemporaryDirectory() as temp_dir:
            patched_model_path = Path(temp_dir) / MODEL_PATH.name

            with zipfile.ZipFile(MODEL_PATH) as source_archive, zipfile.ZipFile(
                patched_model_path,
                "w",
                compression=zipfile.ZIP_DEFLATED,
            ) as target_archive:
                for item in source_archive.infolist():
                    data = source_archive.read(item.filename)
                    if item.filename == "config.json":
                        config = json.loads(data)
                        config = ImageService._strip_serialization_keys(config)
                        data = json.dumps(config).encode("utf-8")
                    target_archive.writestr(item, data)

            model = keras.models.load_model(patched_model_path, compile=False)

        return model

    @staticmethod
    def _load_valid_image(file_path: str | Path) -> Image.Image:
        """Open an image safely and return a resized RGB copy."""
        try:
            with Image.open(file_path) as image:
                image.verify()
            with Image.open(file_path) as image:
                return image.convert("RGB").resize(MODEL_INPUT_SIZE)
        except UnidentifiedImageError as exc:
            raise ValueError("Uploaded file is not a valid image") from exc
        except OSError as exc:
            raise ValueError("Unable to read the uploaded image") from exc

    @staticmethod
    def _prepare_image_for_model(image: Image.Image) -> np.ndarray:
        """Convert a PIL image into a normalized batch tensor."""
        image_array = np.asarray(image, dtype=np.float32) / 255.0
        image_array = np.expand_dims(image_array, axis=0)
        return image_array

    @staticmethod
    def _extract_positive_probability(model_output: np.ndarray) -> float:
        """Interpret binary Keras output as the positive-class probability."""
        squeezed = np.squeeze(np.asarray(model_output))

        if np.ndim(squeezed) == 0:
            probability = float(squeezed)
        elif np.ndim(squeezed) == 1:
            if squeezed.shape[0] == 1:
                probability = float(squeezed[0])
            elif squeezed.shape[0] >= 2:
                probability = float(squeezed[1])
            else:  # pragma: no cover - defensive fallback
                probability = float(squeezed.item())
        else:  # pragma: no cover - defensive fallback for unexpected shapes
            probability = float(np.ravel(squeezed)[-1])

        return float(np.clip(probability, 0.0, 1.0))

    @staticmethod
    def _run_inference(image: Image.Image) -> dict[str, Any]:
        """Run the trained classifier and return a clean prediction payload."""
        model = ImageService._load_model()
        class_names = ImageService._load_class_names()
        if len(class_names) < 2:
            raise ValueError("Expected at least two class names for binary classification")

        model_input = ImageService._prepare_image_for_model(image)
        prediction_value = ImageService._extract_positive_probability(
            model.predict(model_input, verbose=0)
        )

        negative_label = class_names[0]
        positive_label = class_names[1]
        is_positive = prediction_value >= 0.5
        predicted_class = positive_label if is_positive else negative_label
        confidence = (prediction_value if is_positive else 1.0 - prediction_value) * 100.0
        confidence = round(confidence, 2)
        predicted_probability = round(prediction_value * 100.0, 2)

        return {
            "success": True,
            "prediction": predicted_class,
            "confidence": confidence,
            "predicted_probability": predicted_probability,
            "message": (
                f"The model predicts {predicted_class} with {confidence:.2f}% confidence."
            ),
            "threshold": 0.5,
            "class_names": class_names[:2],
        }

    @staticmethod
    def predict_image_path(file_path: str | Path) -> dict[str, Any]:
        """Run inference on an image saved on disk."""
        image = ImageService._load_valid_image(file_path)
        return ImageService._run_inference(image)

    @staticmethod
    def predict_image_bytes(file_content: bytes) -> dict[str, Any]:
        """Run inference directly from uploaded image bytes."""
        try:
            with Image.open(BytesIO(file_content)) as image:
                image.verify()
            with Image.open(BytesIO(file_content)) as image:
                return ImageService._run_inference(image.convert("RGB").resize(MODEL_INPUT_SIZE))
        except UnidentifiedImageError as exc:
            raise ValueError("Uploaded file is not a valid image") from exc
        except OSError as exc:
            raise ValueError("Unable to read the uploaded image") from exc

    @staticmethod
    def predict_uploaded_file(upload_file) -> dict[str, Any]:
        """Run inference directly from an uploaded file object."""
        content = upload_file.file.read()
        return ImageService.predict_image_bytes(content)

    @staticmethod
    def serialize(image: MedicalImage) -> dict[str, Any]:
        """Serialize a MedicalImage ORM object for API responses."""
        return {
            "id": image.id,
            "user_id": image.user_id,
            "filename": image.stored_filename or image.filename,
            "original_filename": image.original_filename or image.filename,
            "stored_filename": image.stored_filename or image.filename,
            "file_path": image.file_path,
            "file_size": image.file_size,
            "mime_type": image.mime_type,
            "image_type": image.image_type,
            "status": image.status.value if hasattr(image.status, "value") else image.status,
            "analysis_status": image.analysis_status,
            "detected_condition": image.detected_condition,
            "confidence": image.confidence,
            "findings": image.findings,
            "recommendations": image.recommendations,
            "uploaded_at": image.uploaded_at,
            "upload_time": image.upload_time or image.uploaded_at,
            "analyzed_at": image.analyzed_at,
            "created_at": image.created_at,
            "preview_url": ImageService._preview_url(image.id),
        }

    @staticmethod
    def create_image(
        db: Session,
        user_id: int,
        upload_file,
        image_type: str = "General",
    ) -> MedicalImage:
        """Validate and persist a new medical image."""
        content = upload_file.file.read()
        file_size = len(content)

        is_valid, error_msg = FileHandler.validate_file(upload_file.filename, file_size)
        if not is_valid:
            raise ValueError(error_msg or "Invalid file")

        file_path, unique_filename = FileHandler.save_upload_file(
            content,
            upload_file.filename,
            category="images",
        )

        image = MedicalImage(
            user_id=user_id,
            filename=upload_file.filename,
            original_filename=upload_file.filename,
            stored_filename=unique_filename,
            file_path=file_path,
            file_size=file_size,
            mime_type=upload_file.content_type or "application/octet-stream",
            image_type=image_type,
            modality=image_type,
            status=ReportStatus.PENDING,
            analysis_status="Uploaded",
            uploaded_at=datetime.utcnow(),
            upload_time=datetime.utcnow(),
        )

        db.add(image)
        db.commit()
        db.refresh(image)
        logger.info("Image %s uploaded for user %s", image.id, user_id)
        return image

    @staticmethod
    def get_user_images(db: Session, user_id: int) -> list[MedicalImage]:
        """Return all images for the current user."""
        return (
            db.query(MedicalImage)
            .filter(MedicalImage.user_id == user_id)
            .order_by(MedicalImage.uploaded_at.desc(), MedicalImage.id.desc())
            .all()
        )

    @staticmethod
    def get_image_or_404(db: Session, image_id: int, user_id: int) -> MedicalImage:
        """Fetch an image and verify ownership."""
        image = db.query(MedicalImage).filter(MedicalImage.id == image_id).first()
        if not image:
            raise LookupError("Image not found")
        if image.user_id != user_id:
            raise PermissionError("Not authorized")
        return image

    @staticmethod
    def get_file_response_path(image: MedicalImage) -> tuple[Path, str]:
        """Return the image file path and media type for download/preview."""
        media_type = image.mime_type or "application/octet-stream"
        return Path(image.file_path), media_type

    @staticmethod
    def analyze_image(db: Session, image: MedicalImage) -> dict[str, Any]:
        """Run the trained classifier against an uploaded image."""
        image.analysis_status = "Processing"
        image.status = ReportStatus.PROCESSING
        db.commit()
        db.refresh(image)

        try:
            inference = ImageService.predict_image_path(image.file_path)
            detected_condition = inference["prediction"]
            confidence = inference["confidence"]
            predicted_probability = inference["predicted_probability"]

            findings = [
                f"Model output: {detected_condition}",
                f"Positive-class probability: {predicted_probability:.2f}%",
            ]

            if detected_condition == (ImageService._load_class_names()[1]):
                recommendations = [
                    "Recommend radiologist review and clinical correlation.",
                    "Consider urgent follow-up if the patient has respiratory symptoms.",
                ]
                summary = (
                    f"The classifier detected {detected_condition.lower()} with "
                    f"{confidence:.1%} confidence."
                )
            else:
                recommendations = [
                    "No clear pneumonia pattern detected by the model.",
                    "Continue interpretation with the full clinical context.",
                ]
                summary = (
                    f"The classifier detected {detected_condition.lower()} with "
                    f"{confidence:.1%} confidence."
                )

            image.detected_condition = detected_condition
            image.confidence = confidence
            image.findings = findings
            image.recommendations = recommendations
            image.analysis_status = "Completed"
            image.status = ReportStatus.ANALYZED
            image.analyzed_at = datetime.utcnow()
            db.commit()
            db.refresh(image)

            return {
                "success": True,
                "prediction": detected_condition,
                "summary": summary,
                "message": inference["message"],
                "analysis_status": "Completed",
                "image_id": image.id,
                "confidence": confidence,
                "detected_condition": detected_condition,
                "predicted_probability": predicted_probability,
                "findings": findings,
                "recommendations": recommendations,
                "threshold": inference["threshold"],
            }
        except Exception as exc:
            db.rollback()
            image.analysis_status = "Failed"
            image.status = ReportStatus.FAILED
            db.add(image)
            db.commit()
            db.refresh(image)
            logger.exception("Medical image analysis failed for image %s: %s", image.id, exc)
            raise

    @staticmethod
    def delete_image(db: Session, image: MedicalImage) -> None:
        """Delete image file and record."""
        FileHandler.delete_file(image.file_path)
        db.delete(image)
        db.commit()
