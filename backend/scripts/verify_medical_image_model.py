"""
Standalone verification script for the saved medical image model.
"""
from __future__ import annotations

import json
import sys
from io import BytesIO
from pathlib import Path

from PIL import Image


BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.services.image_service import ImageService  # noqa: E402


def make_sample_image_bytes() -> bytes:
    """Create a simple RGB image that can be passed through the model."""
    image = Image.new("RGB", (256, 256), color=(180, 180, 180))
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def main() -> int:
    """Run the verification checks and print a compact result."""
    class_names = ImageService._load_class_names()
    model = ImageService._load_model()
    result = ImageService.predict_image_bytes(make_sample_image_bytes())

    if class_names != ["NORMAL", "PNEUMONIA"]:
        raise RuntimeError(f"Unexpected class names: {class_names}")
    if model is None:
        raise RuntimeError("Model failed to load")
    if result["prediction"] not in {"NORMAL", "PNEUMONIA"}:
        raise RuntimeError(f"Unexpected prediction: {result['prediction']}")
    if not (0.0 <= float(result["confidence"]) <= 100.0):
        raise RuntimeError(f"Invalid confidence: {result['confidence']}")

    print(
        json.dumps(
            {
                "model_loaded": True,
                "class_names_loaded": True,
                "prediction": result["prediction"],
                "confidence": result["confidence"],
                "threshold": result["threshold"],
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
