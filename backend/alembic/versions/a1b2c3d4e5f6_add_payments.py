"""add payment/escrow fields to gig_order and payout_account table

Revision ID: a1b2c3d4e5f6
Revises: d4e5f6a7b8c9
Create Date: 2026-08-05 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    payment_status_enum = sa.Enum('PENDING', 'SUCCESS', 'FAILED', 'ABANDONED', name='paymentstatus')
    escrow_status_enum = sa.Enum('HELD', 'RELEASED', 'REFUNDED', name='escrowstatus')
    payment_status_enum.create(op.get_bind(), checkfirst=True)
    escrow_status_enum.create(op.get_bind(), checkfirst=True)

    op.add_column('gig_order', sa.Column('payment_status', payment_status_enum, nullable=True))
    op.add_column('gig_order', sa.Column('escrow_status', escrow_status_enum, nullable=True))
    op.add_column('gig_order', sa.Column('payment_reference', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=True))
    op.add_column('gig_order', sa.Column('buyer_confirmed_at', sa.DateTime(), nullable=True))
    op.add_column('gig_order', sa.Column('provider_confirmed_at', sa.DateTime(), nullable=True))
    op.create_index(op.f('ix_gig_order_payment_reference'), 'gig_order', ['payment_reference'], unique=False)

    op.create_table(
        'payout_account',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('bank_code', sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False),
        sa.Column('bank_name', sqlmodel.sql.sqltypes.AutoString(length=200), nullable=False),
        sa.Column('account_number', sqlmodel.sql.sqltypes.AutoString(length=50), nullable=False),
        sa.Column('account_name', sqlmodel.sql.sqltypes.AutoString(length=200), nullable=False),
        sa.Column('paystack_recipient_code', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=True),
        sa.Column('verified', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['user_account.user_id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_payout_account_user_id'), 'payout_account', ['user_id'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_payout_account_user_id'), table_name='payout_account')
    op.drop_table('payout_account')

    op.drop_index(op.f('ix_gig_order_payment_reference'), table_name='gig_order')
    op.drop_column('gig_order', 'provider_confirmed_at')
    op.drop_column('gig_order', 'buyer_confirmed_at')
    op.drop_column('gig_order', 'payment_reference')
    op.drop_column('gig_order', 'escrow_status')
    op.drop_column('gig_order', 'payment_status')

    sa.Enum('HELD', 'RELEASED', 'REFUNDED', name='escrowstatus').drop(op.get_bind())
    sa.Enum('PENDING', 'SUCCESS', 'FAILED', 'ABANDONED', name='paymentstatus').drop(op.get_bind())
