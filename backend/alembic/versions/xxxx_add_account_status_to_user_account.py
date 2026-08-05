"""add account status to user_account

Revision ID: xxxx
Revises: <current head>
Create Date: 2026-07-26 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ENUM

revision = "xxxx"
down_revision = 'a7d1016777f5'
branch_labels = None
depends_on = None

def upgrade():
    # 1. Create the enum from scratch if it truly doesn't exist
    account_status = ENUM(
        "active", "suspended", "deactivated", "pending_verification",
        name="accountstatus"
    )
    account_status.create(op.get_bind(), checkfirst=True)

    # 2. Explicitly inject the missing values into the type in case it already existed
    # PostgreSQL requires running this outside an active transaction block
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE accountstatus ADD VALUE IF NOT EXISTS 'active';")
        op.execute("ALTER TYPE accountstatus ADD VALUE IF NOT EXISTS 'suspended';")
        op.execute("ALTER TYPE accountstatus ADD VALUE IF NOT EXISTS 'deactivated';")
        op.execute("ALTER TYPE accountstatus ADD VALUE IF NOT EXISTS 'pending_verification';")

    # 3. Safely add the column now that the database type is guaranteed to have the values
    op.add_column(
        "user_account",
        sa.Column("status", sa.Enum("active","suspended","deactivated","pending_verification", name="accountstatus"), nullable=False, server_default="active")
    )
