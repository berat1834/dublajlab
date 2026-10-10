import hashlib
import hmac
import base64
import json
import logging
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Request, Form
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models_db import User, Payment
from backend.routers.auth_router import get_current_user
from backend.config import (
    is_shopier_enabled,
    get_shopier_api_secret,
    get_shopier_payment_url,
)

router = APIRouter()
logger = logging.getLogger(__name__)

VIP_PRICE = 199 # Example price in TRY

@router.post("/checkout")
async def create_checkout(
    request: Request,
    plan: str = "monthly",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not is_shopier_enabled():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Ödeme altyapısı şu anda devre dışı."
        )

    api_secret = get_shopier_api_secret()
    payment_url = get_shopier_payment_url()
    if not api_secret or not payment_url:
        logger.error("SHOPIER_ENABLED=true ama ödeme secret veya ödeme URL'si eksik.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Ödeme altyapısı henüz kullanıma hazır değil."
        )

    if plan != "monthly":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sadece aylık plan desteklenmektedir."
        )

    # 1. Create Payment Record
    payment = Payment(
        user_id=current_user.id,
        provider="shopier",
        amount=VIP_PRICE,
        currency="TRY",
        plan=plan,
        status="pending"
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    # 2. Build Shopier redirect (Simple simulation for now, normally requires sending a form to shopier)
    # Shopier requires you to POST to their endpoint with specific fields. 
    # For this backend endpoint, we return a mock URL if not fully implemented, 
    # or return the data needed to construct the form.
    # We will return the data so frontend can build the form.
    
    return {
        "status": "success",
        "payment_id": payment.id,
        "amount": VIP_PRICE,
        "currency": "TRY",
        "order_id": payment.id, # Using our payment ID as order ID
        "checkout_url": payment_url,
        "message": "Ödeme kaydı oluşturuldu."
    }

@router.post("/webhook")
async def shopier_webhook(
    request: Request,
    payment_status: str = Form(..., alias="status"),
    invoiceId: str = Form(...),
    orderId: str = Form(...),
    isTest: str = Form(None),
    randomNr: str = Form(...),
    signature: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Shopier callback webhook.
    """
    if not is_shopier_enabled():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Shopier is disabled.")

    api_secret = get_shopier_api_secret()
    if not api_secret:
        logger.error("SHOPIER_ENABLED=true ama SHOPIER_API_SECRET eksik.")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Shopier yapılandırılmamış.")

    # Shopier signature validation: base64(hmac-sha256(randomNr + orderId, API_SECRET))
    expected_data = randomNr + orderId
    mac = hmac.new(
        api_secret.encode('utf-8'),
        expected_data.encode('utf-8'),
        hashlib.sha256
    ).digest()
    expected_signature = base64.b64encode(mac).decode('utf-8')

    if not hmac.compare_digest(expected_signature, signature):
        logger.warning(f"Invalid shopier signature for order {orderId}")
        raise HTTPException(status_code=400, detail="Ödeme imzası geçersiz.")

    payment = db.query(Payment).filter(Payment.id == orderId).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Ödeme kaydı bulunamadı.")
        
    if payment.status in ["paid", "failed", "cancelled"]:
        # Idempotency: return 200 OK so Shopier doesn't retry
        return {"status": "ok", "message": "Already processed"}

    if payment_status == "success":
        payment.status = "paid"
        payment.provider_order_id = invoiceId
        
        user = db.query(User).filter(User.id == payment.user_id).first()
        if user:
            user.membership_tier = "vip"
            
            now = datetime.now(timezone.utc)
            if user.membership_expires_at and user.membership_expires_at > now:
                # Add 30 days to existing expiration
                user.membership_expires_at = user.membership_expires_at + timedelta(days=30)
            else:
                user.membership_expires_at = now + timedelta(days=30)
    else:
        payment.status = "failed"
        payment.provider_order_id = invoiceId

    # Store raw event safely (without sensitive info, just basic status)
    safe_event = {
        "status": payment_status,
        "invoiceId": invoiceId,
        "isTest": isTest,
        "signature_valid": True
    }
    payment.raw_event = json.dumps(safe_event)
    
    db.commit()
    
    # Shopier expects a 200 OK to stop retrying.
    return {"status": "ok"}
