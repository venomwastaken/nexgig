"""link reviews to gigs

Revision ID: aeb6db895c46
Revises: c27beffa2c35
Create Date: 2026-08-04 00:00:00.000000

Adds a gig_id FK to user_review so a review can be tied to the specific gig
being reviewed, and a unique constraint on (gig_id, reviewer_id) so a buyer
can only leave one review per gig.

Drops the old service_id column: it was never a foreign key and didn't
reference any existing table (there's no booking/order/transaction model in
this schema yet), so it wasn't enforceable or usable as written.

NOTE: this migration only adds the *data model* for gig-scoped reviews. It
does not and cannot verify that a reviewer actually completed a transaction
for the gig they're reviewing -- there's no booking/order table to check
delivery against. The review-creation endpoint should, at minimum, reject
a reviewer_id that matches the gig's own user_id (owners can't review their
own gig). Real "confirmed delivery" gating (i.e. you can only review a gig
you actually paid for/received) needs the booking feature, which doesn't
exist yet either -- see the stubbed "Book this gig" button in
frontend/src/pages/GigView.tsx.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'aeb6db895c46'
down_revision: Union[str, Sequence[str], None] = 'c27beffa2c35'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('user_review', sa.Column('gig_id', sa.Uuid(), nullable=False))
    op.create_index(op.f('ix_user_review_gig_id'), 'user_review', ['gig_id'], unique=False)
    op.create_foreign_key(
        'fk_user_review_gig_id_gig', 'user_review', 'gig', ['gig_id'], ['gig_id']
    )
    op.create_unique_constraint(
        'uq_user_review_gig_reviewer', 'user_review', ['gig_id', 'reviewer_id']
    )

    op.drop_column('user_review', 'service_id')


def downgrade() -> None:
    """Downgrade schema."""
    # service_id had no data-preserving source to restore from, so it comes
    # back nullable rather than NOT NULL like the original column.
    op.add_column('user_review', sa.Column('service_id', sa.Uuid(), nullable=True))

    op.drop_constraint('uq_user_review_gig_reviewer', 'user_review', type_='unique')
    op.drop_constraint('fk_user_review_gig_id_gig', 'user_review', type_='foreignkey')
    op.drop_index(op.f('ix_user_review_gig_id'), table_name='user_review')
    op.drop_column('user_review', 'gig_id')
