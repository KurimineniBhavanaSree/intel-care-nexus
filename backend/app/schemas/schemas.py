"""
Pydantic schemas for request/response validation.
"""
from typing import Optional, List, Dict, Any
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


# ============= Authentication Schemas =============

class UserCreate(BaseModel):
    """Schema for user registration."""
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    phone: str
    password: str = Field(..., min_length=6, max_length=255)
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    emergency_contact: Optional[str] = None


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Schema for token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    """Schema for refresh token request."""
    refresh_token: str


class UserResponse(BaseModel):
    """Schema for user response."""
    id: int
    name: str
    email: str
    phone: str
    role: str
    is_active: bool
    avatar_url: Optional[str]
    date_of_birth: Optional[str]
    gender: Optional[str]
    emergency_contact: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class AuthSessionResponse(BaseModel):
    """Schema for auth responses that include tokens and the authenticated user."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class UserUpdate(BaseModel):
    """Schema for user update."""
    name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    emergency_contact: Optional[str] = None


# ============= Medical Report Schemas =============

class KeyFinding(BaseModel):
    """Schema for key finding in report."""
    label: str
    value: str
    tone: str  # "success", "warning"
    note: str


class DetectedCondition(BaseModel):
    """Schema for detected condition."""
    name: str
    confidence: float


class MedicalTerm(BaseModel):
    """Schema for medical term glossary."""
    term: str
    meaning: str


class ReportAnalysis(BaseModel):
    """Schema for report analysis result."""
    summary: str
    key_findings: List[KeyFinding]
    detected_conditions: List[DetectedCondition]
    recommendations: List[str]
    medical_terms: List[MedicalTerm]
    sources: List[Dict[str, Any]]


class PatientInfo(BaseModel):
    """Schema for patient information extracted from the report."""
    name: Optional[str] = None
    age: Optional[int] = None
    sex: Optional[str] = None
    patient_id: Optional[str] = None
    report_date: Optional[str] = None
    referring_physician: Optional[str] = None
    report_type: Optional[str] = None


class ReportFinding(BaseModel):
    """Schema for an extracted laboratory finding."""
    test_name: str
    value: Any
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    status: str
    interpretation: Optional[str] = None
    evidence_ids: List[str] = Field(default_factory=list)


class EvidenceSource(BaseModel):
    """Schema for a retrieved evidence source."""
    citation_id: str
    title: str
    organization: str
    year: int
    source_type: str
    url: str
    chunk_id: str
    excerpt: str


class ReportAnalysisDetail(BaseModel):
    """Schema for detailed report analysis returned by the RAG pipeline."""
    report_id: int
    status: str
    message: Optional[str] = None
    llm_status: str
    patient_info: PatientInfo
    summary: str
    findings: List[ReportFinding]
    detected_conditions: List[DetectedCondition]
    possible_conditions: List[Dict[str, Any]] = Field(default_factory=list)
    recommendations: List[Dict[str, Any]] = Field(default_factory=list)
    important_terms: List[Dict[str, Any]] = Field(default_factory=list)
    evidence_sources: List[EvidenceSource]
    retrieval_queries: List[str]
    processing_stage: Optional[str] = None
    educational_use_only: bool = True


class MedicalReportCreate(BaseModel):
    """Schema for medical report creation."""
    report_type: str
    patient_name: Optional[str] = None


class MedicalReportResponse(BaseModel):
    """Schema for medical report response."""
    id: int
    user_id: int
    filename: str
    file_size: int
    report_type: str
    patient_name: Optional[str]
    status: str
    processing_stage: Optional[str] = None
    summary: Optional[str]
    key_findings: Optional[List[Dict[str, Any]]] = None
    detected_conditions: Optional[List[Dict[str, Any]]] = None
    recommendations: Optional[List[str]] = None
    medical_terms: Optional[List[Dict[str, Any]]] = None
    uploaded_at: datetime
    analyzed_at: Optional[datetime]
    processing_message: Optional[str] = None

    class Config:
        from_attributes = True


# ============= Medical Image Schemas =============

class MedicalImageAnalysis(BaseModel):
    """Schema for medical image analysis result."""
    success: bool = True
    prediction: str
    confidence: float
    summary: str
    message: Optional[str] = None
    analysis_status: str
    image_id: int
    detected_condition: Optional[str] = None
    predicted_probability: Optional[float] = None
    threshold: Optional[float] = None
    class_names: Optional[List[str]] = None
    findings: Optional[List[str]] = None
    recommendations: Optional[List[str]] = None


class MedicalImageResponse(BaseModel):
    """Schema for medical image response."""
    id: int
    user_id: int
    filename: str
    original_filename: Optional[str] = None
    stored_filename: Optional[str] = None
    file_path: str
    file_size: int
    mime_type: Optional[str] = None
    image_type: str
    status: str
    analysis_status: Optional[str] = None
    detected_condition: Optional[str]
    confidence: Optional[float]
    findings: Optional[List[str]]
    recommendations: Optional[List[str]] = None
    uploaded_at: datetime
    upload_time: Optional[datetime] = None
    analyzed_at: Optional[datetime]
    created_at: Optional[datetime] = None
    preview_url: Optional[str] = None

    class Config:
        from_attributes = True


# ============= Chat Schemas =============

class Citation(BaseModel):
    """Schema for citation."""
    title: str
    source: str


class ChatMessageCreate(BaseModel):
    """Schema for creating chat message."""
    content: str
    session_id: Optional[str] = None


class ChatMessageResponse(BaseModel):
    """Schema for chat message response."""
    id: int
    role: str  # "user" or "assistant"
    content: str
    citations: Optional[List[Citation]]
    created_at: datetime

    class Config:
        from_attributes = True


class ChatResponse(BaseModel):
    """Schema for chat response."""
    message: ChatMessageResponse
    citations: Optional[List[Citation]]


# ============= Prescription Schemas =============

class Medicine(BaseModel):
    """Schema for medicine in prescription."""
    name: str
    dosage: str
    timing: str
    duration: str
    warnings: List[str]
    side_effects: List[str]
    interactions: List[str]


class PrescriptionResponse(BaseModel):
    """Schema for prescription response."""
    id: int
    user_id: int
    filename: str
    doctor_name: Optional[str]
    prescription_date: Optional[str]
    medicines: List[Medicine]
    uploaded_at: datetime

    class Config:
        from_attributes = True


# ============= Bookmark Schemas =============

class BookmarkCreate(BaseModel):
    """Schema for creating bookmark."""
    report_id: Optional[int] = None
    article_id: Optional[str] = None


class BookmarkResponse(BaseModel):
    """Schema for bookmark response."""
    id: int
    user_id: int
    report_id: Optional[int]
    article_id: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ============= Knowledge Library Schemas =============

class KnowledgeArticleResponse(BaseModel):
    """Schema for knowledge article response."""
    id: int
    external_id: str
    title: str
    category: str
    organization: str
    publication_date: str
    tags: List[str]
    source_url: Optional[str]

    class Config:
        from_attributes = True


# ============= File Upload Schemas =============

class FileUploadResponse(BaseModel):
    """Schema for file upload response."""
    filename: str
    file_size: int
    file_path: str
    upload_id: str
    status: Optional[str] = None


# ============= Error Response Schemas =============

class ErrorResponse(BaseModel):
    """Schema for error response."""
    detail: str
    error_code: str
    timestamp: datetime


class ValidationErrorResponse(BaseModel):
    """Schema for validation error response."""
    detail: List[Dict[str, Any]]
    error_code: str = "VALIDATION_ERROR"


# ============= OCR Schemas =============

class AbnormalValue(BaseModel):
    """Schema for abnormal value detection."""
    field: str
    value: Any
    normal_range: Optional[str] = None
    severity: str  # "low", "medium", "high"
    note: str


class OCRExtractedText(BaseModel):
    """Schema for OCR extracted text."""
    raw_text: str
    confidence: float
    language: Optional[str] = "en"
    extraction_method: str  # "tesseract", "pdfplumber", "pymupdf"


class PrescriptionExtraction(BaseModel):
    """Schema for OCR prescription extraction."""
    patient_name: Optional[str] = None
    patient_age: Optional[str] = None
    doctor_name: Optional[str] = None
    clinic_name: Optional[str] = None
    prescription_date: Optional[str] = None
    medicines: List[Medicine]
    notes: Optional[str] = None
    abnormal_values: List[AbnormalValue]
    raw_text: str
    confidence: float


class TestResult(BaseModel):
    """Schema for medical test result."""
    test_name: str
    value: Any
    unit: Optional[str] = None
    normal_range: Optional[str] = None
    abnormal: bool = False
    severity: Optional[str] = None


class MedicalReportExtraction(BaseModel):
    """Schema for OCR medical report extraction."""
    report_type: str  # "CBC", "Blood Test", "X-ray", etc.
    patient_name: Optional[str] = None
    patient_age: Optional[str] = None
    patient_id: Optional[str] = None
    test_date: Optional[str] = None
    lab_name: Optional[str] = None
    test_results: List[TestResult]
    summary: Optional[str] = None
    notes: Optional[str] = None
    abnormal_values: List[AbnormalValue]
    raw_text: str
    confidence: float


class ImageOCRExtraction(BaseModel):
    """Schema for OCR image text extraction."""
    detected_text: str
    text_regions: List[Dict[str, Any]]  # Bounding boxes with coordinates
    confidence: float
    image_type: Optional[str] = None  # Medical image type
    processing_method: str  # "tesseract", "easyocr", etc.


class OCRRequest(BaseModel):
    """Schema for OCR processing request."""
    extraction_type: str  # "text", "prescription", "medical_report", "image"
    highlight_abnormal: bool = True


class OCRResponse(BaseModel):
    """Schema for OCR processing response."""
    request_id: str
    status: str  # "success", "partial", "error"
    extracted_data: Optional[Dict[str, Any]] = None
    confidence: Optional[float] = None
    abnormal_values: Optional[List[AbnormalValue]] = None
    processing_time: float  # in seconds
    message: Optional[str] = None
    error: Optional[str] = None
