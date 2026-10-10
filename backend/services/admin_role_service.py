from __future__ import annotations

import os

from sqlalchemy.orm import Session

from backend import models_db


def configured_admin_emails() -> set[str]:
    return {
        email.strip().lower()
        for email in os.getenv("ADMIN_EMAILS", "").split(",")
        if email.strip()
    }


def grant_configured_admin_role(user: models_db.User, db: Session) -> bool:
    """Grant an env-configured admin role consistently for password and OAuth login."""
    if user.email.lower() not in configured_admin_emails() or user.role == "admin":
        return False
    user.role = "admin"
    db.commit()
    db.refresh(user)
    return True
