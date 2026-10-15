from fastapi.testclient import TestClient
from backend.main import app
from backend.routers import auth_router

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


def test_password_registration_requires_email_verification(monkeypatch):
    sent = {}

    def fake_send(**kwargs):
        sent.update(kwargs)

    monkeypatch.setenv("EMAIL_VERIFICATION_REQUIRED", "true")
    monkeypatch.setattr(auth_router, "send_verification_email", fake_send)
    register_response = client.post(
        "/api/auth/register",
        json={
            "email": "verify@dublajlab.com",
            "password": "testpassword",
            "display_name": "Verify User",
        },
    )

    assert register_response.status_code == 200
    assert register_response.json()["email_verified"] is False
    assert register_response.json()["email_verification_required"] is True
    assert sent["recipient"] == "verify@dublajlab.com"

    blocked_login = client.post(
        "/api/auth/login",
        json={"email": "verify@dublajlab.com", "password": "testpassword"},
    )
    assert blocked_login.status_code == 403
    assert "doğrulamanız gerekiyor" in blocked_login.json()["detail"]

    token = sent["verification_url"].split("token=", 1)[1]
    verification = client.get(
        f"/api/auth/verify-email?token={token}", follow_redirects=False
    )
    assert verification.status_code == 303
    assert "email_verification=success" in verification.headers["location"]

    login_response = client.post(
        "/api/auth/login",
        json={"email": "verify@dublajlab.com", "password": "testpassword"},
    )
    assert login_response.status_code == 200


def test_invalid_email_verification_token_is_rejected(monkeypatch):
    monkeypatch.setenv("EMAIL_VERIFICATION_REQUIRED", "true")
    response = client.get(
        "/api/auth/verify-email?token=not-a-real-token", follow_redirects=False
    )
    assert response.status_code == 303
    assert "email_verification=invalid" in response.headers["location"]


def test_registration_fails_closed_when_verification_mail_cannot_be_sent(monkeypatch):
    def fail_delivery(**_kwargs):
        raise OSError("SMTP unavailable")

    monkeypatch.setenv("EMAIL_VERIFICATION_REQUIRED", "true")
    monkeypatch.setattr(auth_router, "send_verification_email", fail_delivery)
    response = client.post(
        "/api/auth/register",
        json={
            "email": "delivery-failure@dublajlab.com",
            "password": "testpassword",
            "display_name": "Delivery Failure",
        },
    )
    assert response.status_code == 503
    assert response.json()["detail"] == (
        "Doğrulama e-postası şu anda gönderilemiyor. "
        "Lütfen daha sonra tekrar deneyin."
    )
