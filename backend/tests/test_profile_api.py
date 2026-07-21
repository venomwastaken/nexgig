import uuid

from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine

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
