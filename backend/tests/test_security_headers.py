from __future__ import annotations

from fastapi.testclient import TestClient

from backend.main import app
from backend.middleware.security_headers import SECURITY_HEADERS


client = TestClient(app)


def assert_security_headers(response) -> None:
    for name, expected_value in SECURITY_HEADERS.items():
        assert response.headers[name] == expected_value


def test_security_headers_are_added_to_api_responses() -> None:
    response = client.get("/api/health")

    assert response.status_code == 200
    assert_security_headers(response)


def test_security_headers_are_added_to_cors_preflight() -> None:
    response = client.options(
        "/api/templates",
        headers={
            "Origin": "https://www.dublajlab.com.tr",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == (
        "https://www.dublajlab.com.tr"
    )
    assert_security_headers(response)

