"""add gig approval status and admin flag

Revision ID: 7c9c9d9a1b3e
Revises: 055a95483f11
Create Date: 2026-07-23 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


revision = "7c9c9d9a1b3e"
down_revision = "055a95483f11"
branch_labels = None
depends_on = None


def upgrade():
    approval_status_enum = sa.Enum(
        "PENDING",
        "APPROVED",
        "REJECTED",
        name="gig_approval_status",
    )
    approval_status_enum.create(op.get_bind(), checkfirst=False)

    op.add_column(
        "gig",
        sa.Column(
            "approval_status",
            approval_status_enum,
            nullable=False,
            server_default="PENDING",
        ),
    )
    op.add_column("gig", sa.Column("reviewed_by_id", sa.Uuid(), nullable=True))
    op.add_column("gig", sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("gig", sa.Column("rejection_reason", sa.String(length=500), nullable=True))

    op.create_foreign_key(
        "fk_gig_reviewed_by_user_account",
        "gig",
        "user_account",
        ["reviewed_by_id"],
        ["user_id"],
    )

    op.add_column(
        "user_account",
        sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade():
    op.drop_constraint("fk_gig_reviewed_by_user_account", "gig", type_="foreignkey")
    op.drop_column("gig", "rejection_reason")
    op.drop_column("gig", "reviewed_at")
    op.drop_column("gig", "reviewed_by_id")
    op.drop_column("gig", "approval_status")
    op.drop_column("user_account", "is_admin")

    sa.Enum("PENDING", "APPROVED", "REJECTED", name="gig_approval_status").drop(
        op.get_bind(),
        checkfirst=False,
    )