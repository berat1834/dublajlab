from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

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

def test_me_without_token():
    response = client.get("/api/auth/me")
    assert response.status_code == 401

def test_me_invalid_token():
    response = client.get("/api/auth/me", headers={"Authorization": "Bearer invalidtoken123"})
    assert response.status_code == 401

def test_me_success():
    client.post(
        "/api/auth/register",
        json={"email": "metest@dublajlab.com", "password": "testpassword", "display_name": "Test User"}
    )
    login_response = client.post(
        "/api/auth/login",
        json={"email": "metest@dublajlab.com", "password": "testpassword"}
    )
    token = login_response.json()["access_token"]
    me_response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "metest@dublajlab.com"
