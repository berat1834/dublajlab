from __future__ import annotations

import base64
import binascii
import hashlib
import hmac
import json
import os
import time
from datetime import datetime, timezone
from email.utils import parseaddr
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models_db import EmailDeliveryEvent


router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])

TRACKED_EMAIL_EVENTS = {
    "email.sent",
    "email.delivered",
    "email.delivery_delayed",
    "email.bounced",
    "email.complained",
    "email.failed",
    "email.suppressed",
}
SIGNATURE_TOLERANCE_SECONDS = 300


def _verify_signature(
    *,
    payload: bytes,
    message_id: str,
    timestamp: str,
    signatures: str,
    secret: str,
) -> None:
    try:
        timestamp_value = int(timestamp)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Geçersiz webhook zaman damgası.") from exc

    if abs(int(time.time()) - timestamp_value) > SIGNATURE_TOLERANCE_SECONDS:
        raise HTTPException(status_code=401, detail="Webhook zaman damgası süresi geçmiş.")

    secret_value = secret.removeprefix("whsec_")
    try:
        secret_bytes = base64.b64decode(
            secret_value + "=" * (-len(secret_value) % 4),
            validate=True,
        )
    except (binascii.Error, ValueError) as exc:
        raise HTTPException(status_code=503, detail="Webhook yapılandırması geçersiz.") from exc

    signed_payload = b".".join((message_id.encode(), timestamp.encode(), payload))
    expected = base64.b64encode(
        hmac.new(secret_bytes, signed_payload, hashlib.sha256).digest()
    ).decode()
    candidates = [
        item.split(",", 1)[1]
        for item in signatures.split()
        if item.startswith("v1,") and "," in item
    ]
    if not any(hmac.compare_digest(expected, candidate) for candidate in candidates):
        raise HTTPException(status_code=401, detail="Webhook imzası geçersiz.")


def _parse_occurred_at(value: Any) -> datetime:
    if not isinstance(value, str):
        return datetime.now(timezone.utc)
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return datetime.now(timezone.utc)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _recipient_domain(data: dict[str, Any]) -> str | None:
    recipients = data.get("to")
    if not isinstance(recipients, list) or not recipients:
        return None
    _, address = parseaddr(str(recipients[0]))
    _, separator, domain = address.lower().rpartition("@")
    return domain[:255] if separator and domain else None


def _failure_reason(data: dict[str, Any]) -> str | None:
    for key in ("bounce", "failed", "delivery_delayed"):
        detail = data.get(key)
        if isinstance(detail, dict):
            classifications = [detail.get("type"), detail.get("subType")]
            values = [str(value) for value in classifications if value]
            if values:
                return ":".join(values)[:500]
    return None


@router.post("/resend")
async def receive_resend_webhook(
    request: Request,
    db: Session = Depends(get_db),
) -> dict[str, str]:
    secret = os.getenv("RESEND_WEBHOOK_SECRET", "").strip()
    if not secret:
        raise HTTPException(status_code=503, detail="Resend webhook yapılandırılmamış.")
    if not secret.startswith("whsec_"):
        raise HTTPException(status_code=503, detail="Webhook yapılandırması geçersiz.")

    message_id = request.headers.get("svix-id", "").strip()
    timestamp = request.headers.get("svix-timestamp", "").strip()
    signatures = request.headers.get("svix-signature", "").strip()
    if not message_id or not timestamp or not signatures:
        raise HTTPException(status_code=400, detail="Webhook imza başlıkları eksik.")

    raw_body = await request.body()
    _verify_signature(
        payload=raw_body,
        message_id=message_id,
        timestamp=timestamp,
        signatures=signatures,
        secret=secret,
    )

    try:
        event = json.loads(raw_body)
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise HTTPException(status_code=400, detail="Webhook gövdesi geçersiz.") from exc
    if not isinstance(event, dict):
        raise HTTPException(status_code=400, detail="Webhook gövdesi geçersiz.")

    event_type = event.get("type")
    if event_type not in TRACKED_EMAIL_EVENTS:
        return {"status": "ignored"}
    data = event.get("data")
    if not isinstance(data, dict):
        raise HTTPException(status_code=400, detail="Webhook verisi geçersiz.")

    db.add(EmailDeliveryEvent(
        webhook_id=message_id[:100],
        event_type=event_type,
        email_id=str(data.get("email_id"))[:100] if data.get("email_id") else None,
        recipient_domain=_recipient_domain(data),
        failure_reason=_failure_reason(data),
        occurred_at=_parse_occurred_at(event.get("created_at")),
    ))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return {"status": "duplicate"}
    return {"status": "accepted"}
