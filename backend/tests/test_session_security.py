from fastapi.testclient import TestClient

from backend.main import app


STRONG_PASSWORD = "Forest-River-2026"


def _registered_client(email: str) -> TestClient:
    client = TestClient(app)
    response = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": STRONG_PASSWORD,
            "display_name": "Cookie User",
        },
    )
    assert response.status_code == 200
    return client


def test_login_sets_httponly_session_cookie(db_session, monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("EMAIL_VERIFICATION_REQUIRED", "false")
    monkeypatch.setenv("AUTH_SESSION_COOKIE_ENABLED", "true")
    client = _registered_client("cookie-login@dublajlab.com")

    response = client.post(
        "/api/auth/login",
        json={"email": "cookie-login@dublajlab.com", "password": STRONG_PASSWORD},
    )

    assert response.status_code == 200
    cookie = response.headers["set-cookie"]
    assert "dublajlab_session=" in cookie
    assert "HttpOnly" in cookie
    assert "Secure" in cookie
    assert "SameSite=lax" in cookie


def test_cookie_only_login_omits_bearer_token(db_session, monkeypatch):
    monkeypatch.setenv("AUTH_COOKIE_ONLY", "true")
    client = _registered_client("cookie-only@dublajlab.com")

    response = client.post(
        "/api/auth/login",
        json={"email": "cookie-only@dublajlab.com", "password": STRONG_PASSWORD},
    )

    assert response.status_code == 200
    assert response.json()["access_token"] is None
    assert "dublajlab_session=" in response.headers["set-cookie"]


def test_native_mobile_login_returns_bearer_token(db_session, monkeypatch):
    monkeypatch.setenv("AUTH_COOKIE_ONLY", "true")
    client = _registered_client("mobile-login@dublajlab.com")

    response = client.post(
        "/api/auth/mobile/login",
        json={"email": "mobile-login@dublajlab.com", "password": STRONG_PASSWORD},
    )

    assert response.status_code == 200
    assert response.json()["access_token"]
    assert response.json()["token_type"] == "bearer"


def test_browser_cannot_use_mobile_login(db_session):
    client = _registered_client("browser-mobile-login@dublajlab.com")

    response = client.post(
        "/api/auth/mobile/login",
        headers={"Origin": "https://www.dublajlab.com.tr"},
        json={
            "email": "browser-mobile-login@dublajlab.com",
            "password": STRONG_PASSWORD,
        },
    )

    assert response.status_code == 400


def test_cookie_session_authenticates_me(db_session, monkeypatch):
    monkeypatch.setenv("AUTH_SESSION_COOKIE_ENABLED", "true")
    client = _registered_client("cookie-me@dublajlab.com")
    login = client.post(
        "/api/auth/login",
        json={"email": "cookie-me@dublajlab.com", "password": STRONG_PASSWORD},
    )
    assert login.status_code == 200

    response = client.get("/api/auth/me")

    assert response.status_code == 200
    assert response.json()["email"] == "cookie-me@dublajlab.com"


def test_cookie_session_rejects_cross_site_state_change(db_session, monkeypatch):
    monkeypatch.setenv("AUTH_SESSION_COOKIE_ENABLED", "true")
    client = _registered_client("cookie-csrf@dublajlab.com")
    login = client.post(
        "/api/auth/login",
        json={"email": "cookie-csrf@dublajlab.com", "password": STRONG_PASSWORD},
    )
    assert login.status_code == 200

    rejected = client.patch(
        "/api/me/profile",
        headers={"Origin": "https://evil.example"},
        json={"display_name": "Attacker", "avatar_url": None},
    )
    accepted = client.patch(
        "/api/me/profile",
        headers={"Origin": "http://localhost:5173"},
        json={"display_name": "Safe User", "avatar_url": None},
    )

    assert rejected.status_code == 403
    assert accepted.status_code == 200
    assert accepted.json()["display_name"] == "Safe User"


def test_logout_clears_session_cookie(db_session, monkeypatch):
    monkeypatch.setenv("AUTH_SESSION_COOKIE_ENABLED", "true")
    client = _registered_client("cookie-logout@dublajlab.com")
    login = client.post(
        "/api/auth/login",
        json={"email": "cookie-logout@dublajlab.com", "password": STRONG_PASSWORD},
    )
    assert login.status_code == 200

    response = client.post(
        "/api/auth/logout",
        headers={"Origin": "http://localhost:5173"},
    )

    assert response.status_code == 200
    assert "dublajlab_session=\"\"" in response.headers["set-cookie"]
    assert client.get("/api/auth/me").status_code == 401
