from __future__ import annotations

import hashlib
import html
import os
import secrets
import smtplib
import ssl
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage

import httpx

from backend import config


VERIFICATION_SUBJECT = "DublajLab e-posta doğrulama"
RESEND_EMAILS_URL = "https://api.resend.com/emails"


class EmailDeliveryConfigurationError(RuntimeError):
    """Raised when verification is required but mail delivery is unavailable."""


@dataclass(frozen=True)
class SmtpSettings:
    host: str
    port: int
    username: str
    password: str
    from_email: str
    use_tls: bool
    use_ssl: bool


@dataclass(frozen=True)
class ResendSettings:
    api_key: str
    from_email: str
    reply_to: str | None


def create_verification_token() -> tuple[str, str, datetime]:
    raw_token = secrets.token_urlsafe(32)
    return (
        raw_token,
        hash_verification_token(raw_token),
        datetime.now(timezone.utc)
        + timedelta(minutes=config.email_verification_ttl_minutes()),
    )


def hash_verification_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def email_delivery_provider() -> str:
    provider = os.getenv("EMAIL_DELIVERY_PROVIDER", "smtp").strip().lower()
    if provider not in {"smtp", "resend"}:
        raise EmailDeliveryConfigurationError(
            "E-posta doğrulama servisi yapılandırması geçersiz."
        )
    return provider


def smtp_settings() -> SmtpSettings:
    host = os.getenv("SMTP_HOST", "").strip()
    username = os.getenv("SMTP_USERNAME", "").strip()
    password = os.getenv("SMTP_PASSWORD", "")
    from_email = os.getenv("SMTP_FROM_EMAIL", "").strip()
    missing = [
        name
        for name, value in (
            ("SMTP_HOST", host),
            ("SMTP_USERNAME", username),
            ("SMTP_PASSWORD", password),
            ("SMTP_FROM_EMAIL", from_email),
        )
        if not value
    ]
    if missing:
        raise EmailDeliveryConfigurationError(
            "E-posta doğrulama servisi henüz yapılandırılmamış. "
            "Lütfen daha sonra tekrar deneyin."
        )
    try:
        port = int(os.getenv("SMTP_PORT", "587"))
    except ValueError as exc:
        raise EmailDeliveryConfigurationError(
            "E-posta doğrulama servisi yapılandırması geçersiz."
        ) from exc
    use_tls = os.getenv("SMTP_USE_TLS", "true").strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }
    use_ssl = os.getenv("SMTP_USE_SSL", "false").strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }
    if use_tls and use_ssl:
        raise EmailDeliveryConfigurationError(
            "SMTP_USE_TLS ve SMTP_USE_SSL aynı anda etkinleştirilemez."
        )
    return SmtpSettings(
        host, port, username, password, from_email, use_tls, use_ssl
    )


def resend_settings() -> ResendSettings:
    api_key = os.getenv("RESEND_API_KEY", "").strip()
    from_email = os.getenv("RESEND_FROM_EMAIL", "").strip()
    reply_to = os.getenv("RESEND_REPLY_TO", "").strip() or None
    if not api_key or not from_email:
        raise EmailDeliveryConfigurationError(
            "E-posta doğrulama servisi henüz yapılandırılmamış. "
            "Lütfen daha sonra tekrar deneyin."
        )
    return ResendSettings(api_key, from_email, reply_to)


def send_verification_email(
    *, recipient: str, display_name: str, verification_url: str
) -> None:
    safe_name = html.escape(display_name)
    safe_url = html.escape(verification_url, quote=True)
    text_content = (
        f"Merhaba {display_name},\n\n"
        "DublajLab hesabınızı doğrulamak için aşağıdaki bağlantıyı açın:\n"
        f"{verification_url}\n\n"
        "Bu bağlantı süreli ve tek kullanımlıktır. Bu kaydı siz yapmadıysanız "
        "iletiyi yok sayabilirsiniz."
    )
    html_content = (
        "<html><body>"
        f"<p>Merhaba {safe_name},</p>"
        "<p>DublajLab hesabınızı doğrulamak için aşağıdaki düğmeyi kullanın.</p>"
        f'<p><a href="{safe_url}">E-posta adresimi doğrula</a></p>'
        "<p>Bu bağlantı süreli ve tek kullanımlıktır.</p>"
        "</body></html>"
    )

    if email_delivery_provider() == "resend":
        settings = resend_settings()
        payload = {
            "from": settings.from_email,
            "to": [recipient],
            "subject": VERIFICATION_SUBJECT,
            "text": text_content,
            "html": html_content,
        }
        if settings.reply_to:
            payload["reply_to"] = settings.reply_to
        response = httpx.post(
            RESEND_EMAILS_URL,
            headers={
                "Authorization": f"Bearer {settings.api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=15,
        )
        response.raise_for_status()
        return

    settings = smtp_settings()
    message = EmailMessage()
    message["Subject"] = VERIFICATION_SUBJECT
    message["From"] = settings.from_email
    message["To"] = recipient
    message.set_content(text_content)
    message.add_alternative(html_content, subtype="html")

    context = ssl.create_default_context()
    smtp_client = smtplib.SMTP_SSL if settings.use_ssl else smtplib.SMTP
    client_kwargs = {"timeout": 15}
    if settings.use_ssl:
        client_kwargs["context"] = context

    with smtp_client(settings.host, settings.port, **client_kwargs) as client:
        client.ehlo()
        if settings.use_tls:
            client.starttls(context=context)
            client.ehlo()
        client.login(settings.username, settings.password)
        client.send_message(message)
