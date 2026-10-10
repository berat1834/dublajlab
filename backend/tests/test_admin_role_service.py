from backend import models_db
from backend.services.admin_role_service import grant_configured_admin_role


def test_configured_admin_role_is_granted_for_any_login_flow(monkeypatch, db_session):
    monkeypatch.setenv("ADMIN_EMAILS", "admin@dublajlab.com.tr")
    user = models_db.User(
        email="admin@dublajlab.com.tr",
        password_hash=None,
        display_name="Admin",
    )
    db_session.add(user)
    db_session.commit()

    changed = grant_configured_admin_role(user, db_session)

    assert changed is True
    assert user.role == "admin"


def test_unconfigured_user_is_not_promoted(monkeypatch, db_session):
    monkeypatch.setenv("ADMIN_EMAILS", "admin@dublajlab.com.tr")
    user = models_db.User(
        email="user@dublajlab.com.tr",
        password_hash=None,
        display_name="User",
    )
    db_session.add(user)
    db_session.commit()

    changed = grant_configured_admin_role(user, db_session)

    assert changed is False
    assert user.role == "user"
