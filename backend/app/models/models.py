"""
SQLAlchemy ORM models for MedIntel database.
"""
from datetime import datetime
from enum import Enum

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Float, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship

from app.db.database import Base


class ReportStatus(str, Enum):
    """Status of medical report processing."""
    PENDING = "pending"
    PROCESSING = "processing"
    ANALYZED = "analyzed"
    FAILED = "failed"


class UserRole(str, Enum):
    """User roles in the system."""
    ADMIN = "admin"
    PHYSICIAN = "physician"
    PATIENT = "patient"


class User(Base):
    """User model."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True)
    email = Column(String(255), unique=True, index=True)
    phone = Column(String(20), nullable=True)
    hashed_password = Column(String(255))
    date_of_birth = Column(String(10), nullable=True)
    gender = Column(String(50), nullable=True)
    emergency_contact = Column(String(20), nullable=True)
    role = Column(SQLEnum(UserRole), default=UserRole.PHYSICIAN)
    avatar_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    reports = relationship("MedicalReport", back_populates="user")
    chats = relationship("ChatMessage", back_populates="user")
    bookmarks = relationship("Bookmark", back_populates="user")
    images = relationship("MedicalImage", back_populates="user")

    def __repr__(self) -> str:
        return f"<User {self.email}>"


class MedicalReport(Base):
    """Medical report model."""
    __tablename__ = "medical_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    filename = Column(String(255))
    file_path = Column(String(500))
    file_size = Column(Integer)
    report_type = Column(String(100))  # CBC, MRI, etc.
    patient_name = Column(String(255), nullable=True)
    status = Column(SQLEnum(ReportStatus), default=ReportStatus.PENDING)
    processing_stage = Column(String(50), default="uploaded")
    extracted_text = Column(Text, nullable=True)
    extracted_data = Column(JSON, nullable=True)
    retrieval_queries = Column(JSON, nullable=True)
    evidence_sources = Column(JSON, nullable=True)
    analysis_payload = Column(JSON, nullable=True)
    processing_message = Column(Text, nullable=True)
    
    # Analysis data
    summary = Column(Text, nullable=True)
    key_findings = Column(JSON, nullable=True)  # List of findings
    detected_conditions = Column(JSON, nullable=True)  # List with confidence scores
    recommendations = Column(JSON, nullable=True)  # List of recommendations
    medical_terms = Column(JSON, nullable=True)  # Glossary terms
    
    # Metadata
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    analyzed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="reports")
    bookmarks = relationship("Bookmark", back_populates="report")

    def __repr__(self) -> str:
        return f"<MedicalReport {self.id} - {self.report_type}>"


class MedicalImage(Base):
    """Medical image model (X-ray, MRI, CT, etc.)."""
    __tablename__ = "medical_images"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    filename = Column(String(255))
    original_filename = Column(String(255), nullable=True)
    stored_filename = Column(String(255), nullable=True)
    file_path = Column(String(500))
    file_size = Column(Integer)
    mime_type = Column(String(100), nullable=True)
    image_type = Column(String(100))  # X-Ray, MRI, CT, etc.
    modality = Column(String(100), nullable=True)
    status = Column(SQLEnum(ReportStatus), default=ReportStatus.PENDING)
    analysis_status = Column(String(50), default="Uploaded")
    
    # Analysis data
    detected_condition = Column(String(500), nullable=True)
    confidence = Column(Float, nullable=True)
    findings = Column(JSON, nullable=True)  # List of findings
    recommendations = Column(JSON, nullable=True)
    
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    upload_time = Column(DateTime, default=datetime.utcnow)
    analyzed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="images")

    def __repr__(self) -> str:
        return f"<MedicalImage {self.id} - {self.image_type}>"


class ChatMessage(Base):
    """Chat message model."""
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    role = Column(String(20))  # "user" or "assistant"
    content = Column(Text)
    citations = Column(JSON, nullable=True)  # List of {title, source}
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="chats")

    def __repr__(self) -> str:
        return f"<ChatMessage {self.id} - {self.role}>"


class Bookmark(Base):
    """Bookmark model for saved reports and articles."""
    __tablename__ = "bookmarks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    report_id = Column(Integer, ForeignKey("medical_reports.id"), nullable=True)
    article_id = Column(String(100), nullable=True)  # ID from knowledge library
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="bookmarks")
    report = relationship("MedicalReport", back_populates="bookmarks")

    def __repr__(self) -> str:
        return f"<Bookmark {self.id}>"


class KnowledgeArticle(Base):
    """Knowledge library article model."""
    __tablename__ = "knowledge_articles"

    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String(100), unique=True, index=True)
    title = Column(String(500))
    content = Column(Text, nullable=True)
    category = Column(String(100))  # Cardiology, Neurology, etc.
    organization = Column(String(255))  # WHO, PubMed, etc.
    publication_date = Column(String(50))
    tags = Column(JSON)  # List of tags
    source_url = Column(String(500), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<KnowledgeArticle {self.title}>"


class Prescription(Base):
    """Prescription model."""
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    filename = Column(String(255))
    file_path = Column(String(500))
    
    # Extracted prescription data
    doctor_name = Column(String(255), nullable=True)
    prescription_date = Column(String(50), nullable=True)
    medicines = Column(JSON)  # List of medicine data
    
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<Prescription {self.id}>"


class ChatHistory(Base):
    """Chat session history model."""
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    session_id = Column(String(100), index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<ChatHistory {self.session_id}>"
