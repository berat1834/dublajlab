"""Add password-account email verification state."""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, None] = "b7c8d9e0f1a2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, None] = None


def upgrade() -> None:
    # Existing accounts remain usable. New password registrations explicitly set
    # this field to false until the ownership link is opened.
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(sa.Column(
            "email_verified",
            sa.Boolean(),
            server_default=sa.true(),
            nullable=False,
        ))
        batch_op.add_column(sa.Column(
            "email_verification_token_hash", sa.String(length=64), nullable=True
        ))
        batch_op.add_column(sa.Column(
            "email_verification_expires_at", sa.DateTime(timezone=True), nullable=True
        ))
        batch_op.alter_column("email_verified", server_default=sa.false())


def downgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("email_verification_expires_at")
        batch_op.drop_column("email_verification_token_hash")
        batch_op.drop_column("email_verified")
