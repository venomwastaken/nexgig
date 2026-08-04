"""added banner_url

Revision ID: 617fd04a769d
Revises: 9d58e41baab8
Create Date: 2026-08-01 16:05:11.306862

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '617fd04a769d'
down_revision: Union[str, Sequence[str], None] = '9d58e41baab8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None



def upgrade():
    # 1. Create the new ENUM type in Postgres if it doesn't exist
    gig_approval_status = postgresql.ENUM(
        'PENDING', 'APPROVED', 'REJECTED', 
        name='gigapprovalstatus'
    )
    gig_approval_status.create(op.get_bind(), checkfirst=True)

    # 2. Drop the existing default constraint so Postgres allows type conversion
    op.alter_column('gig', 'approval_status', server_default=None)

    # 3. Alter the column type using double-cast (enum -> text -> new enum)
    op.alter_column(
        'gig', 
        'approval_status',
        type_=gig_approval_status,
        postgresql_using='approval_status::text::gigapprovalstatus',
        existing_nullable=True
    )

    # 4. Set the new default value using the new enum type
    op.alter_column(
        'gig',
        'approval_status',
        server_default=sa.text("'PENDING'::gigapprovalstatus")
    )

    # 5. Clean up old orphan type (optional)
    op.execute("DROP TYPE IF EXISTS gig_approval_status;")


def downgrade():
    # Re-create old enum
    old_enum = postgresql.ENUM('PENDING', 'APPROVED', 'REJECTED', name='gig_approval_status')
    old_enum.create(op.get_bind(), checkfirst=True)

    # Clear current default
    op.alter_column('gig', 'approval_status', server_default=None)

    # Revert type back to old enum
    op.alter_column(
        'gig',
        'approval_status',
        type_=old_enum,
        postgresql_using='approval_status::text::gig_approval_status',
        existing_nullable=True
    )

    # Restore old default
    op.alter_column(
        'gig',
        'approval_status',
        server_default=sa.text("'PENDING'::gig_approval_status")
    )

    # Drop new enum
    gig_approval_status = postgresql.ENUM(name='gigapprovalstatus')
    gig_approval_status.drop(op.get_bind(), checkfirst=True)
