"""
Authentication API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas import (
    AuthSessionResponse,
    RefreshTokenRequest,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
    UserUpdate,
)
from app.services import AuthService
from app.core.security import TokenUtils, verify_token
from app.utils.logger import get_logger

logger = get_logger("auth_routes")

router = APIRouter(prefix="/auth", tags=["Authentication"])


def build_auth_response(user, access_token: str, refresh_token: str) -> dict:
    """Build a consistent auth session payload."""
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user,
    }


@router.post("/register", response_model=AuthSessionResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    # Register user
    user, error = AuthService.register_user(db, user_data)

    if error:
        logger.warning(f"Registration failed: {error}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error
        )

    # Create tokens
    access_token = TokenUtils.create_access_token(subject=str(user.id))
    refresh_token = TokenUtils.create_refresh_token(subject=str(user.id))

    logger.info(f"User registered successfully: {user.email}")

    return build_auth_response(user, access_token, refresh_token)


@router.post("/login", response_model=AuthSessionResponse)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login user."""
    user, error = AuthService.authenticate_user(db, credentials.email, credentials.password)

    if error:
        logger.warning(f"Login failed for {credentials.email}: {error}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error
        )

    # Create tokens
    access_token = TokenUtils.create_access_token(subject=str(user.id))
    refresh_token = TokenUtils.create_refresh_token(subject=str(user.id))

    logger.info(f"User logged in: {user.email}")

    return build_auth_response(user, access_token, refresh_token)


@router.post("/refresh", response_model=AuthSessionResponse)
async def refresh_token(refresh_request: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Refresh access token."""
    payload = TokenUtils.verify_token(refresh_request.refresh_token)

    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    user_id = payload.get("sub")
    user = AuthService.get_user_by_id(db, int(user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    access_token = TokenUtils.create_access_token(subject=user_id)

    return build_auth_response(user, access_token, refresh_request.refresh_token)


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    current_user_id: int = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get current user profile."""
    user = AuthService.get_user_by_id(db, current_user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user


@router.put("/me", response_model=UserResponse)
async def update_user(
    update_data: UserUpdate,
    current_user_id: int = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Update current user profile."""
    # Filter out None values
    update_dict = update_data.model_dump(exclude_unset=True)

    user, error = AuthService.update_user(db, current_user_id, update_dict)

    if error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error
        )

    return user


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(current_user_id: int = Depends(verify_token)):
    """Logout user (client should discard token)."""
    return {"message": "Logged out successfully"}
