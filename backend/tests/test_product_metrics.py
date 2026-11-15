from __future__ import annotations

from fastapi.testclient import TestClient

from backend.main import app
from backend.models_db import ProductMetricDaily


client = TestClient(app)


def test_product_metrics_are_disabled_by_default(monkeypatch) -> None:
    monkeypatch.delenv("PRODUCT_METRICS_ENABLED", raising=False)

    response = client.post(
        "/api/analytics/events",
        json={"event": "catalog_view"},
    )

    assert response.status_code == 404


def test_product_metrics_store_only_daily_aggregate(db_session, monkeypatch) -> None:
    monkeypatch.setenv("PRODUCT_METRICS_ENABLED", "true")
    response = client.post(
        "/api/analytics/events",
        json={"event": "upload_succeeded"},
    )

    assert response.status_code == 202
    metric = db_session.query(ProductMetricDaily).filter_by(
        event_name="upload_succeeded",
    ).one()
    assert metric.event_count == 1
    assert set(ProductMetricDaily.__table__.columns.keys()) == {
        "event_date", "event_name", "event_count", "updated_at",
    }


def test_product_metrics_reject_unlisted_events(monkeypatch) -> None:
    monkeypatch.setenv("PRODUCT_METRICS_ENABLED", "true")

    response = client.post(
        "/api/analytics/events",
        json={"event": "upload_filename"},
    )

    assert response.status_code == 422
