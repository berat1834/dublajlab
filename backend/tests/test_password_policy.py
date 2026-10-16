from passlib.context import CryptContext

from backend import auth
from backend.services.password_policy_service import (
    PasswordPolicyError,
    validate_new_password,
)


def test_password_policy_accepts_long_passphrase_without_composition_rules():
    validate_new_password(
        "uzun ve sakin bir parola",
        email="kullanici@example.com",
        display_name="Örnek Kullanıcı",
    )


def test_password_policy_rejects_short_password():
    try:
        validate_new_password(
            "kisa123",
            email="user@example.com",
            display_name="Example User",
        )
    except PasswordPolicyError as exc:
        assert "en az 10 karakter" in str(exc)
    else:
        raise AssertionError("Short password should be rejected")


def test_password_policy_rejects_common_password():
    try:
        validate_new_password(
            "Password123",
            email="user@example.com",
            display_name="Example User",
        )
    except PasswordPolicyError as exc:
        assert "çok yaygın" in str(exc)
    else:
        raise AssertionError("Common password should be rejected")


def test_password_policy_rejects_identity_information():
    try:
        validate_new_password(
            "berat-2026-guvenli",
            email="berat@example.com",
            display_name="Berat Baylan",
        )
    except PasswordPolicyError as exc:
        assert "e-posta adresinizi veya kullanıcı adınızı" in str(exc)
    else:
        raise AssertionError("Identity-based password should be rejected")


def test_new_hash_supports_long_unicode_passwords():
    password = "çok uzun bir parola cümlesi " * 4
    password_hash = auth.get_password_hash(password)

    assert password_hash.startswith("$bcrypt-sha256$")
    assert auth.verify_password(password, password_hash) is True


def test_existing_bcrypt_hashes_remain_verifiable():
    legacy_context = CryptContext(schemes=["bcrypt"])
    legacy_hash = legacy_context.hash("Legacy-Password-2026")

    assert auth.verify_password("Legacy-Password-2026", legacy_hash) is True
