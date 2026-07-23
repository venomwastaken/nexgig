"""merge divergent heads

Revision ID: 353fdd77e34c
Revises: 5bdf3d1735fa, 7c9c9d9a1b3e
Create Date: 2026-07-23 19:50:08.046226

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '353fdd77e34c'
down_revision: Union[str, Sequence[str], None] = ('5bdf3d1735fa', '7c9c9d9a1b3e')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
