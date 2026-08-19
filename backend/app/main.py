"""
FastAPI application factory and configuration.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.core.config import settings
from app.api.v1 import api_router
from app.db.database import Base, engine
from app.services import ImageService, ReportService
from app.utils.logger import get_logger

logger = get_logger("main")


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""

    # Create database tables
    Base.metadata.create_all(bind=engine)

    # Initialize FastAPI app
    app = FastAPI(
        title=settings.APP_TITLE,
        description=settings.APP_DESCRIPTION,
        version=settings.APP_VERSION,
        docs_url=settings.API_DOCS_URL if settings.APP_DEBUG else None,
        redoc_url=settings.API_REDOC_URL if settings.APP_DEBUG else None,
        openapi_url="/openapi.json" if settings.APP_DEBUG else None,
    )

    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=settings.CORS_CREDENTIALS,
        allow_methods=settings.CORS_METHODS,
        allow_headers=settings.CORS_HEADERS,
    )

    # Add trusted host middleware
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["localhost", "127.0.0.1", "testserver", "*.yourdomain.com"]
    )

    # Include API routers
    app.include_router(
        api_router,
        prefix=settings.API_V1_STR,
        responses={404: {"description": "Not found"}},
    )

    # Health check endpoint
    @app.get("/health")
    async def health_check():
        """Health check endpoint."""
        return {
            "status": "healthy",
            "version": settings.APP_VERSION,
            "environment": settings.APP_ENV
        }

    # Root endpoint
    @app.get("/")
    async def root():
        """Root endpoint."""
        return {
            "message": "MedIntel API",
            "version": settings.APP_VERSION,
            "docs": f"{settings.API_DOCS_URL}",
            "health": "/health"
        }

    # Event handlers
    @app.on_event("startup")
    async def startup_event():
        """Run on application startup."""
        logger.info(f"MedIntel API starting up (v{settings.APP_VERSION})")
        logger.info(f"Environment: {settings.APP_ENV}")
        logger.info(f"Database: {settings.DATABASE_URL}")
        ReportService.sync_schema()
        ImageService.sync_schema()
        try:
            ImageService.initialize()
        except Exception as exc:
            logger.exception("Medical image model warmup failed: %s", exc)

    @app.on_event("shutdown")
    async def shutdown_event():
        """Run on application shutdown."""
        logger.info("MedIntel API shutting down")

    return app


# Create the app instance
app = create_app()
