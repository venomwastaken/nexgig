import os
import sys
from pathlib import Path

import pytest
from sqlmodel import Session, SQLModel, create_engine

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

os.environ.setdefault("DATABASE_URL", "sqlite://")

from app.api.v1.endpoints.gigs import create_gig, list_gigs
from app.models import Gig, GigApprovalStatus, GigTagLink, Tag, UserAccount
from app.schemas import GigCreate


@pytest.fixture()
def session():
    engine = create_engine("sqlite://")
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


def test_create_gig_creates_links_with_sqlmodel_primary_keys(session):
    user = UserAccount(email="test@example.com", clerk_id="clerk_test")
    session.add(user)
    session.commit()
    session.refresh(user)

    payload = GigCreate(
        title="Test gig",
        description="A test gig for regression coverage",
        price=25.0,
        tags=["helper"],
    )

    created = create_gig(payload=payload, user=user, db=session)

    assert created.gig_id is not None
    assert session.get(Gig, created.gig_id) is not None
    assert session.query(Tag).filter(Tag.name == "helper").count() == 1
    assert session.query(GigTagLink).filter(GigTagLink.gig_id == created.gig_id).count() == 1


def test_list_gigs_filters_visibility_for_non_admins(session):
    owner = UserAccount(email="owner@example.com", clerk_id="clerk_owner")
    viewer = UserAccount(email="viewer@example.com", clerk_id="clerk_viewer")
    session.add_all([owner, viewer])
    session.commit()
    session.refresh(owner)
    session.refresh(viewer)

    approved_gig = Gig(
        title="Approved gig",
        description="Visible to everyone",
        price=40.0,
        user_id=owner.user_id,
        approval_status=GigApprovalStatus.APPROVED,
    )
    pending_gig = Gig(
        title="Pending gig",
        description="Visible only to owner",
        price=50.0,
        user_id=owner.user_id,
        approval_status=GigApprovalStatus.PENDING,
    )
    session.add_all([approved_gig, pending_gig])
    session.commit()

    visible = list_gigs(user=viewer, db=session)

    assert len(visible) == 1
    assert visible[0].gig_id == approved_gig.gig_id
