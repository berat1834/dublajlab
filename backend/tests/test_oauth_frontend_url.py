from backend.routers import oauth_router
from fastapi import HTTPException
import pytest
from urllib.parse import parse_qs, urlparse


def test_frontend_url_prefers_explicit_configuration(monkeypatch):
    monkeypatch.setenv("FRONTEND_URL", "https://www.dublajlab.com.tr/")
    monkeypatch.setattr(
        oauth_router.config,
        "allowed_origins",
        lambda: ["https://dublajlab-sigma.vercel.app"],
    )

    assert oauth_router.get_frontend_url() == "https://www.dublajlab.com.tr"


def test_frontend_url_prefers_custom_domain_over_vercel(monkeypatch):
    monkeypatch.delenv("FRONTEND_URL", raising=False)
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setattr(
        oauth_router.config,
        "allowed_origins",
        lambda: [
            "https://dublajlab-sigma.vercel.app",
            "https://www.dublajlab.com.tr",
        ],
    )

    assert oauth_router.get_frontend_url() == "https://www.dublajlab.com.tr"


def test_frontend_url_ignores_stale_vercel_configuration_in_production(monkeypatch):
    monkeypatch.setenv("FRONTEND_URL", "https://dublajlab-sigma.vercel.app")
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setattr(
        oauth_router.config,
        "allowed_origins",
        lambda: [
            "https://dublajlab-sigma.vercel.app",
            "https://www.dublajlab.com.tr",
        ],
    )

    assert oauth_router.get_frontend_url() == "https://www.dublajlab.com.tr"


def test_frontend_url_keeps_localhost_in_development(monkeypatch):
    monkeypatch.delenv("FRONTEND_URL", raising=False)
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.setattr(
        oauth_router.config,
        "allowed_origins",
        lambda: [
            "http://localhost:5173",
            "https://www.dublajlab.com.tr",
        ],
    )

    assert oauth_router.get_frontend_url() == "http://localhost:5173"


def test_frontend_url_ignores_stale_vercel_even_without_production_env(monkeypatch):
    monkeypatch.setenv("FRONTEND_URL", "https://dublajlab-sigma.vercel.app")
    monkeypatch.delenv("APP_ENV", raising=False)
    monkeypatch.setattr(
        oauth_router.config,
        "allowed_origins",
        lambda: [
            "http://localhost:5173",
            "https://dublajlab-sigma.vercel.app",
            "https://www.dublajlab.com.tr",
        ],
    )

    assert oauth_router.get_frontend_url() == "https://www.dublajlab.com.tr"


def test_return_origin_accepts_allowlisted_origin(monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setattr(
        oauth_router.config,
        "allowed_origins",
        lambda: ["https://www.dublajlab.com.tr"],
    )

    assert (
        oauth_router.resolve_return_origin("https://www.dublajlab.com.tr/")
        == "https://www.dublajlab.com.tr"
    )


def test_return_origin_rejects_unknown_origin(monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setattr(
        oauth_router.config,
        "allowed_origins",
        lambda: ["https://www.dublajlab.com.tr"],
    )

    assert oauth_router.resolve_return_origin("https://evil.example.com") is None
    assert oauth_router.resolve_return_origin("not-a-url") is None
    assert oauth_router.resolve_return_origin(None) is None


def test_oauth_state_is_signed_and_preserves_allowlisted_origin(monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setattr(
        oauth_router.config,
        "allowed_origins",
        lambda: ["https://www.dublajlab.com.tr"],
    )

    state = oauth_router._encode_state("https://www.dublajlab.com.tr", "nonce-value")

    assert oauth_router._decode_state(state) == (
        "https://www.dublajlab.com.tr",
        "nonce-value",
    )


def test_oauth_state_rejects_tampering():
    state = oauth_router._encode_state(None, "nonce-value")

    with pytest.raises(HTTPException) as exc_info:
        oauth_router._decode_state(f"{state}tampered")

    assert exc_info.value.status_code == 400


def test_oauth_token_redirect_uses_url_fragment(monkeypatch):
    monkeypatch.setattr(
        oauth_router.config,
        "allowed_origins",
        lambda: ["https://www.dublajlab.com.tr"],
    )

    response = oauth_router._frontend_redirect(
        "https://www.dublajlab.com.tr", "secret-token"
    )

    assert response.headers["location"] == (
        "https://www.dublajlab.com.tr/oauth-callback#token=secret-token"
    )


def test_mobile_oauth_callback_is_exactly_allowlisted():
    assert (
        oauth_router.resolve_return_origin("dublajlab://oauth-callback")
        == "dublajlab://oauth-callback"
    )
    assert oauth_router.resolve_return_origin("dublajlab://evil") is None
    assert oauth_router.resolve_return_origin("dublajlab://oauth-callback.evil") is None


def test_mobile_oauth_redirect_returns_fragment_token_even_in_cookie_only_mode(monkeypatch):
    monkeypatch.setattr(oauth_router, "cookie_only_enabled", lambda: True)
    response = oauth_router._frontend_redirect(
        "dublajlab://oauth-callback", "mobile-secret-token"
    )
    assert response.headers["location"] == (
        "dublajlab://oauth-callback#token=mobile-secret-token"
    )


@pytest.mark.asyncio
async def test_google_login_prompts_for_account_selection(monkeypatch):
    class RequestStub:
        @staticmethod
        def url_for(_name):
            return "https://api.dublajlab.com.tr/api/auth/google/callback"

    monkeypatch.setattr(oauth_router, "GOOGLE_CLIENT_ID", "google-client-id")
    response = await oauth_router.google_login(
        RequestStub(), return_to="dublajlab://oauth-callback"
    )
    query = parse_qs(urlparse(response.headers["location"]).query)

    assert query["prompt"] == ["select_account"]
    assert query["client_id"] == ["google-client-id"]


def test_oauth_cookie_only_redirect_never_exposes_token(monkeypatch):
    monkeypatch.setenv("AUTH_COOKIE_ONLY", "true")
    monkeypatch.setattr(
        oauth_router.config,
        "allowed_origins",
        lambda: ["https://www.dublajlab.com.tr"],
    )

    response = oauth_router._frontend_redirect(
        "https://www.dublajlab.com.tr", "secret-token"
    )

    assert response.headers["location"] == (
        "https://www.dublajlab.com.tr/oauth-callback"
    )
    assert "secret-token" not in response.headers["location"]
    assert "dublajlab_session=" in response.headers["set-cookie"]


@pytest.mark.asyncio
async def test_discord_oauth_can_be_paused(monkeypatch):
    monkeypatch.setenv("DISCORD_OAUTH_ENABLED", "false")

    with pytest.raises(HTTPException) as exc_info:
        await oauth_router.discord_login(None)

    assert exc_info.value.status_code == 503
