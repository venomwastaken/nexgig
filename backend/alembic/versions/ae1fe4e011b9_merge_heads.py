"""merge heads

Revision ID: ae1fe4e011b9
Revises: aeb6db895c46, c7d8e9f0a1b2, f1b2c3d4e5a6, xxxx
Create Date: 2026-08-04 23:56:26.701607

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'ae1fe4e011b9'
down_revision: Union[str, Sequence[str], None] = ('aeb6db895c46', 'c7d8e9f0a1b2', 'f1b2c3d4e5a6', 'xxxx')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
