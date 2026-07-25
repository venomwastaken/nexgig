"""add booking table

Revision ID: f1b2c3d4e5a6
Revises: 7c9c9d9a1b3e
Create Date: 2026-07-25 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ENUM, UUID

revision = "f1b2c3d4e5a6"
down_revision = "7c9c9d9a1b3e"
branch_labels = None
depends_on = None


def upgrade():
    booking_status_type = ENUM(
        "pending",
        "accepted",
        "declined",
        "completed",
        "cancelled",
        name="bookingstatus",
    )
    booking_status_type.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "booking",
        sa.Column("booking_id", UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("listing_id", UUID(as_uuid=True), nullable=False),
        sa.Column("client_id", UUID(as_uuid=True), nullable=False),
        sa.Column("freelancer_id", UUID(as_uuid=True), nullable=False),
        sa.Column(
            "status",
            ENUM(
                "pending",
                "accepted",
                "declined",
                "completed",
                "cancelled",
                name="bookingstatus",
                create_type=False,
            ),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["listing_id"], ["gig.gig_id"], name="fk_booking_listing_id_gig"),
        sa.ForeignKeyConstraint(["client_id"], ["user_account.user_id"], name="fk_booking_client_id_user_account"),
        sa.ForeignKeyConstraint(["freelancer_id"], ["user_account.user_id"], name="fk_booking_freelancer_id_user_account"),
    )


def downgrade():
    op.drop_table("booking")
    booking_status = ENUM(
        "pending",
        "accepted",
        "declined",
        "completed",
        "cancelled",
        name="bookingstatus",
    )
    booking_status.drop(op.get_bind(), checkfirst=True)