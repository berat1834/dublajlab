from __future__ import annotations

from copy import deepcopy

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from backend.main import app
from backend.models import VideoTemplate


client = TestClient(app)


def valid_template_data() -> dict:
    return {
        "id": "test-sahnesi",
        "title": "Test Sahnesi",
        "category": "Komedi",
        "description": "Template validasyonu için güvenli metadata.",
        "duration_seconds": 6.0,
        "video_url": None,
        "license": "CC0-1.0",
        "source": "Yerel test verisi",
        "lines": [
            {"id": "line-1", "start": 0.0, "end": 2.0, "text": "Birinci"},
            {"id": "line-2", "start": 2.5, "end": 5.5, "text": "İkinci"},
        ],
    }


def test_template_list_endpoint() -> None:
    response = client.get("/api/templates")

    assert response.status_code == 200
    payload = response.json()
    assert len(payload) >= 1
    assert payload[0]["license"]
    assert payload[0]["source"]
    assert 1 <= len(payload[0]["lines"]) <= 20


def test_template_detail_endpoint() -> None:
    response = client.get("/api/templates/ofis-surprizi")

    assert response.status_code == 200
    assert response.json()["id"] == "ofis-surprizi"
    assert response.json()["video_url"] is None


def test_missing_template_returns_turkish_404() -> None:
    response = client.get("/api/templates/bilinmeyen-sahne")

    assert response.status_code == 404
    assert response.json()["detail"] == "Hazır sahne bulunamadı."


@pytest.mark.parametrize(
    "mutate",
    [
        lambda data: data["lines"][0].update(start=-0.1),
        lambda data: data["lines"][0].update(end=0.0),
        lambda data: data["lines"][0].update(end=6.5),
        lambda data: data.update(lines=[]),
        lambda data: data.update(lines=[
            {"id": f"line-{index}", "start": 0.0, "end": 1.0, "text": "Replik"}
            for index in range(21)
        ]),
        lambda data: data["lines"][1].update(id="line-1"),
        lambda data: data.update(license="   "),
        lambda data: data.update(source="   "),
    ],
    ids=[
        "negative-start",
        "end-before-start",
        "end-after-duration",
        "no-lines",
        "too-many-lines",
        "duplicate-line-id",
        "blank-license",
        "blank-source",
    ],
)
def test_invalid_template_metadata_is_rejected(mutate) -> None:
    data = deepcopy(valid_template_data())
    mutate(data)

    with pytest.raises(ValidationError):
        VideoTemplate.model_validate(data)
