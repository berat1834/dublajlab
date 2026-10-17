"""Add single-use password reset tokens and password change timestamp."""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d5e6f7a8b9c0"
down_revision: Union[str, None] = "c3d4e5f6a7b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, None] = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(sa.Column(
            "password_reset_token_hash", sa.String(length=64), nullable=True
        ))
        batch_op.add_column(sa.Column(
            "password_reset_expires_at", sa.DateTime(timezone=True), nullable=True
        ))
        # Tokens issued before this moment are rejected, so a reset also
        # signs out every previously stolen or forgotten session.
        batch_op.add_column(sa.Column(
            "password_changed_at", sa.DateTime(timezone=True), nullable=True
        ))
        batch_op.create_index(
            "ix_users_password_reset_token_hash", ["password_reset_token_hash"]
        )


def downgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_index("ix_users_password_reset_token_hash")
        batch_op.drop_column("password_changed_at")
        batch_op.drop_column("password_reset_expires_at")
        batch_op.drop_column("password_reset_token_hash")
