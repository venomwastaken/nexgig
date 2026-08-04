"""merge branched heads

Revision ID: 0f3b5d08dbd2
Revises: 685e8287cf5c, a7d1016777f5
Create Date: 2026-07-28 23:02:00.406942

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '0f3b5d08dbd2'
down_revision: Union[str, Sequence[str], None] = ('685e8287cf5c', 'a7d1016777f5')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
