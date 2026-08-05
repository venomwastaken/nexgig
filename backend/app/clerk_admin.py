"""Best-effort integration with Clerk's Backend API for admin-triggered password
resets. Passwords are entirely Clerk-managed here — this app never stores a hash —
so "reset a user's password" can't be done locally the way the old email-OTP flow in
verification.py works; it has to go through Clerk.

No-ops (returns False) when CLERK_SECRET_KEY isn't configured, the same graceful
degradation app/email.py uses when RESEND_API_KEY is missing.

CAVEAT: revoking sessions (below) is the well-documented, stable primitive in
Clerk's Backend API for forcing a user to re-authenticate. Whether Clerk also
exposes a direct "send password reset email" call depends on your Clerk plan/API
version — verify against your Clerk dashboard's API reference before assuming this
literally emails the user; today it forces their next request to fail auth, which
sends them through Clerk's own hosted "forgot password" flow.
"""

import os
from typing import Optional

import requests

CLERK_SECRET_KEY: Optional[str] = os.getenv("CLERK_SECRET_KEY")
CLERK_API_BASE = "https://api.clerk.com/v1"
_REQUEST_TIMEOUT_SECONDS = 10


def trigger_password_reset(clerk_user_id: str) -> bool:
    if not CLERK_SECRET_KEY:
        return False

    headers = {"Authorization": f"Bearer {CLERK_SECRET_KEY}"}
    try:
        sessions_resp = requests.get(
            f"{CLERK_API_BASE}/sessions",
            params={"user_id": clerk_user_id, "status": "active"},
            headers=headers,
            timeout=_REQUEST_TIMEOUT_SECONDS,
        )
        sessions_resp.raise_for_status()
        sessions = sessions_resp.json()

        for session in sessions:
            revoke_resp = requests.post(
                f"{CLERK_API_BASE}/sessions/{session['id']}/revoke",
                headers=headers,
                timeout=_REQUEST_TIMEOUT_SECONDS,
            )
            revoke_resp.raise_for_status()

        return True
    except requests.RequestException:
        return False
