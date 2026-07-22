"""Add status to gig table

Revision ID: 055a95483f11
Revises: 1fd5a44b61af
Create Date: 2026-07-13 18:17:46.795995

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '055a95483f11'
down_revision: Union[str, Sequence[str], None] = '1fd5a44b61af'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Manually create the enum type in PostgreSQL first
    sa.Enum('ACTIVE', 'COMPLETED', 'PAUSED', name='gigstatus').create(op.get_bind())
    
    # 2. Add the column to the table
    op.add_column('gig', sa.Column('status', sa.Enum('ACTIVE', 'COMPLETED', 'PAUSED', name='gigstatus'), nullable=False))


def downgrade() -> None:
    # 1. Drop the column first
    op.drop_column('gig', 'status')
    
    # 2. Manually drop the enum type from PostgreSQL
    sa.Enum('ACTIVE', 'COMPLETED', 'PAUSED', name='gigstatus').drop(op.get_bind())
