"""
Authentication service for user registration, login, and token management.
"""
from typing import Optional, Tuple
from sqlalchemy.orm import Session

from app.models import User
from app.schemas import UserCreate, UserResponse
from app.core.security import TokenUtils, PasswordUtils
from app.utils.logger import get_logger

logger = get_logger("auth_service")


class AuthService:
    """Service for authentication operations."""

    @staticmethod
    def register_user(db: Session, user_data: UserCreate) -> Tuple[Optional[User], Optional[str]]:
        """
        Register a new user.
        Returns tuple of (user, error_message)
        """
        try:
            # Check if user exists
            existing_user = db.query(User).filter(User.email == user_data.email).first()
            if existing_user:
                return None, "Email already registered"

            # Hash password
            hashed_password = PasswordUtils.hash_password(user_data.password)

            # Create user
            user = User(
                name=user_data.name,
                email=user_data.email,
                phone=user_data.phone,
                hashed_password=hashed_password,
                date_of_birth=user_data.date_of_birth,
                gender=user_data.gender,
                emergency_contact=user_data.emergency_contact,
            )

            db.add(user)
            db.commit()
            db.refresh(user)

            logger.info(f"User registered: {user.email}")
            return user, None

        except Exception as e:
            db.rollback()
            logger.error(f"Error registering user: {str(e)}")
            return None, str(e)

    @staticmethod
    def authenticate_user(
        db: Session,
        email: str,
        password: str
    ) -> Tuple[Optional[User], Optional[str]]:
        """
        Authenticate user.
        Returns tuple of (user, error_message)
        """
        try:
            user = db.query(User).filter(User.email == email).first()

            if not user:
                return None, "Invalid email or password"

            if not PasswordUtils.verify_password(password, user.hashed_password):
                return None, "Invalid email or password"

            if not user.is_active:
                return None, "User account is inactive"

            logger.info(f"User authenticated: {user.email}")
            return user, None

        except Exception as e:
            logger.error(f"Error authenticating user: {str(e)}")
            return None, str(e)

    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        """Get user by ID."""
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """Get user by email."""
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def update_user(db: Session, user_id: int, update_data: dict) -> Tuple[Optional[User], Optional[str]]:
        """Update user data."""
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return None, "User not found"

            for field, value in update_data.items():
                if value is not None:
                    setattr(user, field, value)

            db.commit()
            db.refresh(user)
            logger.info(f"User updated: {user.email}")
            return user, None

        except Exception as e:
            db.rollback()
            logger.error(f"Error updating user: {str(e)}")
            return None, str(e)
