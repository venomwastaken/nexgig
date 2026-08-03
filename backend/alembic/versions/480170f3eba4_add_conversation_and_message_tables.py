"""add conversation and message tables

Revision ID: 4e5fe6dc2939
Revises: 9d58e41baab8
Create Date: 2026-08-01 02:19:04.260560

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '4e5fe6dc2939'
down_revision: Union[str, Sequence[str], None] = '9d58e41baab8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'conversation',
        sa.Column('conversation_id', sa.Uuid(), nullable=False),
        sa.Column('user_a_id', sa.Uuid(), nullable=False),
        sa.Column('user_b_id', sa.Uuid(), nullable=False),
        sa.Column('gig_id', sa.Uuid(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('last_message_at', sa.DateTime(), nullable=True),
        sa.Column('user_a_last_read_at', sa.DateTime(), nullable=True),
        sa.Column('user_b_last_read_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_a_id'], ['user_account.user_id']),
        sa.ForeignKeyConstraint(['user_b_id'], ['user_account.user_id']),
        sa.ForeignKeyConstraint(['gig_id'], ['gig.gig_id']),
        sa.PrimaryKeyConstraint('conversation_id'),
    )
    op.create_index(op.f('ix_conversation_user_a_id'), 'conversation', ['user_a_id'], unique=False)
    op.create_index(op.f('ix_conversation_user_b_id'), 'conversation', ['user_b_id'], unique=False)
    op.create_index(op.f('ix_conversation_gig_id'), 'conversation', ['gig_id'], unique=False)
    op.create_index(op.f('ix_conversation_last_message_at'), 'conversation', ['last_message_at'], unique=False)
    op.create_unique_constraint('uq_conversation_participants', 'conversation', ['user_a_id', 'user_b_id'])

    op.create_table(
        'message',
        sa.Column('message_id', sa.Uuid(), nullable=False),
        sa.Column('conversation_id', sa.Uuid(), nullable=False),
        sa.Column('sender_id', sa.Uuid(), nullable=False),
        sa.Column('body', sqlmodel.sql.sqltypes.AutoString(length=4000), nullable=True),
        sa.Column('attachment_url', sqlmodel.sql.sqltypes.AutoString(length=2048), nullable=True),
        sa.Column('attachment_type', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['conversation_id'], ['conversation.conversation_id']),
        sa.ForeignKeyConstraint(['sender_id'], ['user_account.user_id']),
        sa.PrimaryKeyConstraint('message_id'),
    )
    op.create_index(op.f('ix_message_conversation_id'), 'message', ['conversation_id'], unique=False)
    op.create_index(op.f('ix_message_sender_id'), 'message', ['sender_id'], unique=False)
    op.create_index(op.f('ix_message_created_at'), 'message', ['created_at'], unique=False)
    op.create_index(
        'ix_message_conversation_id_created_at', 'message', ['conversation_id', 'created_at'], unique=False
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_message_conversation_id_created_at', table_name='message')
    op.drop_index(op.f('ix_message_created_at'), table_name='message')
    op.drop_index(op.f('ix_message_sender_id'), table_name='message')
    op.drop_index(op.f('ix_message_conversation_id'), table_name='message')
    op.drop_table('message')

    op.drop_constraint('uq_conversation_participants', 'conversation', type_='unique')
    op.drop_index(op.f('ix_conversation_last_message_at'), table_name='conversation')
    op.drop_index(op.f('ix_conversation_gig_id'), table_name='conversation')
    op.drop_index(op.f('ix_conversation_user_b_id'), table_name='conversation')
    op.drop_index(op.f('ix_conversation_user_a_id'), table_name='conversation')
    op.drop_table('conversation')
