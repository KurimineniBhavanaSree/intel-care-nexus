"""
Core configuration module for MedIntel backend.
"""
import os
import socket
from pathlib import Path
from typing import Optional

BASE_DIR = Path(__file__).resolve().parents[2]
ENV_FILE = BASE_DIR / ".env"

try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
except ImportError:  # pragma: no cover - compatibility fallback
    from pydantic.v1 import BaseSettings
    SettingsConfigDict = None


def _detect_local_ip() -> Optional[str]:
    """
    Detect the LAN IP for the current machine.

    This lets local browser sessions opened via a network URL, such as
    http://192.168.x.x:8080, pass CORS checks during development.
    """
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.connect(("8.8.8.8", 80))
            ip = sock.getsockname()[0]
            if ip and not ip.startswith("127."):
                return ip
    except OSError:
        return None
    return None


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    if SettingsConfigDict is not None:  # pragma: no branch - pydantic-settings path
        model_config = SettingsConfigDict(
            env_file=str(ENV_FILE),
            case_sensitive=True,
            extra="ignore",
        )

    # Application
    APP_ENV: str = "development"
    APP_DEBUG: bool = True
    APP_VERSION: str = "1.0.0"
    APP_TITLE: str = "MedIntel API"
    APP_DESCRIPTION: str = "Explainable Multimodal Healthcare Assistant API"
    LOG_LEVEL: str = "INFO"

    # API
    API_V1_STR: str = "/api/v1"
    API_DOCS_URL: str = "/docs"
    API_REDOC_URL: str = "/redoc"

    # Database
    DATABASE_URL: str = "postgresql+psycopg://user:password@localhost:5432/medintel_db"
    DATABASE_ECHO: bool = False
    SQLALCHEMY_POOL_SIZE: int = 10
    SQLALCHEMY_POOL_RECYCLE: int = 3600
    SQLALCHEMY_POOL_PRE_PING: bool = True

    # JWT & Security
    SECRET_KEY: str = "change-this-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8080",
        "http://localhost:8082",
        "http://localhost:4173",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:8082",
        "http://127.0.0.1:4173",
    ]
    CORS_CREDENTIALS: bool = True
    CORS_METHODS: list = ["*"]
    CORS_HEADERS: list = ["*"]

    # OpenAI
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"

    # Gemini
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.6-flash"

    # Medical RAG
    MEDICAL_EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    MEDICAL_VECTORSTORE_NAME: str = "medical_trusted_sources"

    # File Upload
    MAX_UPLOAD_SIZE: int = 20971520  # 20MB
    ALLOWED_EXTENSIONS: list = ["pdf", "docx", "txt", "png", "jpg", "jpeg", "dicom", "dcm"]
    UPLOAD_DIR: str = "./app/uploads"
    VECTORSTORE_DIR: str = "./app/rag/vectorstore"

    # Redis (optional)
    REDIS_URL: Optional[str] = None

    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    FROM_EMAIL: str = "noreply@medintel.io"

    # AWS S3
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_S3_BUCKET: Optional[str] = None
    AWS_REGION: str = "us-east-1"

    # Sentry
    SENTRY_DSN: Optional[str] = None
    if SettingsConfigDict is None:  # pragma: no cover - pydantic v1 fallback
        class Config:
            env_file = str(ENV_FILE)
            case_sensitive = True
            extra = "ignore"


settings = Settings()

local_ip = _detect_local_ip()
if local_ip:
    for port in ("5173", "3000", "8080", "4173"):
        origin = f"http://{local_ip}:{port}"
        if origin not in settings.CORS_ORIGINS:
            settings.CORS_ORIGINS.append(origin)

# Ensure upload directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.VECTORSTORE_DIR, exist_ok=True)
