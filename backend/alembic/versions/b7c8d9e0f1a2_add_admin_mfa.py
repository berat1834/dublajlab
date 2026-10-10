"""Add encrypted admin MFA state to users."""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b7c8d9e0f1a2"
down_revision: Union[str, None] = "f1a2b3c4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("mfa_enabled", sa.Boolean(), server_default=sa.false(), nullable=False),
    )
    op.add_column("users", sa.Column("mfa_secret_encrypted", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("mfa_pending_secret_encrypted", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("mfa_recovery_code_hashes", sa.Text(), nullable=True))
    op.add_column("users", sa.Column("mfa_last_totp_step", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "mfa_last_totp_step")
    op.drop_column("users", "mfa_recovery_code_hashes")
    op.drop_column("users", "mfa_pending_secret_encrypted")
    op.drop_column("users", "mfa_secret_encrypted")
    op.drop_column("users", "mfa_enabled")