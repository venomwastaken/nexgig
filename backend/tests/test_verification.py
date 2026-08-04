import uuid
from datetime import datetime

from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine, select

from app.api.v1.endpoints import verification
from app.core.database import get_db
from app.main import app
from app.models import StudentVerification, UserAccount, VerificationStatus


def test_accepts_edu_gh_domains(monkeypatch):
    engine = create_engine("sqlite:///./test_verification.sqlite3")
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)

    def override_get_db():
        with Session(engine) as session:
            yield session

    def override_get_or_create_user():
        return UserAccount(
            user_id=uuid.UUID("00000000-0000-0000-0000-000000000102"),
            email="student2@example.com",
            clerk_id="clerk_student_test_2",
        )

    captured = {}

    def fake_send_email(*, to, subject, body):
        captured["to"] = to
        captured["body"] = body

    monkeypatch.setattr(verification, "send_email", fake_send_email)

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[verification.get_or_create_user] = override_get_or_create_user

    client = TestClient(app)
    response = client.post(
        "/api/v1/verification/email/request",
        json={"email": "afbuaful@st.knust.edu.gh"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "code_sent"
    assert captured["to"] == "afbuaful@st.knust.edu.gh"


def test_request_accepts_whitespace_around_email(monkeypatch):
    engine = create_engine("sqlite:///./test_verification.sqlite3")
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)

    def override_get_db():
        with Session(engine) as session:
            yield session

    def override_get_or_create_user():
        return UserAccount(
            user_id=uuid.UUID("00000000-0000-0000-0000-000000000103"),
            email="student3@example.com",
            clerk_id="clerk_student_test_3",
        )

    monkeypatch.setattr(verification, "send_email", lambda *args, **kwargs: None)

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[verification.get_or_create_user] = override_get_or_create_user

    client = TestClient(app)
    response = client.post(
        "/api/v1/verification/email/request",
        json={"email": " Student@School.edu "},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "code_sent"


def test_student_verification_email_flow(monkeypatch):
    engine = create_engine("sqlite:///./test_verification.sqlite3")
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)

    def override_get_db():
        with Session(engine) as session:
            yield session

    def override_get_or_create_user():
        return UserAccount(
            user_id=uuid.UUID("00000000-0000-0000-0000-000000000101"),
            email="student@example.com",
            clerk_id="clerk_student_test",
        )

    captured = {}

    def fake_send_email(*, to, subject, body):
        captured["to"] = to
        captured["body"] = body

    monkeypatch.setattr(verification, "send_email", fake_send_email)

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[verification.get_or_create_user] = override_get_or_create_user

    client = TestClient(app)

    request_response = client.post(
        "/api/v1/verification/email/request",
        json={"email": "student@school.edu"},
    )
    assert request_response.status_code == 200
    assert request_response.json()["status"] == "code_sent"
    assert captured["to"] == "student@school.edu"

    code = captured["body"].split("code is ", 1)[1].split(".", 1)[0].strip()

    confirm_response = client.post(
        "/api/v1/verification/email/confirm",
        json={"code": code},
    )
    assert confirm_response.status_code == 200
    assert confirm_response.json()["status"] == "verified"

    with Session(engine) as session:
        record = session.exec(
            select(StudentVerification).where(StudentVerification.user_id == "clerk_student_test")
        ).first()
        assert record is not None
    assert record.status == VerificationStatus.verified
    assert record.verified_at is not None


def test_request_email_code_handles_naive_last_email_sent_at(monkeypatch):
    engine = create_engine("sqlite:///./test_verification.sqlite3")
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)

    def override_get_db():
        with Session(engine) as session:
            yield session

    def override_get_or_create_user():
        return UserAccount(
            user_id=uuid.UUID("00000000-0000-0000-0000-000000000105"),
            email="student5@example.com",
            clerk_id="clerk_student_test_5",
        )

    monkeypatch.setattr(verification, "send_email", lambda *args, **kwargs: None)

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[verification.get_or_create_user] = override_get_or_create_user

    client = TestClient(app)

    with Session(engine) as session:
        record = StudentVerification(
            user_id="clerk_student_test_5",
            email_send_attempts=1,
            last_email_sent_at=datetime.now(),
        )
        session.add(record)
        session.commit()

    response = client.post(
        "/api/v1/verification/email/request",
        json={"email": "student@school.edu"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "code_sent"
