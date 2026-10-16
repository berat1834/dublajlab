from datetime import datetime, timezone

import pytest

from backend import config
from backend.services.email_verification_service import (
    EmailDeliveryConfigurationError,
    create_verification_token,
    hash_verification_token,
    send_verification_email,
    smtp_settings,
)


def test_email_verification_is_required_by_default_in_production(monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.delenv("EMAIL_VERIFICATION_REQUIRED", raising=False)
    assert config.email_verification_required() is True


def test_email_verification_can_be_disabled_in_development(monkeypatch):
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.delenv("EMAIL_VERIFICATION_REQUIRED", raising=False)
    assert config.email_verification_required() is False


def test_verification_token_is_hashed_and_expires(monkeypatch):
    monkeypatch.setenv("EMAIL_VERIFICATION_TTL_MINUTES", "30")
    raw_token, token_hash, expires_at = create_verification_token()
    assert raw_token != token_hash
    assert token_hash == hash_verification_token(raw_token)
    assert len(token_hash) == 64
    assert expires_at > datetime.now(timezone.utc)


def test_missing_smtp_configuration_fails_safely(monkeypatch):
    for name in ("SMTP_HOST", "SMTP_USERNAME", "SMTP_PASSWORD", "SMTP_FROM_EMAIL"):
        monkeypatch.delenv(name, raising=False)
    with pytest.raises(EmailDeliveryConfigurationError) as error:
        smtp_settings()
    assert "henüz yapılandırılmamış" in str(error.value)


def test_smtp_ssl_uses_implicit_tls_connection(monkeypatch):
    for name, value in {
        "SMTP_HOST": "mail.example.test",
        "SMTP_PORT": "465",
        "SMTP_USERNAME": "sender@example.test",
        "SMTP_PASSWORD": "not-a-real-secret",
        "SMTP_FROM_EMAIL": "sender@example.test",
        "SMTP_USE_TLS": "false",
        "SMTP_USE_SSL": "true",
    }.items():
        monkeypatch.setenv(name, value)

    calls = []

    class FakeSmtpSsl:
        def __init__(self, host, port, **kwargs):
            calls.append(("connect", host, port, kwargs))

        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return None

        def ehlo(self):
            calls.append(("ehlo",))

        def starttls(self, **_kwargs):
            raise AssertionError("Implicit SSL bağlantısında STARTTLS kullanılmamalı")

        def login(self, username, password):
            calls.append(("login", username, password))

        def send_message(self, message):
            calls.append(("send", message["To"]))

    monkeypatch.setattr("smtplib.SMTP_SSL", FakeSmtpSsl)
    send_verification_email(
        recipient="user@example.test",
        display_name="Test User",
        verification_url="https://example.test/verify?token=test",
    )

    assert calls[0][0:3] == ("connect", "mail.example.test", 465)
    assert calls[-1] == ("send", "user@example.test")


def test_smtp_tls_and_ssl_cannot_be_enabled_together(monkeypatch):
    for name, value in {
        "SMTP_HOST": "mail.example.test",
        "SMTP_USERNAME": "sender@example.test",
        "SMTP_PASSWORD": "not-a-real-secret",
        "SMTP_FROM_EMAIL": "sender@example.test",
        "SMTP_USE_TLS": "true",
        "SMTP_USE_SSL": "true",
    }.items():
        monkeypatch.setenv(name, value)

    with pytest.raises(EmailDeliveryConfigurationError) as error:
        smtp_settings()
    assert "aynı anda" in str(error.value)


def test_production_frontend_url_ignores_stale_vercel_origin(monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("FRONTEND_URL", "https://dublajlab-sigma.vercel.app")
    assert config.frontend_url() == "https://www.dublajlab.com.tr"
