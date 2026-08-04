"""merge heads

Revision ID: beec2f9727aa
Revises: b78cd923860d, 4e5fe6dc2939
Create Date: 2026-08-03 23:17:10.419456

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'beec2f9727aa'
down_revision: Union[str, Sequence[str], None] = ('b78cd923860d', '4e5fe6dc2939')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
