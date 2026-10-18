import base64
import hashlib
import hmac
import json
import time
from datetime import datetime, timezone

from fastapi.testclient import TestClient

from backend.main import app
from backend.models_db import EmailDeliveryEvent


client = TestClient(app)
SECRET_BYTES = b"test-resend-webhook-secret-32byt"
SECRET = "whsec_" + base64.b64encode(SECRET_BYTES).decode()


def _signed_request(
    payload: dict,
    *,
    message_id: str = "msg_webhook_1",
    timestamp: int | None = None,
    signature: str | None = None,
):
    raw_body = json.dumps(payload, separators=(",", ":")).encode()
    timestamp_value = str(timestamp if timestamp is not None else int(time.time()))
    expected = base64.b64encode(hmac.new(
        SECRET_BYTES,
        b".".join((message_id.encode(), timestamp_value.encode(), raw_body)),
        hashlib.sha256,
    ).digest()).decode()
    return client.post(
        "/api/webhooks/resend",
        content=raw_body,
        headers={
            "content-type": "application/json",
            "svix-id": message_id,
            "svix-timestamp": timestamp_value,
            "svix-signature": signature or f"v1,{expected}",
        },
    )


def _event_payload(event_type: str = "email.delivered") -> dict:
    return {
        "type": event_type,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "data": {
            "email_id": "email_123",
            "to": ["Private User <private.user@gmail.com>"],
            "subject": "Sensitive subject is not persisted",
            "bounce": {
                "type": "Permanent",
                "subType": "General",
                "message": "private.user@gmail.com could not be reached",
            },
        },
    }


def test_resend_webhook_accepts_valid_event_without_storing_address(monkeypatch, db_session):
    monkeypatch.setenv("RESEND_WEBHOOK_SECRET", SECRET)

    response = _signed_request(_event_payload())

    assert response.status_code == 200
    assert response.json() == {"status": "accepted"}
    stored = db_session.query(EmailDeliveryEvent).one()
    assert stored.webhook_id == "msg_webhook_1"
    assert stored.event_type == "email.delivered"
    assert stored.recipient_domain == "gmail.com"
    assert stored.failure_reason == "Permanent:General"
    assert "private.user" not in repr(stored.__dict__)
    assert "Sensitive subject" not in repr(stored.__dict__)


def test_resend_webhook_is_idempotent(monkeypatch, db_session):
    monkeypatch.setenv("RESEND_WEBHOOK_SECRET", SECRET)
    payload = _event_payload("email.delivery_delayed")

    assert _signed_request(payload).json() == {"status": "accepted"}
    assert _signed_request(payload).json() == {"status": "duplicate"}
    assert db_session.query(EmailDeliveryEvent).count() == 1


def test_resend_webhook_rejects_invalid_signature(monkeypatch, db_session):
    monkeypatch.setenv("RESEND_WEBHOOK_SECRET", SECRET)

    response = _signed_request(_event_payload(), signature="v1,invalid")

    assert response.status_code == 401
    assert db_session.query(EmailDeliveryEvent).count() == 0


def test_resend_webhook_rejects_stale_timestamp(monkeypatch, db_session):
    monkeypatch.setenv("RESEND_WEBHOOK_SECRET", SECRET)

    response = _signed_request(_event_payload(), timestamp=int(time.time()) - 301)

    assert response.status_code == 401
    assert db_session.query(EmailDeliveryEvent).count() == 0


def test_resend_webhook_requires_configuration(monkeypatch):
    monkeypatch.delenv("RESEND_WEBHOOK_SECRET", raising=False)

    response = _signed_request(_event_payload())

    assert response.status_code == 503
