"""
Knowledge Library API endpoints.
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import KnowledgeArticle
from app.schemas import KnowledgeArticleResponse
from app.core.security import verify_token
from app.utils.logger import get_logger

logger = get_logger("library_routes")

router = APIRouter(prefix="/library", tags=["Knowledge Library"])


@router.get("", response_model=List[KnowledgeArticleResponse])
async def list_articles(
    category: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    current_user_id: int = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """List knowledge articles with filtering and search."""
    try:
        query = db.query(KnowledgeArticle)

        if category:
            query = query.filter(KnowledgeArticle.category == category)

        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (KnowledgeArticle.title.ilike(search_term)) |
                (KnowledgeArticle.organization.ilike(search_term))
            )

        articles = query.offset(skip).limit(limit).all()
        return articles

    except Exception as e:
        logger.error(f"Error listing articles: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching articles"
        )


@router.get("/categories", response_model=List[str])
async def get_categories(
    current_user_id: int = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get list of article categories."""
    try:
        categories = db.query(KnowledgeArticle.category).distinct().all()
        return [cat[0] for cat in categories if cat[0]]

    except Exception as e:
        logger.error(f"Error fetching categories: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching categories"
        )


@router.get("/{article_id}", response_model=KnowledgeArticleResponse)
async def get_article(
    article_id: int,
    current_user_id: int = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get article by ID."""
    article = db.query(KnowledgeArticle).filter(
        KnowledgeArticle.id == article_id
    ).first()

    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found"
        )

    return article
