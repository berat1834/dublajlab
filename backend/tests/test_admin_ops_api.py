import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.models_db import User, DubbingProject, Payment

client = TestClient(app)

def test_admin_metrics_forbidden_for_user(auth_headers_factory):
    headers = auth_headers_factory(role="user")
    response = client.get("/api/admin/ops/metrics", headers=headers)
    assert response.status_code == 403


def test_admin_metrics_requires_mfa_step_up(auth_headers_factory):
    headers = auth_headers_factory(role="admin", mfa_verified=False)
    response = client.get("/api/admin/ops/metrics", headers=headers)
    assert response.status_code == 403


def test_admin_metrics_success_for_admin(auth_headers_factory, db_session):
    headers = auth_headers_factory(role="admin")
    
    # Check successful response
    response = client.get("/api/admin/ops/metrics", headers=headers)
    assert response.status_code == 200
    data = response.json()
    
    assert data["app_status"] == "ok"
    assert "database_connected" in data
    assert "redis_configured" in data
    assert "ffmpeg_available" in data
    assert "total_users" in data
    assert "recent_failed_jobs" in data
    assert "storage_provider" in data
    assert "storage_configured" in data
    assert "storage_accessible" in data
    assert "S3_ACCESS_KEY_ID" not in response.text
    assert "S3_SECRET_ACCESS_KEY" not in response.text
    assert "S3_ENDPOINT_URL" not in response.text
