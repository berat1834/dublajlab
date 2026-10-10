from __future__ import annotations

import time

from fastapi.testclient import TestClient

from backend.database import get_db
from backend.main import app
from backend.models_db import User
from backend.services.admin_mfa_service import (
    decrypt_totp_secret,
    encrypt_totp_secret,
    matching_totp_step,
    totp_code_for_time,
)

client = TestClient(app)


def test_totp_secret_is_encrypted_and_rfc6238_code_matches() -> None:
    secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"

    assert totp_code_for_time(secret, 59) == "287082"
    encrypted = encrypt_totp_secret(secret)
    assert encrypted != secret
    assert decrypt_totp_secret(encrypted) == secret


def test_admin_mfa_enrollment_step_up_and_recovery_codes(
    auth_headers_factory,
    db_session,
) -> None:
    headers = auth_headers_factory(role="admin", mfa_enabled=False, mfa_verified=False)
    user = db_session.query(User).filter(User.role == "admin").first()
    assert user is not None

    wrong_password = client.post(
        "/api/auth/mfa/setup",
        json={"password": "wrong-password"},
        headers=headers,
    )
    assert wrong_password.status_code == 403

    start = client.post(
        "/api/auth/mfa/setup",
        json={"password": "testpassword"},
        headers=headers,
    )
    assert start.status_code == 200
    setup = start.json()
    secret = setup["secret"]
    assert "otpauth://totp/" in setup["otpauth_uri"]

    confirmation = client.post(
        "/api/auth/mfa/setup/confirm",
        json={"code": totp_code_for_time(secret, time.time())},
        headers=headers,
    )
    assert confirmation.status_code == 200
    recovery_codes = confirmation.json()["recovery_codes"]
    assert len(recovery_codes) == 10

    db_session.refresh(user)
    assert user.mfa_enabled is True
    assert secret not in user.mfa_secret_encrypted

    admin_request = client.get("/api/admin/ops/metrics", headers=headers)
    assert admin_request.status_code == 403

    step_up = client.post(
        "/api/auth/mfa/verify",
        json={"code": totp_code_for_time(secret, time.time() + 30)},
        headers=headers,
    )
    assert step_up.status_code == 200
    elevated_headers = {"Authorization": f"Bearer {step_up.json()['access_token']}"}
    admin_request = client.get("/api/admin/ops/metrics", headers=elevated_headers)
    assert admin_request.status_code == 200

    recovery_step_up = client.post(
        "/api/auth/mfa/verify",
        json={"code": recovery_codes[0]},
        headers=headers,
    )
    assert recovery_step_up.status_code == 200
    reused_code = client.post(
        "/api/auth/mfa/verify",
        json={"code": recovery_codes[0]},
        headers=headers,
    )
    assert reused_code.status_code == 400
