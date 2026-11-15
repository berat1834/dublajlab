"""Add daily aggregate product metrics without user or media identifiers.

Revision ID: e7f8a9b0c1d2
Revises: a1b2c3d4e5f7
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e7f8a9b0c1d2"
down_revision: Union[str, None] = "a1b2c3d4e5f7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "product_metric_daily",
        sa.Column("event_date", sa.Date(), nullable=False),
        sa.Column("event_name", sa.String(length=40), nullable=False),
        sa.Column("event_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("event_date", "event_name"),
    )


def downgrade() -> None:
    op.drop_table("product_metric_daily")
