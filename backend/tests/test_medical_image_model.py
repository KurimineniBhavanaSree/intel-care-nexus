"""
Tests for the saved medical image model integration.
"""
from __future__ import annotations

from io import BytesIO

from PIL import Image

from app.services.image_service import ImageService


def _make_sample_image_bytes() -> bytes:
    """Create a small RGB image for inference tests."""
    image = Image.new("RGB", (256, 256), color=(180, 180, 180))
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def test_model_and_class_names_load():
    """The exported Keras model and class names should load successfully."""
    class_names = ImageService._load_class_names()
    model = ImageService._load_model()

    assert class_names == ["NORMAL", "PNEUMONIA"]
    assert model is not None


def test_sample_image_runs_through_model():
    """A sample RGB image should be processed by the trained classifier."""
    result = ImageService.predict_image_bytes(_make_sample_image_bytes())

    assert result["success"] is True
    assert result["prediction"] in {"NORMAL", "PNEUMONIA"}
    assert 0.0 <= result["confidence"] <= 100.0
    assert result["threshold"] == 0.5
    assert result["class_names"] == ["NORMAL", "PNEUMONIA"]

