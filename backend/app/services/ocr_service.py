"""
OCR Service for text extraction from medical documents and images.

Supports:
- PDF text extraction (pdfplumber, PyMuPDF)
- Image OCR (Tesseract)
- Prescription data extraction
- Medical report analysis
- Abnormal value detection
"""

import json
import logging
import re
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple

import cv2
import numpy as np
import pdfplumber
import pytesseract
from PIL import Image
import fitz  # PyMuPDF

from app.core.config import settings

logger = logging.getLogger(__name__)


# ============= Medical Data Reference =============

# Common abnormal ranges for medical tests
ABNORMAL_RANGES = {
    "hemoglobin": {"min": 12.0, "max": 17.5, "unit": "g/dL", "severity": "high"},
    "glucose": {"min": 70, "max": 100, "unit": "mg/dL", "severity": "high"},
    "cholesterol": {"min": 0, "max": 200, "unit": "mg/dL", "severity": "medium"},
    "triglycerides": {"min": 0, "max": 150, "unit": "mg/dL", "severity": "medium"},
    "ldl": {"min": 0, "max": 100, "unit": "mg/dL", "severity": "medium"},
    "hdl": {"min": 40, "max": 300, "unit": "mg/dL", "severity": "medium"},
    "platelet": {"min": 150, "max": 400, "unit": "K/uL", "severity": "high"},
    "wbc": {"min": 4.5, "max": 11.0, "unit": "K/uL", "severity": "high"},
    "rbc": {"min": 4.5, "max": 5.5, "unit": "M/uL", "severity": "high"},
    "creatinine": {"min": 0.7, "max": 1.3, "unit": "mg/dL", "severity": "high"},
    "bun": {"min": 7, "max": 20, "unit": "mg/dL", "severity": "high"},
    "sodium": {"min": 135, "max": 145, "unit": "mEq/L", "severity": "high"},
    "potassium": {"min": 3.5, "max": 5.0, "unit": "mEq/L", "severity": "high"},
    "calcium": {"min": 8.5, "max": 10.5, "unit": "mg/dL", "severity": "high"},
    "magnesium": {"min": 1.8, "max": 2.3, "unit": "mg/dL", "severity": "high"},
    "phosphorus": {"min": 2.5, "max": 4.5, "unit": "mg/dL", "severity": "medium"},
    "alt": {"min": 7, "max": 35, "unit": "U/L", "severity": "high"},
    "ast": {"min": 10, "max": 34, "unit": "U/L", "severity": "high"},
    "bilirubin": {"min": 0.3, "max": 1.2, "unit": "mg/dL", "severity": "high"},
    "albumin": {"min": 3.5, "max": 5.0, "unit": "g/dL", "severity": "medium"},
    "protein": {"min": 6.0, "max": 8.3, "unit": "g/dL", "severity": "medium"},
}

# Common prescription medicines
COMMON_MEDICINES = {
    "aspirin", "ibuprofen", "paracetamol", "acetaminophen",
    "amoxicillin", "penicillin", "erythromycin",
    "metformin", "insulin", "lisinopril", "atorvastatin",
    "omeprazole", "ranitidine", "loratadine", "cetirizine",
    "doxycycline", "ciprofloxacin", "azithromycin",
    "enalapril", "amlodipine", "metoprolol", "warfarin"
}


class OCRService:
    """Service for OCR processing and text extraction."""

    @staticmethod
    async def extract_text_from_pdf(
        file_path: str,
        method: str = "pdfplumber"
    ) -> Tuple[str, float]:
        """
        Extract text from PDF file.

        Args:
            file_path: Path to PDF file
            method: Extraction method ("pdfplumber" or "pymupdf")

        Returns:
            Tuple of (extracted_text, confidence)
        """
        try:
            if method == "pdfplumber":
                return await OCRService._extract_pdfplumber(file_path)
            elif method == "pymupdf":
                return await OCRService._extract_pymupdf(file_path)
            else:
                # Try both and return best result
                text1, conf1 = await OCRService._extract_pdfplumber(file_path)
                text2, conf2 = await OCRService._extract_pymupdf(file_path)
                return (text1, conf1) if conf1 >= conf2 else (text2, conf2)
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {str(e)}")
            raise

    @staticmethod
    async def _extract_pdfplumber(file_path: str) -> Tuple[str, float]:
        """Extract text using pdfplumber."""
        try:
            with pdfplumber.open(file_path) as pdf:
                text = ""
                for page in pdf.pages:
                    text += page.extract_text() or ""
                    text += "\n"

                # Estimate confidence based on extraction completeness
                confidence = min(1.0, len(text.strip()) / 1000) if text.strip() else 0.0
                return text.strip(), confidence

        except Exception as e:
            logger.error(f"pdfplumber extraction failed: {str(e)}")
            return "", 0.0

    @staticmethod
    async def _extract_pymupdf(file_path: str) -> Tuple[str, float]:
        """Extract text using PyMuPDF (fitz)."""
        try:
            document = fitz.open(file_path)
            text = ""
            for page_num in range(len(document)):
                page = document[page_num]
                text += page.get_text()
                text += "\n"

            document.close()

            # Estimate confidence
            confidence = min(1.0, len(text.strip()) / 1000) if text.strip() else 0.0
            return text.strip(), confidence

        except Exception as e:
            logger.error(f"PyMuPDF extraction failed: {str(e)}")
            return "", 0.0

    @staticmethod
    async def extract_text_from_image(
        file_path: str,
        preprocessing: bool = True
    ) -> Tuple[str, List[Dict[str, Any]], float]:
        """
        Extract text from image using Tesseract OCR.

        Args:
            file_path: Path to image file
            preprocessing: Apply image preprocessing for better OCR

        Returns:
            Tuple of (extracted_text, text_regions, confidence)
        """
        try:
            # Read image
            image = cv2.imread(file_path)
            if image is None:
                raise ValueError(f"Could not read image: {file_path}")

            # Preprocessing
            if preprocessing:
                image = OCRService._preprocess_image(image)

            # Extract text with Tesseract
            custom_config = r'--oem 3 --psm 6'
            text = pytesseract.image_to_string(image, config=custom_config)

            # Get detailed results with bounding boxes
            data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
            text_regions = OCRService._extract_text_regions(data)

            # Calculate confidence
            confidence = OCRService._calculate_ocr_confidence(data)

            return text.strip(), text_regions, confidence

        except Exception as e:
            logger.error(f"Error extracting text from image: {str(e)}")
            raise

    @staticmethod
    def _preprocess_image(image: np.ndarray) -> np.ndarray:
        """Preprocess image for better OCR results."""
        try:
            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

            # Denoise
            denoised = cv2.fastNlMeansDenoising(gray, h=10)

            # Thresholding
            _, thresh = cv2.threshold(denoised, 150, 255, cv2.THRESH_BINARY)

            # Dilation and Erosion
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
            processed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)

            return processed

        except Exception as e:
            logger.warning(f"Image preprocessing failed: {str(e)}, using original")
            return image

    @staticmethod
    def _extract_text_regions(data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract text regions with bounding boxes."""
        regions = []
        for i, text in enumerate(data["text"]):
            if text.strip():
                regions.append({
                    "text": text,
                    "confidence": int(data["conf"][i]),
                    "x": int(data["left"][i]),
                    "y": int(data["top"][i]),
                    "width": int(data["width"][i]),
                    "height": int(data["height"][i]),
                })
        return regions

    @staticmethod
    def _calculate_ocr_confidence(data: Dict[str, Any]) -> float:
        """Calculate overall OCR confidence."""
        confidences = [int(conf) for conf in data["conf"] if int(conf) > 0]
        if not confidences:
            return 0.0
        return sum(confidences) / len(confidences) / 100

    @staticmethod
    async def extract_prescription_data(
        text: str,
        highlight_abnormal: bool = True
    ) -> Dict[str, Any]:
        """
        Extract structured prescription data from text.

        Args:
            text: Extracted prescription text
            highlight_abnormal: Whether to highlight abnormal values

        Returns:
            Dictionary with extracted prescription data
        """
        try:
            result = {
                "patient_name": None,
                "patient_age": None,
                "doctor_name": None,
                "clinic_name": None,
                "prescription_date": None,
                "medicines": [],
                "notes": None,
                "abnormal_values": [],
                "raw_text": text,
            }

            lines = text.split("\n")

            # Extract basic info
            for i, line in enumerate(lines):
                line_lower = line.lower()

                # Patient name
                if "patient" in line_lower and ":" in line:
                    result["patient_name"] = line.split(":")[-1].strip()

                # Patient age
                if "age" in line_lower and ":" in line:
                    age_match = re.search(r"\d+", line)
                    if age_match:
                        result["patient_age"] = age_match.group()

                # Doctor name
                if "doctor" in line_lower or "dr." in line_lower:
                    result["doctor_name"] = line.split(":")[-1].strip() if ":" in line else line.strip()

                # Clinic
                if "clinic" in line_lower or "hospital" in line_lower:
                    result["clinic_name"] = line.split(":")[-1].strip() if ":" in line else line.strip()

                # Date
                if "date" in line_lower:
                    date_match = re.search(r"\d{1,2}[-/]\d{1,2}[-/]\d{2,4}", line)
                    if date_match:
                        result["prescription_date"] = date_match.group()

            # Extract medicines
            medicines = OCRService._extract_medicines(text)
            result["medicines"] = medicines

            # Check for abnormal values/warnings
            if highlight_abnormal:
                abnormal = OCRService._detect_abnormal_values_in_text(
                    text, "prescription"
                )
                result["abnormal_values"] = abnormal

            return result

        except Exception as e:
            logger.error(f"Error extracting prescription data: {str(e)}")
            raise

    @staticmethod
    async def extract_medical_report_data(
        text: str,
        report_type: str = "General",
        highlight_abnormal: bool = True
    ) -> Dict[str, Any]:
        """
        Extract structured medical report data from text.

        Args:
            text: Extracted report text
            report_type: Type of report (CBC, Blood Test, etc.)
            highlight_abnormal: Whether to highlight abnormal values

        Returns:
            Dictionary with extracted report data
        """
        try:
            result = {
                "report_type": report_type,
                "patient_name": None,
                "patient_age": None,
                "patient_id": None,
                "test_date": None,
                "lab_name": None,
                "test_results": [],
                "summary": None,
                "notes": None,
                "abnormal_values": [],
                "raw_text": text,
            }

            lines = text.split("\n")

            # Extract basic info
            for line in lines:
                line_lower = line.lower()

                # Patient info
                if "patient" in line_lower and ":" in line:
                    result["patient_name"] = line.split(":")[-1].strip()

                if "age" in line_lower and ":" in line:
                    age_match = re.search(r"\d+", line)
                    if age_match:
                        result["patient_age"] = age_match.group()

                if "patient id" in line_lower or "id" in line_lower:
                    result["patient_id"] = line.split(":")[-1].strip()

                # Lab info
                if "lab" in line_lower or "laboratory" in line_lower:
                    result["lab_name"] = line.split(":")[-1].strip() if ":" in line else line.strip()

                # Date
                if "date" in line_lower:
                    date_match = re.search(r"\d{1,2}[-/]\d{1,2}[-/]\d{2,4}", line)
                    if date_match:
                        result["test_date"] = date_match.group()

            # Extract test results
            results = OCRService._extract_test_results(text)
            result["test_results"] = results

            # Detect abnormal values
            if highlight_abnormal:
                abnormal = OCRService._detect_abnormal_values_in_results(results)
                result["abnormal_values"] = abnormal

            return result

        except Exception as e:
            logger.error(f"Error extracting medical report data: {str(e)}")
            raise

    @staticmethod
    def _extract_medicines(text: str) -> List[Dict[str, Any]]:
        """Extract medicines from prescription text."""
        medicines = []

        # Common medicine patterns
        medicine_patterns = [
            r"(\d+\.?\d*)\s*mg\s+([A-Za-z\s]+?)(?:\n|$|[0-9]+)",
            r"([A-Za-z\s]+?)\s+(\d+\.?\d*)\s*mg",
            r"([A-Za-z\s]+?)\s+([0-9]+\s+(?:tablet|cap|ml|drop|spray))",
        ]

        for pattern in medicine_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                medicine_name = match.group(1).strip()
                if medicine_name and len(medicine_name) > 2:
                    # Try to extract dosage and timing
                    dosage = re.search(r"(\d+\.?\d*)\s*(mg|ml|unit)", match.group(0))
                    dosage_str = f"{dosage.group(1)} {dosage.group(2)}" if dosage else "Not specified"

                    # Extract timing if available
                    timing_match = re.search(
                        r"(twice|thrice|once|2x|3x|daily|bd|td|qid|every\s+\d+\s+hours?)",
                        text[max(0, match.start() - 100):match.end() + 100],
                        re.IGNORECASE
                    )
                    timing = timing_match.group(1) if timing_match else "As directed"

                    medicines.append({
                        "name": medicine_name,
                        "dosage": dosage_str,
                        "timing": timing,
                        "duration": "Not specified",
                        "warnings": [],
                        "side_effects": [],
                        "interactions": []
                    })

        # Remove duplicates
        seen = set()
        unique_medicines = []
        for med in medicines:
            if med["name"].lower() not in seen:
                seen.add(med["name"].lower())
                unique_medicines.append(med)

        return unique_medicines[:10]  # Limit to 10 medicines

    @staticmethod
    def _extract_test_results(text: str) -> List[Dict[str, Any]]:
        """Extract test results from medical report."""
        results = []

        # Pattern: Test Name: Value Unit
        pattern = r"([A-Za-z\s\(\)]+?):\s*(\d+\.?\d*)\s*([A-Za-z/%]*)"

        for match in re.finditer(pattern, text):
            test_name = match.group(1).strip()
            value_str = match.group(2)
            unit = match.group(3).strip() if match.group(3) else ""

            if test_name and len(test_name) > 2:
                try:
                    value = float(value_str)
                    results.append({
                        "test_name": test_name,
                        "value": value,
                        "unit": unit,
                        "normal_range": None,
                        "abnormal": False,
                        "severity": None
                    })
                except ValueError:
                    pass

        return results

    @staticmethod
    def _detect_abnormal_values_in_results(
        results: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Detect abnormal values in test results."""
        abnormal = []

        for result in results:
            test_name = result["test_name"].lower()
            value = result["value"]

            # Match against known abnormal ranges
            for key, range_info in ABNORMAL_RANGES.items():
                if key in test_name:
                    if not (range_info["min"] <= value <= range_info["max"]):
                        abnormal.append({
                            "field": result["test_name"],
                            "value": value,
                            "normal_range": f"{range_info['min']}-{range_info['max']} {range_info['unit']}",
                            "severity": range_info["severity"],
                            "note": f"Value {value} is outside normal range"
                        })
                        result["abnormal"] = True
                        result["severity"] = range_info["severity"]
                    break

        return abnormal

    @staticmethod
    def _detect_abnormal_values_in_text(
        text: str,
        doc_type: str = "prescription"
    ) -> List[Dict[str, Any]]:
        """Detect abnormal values in text (warnings, contraindications)."""
        abnormal = []

        # Look for warning keywords
        warning_keywords = [
            "warning", "caution", "contraindication", "severe", "critical",
            "danger", "alert", "abnormal", "high", "low", "critically low"
        ]

        lines = text.split("\n")
        for line in lines:
            line_lower = line.lower()
            for keyword in warning_keywords:
                if keyword in line_lower:
                    abnormal.append({
                        "field": "General Warning",
                        "value": line.strip(),
                        "normal_range": None,
                        "severity": "high" if keyword in ["severe", "critical", "danger"] else "medium",
                        "note": f"Found: {keyword}"
                    })

        return abnormal

    @staticmethod
    def _check_medicine_interactions(medicines: List[str]) -> List[str]:
        """Check for medicine interactions."""
        # Simplified interaction checking
        interactions = []

        # Known problematic combinations
        interaction_pairs = [
            ("warfarin", "aspirin"),
            ("metformin", "contrast dye"),
            ("lisinopril", "potassium"),
            ("ibuprofen", "warfarin"),
        ]

        medicine_names = [med.lower() for med in medicines]

        for drug1, drug2 in interaction_pairs:
            if any(drug1 in med for med in medicine_names) and any(drug2 in med for med in medicine_names):
                interactions.append(f"Potential interaction between {drug1} and {drug2}")

        return interactions

    @staticmethod
    async def process_ocr_request(
        file_path: str,
        extraction_type: str,
        highlight_abnormal: bool = True
    ) -> Dict[str, Any]:
        """
        Process complete OCR request for a file.

        Args:
            file_path: Path to file
            extraction_type: Type of extraction ("text", "prescription", "medical_report", "image")
            highlight_abnormal: Whether to highlight abnormal values

        Returns:
            Dictionary with OCR results
        """
        request_id = str(uuid.uuid4())
        start_time = datetime.now()

        try:
            file_path_obj = Path(file_path)

            if extraction_type == "text" and file_path_obj.suffix.lower() == ".pdf":
                # PDF text extraction
                text, confidence = await OCRService.extract_text_from_pdf(file_path)
                extracted_data = {
                    "raw_text": text,
                    "confidence": confidence,
                    "extraction_method": "pdfplumber"
                }
                abnormal = []

            elif extraction_type == "prescription":
                # Prescription extraction
                if file_path_obj.suffix.lower() == ".pdf":
                    text, _ = await OCRService.extract_text_from_pdf(file_path)
                else:
                    text, _, _ = await OCRService.extract_text_from_image(file_path)

                extracted_data = await OCRService.extract_prescription_data(
                    text, highlight_abnormal
                )
                abnormal = extracted_data.pop("abnormal_values", [])

            elif extraction_type == "medical_report":
                # Medical report extraction
                if file_path_obj.suffix.lower() == ".pdf":
                    text, _ = await OCRService.extract_text_from_pdf(file_path)
                else:
                    text, _, _ = await OCRService.extract_text_from_image(file_path)

                extracted_data = await OCRService.extract_medical_report_data(
                    text, highlight_abnormal=highlight_abnormal
                )
                abnormal = extracted_data.pop("abnormal_values", [])

            elif extraction_type == "image":
                # Image OCR
                text, regions, confidence = await OCRService.extract_text_from_image(file_path)
                extracted_data = {
                    "detected_text": text,
                    "text_regions": regions,
                    "confidence": confidence,
                    "processing_method": "tesseract"
                }
                abnormal = OCRService._detect_abnormal_values_in_text(text)

            else:
                raise ValueError(f"Unknown extraction type: {extraction_type}")

            processing_time = (datetime.now() - start_time).total_seconds()

            return {
                "request_id": request_id,
                "status": "success",
                "extracted_data": extracted_data,
                "abnormal_values": abnormal,
                "processing_time": processing_time,
                "message": "OCR processing completed successfully"
            }

        except Exception as e:
            logger.error(f"OCR processing error: {str(e)}")
            processing_time = (datetime.now() - start_time).total_seconds()

            return {
                "request_id": request_id,
                "status": "error",
                "extracted_data": None,
                "abnormal_values": [],
                "processing_time": processing_time,
                "error": str(e)
            }


# Export for use in other modules
__all__ = ["OCRService"]
