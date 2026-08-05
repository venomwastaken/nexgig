import uuid
from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine

from app.api.v1.endpoints import admin as admin_endpoint
from app.api.v1.endpoints import users as users_endpoint
from app.main import app
from app.models import AccountStatus, UserAccount, UserProfile, UserRole

ADMIN_ID = uuid.UUID("00000000-0000-0000-0000-0000000000a1")
USER_ID = uuid.UUID("00000000-0000-0000-0000-0000000000b1")
OTHER_ID = uuid.UUID("00000000-0000-0000-0000-0000000000c1")


def _setup(db_name: str):
    engine = create_engine(f"sqlite:///./{db_name}.sqlite3")
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        session.add_all(
            [
                UserAccount(
                    user_id=ADMIN_ID,
                    email="admin@example.com",
                    clerk_id="clerk_admin",
                    is_admin=True,
                    role=UserRole.ADMIN,
                ),
                UserAccount(
                    user_id=USER_ID,
                    email="user@example.com",
                    clerk_id="clerk_user",
                ),
            ]
        )
        session.add(UserProfile(user_id=USER_ID, first_name="Jane", last_name="Doe", username="janedoe"))
        session.commit()

    def override_get_db():
        with Session(engine) as session:
            yield session

    def override_get_or_create_user():
        with Session(engine) as session:
            return session.get(UserAccount, ADMIN_ID)

    app.dependency_overrides[admin_endpoint.get_db] = override_get_db
    app.dependency_overrides[admin_endpoint.get_or_create_user] = override_get_or_create_user

    return engine, TestClient(app)


def _teardown():
    app.dependency_overrides.clear()


def test_list_users_search_and_filter():
    engine, client = _setup("test_admin_users_list")
    try:
        res = client.get("/api/v1/admin/users")
        assert res.status_code == 200
        body = res.json()
        assert body["total"] == 2
        assert {u["email"] for u in body["items"]} == {"admin@example.com", "user@example.com"}

        res = client.get("/api/v1/admin/users", params={"q": "jane"})
        assert res.status_code == 200
        assert res.json()["total"] == 1
        assert res.json()["items"][0]["profile"]["username"] == "janedoe"

        res = client.get("/api/v1/admin/users", params={"role": "admin"})
        assert res.status_code == 200
        assert res.json()["total"] == 1
        assert res.json()["items"][0]["email"] == "admin@example.com"
    finally:
        _teardown()


def test_get_user_detail_includes_stats_shape():
    engine, client = _setup("test_admin_users_detail")
    try:
        res = client.get(f"/api/v1/admin/users/{USER_ID}")
        assert res.status_code == 200
        body = res.json()
        assert body["email"] == "user@example.com"
        assert body["role"] == "user"
        assert body["account_status"] == "pending_verification"
        assert body["stats"] == {
            "gigs_posted": 0,
            "orders_completed": 0,
            "reviews_received": 0,
            "average_rating": None,
        }

        res = client.get(f"/api/v1/admin/users/{OTHER_ID}")
        assert res.status_code == 404
    finally:
        _teardown()


def test_update_user_rejects_duplicate_username():
    engine, client = _setup("test_admin_users_update")
    try:
        with Session(engine) as session:
            session.add(
                UserProfile(user_id=ADMIN_ID, first_name="Admin", last_name="User", username="admin1")
            )
            session.commit()

        res = client.patch(f"/api/v1/admin/users/{USER_ID}", json={"username": "admin1"})
        assert res.status_code == 409

        res = client.patch(f"/api/v1/admin/users/{USER_ID}", json={"first_name": "Janet"})
        assert res.status_code == 200
        assert res.json()["profile"]["first_name"] == "Janet"
    finally:
        _teardown()


def test_role_change_and_self_demote_guard():
    engine, client = _setup("test_admin_users_role")
    try:
        res = client.patch(f"/api/v1/admin/users/{USER_ID}/role", json={"role": "moderator"})
        assert res.status_code == 200
        assert res.json()["role"] == "moderator"
        assert res.json()["is_admin"] is False

        res = client.patch(f"/api/v1/admin/users/{ADMIN_ID}/role", json={"role": "user"})
        assert res.status_code == 400
    finally:
        _teardown()


def test_ban_unban_and_self_ban_guard():
    engine, client = _setup("test_admin_users_ban")
    try:
        res = client.post(f"/api/v1/admin/users/{ADMIN_ID}/ban", json={})
        assert res.status_code == 400

        res = client.post(f"/api/v1/admin/users/{USER_ID}/ban", json={"reason": "spam"})
        assert res.status_code == 200
        assert res.json()["account_status"] == "banned"
        assert res.json()["ban_reason"] == "spam"

        res = client.post(f"/api/v1/admin/users/{USER_ID}/unban")
        assert res.status_code == 200
        assert res.json()["account_status"] == "pending_verification"
    finally:
        _teardown()


def test_suspend_expiry_is_healed_lazily():
    engine, client = _setup("test_admin_users_suspend")
    try:
        res = client.post(
            f"/api/v1/admin/users/{ADMIN_ID}/suspend", json={"duration_hours": 1}
        )
        assert res.status_code == 400  # can't suspend self

        res = client.post(
            f"/api/v1/admin/users/{USER_ID}/suspend",
            json={"reason": "cool off", "duration_hours": 1},
        )
        assert res.status_code == 200
        assert res.json()["account_status"] == "suspended"
        assert res.json()["suspension"]["reason"] == "cool off"

        # Force the suspension into the past to simulate expiry, then confirm the
        # list/detail endpoints self-heal it back to active without a manual unsuspend.
        with Session(engine) as session:
            user = session.get(UserAccount, USER_ID)
            user.suspended_until = datetime.now(timezone.utc) - timedelta(hours=1)
            session.add(user)
            session.commit()

        res = client.get(f"/api/v1/admin/users/{USER_ID}")
        assert res.status_code == 200
        assert res.json()["account_status"] == "active"

        with Session(engine) as session:
            user = session.get(UserAccount, USER_ID)
            assert user.account_status == AccountStatus.active
            assert user.suspended_until is None
    finally:
        _teardown()


def test_delete_user_is_a_soft_delete():
    engine, client = _setup("test_admin_users_delete")
    try:
        res = client.delete(f"/api/v1/admin/users/{ADMIN_ID}")
        assert res.status_code == 400

        res = client.delete(f"/api/v1/admin/users/{USER_ID}")
        assert res.status_code == 200
        assert res.json()["account_status"] == "deactivated"

        with Session(engine) as session:
            assert session.get(UserAccount, USER_ID) is not None
    finally:
        _teardown()


def test_bulk_action_bans_and_rejects_self_inclusion():
    engine, client = _setup("test_admin_users_bulk")
    try:
        with Session(engine) as session:
            session.add(UserAccount(user_id=OTHER_ID, email="other@example.com", clerk_id="clerk_other"))
            session.commit()

        res = client.post(
            "/api/v1/admin/users/bulk",
            json={"user_ids": [str(ADMIN_ID), str(USER_ID)], "action": "ban"},
        )
        assert res.status_code == 400

        res = client.post(
            "/api/v1/admin/users/bulk",
            json={"user_ids": [str(USER_ID), str(OTHER_ID)], "action": "ban", "reason": "sweep"},
        )
        assert res.status_code == 200
        assert res.json()["updated"] == 2

        with Session(engine) as session:
            assert session.get(UserAccount, USER_ID).is_banned is True
            assert session.get(UserAccount, OTHER_ID).is_banned is True

        res = client.post(
            "/api/v1/admin/users/bulk",
            json={"user_ids": [str(USER_ID)], "action": "set_role"},
        )
        assert res.status_code == 422
    finally:
        _teardown()


def test_non_admin_is_forbidden():
    engine, client = _setup("test_admin_users_forbidden")
    try:
        def override_non_admin():
            with Session(engine) as session:
                return session.get(UserAccount, USER_ID)

        app.dependency_overrides[admin_endpoint.get_or_create_user] = override_non_admin
        res = client.get("/api/v1/admin/users")
        assert res.status_code == 403
    finally:
        _teardown()


def test_banned_user_is_rejected_at_auth_layer():
    engine = create_engine("sqlite:///./test_admin_users_auth_gate.sqlite3")
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        session.add(
            UserAccount(user_id=USER_ID, email="user@example.com", clerk_id="clerk_user", is_banned=True)
        )
        session.commit()

    with Session(engine) as session:
        with pytest.raises(HTTPException) as exc_info:
            users_endpoint.get_or_create_user_from_payload({"sub": "clerk_user", "email": "user@example.com"}, session)
        assert exc_info.value.status_code == 403


def test_suspended_user_is_rejected_until_expiry():
    engine = create_engine("sqlite:///./test_admin_users_suspend_gate.sqlite3")
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        session.add(
            UserAccount(
                user_id=USER_ID,
                email="user@example.com",
                clerk_id="clerk_user",
                account_status=AccountStatus.suspended,
                suspended_until=datetime.now(timezone.utc) + timedelta(hours=1),
            )
        )
        session.commit()

    with Session(engine) as session:
        with pytest.raises(HTTPException) as exc_info:
            users_endpoint.get_or_create_user_from_payload({"sub": "clerk_user", "email": "user@example.com"}, session)
        assert exc_info.value.status_code == 403

    # Once the suspension has lapsed, the same call should succeed and heal the row.
    with Session(engine) as session:
        user = session.get(UserAccount, USER_ID)
        user.suspended_until = datetime.now(timezone.utc) - timedelta(hours=1)
        session.add(user)
        session.commit()

    with Session(engine) as session:
        user = users_endpoint.get_or_create_user_from_payload(
            {"sub": "clerk_user", "email": "user@example.com"}, session
        )
        assert user.account_status == AccountStatus.active
