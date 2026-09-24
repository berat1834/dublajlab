from __future__ import annotations

from fastapi.testclient import TestClient

from backend.main import app
from backend.routers import maintenance
from backend.services.cleanup_service import CleanupResult


def test_lifespan_checks_ffmpeg_without_stopping_app() -> None:
    with TestClient(app) as client:
        response = client.get("/api/system/ffmpeg")

        assert response.status_code == 200
        assert isinstance(response.json()["available"], bool)
        assert response.json()["message"]
        assert hasattr(app.state, "ffmpeg_status")


def test_manual_cleanup_endpoint(monkeypatch) -> None:
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.delenv("MAINTENANCE_TOKEN", raising=False)
    monkeypatch.setattr(
        maintenance.cleanup_service,
        "cleanup_old_files",
        lambda hours: CleanupResult(
            deleted_files=3,
            freed_bytes=2048,
            older_than_hours=hours,
        ),
    )

    response = TestClient(app).post(
        "/api/maintenance/cleanup",
        params={"older_than_hours": 48},
    )

    assert response.status_code == 200
    assert response.json() == {
        "status": "completed",
        "deleted_files": 3,
        "freed_bytes": 2048,
        "older_than_hours": 48,
    }


def test_cleanup_requires_configured_token(monkeypatch) -> None:
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("MAINTENANCE_TOKEN", "correct-token")

    response = TestClient(app).post("/api/maintenance/cleanup")

    assert response.status_code == 403
    assert response.json()["detail"] == "Maintenance token geçersiz veya eksik."


def test_cleanup_accepts_valid_token(monkeypatch) -> None:
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("MAINTENANCE_TOKEN", "correct-token")
    monkeypatch.setattr(
        maintenance.cleanup_service,
        "cleanup_old_files",
        lambda hours: CleanupResult(0, 0, hours),
    )

    response = TestClient(app).post(
        "/api/maintenance/cleanup",
        headers={"X-Maintenance-Token": "correct-token"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "completed"


def test_cleanup_is_disabled_without_token_in_production(monkeypatch) -> None:
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.delenv("MAINTENANCE_TOKEN", raising=False)

    response = TestClient(app).post("/api/maintenance/cleanup")

    assert response.status_code == 503
    assert "devre dışı" in response.json()["detail"]
