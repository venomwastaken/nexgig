"""add gig_comment table

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-08-05 12:55:00.000000

The `GigComment` SQLModel (app/models.py) has existed with no matching
migration, so the `gig_comment` table was never created in the database.
This caused every read of it (e.g. GET /gigs/{id}/comments) to fail with
`psycopg2.errors.UndefinedTable: relation "gig_comment" does not exist`.
This migration creates the table to match the model.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "gig_comment",
        sa.Column("comment_id", sa.Uuid(), nullable=False),
        sa.Column("gig_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("parent_comment_id", sa.Uuid(), nullable=True),
        sa.Column("body", sqlmodel.sql.sqltypes.AutoString(length=2000), nullable=False),
        sa.Column("is_edited", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["gig_id"], ["gig.gig_id"]),
        sa.ForeignKeyConstraint(["user_id"], ["user_account.user_id"]),
        sa.ForeignKeyConstraint(["parent_comment_id"], ["gig_comment.comment_id"]),
        sa.PrimaryKeyConstraint("comment_id"),
    )
    op.create_index(op.f("ix_gig_comment_gig_id"), "gig_comment", ["gig_id"], unique=False)
    op.create_index(op.f("ix_gig_comment_user_id"), "gig_comment", ["user_id"], unique=False)
    op.create_index(op.f("ix_gig_comment_parent_comment_id"), "gig_comment", ["parent_comment_id"], unique=False)
    op.create_index(op.f("ix_gig_comment_created_at"), "gig_comment", ["created_at"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_gig_comment_created_at"), table_name="gig_comment")
    op.drop_index(op.f("ix_gig_comment_parent_comment_id"), table_name="gig_comment")
    op.drop_index(op.f("ix_gig_comment_user_id"), table_name="gig_comment")
    op.drop_index(op.f("ix_gig_comment_gig_id"), table_name="gig_comment")
    op.drop_table("gig_comment")
