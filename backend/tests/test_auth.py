"""
Tests for authentication endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.database import Base, get_db
from app.schemas import UserCreate

# Test database
TEST_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(
    TEST_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


class TestAuth:
    """Test authentication endpoints."""

    def test_register(self):
        """Test user registration."""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "name": "John Doe",
                "email": "john@example.com",
                "phone": "+1234567890",
                "password": "password123",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    def test_register_duplicate_email(self):
        """Test registration with duplicate email."""
        # First registration
        client.post(
            "/api/v1/auth/register",
            json={
                "name": "John Doe",
                "email": "john@example.com",
                "phone": "+1234567890",
                "password": "password123",
            },
        )

        # Duplicate registration
        response = client.post(
            "/api/v1/auth/register",
            json={
                "name": "Jane Doe",
                "email": "john@example.com",
                "phone": "+0987654321",
                "password": "password456",
            },
        )
        assert response.status_code == 400

    def test_login(self):
        """Test user login."""
        # Register user
        client.post(
            "/api/v1/auth/register",
            json={
                "name": "John Doe",
                "email": "john@example.com",
                "phone": "+1234567890",
                "password": "password123",
            },
        )

        # Login
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "john@example.com",
                "password": "password123",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data

    def test_login_invalid_password(self):
        """Test login with invalid password."""
        # Register user
        client.post(
            "/api/v1/auth/register",
            json={
                "name": "John Doe",
                "email": "john@example.com",
                "phone": "+1234567890",
                "password": "password123",
            },
        )

        # Login with wrong password
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "john@example.com",
                "password": "wrongpassword",
            },
        )
        assert response.status_code == 401

    def test_get_current_user(self):
        """Test get current user endpoint."""
        # Register and login
        register_response = client.post(
            "/api/v1/auth/register",
            json={
                "name": "John Doe",
                "email": "john@example.com",
                "phone": "+1234567890",
                "password": "password123",
            },
        )
        token = register_response.json()["access_token"]

        # Get current user
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "john@example.com"
        assert data["name"] == "John Doe"

    def test_logout(self):
        """Test logout endpoint."""
        # Register and login
        register_response = client.post(
            "/api/v1/auth/register",
            json={
                "name": "John Doe",
                "email": "john@example.com",
                "phone": "+1234567890",
                "password": "password123",
            },
        )
        token = register_response.json()["access_token"]

        # Logout
        response = client.post(
            "/api/v1/auth/logout",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
