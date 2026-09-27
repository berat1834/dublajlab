"""Add user membership fields.

Revision ID: d4e5f6a7b8c9
Revises: 182b4895da88
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, None] = "182b4895da88"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(
            sa.Column(
                "membership_tier",
                sa.String(length=20),
                nullable=False,
                server_default="free",
            )
        )
        batch_op.add_column(
            sa.Column("membership_expires_at", sa.DateTime(timezone=True), nullable=True)
        )
        batch_op.alter_column("membership_tier", server_default=None)


def downgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("membership_expires_at")
        batch_op.drop_column("membership_tier")
