from fastapi.testclient import TestClient
from backend.main import app
from backend.database import Base, engine, get_db
from sqlalchemy.orm import sessionmaker
import pytest
import os

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def run_around_tests():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def test_register_user():
    response = client.post(
        "/api/auth/register",
        json={"email": "test@dublajlab.com", "password": "testpassword", "display_name": "Test User"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@dublajlab.com"
    assert "id" in data
    assert data["display_name"] == "Test User"

def test_register_duplicate_email():
    client.post(
        "/api/auth/register",
        json={"email": "dup@dublajlab.com", "password": "testpassword", "display_name": "Test User"}
    )
    response = client.post(
        "/api/auth/register",
        json={"email": "dup@dublajlab.com", "password": "testpassword", "display_name": "Test User 2"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Bu e-posta adresi zaten kullanımda."

def test_login_success():
    client.post(
        "/api/auth/register",
        json={"email": "login@dublajlab.com", "password": "testpassword", "display_name": "Test User"}
    )
    response = client.post(
        "/api/auth/login",
        json={"email": "login@dublajlab.com", "password": "testpassword"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_login_fail_wrong_password():
    client.post(
        "/api/auth/register",
        json={"email": "fail@dublajlab.com", "password": "testpassword", "display_name": "Test User"}
    )
    response = client.post(
        "/api/auth/login",
        json={"email": "fail@dublajlab.com", "password": "wrongpassword"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "E-posta veya şifre hatalı."
