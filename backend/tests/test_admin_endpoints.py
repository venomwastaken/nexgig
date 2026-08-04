import os
import sys
import uuid
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_admin_endpoints.sqlite3")

from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine

from app.api.v1.endpoints import admin as admin_endpoint
from app.main import app
from app.models import Gig, GigApprovalStatus, GigStatus, UserAccount


def test_admin_gig_review_flow():
    engine = create_engine("sqlite:///./test_admin_endpoints.sqlite3")
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)

    def override_get_db():
        with Session(engine) as session:
            yield session

    admin_user = UserAccount(
        user_id=uuid.UUID("00000000-0000-0000-0000-000000000101"),
        email="admin@example.com",
        clerk_id="clerk_admin",
        is_admin=True,
    )
    regular_user = UserAccount(
        user_id=uuid.UUID("00000000-0000-0000-0000-000000000102"),
        email="user@example.com",
        clerk_id="clerk_user",
        is_admin=False,
    )

    with Session(engine) as session:
        session.add_all([admin_user, regular_user])
        session.commit()

    def override_get_or_create_user():
        with Session(engine) as session:
            return session.get(UserAccount, uuid.UUID("00000000-0000-0000-0000-000000000101"))

    app.dependency_overrides[admin_endpoint.get_db] = override_get_db
    app.dependency_overrides[admin_endpoint.get_or_create_user] = override_get_or_create_user

    client = TestClient(app)

    with Session(engine) as session:
        gig = Gig(
            title="Pending gig",
            description="Needs review",
            price=50.0,
            user_id=uuid.UUID("00000000-0000-0000-0000-000000000102"),
            category_name="Test",
            turnaround_time="1-2 days",
            approval_status=GigApprovalStatus.PENDING,
            status=GigStatus.ACTIVE,
        )
        session.add(gig)
        session.commit()
        session.refresh(gig)
        gig_id = gig.gig_id

    pending_response = client.get("/api/v1/admin/gigs/pending")
    assert pending_response.status_code == 200
    assert len(pending_response.json()) == 1
    assert pending_response.json()[0]["id"] == str(gig_id)

    approve_response = client.patch(f"/api/v1/admin/gigs/{gig_id}/approve")
    assert approve_response.status_code == 200
    assert approve_response.json()["approval_status"] == GigApprovalStatus.APPROVED.value
    assert approve_response.json()["reviewed_by_id"] == "00000000-0000-0000-0000-000000000101"

    with Session(engine) as session:
        updated_gig = session.get(Gig, gig_id)
        assert updated_gig is not None
        assert updated_gig.approval_status == GigApprovalStatus.APPROVED

    second_gig = Gig(
        title="Rejected gig",
        description="Needs rejection",
        price=75.0,
        user_id=uuid.UUID("00000000-0000-0000-0000-000000000102"),
        category_name="Test",
        turnaround_time="1-2 days",
        approval_status=GigApprovalStatus.PENDING,
        status=GigStatus.ACTIVE,
    )
    with Session(engine) as session:
        session.add(second_gig)
        session.commit()
        session.refresh(second_gig)
        second_gig_id = second_gig.gig_id

    reject_response = client.patch(
        f"/api/v1/admin/gigs/{second_gig_id}/reject",
        json={"rejection_reason": "Not a good fit"},
    )
    assert reject_response.status_code == 200
    assert reject_response.json()["approval_status"] == GigApprovalStatus.REJECTED.value
    assert reject_response.json()["rejection_reason"] == "Not a good fit"

    app.dependency_overrides.clear()
