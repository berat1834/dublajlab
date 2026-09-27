from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi.testclient import TestClient

from backend import auth, models_db
from backend.main import app
from backend.services.membership_service import has_active_vip


client = TestClient(app)


def _create_user(db_session) -> models_db.User:
    user = models_db.User(
        email=f"{uuid4()}@dublajlab.com",
        password_hash=auth.get_password_hash("testpassword"),
        display_name="VIP Candidate",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_membership_plans_describe_free_and_vip() -> None:
    response = client.get("/api/membership/plans")

    assert response.status_code == 200
    plans = response.json()["plans"]
    assert [plan["id"] for plan in plans] == ["free", "vip"]
    assert plans[0]["max_export_resolution"] == "720p"
    assert plans[1]["max_export_resolution"] == "1080p"
    assert plans[1]["ai_voice"] is True


def test_new_user_is_free() -> None:
    client_user_email = f"{uuid4()}@dublajlab.com"
    response = client.post(
        "/api/auth/register",
        json={
            "email": client_user_email,
            "password": "testpassword",
            "display_name": "Free Member",
        },
    )

    assert response.status_code == 200
    assert response.json()["membership_tier"] == "free"
    assert response.json()["has_active_vip"] is False


def test_admin_can_activate_and_revoke_vip(db_session, auth_headers_factory) -> None:
    user = _create_user(db_session)
    admin_headers = auth_headers_factory(role="admin")

    activated = client.patch(
        f"/api/admin/users/{user.id}/membership",
        headers=admin_headers,
        json={"tier": "vip", "duration_days": 30},
    )

    assert activated.status_code == 200
    assert activated.json()["membership_tier"] == "vip"
    assert activated.json()["has_active_vip"] is True
    assert activated.json()["membership_expires_at"] is not None

    revoked = client.patch(
        f"/api/admin/users/{user.id}/membership",
        headers=admin_headers,
        json={"tier": "free", "duration_days": 30},
    )

    assert revoked.status_code == 200
    assert revoked.json()["membership_tier"] == "free"
    assert revoked.json()["has_active_vip"] is False
    assert revoked.json()["membership_expires_at"] is None


def test_expired_vip_is_not_active(db_session) -> None:
    user = _create_user(db_session)
    user.membership_tier = "vip"
    user.membership_expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
    db_session.commit()

    assert has_active_vip(user) is False
