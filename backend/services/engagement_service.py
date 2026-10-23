from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from backend import models_db


ISTANBUL = ZoneInfo("Europe/Istanbul")


def _local_date(value: datetime | None) -> date | None:
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(ISTANBUL).date()


def _streaks(activity_dates: set[date], today: date) -> tuple[int, int]:
    if not activity_dates:
        return 0, 0

    longest = 0
    run = 0
    previous: date | None = None
    for activity_date in sorted(activity_dates):
        run = run + 1 if previous and activity_date == previous + timedelta(days=1) else 1
        longest = max(longest, run)
        previous = activity_date

    anchor = today if today in activity_dates else today - timedelta(days=1)
    current = 0
    while anchor in activity_dates:
        current += 1
        anchor -= timedelta(days=1)
    return current, longest


def build_engagement_progress(
    db: Session,
    user_id: str,
    *,
    now: datetime | None = None,
) -> dict:
    local_today = (now or datetime.now(timezone.utc)).astimezone(ISTANBUL).date()
    projects = db.query(models_db.DubbingProject).filter(
        models_db.DubbingProject.user_id == user_id,
        models_db.DubbingProject.status == "completed",
    ).all()
    comments = db.query(models_db.DubbingComment).filter(
        models_db.DubbingComment.user_id == user_id,
        models_db.DubbingComment.status == "visible",
    ).all()

    activity_dates = {
        value for value in (_local_date(project.created_at) for project in projects)
        if value is not None
    }
    current_streak, longest_streak = _streaks(activity_dates, local_today)
    today_projects = [project for project in projects if _local_date(project.created_at) == local_today]
    today_template_ids = {project.template_id for project in today_projects if project.template_id}
    today_comments = sum(1 for comment in comments if _local_date(comment.created_at) == local_today)
    distinct_template_ids = {project.template_id for project in projects if project.template_id}

    tasks = [
        {"key": "complete_dub", "progress": len(today_projects), "target": 1, "xp": 30},
        {"key": "explore_scenes", "progress": len(today_template_ids), "target": 2, "xp": 60},
        {"key": "give_feedback", "progress": today_comments, "target": 1, "xp": 40},
    ]
    for task in tasks:
        task["completed"] = task["progress"] >= task["target"]

    all_tasks_completed = all(task["completed"] for task in tasks)
    today_xp = sum(task["xp"] for task in tasks if task["completed"])
    if all_tasks_completed:
        today_xp += 100

    achievements = [
        {"key": "first_dub", "progress": len(projects), "target": 1},
        {"key": "scene_explorer", "progress": len(distinct_template_ids), "target": 3},
        {"key": "helpful_voice", "progress": len(comments), "target": 3},
        {"key": "three_day_streak", "progress": longest_streak, "target": 3},
    ]
    for achievement in achievements:
        achievement["unlocked"] = achievement["progress"] >= achievement["target"]

    return {
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "active_today": local_today in activity_dates,
        "today_xp": today_xp,
        "daily_bonus_xp": 100,
        "all_tasks_completed": all_tasks_completed,
        "tasks": tasks,
        "achievements": achievements,
    }
