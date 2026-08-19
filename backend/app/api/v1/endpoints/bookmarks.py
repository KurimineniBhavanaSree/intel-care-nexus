"""
Bookmarks API endpoints for saving reports and articles.
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Bookmark
from app.schemas import BookmarkCreate, BookmarkResponse
from app.core.security import verify_token
from app.utils.logger import get_logger

logger = get_logger("bookmark_routes")

router = APIRouter(prefix="/bookmarks", tags=["Bookmarks"])


@router.post("", response_model=BookmarkResponse, status_code=status.HTTP_201_CREATED)
async def create_bookmark(
    bookmark_data: BookmarkCreate,
    current_user_id: int = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Create a bookmark."""
    try:
        bookmark = Bookmark(
            user_id=current_user_id,
            report_id=bookmark_data.report_id,
            article_id=bookmark_data.article_id
        )

        db.add(bookmark)
        db.commit()
        db.refresh(bookmark)

        logger.info(f"Bookmark created: {bookmark.id}")
        return bookmark

    except Exception as e:
        db.rollback()
        logger.error(f"Error creating bookmark: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating bookmark"
        )


@router.get("", response_model=List[BookmarkResponse])
async def list_bookmarks(
    current_user_id: int = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """List all bookmarks for current user."""
    bookmarks = db.query(Bookmark).filter(
        Bookmark.user_id == current_user_id
    ).order_by(Bookmark.created_at.desc()).all()

    return bookmarks


@router.delete("/{bookmark_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bookmark(
    bookmark_id: int,
    current_user_id: int = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Delete a bookmark."""
    bookmark = db.query(Bookmark).filter(Bookmark.id == bookmark_id).first()

    if not bookmark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bookmark not found"
        )

    if bookmark.user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )

    try:
        db.delete(bookmark)
        db.commit()
        logger.info(f"Bookmark {bookmark_id} deleted")
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting bookmark: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting bookmark"
        )
