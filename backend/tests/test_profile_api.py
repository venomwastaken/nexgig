import uuid

from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine, select

from app.api.v1.endpoints import users as users_endpoint
from app.core.database import get_db
from app.main import app
from app.models import UserAccount, UserProfile


def test_create_profile_accepts_payload_without_timestamps():
    engine = create_engine("sqlite:///./test_profile_api.sqlite3")
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)

    def override_get_db():
        with Session(engine) as session:
            yield session

    def override_get_or_create_user():
        return UserAccount(
            user_id=uuid.UUID("00000000-0000-0000-0000-000000000001"),
            email="test@example.com",
            clerk_id="clerk_test",
        )

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[users_endpoint.get_or_create_user] = override_get_or_create_user

    client = TestClient(app)
    response = client.post(
        "/api/v1/users/me/profile",
        json={
            "first_name": "Test",
            "last_name": "User",
            "username": "testuser",
            "bio": "Hello",
        },
    )

    assert response.status_code == 201
    assert response.json()["username"] == "testuser"

    with Session(engine) as session:
        saved = session.get(UserProfile, uuid.UUID(response.json()["id"]))
        assert saved is not None
        assert saved.username == "testuser"


def test_create_profile_upserts_instead_of_duplicating():
    engine = create_engine("sqlite:///./test_profile_api_upsert.sqlite3")
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)

    def override_get_db():
        with Session(engine) as session:
            yield session

    def override_get_or_create_user():
        return UserAccount(
            user_id=uuid.UUID("00000000-0000-0000-0000-000000000002"),
            email="test2@example.com",
            clerk_id="clerk_test_2",
        )

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[users_endpoint.get_or_create_user] = override_get_or_create_user

    client = TestClient(app)
    first = client.post(
        "/api/v1/users/me/profile",
        json={
            "first_name": "Test",
            "last_name": "User",
            "username": "onboardtest",
            "university": "State U",
        },
    )
    assert first.status_code == 201
    profile_id = first.json()["id"]

    second = client.post(
        "/api/v1/users/me/profile",
        json={
            "first_name": "Test",
            "last_name": "User",
            "username": "onboardtest",
            "university": "Renamed U",
        },
    )
    assert second.status_code == 200
    assert second.json()["id"] == profile_id
    assert second.json()["university"] == "Renamed U"

    with Session(engine) as session:
        rows = session.exec(
            select(UserProfile).where(UserProfile.user_id == uuid.UUID("00000000-0000-0000-0000-000000000002"))
        ).all()
        assert len(rows) == 1


def test_username_available_excludes_self_but_flags_others():
    engine = create_engine("sqlite:///./test_profile_api_username.sqlite3")
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)

    def override_get_db():
        with Session(engine) as session:
            yield session

    user_a = UserAccount(
        user_id=uuid.UUID("00000000-0000-0000-0000-000000000003"),
        email="test3@example.com",
        clerk_id="clerk_test_3",
    )
    user_b = UserAccount(
        user_id=uuid.UUID("00000000-0000-0000-0000-000000000004"),
        email="test4@example.com",
        clerk_id="clerk_test_4",
    )

    app.dependency_overrides[get_db] = override_get_db

    client = TestClient(app)

    app.dependency_overrides[users_endpoint.get_or_create_user] = lambda: user_a
    client.post(
        "/api/v1/users/me/profile",
        json={"first_name": "Test", "last_name": "User", "username": "myownname"},
    )

    # user_a checking their own already-saved username should read as available
    own_name = client.get("/api/v1/users/username-available", params={"username": "myownname"})
    assert own_name.json()["available"] is True

    # user_b checking that same username should read as taken
    app.dependency_overrides[users_endpoint.get_or_create_user] = lambda: user_b
    taken = client.get("/api/v1/users/username-available", params={"username": "myownname"})
    assert taken.json()["available"] is False
