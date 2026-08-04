import os
import sys
from pathlib import Path

import pytest
from fastapi import HTTPException
from sqlmodel import Session, SQLModel, create_engine

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

os.environ.setdefault("DATABASE_URL", "sqlite://")

from app.api.v1.endpoints.reviews import (
    create_gig_review,
    delete_gig_review,
    get_gig_review_summary,
    list_gig_reviews,
)
from app.models import Gig, GigApprovalStatus, UserAccount
from app.schemas import GigReviewCreate


@pytest.fixture()
def session():
    engine = create_engine("sqlite://")
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


def _make_user(session, email, clerk_id):
    user = UserAccount(email=email, clerk_id=clerk_id)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def _make_gig(session, owner):
    gig = Gig(
        title="Logo design",
        description="A test gig",
        price=25.0,
        user_id=owner.user_id,
        approval_status=GigApprovalStatus.APPROVED,
        category_name="Design",
        turnaround_time="24 hours",
    )
    session.add(gig)
    session.commit()
    session.refresh(gig)
    return gig


def test_create_review_updates_list_and_summary(session):
    owner = _make_user(session, "owner@example.com", "clerk_owner")
    buyer = _make_user(session, "buyer@example.com", "clerk_buyer")
    gig = _make_gig(session, owner)

    created = create_gig_review(
        gig_id=gig.gig_id,
        payload=GigReviewCreate(rating=5, comment="Great work!"),
        user=buyer,
        db=session,
    )

    assert created.rating == 5
    assert created.comment == "Great work!"
    assert created.reviewer.user_id == buyer.user_id

    reviews = list_gig_reviews(gig_id=gig.gig_id, user=buyer, db=session)
    assert len(reviews) == 1

    summary = get_gig_review_summary(gig_id=gig.gig_id, user=buyer, db=session)
    assert summary.review_count == 1
    assert summary.average_rating == 5.0


def test_cannot_review_own_gig(session):
    owner = _make_user(session, "owner@example.com", "clerk_owner")
    gig = _make_gig(session, owner)

    with pytest.raises(HTTPException) as exc_info:
        create_gig_review(
            gig_id=gig.gig_id,
            payload=GigReviewCreate(rating=4),
            user=owner,
            db=session,
        )
    assert exc_info.value.status_code == 400


def test_cannot_review_the_same_gig_twice(session):
    owner = _make_user(session, "owner@example.com", "clerk_owner")
    buyer = _make_user(session, "buyer@example.com", "clerk_buyer")
    gig = _make_gig(session, owner)

    create_gig_review(gig_id=gig.gig_id, payload=GigReviewCreate(rating=3), user=buyer, db=session)

    with pytest.raises(HTTPException) as exc_info:
        create_gig_review(gig_id=gig.gig_id, payload=GigReviewCreate(rating=4), user=buyer, db=session)
    assert exc_info.value.status_code == 409


def test_review_on_missing_gig_404s(session):
    buyer = _make_user(session, "buyer@example.com", "clerk_buyer")

    with pytest.raises(HTTPException) as exc_info:
        create_gig_review(gig_id=__import__("uuid").uuid4(), payload=GigReviewCreate(rating=5), user=buyer, db=session)
    assert exc_info.value.status_code == 404


def test_delete_review_requires_ownership_or_admin(session):
    owner = _make_user(session, "owner@example.com", "clerk_owner")
    buyer = _make_user(session, "buyer@example.com", "clerk_buyer")
    other = _make_user(session, "other@example.com", "clerk_other")
    gig = _make_gig(session, owner)

    review = create_gig_review(gig_id=gig.gig_id, payload=GigReviewCreate(rating=5), user=buyer, db=session)

    with pytest.raises(HTTPException) as exc_info:
        delete_gig_review(review_id=review.review_id, user=other, db=session)
    assert exc_info.value.status_code == 403

    delete_gig_review(review_id=review.review_id, user=buyer, db=session)
    assert list_gig_reviews(gig_id=gig.gig_id, user=buyer, db=session) == []


def test_admin_can_delete_any_review(session):
    owner = _make_user(session, "owner@example.com", "clerk_owner")
    buyer = _make_user(session, "buyer@example.com", "clerk_buyer")
    admin = _make_user(session, "admin@example.com", "clerk_admin")
    admin.is_admin = True
    session.add(admin)
    session.commit()

    gig = _make_gig(session, owner)
    review = create_gig_review(gig_id=gig.gig_id, payload=GigReviewCreate(rating=2), user=buyer, db=session)

    delete_gig_review(review_id=review.review_id, user=admin, db=session)
    assert list_gig_reviews(gig_id=gig.gig_id, user=buyer, db=session) == []
