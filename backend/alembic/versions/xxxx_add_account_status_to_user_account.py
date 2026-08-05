"""add account status to user_account

Revision ID: xxxx
Revises: <current head>
Create Date: 2026-07-26 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ENUM

revision = "xxxx"
down_revision = "<current head>"
branch_labels = None
depends_on = None

def upgrade():
    account_status = ENUM(
        "active", "suspended", "deactivated", "pending_verification",
        name="accountstatus"
    )
    account_status.create(op.get_bind(), checkfirst=True)

    op.add_column(
        "user_account",
        sa.Column("status", sa.Enum("active","suspended","deactivated","pending_verification", name="accountstatus"), nullable=False, server_default="active")
    )
    # optional: remove server_default if you prefer afterwards

def downgrade():
    op.drop_column("user_account", "status")
    account_status = ENUM(
        "active", "suspended", "deactivated", "pending_verification",
        name="accountstatus"
    )
    account_status.drop(op.get_bind(), checkfirst=True)