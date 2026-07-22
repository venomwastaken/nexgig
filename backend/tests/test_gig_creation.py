import os

import pytest
from sqlmodel import Session, SQLModel, create_engine

os.environ.setdefault("DATABASE_URL", "sqlite://")

from app.api.v1.endpoints.gigs import create_gig
from app.models import Gig, GigTagLink, Tag, UserAccount
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
