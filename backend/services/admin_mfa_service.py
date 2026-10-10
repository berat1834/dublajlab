from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
import struct
import time
from urllib.parse import quote

from cryptography.fernet import Fernet, InvalidToken

from backend import auth

ISSUER = "DublajLab"
TOTP_PERIOD_SECONDS = 30
TOTP_DIGITS = 6
TOTP_WINDOW_STEPS = 1
RECOVERY_CODE_COUNT = 10


def _cipher() -> Fernet:
    key_material = hashlib.sha256(
        b"dublajlab-admin-mfa\0" + auth.SECRET_KEY.encode("utf-8")
    ).digest()
    return Fernet(base64.urlsafe_b64encode(key_material))


def encrypt_totp_secret(secret: str) -> str:
    return _cipher().encrypt(secret.encode("ascii")).decode("ascii")


def decrypt_totp_secret(encrypted_secret: str) -> str:
    try:
        return _cipher().decrypt(encrypted_secret.encode("ascii")).decode("ascii")
    except (InvalidToken, UnicodeDecodeError) as exc:
        raise ValueError("Stored MFA secret could not be decrypted.") from exc


def generate_totp_secret() -> str:
    return base64.b32encode(secrets.token_bytes(20)).decode("ascii").rstrip("=")


def totp_code_for_time(secret: str, timestamp: float) -> str:
    key = base64.b32decode(secret + "=" * (-len(secret) % 8), casefold=True)
    counter = int(timestamp // TOTP_PERIOD_SECONDS)
    digest = hmac.new(key, struct.pack(">Q", counter), hashlib.sha1).digest()
    offset = digest[-1] & 0x0F
    value = struct.unpack(">I", digest[offset:offset + 4])[0] & 0x7FFFFFFF
    return f"{value % (10 ** TOTP_DIGITS):0{TOTP_DIGITS}d}"


def matching_totp_step(secret: str, code: str, timestamp: float | None = None) -> int | None:
    if len(code) != TOTP_DIGITS or not code.isdigit():
        return None

    current_step = int((time.time() if timestamp is None else timestamp) // TOTP_PERIOD_SECONDS)
    for step in range(current_step - TOTP_WINDOW_STEPS, current_step + TOTP_WINDOW_STEPS + 1):
        expected = totp_code_for_time(secret, step * TOTP_PERIOD_SECONDS)
        if hmac.compare_digest(expected, code):
            return step
    return None


def provisioning_uri(secret: str, account_name: str) -> str:
    label = f"{quote(ISSUER)}:{quote(account_name)}"
    return (
        f"otpauth://totp/{label}?secret={secret}&issuer={quote(ISSUER)}"
        f"&algorithm=SHA1&digits={TOTP_DIGITS}&period={TOTP_PERIOD_SECONDS}"
    )


def generate_recovery_codes() -> tuple[list[str], list[str]]:
    codes = [secrets.token_hex(16).upper() for _ in range(RECOVERY_CODE_COUNT)]
    return codes, [hashlib.sha256(code.encode("ascii")).hexdigest() for code in codes]


def serialize_recovery_code_hashes(hashes: list[str]) -> str:
    return json.dumps(hashes, separators=(",", ":"))


def consume_recovery_code(code: str, serialized_hashes: str | None) -> list[str] | None:
    if not serialized_hashes:
        return None
    try:
        hashes = json.loads(serialized_hashes)
    except json.JSONDecodeError:
        return None
    if not isinstance(hashes, list):
        return None

    candidate = hashlib.sha256(code.strip().replace("-", "").upper().encode("ascii", errors="ignore")).hexdigest()
    for index, stored_hash in enumerate(hashes):
        if isinstance(stored_hash, str) and hmac.compare_digest(candidate, stored_hash):
            return [value for position, value in enumerate(hashes) if position != index]
    return None
