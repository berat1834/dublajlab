import pytest
import hmac
import hashlib
import base64
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from backend.main import app
from backend.database import get_db
from backend.models_db import User, Payment

client = TestClient(app)



def test_checkout_requires_login():
    response = client.post("/api/payments/checkout?plan=monthly")
    assert response.status_code == 401

def test_checkout_disabled_returns_503(auth_headers_factory, monkeypatch):
    headers = auth_headers_factory()
    monkeypatch.setenv("SHOPIER_ENABLED", "false")
    response = client.post("/api/payments/checkout?plan=monthly", headers=headers)
    assert response.status_code == 503

def test_checkout_does_not_create_pending_record_without_payment_url(auth_headers_factory, monkeypatch, db_session):
    headers = auth_headers_factory()
    monkeypatch.setenv("SHOPIER_ENABLED", "true")
    monkeypatch.setenv("SHOPIER_API_SECRET", "test_api_secret")
    monkeypatch.delenv("SHOPIER_PAYMENT_URL", raising=False)

    response = client.post("/api/payments/checkout?plan=monthly", headers=headers)

    assert response.status_code == 503
    assert db_session.query(Payment).count() == 0

def test_checkout_creates_pending_payment(auth_headers_factory, monkeypatch, db_session):
    headers = auth_headers_factory()
    monkeypatch.setenv("SHOPIER_ENABLED", "true")
    monkeypatch.setenv("SHOPIER_API_SECRET", "test_api_secret")
    monkeypatch.setenv("SHOPIER_PAYMENT_URL", "https://www.shopier.com/example")
    response = client.post("/api/payments/checkout?plan=monthly", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "payment_id" in data
    assert data["checkout_url"] == "https://www.shopier.com/example"
    
    payment = db_session.query(Payment).filter(Payment.id == data["payment_id"]).first()
    assert payment is not None
    assert payment.status == "pending"

def test_webhook_invalid_signature(monkeypatch):
    monkeypatch.setenv("SHOPIER_ENABLED", "true")
    monkeypatch.setenv("SHOPIER_API_SECRET", "test_api_secret")
    
    response = client.post(
        "/api/payments/webhook",
        data={
            "status": "success",
            "invoiceId": "shopier_inv_123",
            "orderId": "test_order",
            "randomNr": "123456",
            "signature": "invalid_signature"
        }
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Ödeme imzası geçersiz."

def _generate_signature(order_id, random_nr, api_secret):
    expected_data = random_nr + order_id
    mac = hmac.new(
        api_secret.encode('utf-8'),
        expected_data.encode('utf-8'),
        hashlib.sha256
    ).digest()
    return base64.b64encode(mac).decode('utf-8')

def test_webhook_success_activates_vip(auth_headers_factory, monkeypatch, db_session):
    headers = auth_headers_factory()
    user = db_session.query(User).first()
    monkeypatch.setenv("SHOPIER_ENABLED", "true")
    monkeypatch.setenv("SHOPIER_API_SECRET", "test_api")
    
    payment = Payment(user_id=user.id, amount=199, currency="TRY", plan="monthly", status="pending")
    db_session.add(payment)
    db_session.commit()
    db_session.refresh(payment)
    
    sig = _generate_signature(payment.id, "123456", "test_api")
    
    response = client.post(
        "/api/payments/webhook",
        data={
            "status": "success",
            "invoiceId": "shopier_123",
            "orderId": payment.id,
            "randomNr": "123456",
            "signature": sig
        }
    )
    assert response.status_code == 200
    
    db_session.refresh(payment)
    db_session.refresh(user)
    assert payment.status == "paid"
    assert user.membership_tier == "vip"
    assert user.membership_expires_at is not None

def test_webhook_duplicate_callback(auth_headers_factory, monkeypatch, db_session):
    headers = auth_headers_factory()
    user = db_session.query(User).first()
    monkeypatch.setenv("SHOPIER_ENABLED", "true")
    monkeypatch.setenv("SHOPIER_API_SECRET", "test_api")
    
    payment = Payment(user_id=user.id, amount=199, currency="TRY", plan="monthly", status="paid")
    db_session.add(payment)
    db_session.commit()
    db_session.refresh(payment)
    
    sig = _generate_signature(payment.id, "123456", "test_api")
    
    # Send webhook again
    response = client.post(
        "/api/payments/webhook",
        data={
            "status": "success",
            "invoiceId": "shopier_123",
            "orderId": payment.id,
            "randomNr": "123456",
            "signature": sig
        }
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Already processed"

def test_webhook_failure_does_not_activate_vip(auth_headers_factory, monkeypatch, db_session):
    headers = auth_headers_factory()
    user = db_session.query(User).first()
    monkeypatch.setenv("SHOPIER_ENABLED", "true")
    monkeypatch.setenv("SHOPIER_API_SECRET", "test_api")
    
    payment = Payment(user_id=user.id, amount=199, currency="TRY", plan="monthly", status="pending")
    db_session.add(payment)
    db_session.commit()
    db_session.refresh(payment)
    
    sig = _generate_signature(payment.id, "123456", "test_api")
    
    response = client.post(
        "/api/payments/webhook",
        data={
            "status": "failed",
            "invoiceId": "shopier_123",
            "orderId": payment.id,
            "randomNr": "123456",
            "signature": sig
        }
    )
    assert response.status_code == 200
    
    db_session.refresh(payment)
    db_session.refresh(user)
    assert payment.status == "failed"
    assert user.membership_tier == "free"
