"""add admin user management fields (role, ban, suspension metadata, last_login)

Revision ID: c7d8e9f0a1b2
Revises: b1c2d3e4f5a6
Create Date: 2026-08-04 00:00:01.000000

"""
from alembic import op
import sqlalchemy as sa


revision = "c7d8e9f0a1b2"
down_revision = "b1c2d3e4f5a6"
branch_labels = None
depends_on = None


def upgrade():
    user_role_enum = sa.Enum("USER", "MODERATOR", "ADMIN", name="userrole")
    user_role_enum.create(op.get_bind(), checkfirst=False)

    op.add_column(
        "user_account",
        sa.Column("role", user_role_enum, nullable=False, server_default="USER"),
    )
    op.add_column("user_account", sa.Column("last_login", sa.DateTime(timezone=True), nullable=True))

    # Kept separate from account_status rather than a new enum member — altering the
    # existing `accountstatus` Postgres enum type in-place is riskier than adding a
    # plain boolean column (see app/moderation.py for the full rationale).
    op.add_column(
        "user_account",
        sa.Column("is_banned", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column("user_account", sa.Column("ban_reason", sa.String(length=500), nullable=True))
    op.add_column("user_account", sa.Column("banned_at", sa.DateTime(timezone=True), nullable=True))

    # Suspension reuses the existing account_status = SUSPENDED value; these two
    # columns carry the expiry/reason metadata the enum value alone can't express.
    op.add_column("user_account", sa.Column("suspended_until", sa.DateTime(timezone=True), nullable=True))
    op.add_column("user_account", sa.Column("suspension_reason", sa.String(length=500), nullable=True))


def downgrade():
    op.drop_column("user_account", "suspension_reason")
    op.drop_column("user_account", "suspended_until")
    op.drop_column("user_account", "banned_at")
    op.drop_column("user_account", "ban_reason")
    op.drop_column("user_account", "is_banned")
    op.drop_column("user_account", "last_login")
    op.drop_column("user_account", "role")

    sa.Enum("USER", "MODERATOR", "ADMIN", name="userrole").drop(op.get_bind(), checkfirst=False)
