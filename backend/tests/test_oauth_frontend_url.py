from backend.routers import oauth_router


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
