"""merge multiple heads

Revision ID: e242c23bb3d4
Revises: 480170f3eba4, 4e5fe6dc2939
Create Date: 2026-08-03 17:08:25.762832

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'e242c23bb3d4'
down_revision: Union[str, Sequence[str], None] = ('480170f3eba4', '4e5fe6dc2939')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
