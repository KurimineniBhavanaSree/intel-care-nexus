"""
Main entry point for running the FastAPI server.
Usage: python main.py or uvicorn main:app --reload
"""
import os
import sys
import uvicorn

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.core.config import settings


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.APP_DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
        env_file=".env"
    )
