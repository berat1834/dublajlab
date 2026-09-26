"""Add DubbingProject and DubbingExport

Revision ID: 82db0755cbda
Revises: 330e75449567
Create Date: 2026-09-26 10:29:55.310763

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '82db0755cbda'
down_revision: Union[str, None] = '330e75449567'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Keep the existing users table intact.

    This revision was generated before the project/export models were imported
    into Alembic metadata and originally attempted to drop ``users``. The next
    revision contains the actual additive schema change.
    """
    pass


def downgrade() -> None:
    pass
