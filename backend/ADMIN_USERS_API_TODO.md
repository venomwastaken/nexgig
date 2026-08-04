# Admin user-management API — implementation notes

All endpoints below are implemented in `backend/app/api/v1/endpoints/admin.py` and
match what the frontend (`frontend/src/pages/components/dashboard/users/api.ts`)
calls. This file now tracks what's implemented and the couple of things a deployer
still needs to do — it's no longer a spec for unbuilt work.

## Endpoints (all under `/api/v1/admin`, gated by `require_admin`)

| Method | Path | Notes |
|---|---|---|
| `GET` | `/admin/users` | `q`, `status`, `role`, `sort`, `order`, `limit`, `offset` query params. |
| `GET` | `/admin/users/{user_id}` | Full `AdminUserRead`. |
| `PATCH` | `/admin/users/{user_id}` | Edits email + profile fields; 409 on duplicate email/username. |
| `PATCH` | `/admin/users/{user_id}/role` | `user \| moderator \| admin`; blocks self-demotion. |
| `POST` | `/admin/users/{user_id}/ban` / `unban` | Blocks self-ban. |
| `POST` | `/admin/users/{user_id}/suspend` / `unsuspend` | Optional reason + duration; blocks self-suspend. |
| `DELETE` | `/admin/users/{user_id}` | Soft delete — see below. |
| `POST` | `/admin/users/{user_id}/reset-password` | Requires `CLERK_SECRET_KEY` — see below. |
| `POST` | `/admin/users/bulk` | `ban \| unban \| suspend \| unsuspend \| delete \| set_role`; rejects including your own account. |

## Design decisions worth knowing about

- **No new `AccountStatus` enum value for "banned".** It's a separate `is_banned`
  boolean on `UserAccount` instead, to avoid an `ALTER TYPE ... ADD VALUE` migration
  on the existing Postgres `accountstatus` enum. `GET` endpoints report a computed
  `account_status` of `"banned"` when set — see `app/moderation.py::effective_status`.
- **Suspension auto-expiry is lazy, not cron-driven.** `suspended_until` is checked
  (and healed back to `active`) both on the admin's next read (`app/moderation.py`)
  and on the suspended user's own next authenticated request
  (`get_or_create_user_from_payload` in `app/api/v1/endpoints/users.py`).
- **Ban/suspension is enforced app-wide**, not just in the admin panel — the same
  check lives in `get_or_create_user_from_payload`, which every authenticated
  endpoint depends on, so a banned/suspended user gets a 403 everywhere, including
  from their own admin session if they ban/suspend themselves. Self-ban/-suspend/
  -delete/-demote are blocked at the API layer specifically to avoid that footgun,
  but bulk actions can still catch an admin's own id indirectly if IDs are reused —
  the bulk endpoint rejects the whole request if your own id is in the list.
- **`DELETE` is a soft delete** (`account_status -> deactivated`), not a row delete.
  `gig`, `gig_order`, `user_review`, `message`, `conversation`, and `user_wallet` all
  reference `user_account.user_id` with no `ON DELETE CASCADE`, so a hard delete
  would 500 on any user with history. This is the safe equivalent.
- **`role`** is a new column (`user | moderator | admin`) kept in sync with the
  pre-existing `is_admin` boolean (`is_admin = role == "admin"`) — nothing that
  already reads `is_admin` needed to change. `moderator` doesn't currently unlock
  anything beyond what a `user` can do; `require_admin` still only accepts `admin`.

## What still needs deploy-time configuration

- **`CLERK_SECRET_KEY`** — `POST /admin/users/{user_id}/reset-password`
  (`app/clerk_admin.py`) calls Clerk's Backend API to revoke the user's active
  sessions, forcing them through Clerk's own "forgot password" flow on next visit.
  Without this env var set, the endpoint returns `503`. Verify the exact session-
  revocation endpoint against your Clerk plan/API version before relying on it in
  production — it was written from Backend API docs, not tested against a live
  Clerk account.
- **Run the migration**: `c7d8e9f0a1b2_add_admin_user_management_fields.py` (preceded
  by a head-merge migration, `b1c2d3e4f5a6`, since `main` had two migration heads
  before this change). `alembic upgrade head`.
- **Expose `is_admin` on `/users/me`**: done — `UserAccountWithProfile` now includes
  `is_admin`/`role`, which `frontend/src/components/RequireAdmin.tsx` depends on to
  gate the `/admin` route.
