from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from backend import models_db


def increment_daily_event(db: Session, event_name: str) -> None:
    event_date = datetime.now(timezone.utc).date()
    dialect = db.get_bind().dialect.name
    if dialect == "sqlite":
        from sqlalchemy.dialects.sqlite import insert
    elif dialect == "postgresql":
        from sqlalchemy.dialects.postgresql import insert
    else:
        raise RuntimeError(f"Product metrics do not support database dialect: {dialect}")

    statement = insert(models_db.ProductMetricDaily).values(
        event_date=event_date,
        event_name=event_name,
        event_count=1,
    )
    statement = statement.on_conflict_do_update(
        index_elements=[
            models_db.ProductMetricDaily.event_date,
            models_db.ProductMetricDaily.event_name,
        ],
        set_={
            "event_count": models_db.ProductMetricDaily.event_count + 1,
            "updated_at": datetime.now(timezone.utc),
        },
    )
    db.execute(statement)
    db.commit()
