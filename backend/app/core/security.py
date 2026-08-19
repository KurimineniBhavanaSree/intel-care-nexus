"""
Security utilities for JWT, password hashing, and authentication.
"""
import base64
import hashlib
import hmac
import json
import time
from datetime import datetime, timedelta, timezone
from typing import Optional, Any, Dict

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import bcrypt

from app.core.config import settings

try:
    from jose import JWTError, jwt
except ImportError:  # pragma: no cover - compatibility fallback
    class JWTError(Exception):
        """Fallback JWT error used when python-jose is unavailable."""

    class _LocalJWT:
        @staticmethod
        def _b64url_encode(value: bytes) -> str:
            return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")

        @staticmethod
        def _b64url_decode(value: str) -> bytes:
            padding = "=" * (-len(value) % 4)
            return base64.urlsafe_b64decode(value + padding)

        @staticmethod
        def encode(payload: Dict[str, Any], key: str, algorithm: str = "HS256") -> str:
            if algorithm != "HS256":
                raise JWTError("Unsupported algorithm")

            header = {"alg": algorithm, "typ": "JWT"}
            header_segment = _LocalJWT._b64url_encode(
                json.dumps(header, separators=(",", ":")).encode("utf-8")
            )
            payload_segment = _LocalJWT._b64url_encode(
                json.dumps(payload, separators=(",", ":"), default=str).encode("utf-8")
            )
            signing_input = f"{header_segment}.{payload_segment}".encode("ascii")
            signature = hmac.new(
                key.encode("utf-8"),
                signing_input,
                hashlib.sha256,
            ).digest()
            return f"{header_segment}.{payload_segment}.{_LocalJWT._b64url_encode(signature)}"

        @staticmethod
        def decode(token: str, key: str, algorithms: list[str] | None = None) -> Dict[str, Any]:
            try:
                header_segment, payload_segment, signature_segment = token.split(".")
            except ValueError as exc:
                raise JWTError("Invalid token") from exc

            header = json.loads(_LocalJWT._b64url_decode(header_segment))
            algorithm = header.get("alg")
            if algorithms and algorithm not in algorithms:
                raise JWTError("Unsupported algorithm")
            if algorithm != "HS256":
                raise JWTError("Unsupported algorithm")

            signing_input = f"{header_segment}.{payload_segment}".encode("ascii")
            expected_signature = hmac.new(
                key.encode("utf-8"),
                signing_input,
                hashlib.sha256,
            ).digest()
            provided_signature = _LocalJWT._b64url_decode(signature_segment)

            if not hmac.compare_digest(expected_signature, provided_signature):
                raise JWTError("Invalid token signature")

            payload = json.loads(_LocalJWT._b64url_decode(payload_segment))
            exp = payload.get("exp")
            if exp is not None and int(exp) < int(time.time()):
                raise JWTError("Token expired")
            return payload

    jwt = _LocalJWT()


bearer_scheme = HTTPBearer(auto_error=False)


class TokenUtils:
    """Utilities for JWT token operations."""

    @staticmethod
    def create_access_token(
        subject: str,
        expires_delta: Optional[timedelta] = None,
        **kwargs: Any
    ) -> str:
        """Create JWT access token."""
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(
                minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
            )

        to_encode = {"exp": int(expire.timestamp()), "sub": str(subject)}
        to_encode.update(kwargs)
        encoded_jwt = jwt.encode(
            to_encode,
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM
        )
        return encoded_jwt

    @staticmethod
    def create_refresh_token(subject: str) -> str:
        """Create JWT refresh token."""
        expire = datetime.now(timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
        to_encode = {"exp": int(expire.timestamp()), "sub": str(subject), "type": "refresh"}
        encoded_jwt = jwt.encode(
            to_encode,
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM
        )
        return encoded_jwt

    @staticmethod
    def verify_token(token: str) -> Dict[str, Any]:
        """Verify JWT token and return payload."""
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM]
            )
            return payload
        except JWTError:
            return {}

    @staticmethod
    def get_subject_from_token(token: str) -> Optional[str]:
        """Extract subject (user_id) from token."""
        payload = TokenUtils.verify_token(token)
        return payload.get("sub")


class PasswordUtils:
    """Utilities for password hashing and verification."""

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password."""
        if len(password.encode("utf-8")) > 72:
            raise ValueError("Password must be 72 bytes or fewer.")

        hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
        return hashed.decode("utf-8")

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash."""
        try:
            return bcrypt.checkpw(
                plain_password.encode("utf-8"),
                hashed_password.encode("utf-8"),
            )
        except ValueError:
            return False


def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> int:
    """
    Validate a bearer token and return the authenticated user ID.
    """
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
        )

    payload = TokenUtils.verify_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    subject = payload.get("sub")
    if subject is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    try:
        return int(subject)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
