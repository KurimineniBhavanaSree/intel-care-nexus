"""
API v1 package initialization.
"""
from fastapi import APIRouter

from app.api.v1.endpoints import auth, reports, chat, images, bookmarks, library, prescriptions, ocr

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(reports.router)
api_router.include_router(chat.router)
api_router.include_router(images.router)
api_router.include_router(bookmarks.router)
api_router.include_router(library.router)
api_router.include_router(prescriptions.router)
api_router.include_router(ocr.router)

__all__ = ["api_router"]
