from __future__ import annotations

import re


MIN_PASSWORD_LENGTH = 10
MAX_PASSWORD_LENGTH = 128

COMMON_PASSWORDS = {
    "1234567890",
    "admin123",
    "dublajlab",
    "dublajlab123",
    "letmein",
    "password",
    "password1",
    "password123",
    "qwerty",
    "qwerty123",
    "testpassword",
    "welcome",
}


class PasswordPolicyError(ValueError):
    """Raised when a newly selected password does not meet the account policy."""

    def __init__(self, message: str, *, code: str) -> None:
        super().__init__(message)
        self.code = code


def _identity_terms(email: str, display_name: str) -> set[str]:
    email_local = email.split("@", 1)[0].casefold()
    name_parts = re.split(r"[\s_.-]+", display_name.casefold())
    return {
        term
        for term in (email_local, *name_parts)
        if len(term) >= 4
    }


def validate_new_password(password: str, *, email: str, display_name: str) -> None:
    if len(password) < MIN_PASSWORD_LENGTH:
        raise PasswordPolicyError(
            f"Parola en az {MIN_PASSWORD_LENGTH} karakter olmalıdır.",
            code="too_short",
        )
    if len(password) > MAX_PASSWORD_LENGTH:
        raise PasswordPolicyError(
            f"Parola en fazla {MAX_PASSWORD_LENGTH} karakter olabilir.",
            code="too_long",
        )

    normalized = password.casefold().strip()
    if normalized in COMMON_PASSWORDS:
        raise PasswordPolicyError(
            "Bu parola çok yaygın veya kolay tahmin edilebilir. Lütfen daha güçlü bir parola seçin.",
            code="common",
        )

    if any(term in normalized for term in _identity_terms(email, display_name)):
        raise PasswordPolicyError(
            "Parola e-posta adresinizi veya kullanıcı adınızı içermemelidir.",
            code="contains_identity",
        )
