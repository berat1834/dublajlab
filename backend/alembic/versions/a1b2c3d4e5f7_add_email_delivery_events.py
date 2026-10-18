"""Add privacy-minimized Resend delivery event storage.

Revision ID: a1b2c3d4e5f7
Revises: d5e6f7a8b9c0
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a1b2c3d4e5f7"
down_revision: Union[str, None] = "d5e6f7a8b9c0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "email_delivery_events",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("webhook_id", sa.String(length=100), nullable=False),
        sa.Column("event_type", sa.String(length=50), nullable=False),
        sa.Column("email_id", sa.String(length=100), nullable=True),
        sa.Column("recipient_domain", sa.String(length=255), nullable=True),
        sa.Column("failure_reason", sa.String(length=500), nullable=True),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("received_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_email_delivery_events_id"), "email_delivery_events", ["id"], unique=False)
    op.create_index(op.f("ix_email_delivery_events_webhook_id"), "email_delivery_events", ["webhook_id"], unique=True)
    op.create_index(op.f("ix_email_delivery_events_event_type"), "email_delivery_events", ["event_type"], unique=False)
    op.create_index(op.f("ix_email_delivery_events_email_id"), "email_delivery_events", ["email_id"], unique=False)
    op.create_index(op.f("ix_email_delivery_events_occurred_at"), "email_delivery_events", ["occurred_at"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_email_delivery_events_occurred_at"), table_name="email_delivery_events")
    op.drop_index(op.f("ix_email_delivery_events_email_id"), table_name="email_delivery_events")
    op.drop_index(op.f("ix_email_delivery_events_event_type"), table_name="email_delivery_events")
    op.drop_index(op.f("ix_email_delivery_events_webhook_id"), table_name="email_delivery_events")
    op.drop_index(op.f("ix_email_delivery_events_id"), table_name="email_delivery_events")
    op.drop_table("email_delivery_events")
