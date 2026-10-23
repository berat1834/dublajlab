from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi.testclient import TestClient

from backend import models_db
from backend.main import app
from backend.services.engagement_service import build_engagement_progress


client = TestClient(app)


def _project(user_id: str, created_at: datetime, template_id: str | None = None):
    return models_db.DubbingProject(
        user_id=user_id,
        source_type="template" if template_id else "upload",
        template_id=template_id,
        title="Test dublajı",
        status="completed",
        created_at=created_at,
    )


def test_progress_uses_real_activity_and_caps_daily_rewards(db_session) -> None:
    user_id = str(uuid4())
    now = datetime(2026, 10, 23, 9, 0, tzinfo=timezone.utc)
    db_session.add_all([
        _project(user_id, now - timedelta(days=2), "ofis-surprizi"),
        _project(user_id, now - timedelta(days=1), "uzay-gorevi"),
        _project(user_id, now, "ofis-surprizi"),
        _project(user_id, now + timedelta(minutes=1), "uzay-gorevi"),
        _project(user_id, now + timedelta(minutes=2), "uzay-gorevi"),
        models_db.DubbingComment(
            project_id=str(uuid4()),
            user_id=user_id,
            body="Eline sağlık",
            status="visible",
            created_at=now,
        ),
    ])
    db_session.commit()

    result = build_engagement_progress(db_session, user_id, now=now)

    assert result["current_streak"] == 3
    assert result["longest_streak"] == 3
    assert result["active_today"] is True
    assert result["today_xp"] == 230
    assert result["all_tasks_completed"] is True
    assert [task["progress"] for task in result["tasks"]] == [3, 2, 1]
    assert all(task["completed"] for task in result["tasks"])
    unlocked = {item["key"]: item["unlocked"] for item in result["achievements"]}
    assert unlocked == {
        "first_dub": True,
        "scene_explorer": False,
        "helpful_voice": False,
        "three_day_streak": True,
    }


def test_current_streak_remains_active_until_end_of_next_day(db_session) -> None:
    user_id = str(uuid4())
    now = datetime(2026, 10, 23, 9, 0, tzinfo=timezone.utc)
    db_session.add(_project(user_id, now - timedelta(days=1)))
    db_session.commit()

    result = build_engagement_progress(db_session, user_id, now=now)

    assert result["current_streak"] == 1
    assert result["active_today"] is False
    assert result["today_xp"] == 0


def test_engagement_endpoint_requires_login_and_returns_progress(auth_headers_factory) -> None:
    assert client.get("/api/me/engagement").status_code == 401

    response = client.get("/api/me/engagement", headers=auth_headers_factory())

    assert response.status_code == 200
    assert response.json()["tasks"][0]["key"] == "complete_dub"
