import os
import sys
import uuid
from pathlib import Path

import pytest
from fastapi import HTTPException
from sqlmodel import Session, SQLModel, create_engine

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

os.environ.setdefault("DATABASE_URL", "sqlite://")

from app.api.v1.endpoints.comments import (
    create_gig_comment,
    delete_gig_comment,
    list_gig_comments,
    update_gig_comment,
)
from app.models import Gig, GigApprovalStatus, UserAccount
from app.schemas import GigCommentCreate, GigCommentUpdate


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


def test_create_and_list_comments_with_a_reply(session):
    owner = _make_user(session, "owner@example.com", "clerk_owner")
    commenter = _make_user(session, "commenter@example.com", "clerk_commenter")
    gig = _make_gig(session, owner)

    top_level = create_gig_comment(
        gig_id=gig.gig_id,
        payload=GigCommentCreate(body="Does this include revisions?"),
        user=commenter,
        db=session,
    )
    reply = create_gig_comment(
        gig_id=gig.gig_id,
        payload=GigCommentCreate(body="Yes, two rounds included.", parent_comment_id=top_level.id),
        user=owner,
        db=session,
    )

    comments = list_gig_comments(gig_id=gig.gig_id, user=commenter, db=session)
    assert len(comments) == 2
    assert reply.parent_comment_id == top_level.id
    assert reply.author.user_id == owner.user_id


def test_invalid_parent_comment_is_rejected(session):
    owner = _make_user(session, "owner@example.com", "clerk_owner")
    gig = _make_gig(session, owner)

    with pytest.raises(HTTPException) as exc_info:
        create_gig_comment(
            gig_id=gig.gig_id,
            payload=GigCommentCreate(body="orphan reply", parent_comment_id=uuid.uuid4()),
            user=owner,
            db=session,
        )
    assert exc_info.value.status_code == 400


def test_update_and_delete_require_ownership(session):
    owner = _make_user(session, "owner@example.com", "clerk_owner")
    commenter = _make_user(session, "commenter@example.com", "clerk_commenter")
    other = _make_user(session, "other@example.com", "clerk_other")
    gig = _make_gig(session, owner)

    comment = create_gig_comment(
        gig_id=gig.gig_id, payload=GigCommentCreate(body="hi"), user=commenter, db=session
    )

    with pytest.raises(HTTPException) as exc_info:
        update_gig_comment(comment_id=comment.id, payload=GigCommentUpdate(body="edited"), user=other, db=session)
    assert exc_info.value.status_code == 403

    updated = update_gig_comment(
        comment_id=comment.id, payload=GigCommentUpdate(body="edited"), user=commenter, db=session
    )
    assert updated.body == "edited"
    assert updated.is_edited is True

    with pytest.raises(HTTPException) as exc_info:
        delete_gig_comment(comment_id=comment.id, user=other, db=session)
    assert exc_info.value.status_code == 403

    delete_gig_comment(comment_id=comment.id, user=commenter, db=session)
    assert list_gig_comments(gig_id=gig.gig_id, user=commenter, db=session) == []


def test_deleting_a_parent_orphans_its_replies_instead_of_erroring(session):
    owner = _make_user(session, "owner@example.com", "clerk_owner")
    commenter = _make_user(session, "commenter@example.com", "clerk_commenter")
    gig = _make_gig(session, owner)

    parent = create_gig_comment(
        gig_id=gig.gig_id, payload=GigCommentCreate(body="parent"), user=commenter, db=session
    )
    create_gig_comment(
        gig_id=gig.gig_id,
        payload=GigCommentCreate(body="child", parent_comment_id=parent.id),
        user=owner,
        db=session,
    )

    delete_gig_comment(comment_id=parent.id, user=commenter, db=session)

    remaining = list_gig_comments(gig_id=gig.gig_id, user=commenter, db=session)
    assert len(remaining) == 1
    assert remaining[0].parent_comment_id is None
