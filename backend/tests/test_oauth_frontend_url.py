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
