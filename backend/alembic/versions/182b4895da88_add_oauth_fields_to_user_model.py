"""Add OAuth fields to User model

Revision ID: 182b4895da88
Revises: bc2a9e7650d6
Create Date: 2026-09-26 16:05:37.513467

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '182b4895da88'
down_revision: Union[str, None] = 'bc2a9e7650d6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # SQLite does not support ``ALTER COLUMN`` directly. Batch mode keeps the
    # same migration portable for local SQLite and production PostgreSQL.
    with op.batch_alter_table('users') as batch_op:
        batch_op.add_column(sa.Column('google_id', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('discord_id', sa.String(length=255), nullable=True))
        batch_op.alter_column(
            'password_hash',
            existing_type=sa.VARCHAR(length=255),
            nullable=True,
        )
        batch_op.create_index(op.f('ix_users_discord_id'), ['discord_id'], unique=True)
        batch_op.create_index(op.f('ix_users_google_id'), ['google_id'], unique=True)


def downgrade() -> None:
    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_index(op.f('ix_users_google_id'))
        batch_op.drop_index(op.f('ix_users_discord_id'))
        batch_op.alter_column(
            'password_hash',
            existing_type=sa.VARCHAR(length=255),
            nullable=False,
        )
        batch_op.drop_column('discord_id')
        batch_op.drop_column('google_id')
