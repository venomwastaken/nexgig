"""Shared helpers for account moderation state (ban/suspend), used by both the
regular auth path (app/api/v1/endpoints/users.py) and the admin endpoints
(app/api/v1/endpoints/admin.py) so a suspension's expiry is interpreted the same
way everywhere."""

from datetime import datetime, timezone

from app.models import AccountStatus, UserAccount


def _is_past(when: datetime) -> bool:
    # SQLite (used in tests, and by default if DATABASE_URL isn't set) drops tzinfo
    # on round-trip even for a `DateTime(timezone=True)` column, so a value read back
    # from the DB can be naive even though we always write it as UTC-aware. Postgres
    # doesn't have this problem, but treating a naive value as UTC is correct there
    # too since that's the only timezone this app ever writes.
    if when.tzinfo is None:
        when = when.replace(tzinfo=timezone.utc)
    return when <= datetime.now(timezone.utc)


def heal_expired_suspension(user: UserAccount) -> bool:
    """If a timed suspension has passed its expiry, lift it in place. Returns True
    if the row was changed — the caller is responsible for committing."""
    if (
        user.account_status == AccountStatus.suspended
        and user.suspended_until is not None
        and _is_past(user.suspended_until)
    ):
        user.account_status = AccountStatus.active
        user.suspended_until = None
        user.suspension_reason = None
        return True
    return False


def effective_status(user: UserAccount) -> str:
    """Display-only status, folding in `is_banned` and a lazily-expired suspension
    without requiring a DB write. Matches the frontend's AdminAccountStatus union
    (frontend/src/pages/components/dashboard/users/types.ts)."""
    if user.is_banned:
        return "banned"
    if user.account_status == AccountStatus.suspended:
        if user.suspended_until is not None and _is_past(user.suspended_until):
            return AccountStatus.active.value
        return AccountStatus.suspended.value
    return user.account_status.value
