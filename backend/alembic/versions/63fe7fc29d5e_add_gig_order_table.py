"""add gig order table

Revision ID: 63fe7fc29d5e
Revises: c27beffa2c35
Create Date: 2026-08-04 13:34:28.421664

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '63fe7fc29d5e'
down_revision: Union[str, Sequence[str], None] = 'c27beffa2c35'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # create_table() below creates the backing enum type automatically as
    # part of its DDL, so it must not be created separately here first.
    order_status_enum = sa.Enum(
        'REQUESTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', name='orderstatus'
    )

    op.create_table(
        'gig_order',
        sa.Column('order_id', sa.Uuid(), nullable=False),
        sa.Column('gig_id', sa.Uuid(), nullable=False),
        sa.Column('buyer_id', sa.Uuid(), nullable=False),
        sa.Column('provider_id', sa.Uuid(), nullable=False),
        sa.Column('price', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('note', sqlmodel.sql.sqltypes.AutoString(length=1000), nullable=True),
        sa.Column('status', order_status_enum, nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['gig_id'], ['gig.gig_id']),
        sa.ForeignKeyConstraint(['buyer_id'], ['user_account.user_id']),
        sa.ForeignKeyConstraint(['provider_id'], ['user_account.user_id']),
        sa.PrimaryKeyConstraint('order_id'),
    )
    op.create_index(op.f('ix_gig_order_gig_id'), 'gig_order', ['gig_id'], unique=False)
    op.create_index(op.f('ix_gig_order_buyer_id'), 'gig_order', ['buyer_id'], unique=False)
    op.create_index(op.f('ix_gig_order_provider_id'), 'gig_order', ['provider_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_gig_order_provider_id'), table_name='gig_order')
    op.drop_index(op.f('ix_gig_order_buyer_id'), table_name='gig_order')
    op.drop_index(op.f('ix_gig_order_gig_id'), table_name='gig_order')
    op.drop_table('gig_order')

    sa.Enum(
        'REQUESTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', name='orderstatus'
    ).drop(op.get_bind())
