"""normalize legacy uppercase account_status values

Revision ID: b3c4d5e6f7a8
Revises: ae1fe4e011b9
Create Date: 2026-08-05 00:00:00.000000

The `accountstatus` Postgres enum was originally created (in 5a6bfac40768)
with uppercase labels (PENDING_VERIFICATION, ACTIVE, SUSPENDED, DEACTIVATED).
The Python `AccountStatus` enum was later changed to lowercase values, and a
later migration (xxxx_add_account_status_to_user_account) added the lowercase
labels to the same Postgres type via `ALTER TYPE ... ADD VALUE`, but never
migrated existing row data off the original uppercase labels. Rows still
carrying an uppercase label fail to deserialize since the Python enum no
longer has a matching member, e.g.:

    LookupError: 'PENDING_VERIFICATION' is not among the defined enum
    values. Enum name: accountstatus.

This migration rewrites any remaining uppercase values on `user_account.account_status`
to their lowercase equivalent. The old uppercase labels are left in the
Postgres enum type itself (Postgres cannot drop enum labels without
recreating the type), but nothing should produce them going forward.
"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b3c4d5e6f7a8"
down_revision: Union[str, Sequence[str], None] = "ae1fe4e011b9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_LEGACY_TO_CURRENT = {
    "PENDING_VERIFICATION": "pending_verification",
    "ACTIVE": "active",
    "SUSPENDED": "suspended",
    "DEACTIVATED": "deactivated",
}


def upgrade() -> None:
    for legacy, current in _LEGACY_TO_CURRENT.items():
        op.execute(
            f"UPDATE user_account SET account_status = '{current}' "
            f"WHERE account_status = '{legacy}'"
        )


def downgrade() -> None:
    # Original casing is not recoverable; this is a one-way data cleanup.
    pass
