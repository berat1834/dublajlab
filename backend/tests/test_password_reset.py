from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from backend import auth, models_db
from backend.main import app
from backend.services.auth_rate_limit_service import (
    auth_attempt_limiter,
    password_reset_request_limiter,
)
from backend.services.email_verification_service import (
    EmailDeliveryConfigurationError,
    hash_verification_token,
)


client = TestClient(app)
STRONG_PASSWORD = "Mavi-Kedi-Dublaj-2026!"


@pytest.fixture(autouse=True)
def reset_limiters():
    auth_attempt_limiter.reset()
    password_reset_request_limiter.reset()
    yield
    auth_attempt_limiter.reset()
    password_reset_request_limiter.reset()


@pytest.fixture()
def sent_emails(monkeypatch):
    sent: list[dict] = []
    monkeypatch.setattr(
        "backend.routers.auth_router.ensure_email_delivery_configured", lambda: None
    )
    monkeypatch.setattr(
        "backend.routers.auth_router.send_password_reset_email",
        lambda **kwargs: sent.append(kwargs),
    )
    return sent


def _create_user(db_session, email="reset@example.com", **overrides):
    user = models_db.User(
        email=email,
        password_hash=auth.get_password_hash("Eski-Parola-12345"),
        display_name="Reset User",
        email_verified=False,
        **overrides,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def _token_from(sent_email: dict) -> str:
    return sent_email["reset_url"].split("#reset_token=", 1)[1]


def test_forgot_password_sends_fragment_link_and_stores_only_hash(db_session, sent_emails):
    user = _create_user(db_session)

    response = client.post("/api/auth/forgot-password", json={"email": "Reset@Example.com"})

    assert response.status_code == 200
    assert len(sent_emails) == 1
    assert "/parola-sifirla#reset_token=" in sent_emails[0]["reset_url"]
    raw_token = _token_from(sent_emails[0])
    db_session.refresh(user)
    assert user.password_reset_token_hash == hash_verification_token(raw_token)
    assert raw_token not in (user.password_reset_token_hash or "")
    expires_at = user.password_reset_expires_at.replace(tzinfo=timezone.utc)
    assert expires_at > datetime.now(timezone.utc)


def test_forgot_password_response_does_not_reveal_unknown_accounts(db_session, sent_emails):
    _create_user(db_session)

    known = client.post("/api/auth/forgot-password", json={"email": "reset@example.com"})
    unknown = client.post("/api/auth/forgot-password", json={"email": "nobody@example.com"})

    assert known.status_code == unknown.status_code == 200
    assert known.json() == unknown.json()
    assert len(sent_emails) == 1


def test_forgot_password_uses_selected_english_language(db_session, sent_emails):
    _create_user(db_session)

    response = client.post(
        "/api/auth/forgot-password",
        json={"email": "reset@example.com", "language": "EN"},
    )

    assert response.status_code == 200
    assert response.json()["message"].startswith("If this address is registered")
    assert sent_emails[0]["language"] == "EN"


def test_forgot_password_delivery_failure_still_returns_generic_message(db_session, monkeypatch):
    _create_user(db_session)
    monkeypatch.setattr(
        "backend.routers.auth_router.ensure_email_delivery_configured", lambda: None
    )

    def failing_send(**_kwargs):
        raise OSError("smtp down")

    monkeypatch.setattr("backend.routers.auth_router.send_password_reset_email", failing_send)

    response = client.post("/api/auth/forgot-password", json={"email": "reset@example.com"})

    assert response.status_code == 200


def test_forgot_password_reports_missing_mail_configuration(db_session, monkeypatch):
    def not_configured():
        raise EmailDeliveryConfigurationError("missing")

    monkeypatch.setattr(
        "backend.routers.auth_router.ensure_email_delivery_configured", not_configured
    )

    response = client.post("/api/auth/forgot-password", json={"email": "nobody@example.com"})

    assert response.status_code == 503


def test_forgot_password_is_rate_limited_per_email(db_session, sent_emails):
    _create_user(db_session)
    for _ in range(5):
        assert client.post(
            "/api/auth/forgot-password", json={"email": "reset@example.com"}
        ).status_code == 200

    response = client.post("/api/auth/forgot-password", json={"email": "reset@example.com"})

    assert response.status_code == 429
    assert len(sent_emails) == 5


def test_reset_password_updates_hash_verifies_email_and_is_single_use(db_session, sent_emails):
    user = _create_user(db_session)
    client.post("/api/auth/forgot-password", json={"email": "reset@example.com"})
    raw_token = _token_from(sent_emails[0])

    response = client.post(
        "/api/auth/reset-password",
        json={"token": raw_token, "new_password": STRONG_PASSWORD},
    )

    assert response.status_code == 200
    db_session.refresh(user)
    assert auth.verify_password(STRONG_PASSWORD, user.password_hash)
    assert user.password_reset_token_hash is None
    assert user.email_verified is True
    assert user.password_changed_at is not None

    reused = client.post(
        "/api/auth/reset-password",
        json={"token": raw_token, "new_password": "Baska-Guclu-Parola-99"},
    )
    assert reused.status_code == 400

    login = client.post(
        "/api/auth/login",
        json={"email": "reset@example.com", "password": STRONG_PASSWORD},
    )
    assert login.status_code == 200


def test_reset_password_rejects_expired_token(db_session):
    raw_token = "expired-token-value-0123456789"
    user = _create_user(
        db_session,
        password_reset_token_hash=hash_verification_token(raw_token),
        password_reset_expires_at=datetime.now(timezone.utc) - timedelta(minutes=1),
    )

    response = client.post(
        "/api/auth/reset-password",
        json={"token": raw_token, "new_password": STRONG_PASSWORD},
    )

    assert response.status_code == 400
    db_session.refresh(user)
    assert user.password_reset_token_hash is None
    assert auth.verify_password("Eski-Parola-12345", user.password_hash)


def test_reset_password_enforces_password_policy_and_keeps_token(db_session, sent_emails):
    user = _create_user(db_session)
    client.post("/api/auth/forgot-password", json={"email": "reset@example.com"})
    raw_token = _token_from(sent_emails[0])

    weak = client.post(
        "/api/auth/reset-password",
        json={"token": raw_token, "new_password": "123456"},
    )

    assert weak.status_code == 400
    db_session.refresh(user)
    assert user.password_reset_token_hash == hash_verification_token(raw_token)


def test_reset_password_translates_policy_error_to_english(db_session, sent_emails):
    _create_user(db_session)
    client.post(
        "/api/auth/forgot-password",
        json={"email": "reset@example.com", "language": "EN"},
    )

    response = client.post(
        "/api/auth/reset-password",
        json={
            "token": _token_from(sent_emails[0]),
            "new_password": "123456",
            "language": "EN",
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Password must be at least 10 characters long."


def test_reset_password_rejects_reusing_current_password(db_session, sent_emails):
    _create_user(db_session)
    client.post("/api/auth/forgot-password", json={"email": "reset@example.com"})

    response = client.post(
        "/api/auth/reset-password",
        json={
            "token": _token_from(sent_emails[0]),
            "new_password": "Eski-Parola-12345",
        },
    )

    assert response.status_code == 400
    assert "mevcut parolanızdan farklı" in response.json()["detail"]


def test_reset_password_invalidates_existing_sessions(db_session, sent_emails):
    from jose import jwt

    user = _create_user(db_session)
    # Simulate a session issued well before the reset.
    old_token = jwt.encode(
        {
            "sub": user.id,
            "iat": int((datetime.now(timezone.utc) - timedelta(minutes=5)).timestamp()),
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        },
        auth.SECRET_KEY,
        algorithm=auth.ALGORITHM,
    )
    assert client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {old_token}"}
    ).status_code == 200

    client.post("/api/auth/forgot-password", json={"email": "reset@example.com"})
    client.post(
        "/api/auth/reset-password",
        json={"token": _token_from(sent_emails[0]), "new_password": STRONG_PASSWORD},
    )

    assert client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {old_token}"}
    ).status_code == 401
    fresh_token = auth.create_access_token({"sub": user.id})
    assert client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {fresh_token}"}
    ).status_code == 200
