import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest
from fastapi import HTTPException
from sqlmodel import Session, SQLModel, create_engine

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("R2_ACCOUNT_ID", "test-account")
os.environ.setdefault("R2_ACCESS_KEY_ID", "test-key")
os.environ.setdefault("R2_SECRET_ACCESS_KEY", "test-secret")
os.environ.setdefault("R2_BUCKET", "test-bucket")
os.environ.setdefault("R2_PUBLIC_BASE_URL", "https://example.test")

from app.api.v1.endpoints.messaging import (
    create_conversation,
    list_messages,
    presign_attachment,
)
from app.models import Conversation, Message, UserAccount, UserProfile
from app.schemas import AttachmentPresignRequest, ConversationCreate


@pytest.fixture()
def session():
    engine = create_engine("sqlite://")
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


def _make_user_with_profile(session: Session, email: str, username: str) -> UserAccount:
    user = UserAccount(email=email, clerk_id=f"clerk_{username}")
    session.add(user)
    session.commit()
    session.refresh(user)

    profile = UserProfile(
        user_id=user.user_id, first_name="Test", last_name="User", username=username
    )
    session.add(profile)
    session.commit()

    return user


def test_get_or_create_conversation_is_idempotent_and_order_independent(session):
    alice = _make_user_with_profile(session, "alice@example.com", "alice")
    bob = _make_user_with_profile(session, "bob@example.com", "bob")

    first = create_conversation(
        payload=ConversationCreate(other_user_id=bob.user_id), current_user=alice, db=session
    )
    second = create_conversation(
        payload=ConversationCreate(other_user_id=alice.user_id), current_user=bob, db=session
    )

    assert first.id == second.id
    assert session.query(Conversation).count() == 1


def test_conversation_participant_ordering_is_normalized(session):
    alice = _make_user_with_profile(session, "alice@example.com", "alice")
    bob = _make_user_with_profile(session, "bob@example.com", "bob")

    create_conversation(
        payload=ConversationCreate(other_user_id=bob.user_id), current_user=alice, db=session
    )

    conversation = session.query(Conversation).one()
    assert conversation.user_a_id < conversation.user_b_id
    assert {conversation.user_a_id, conversation.user_b_id} == {alice.user_id, bob.user_id}


def test_list_messages_returns_chronological_order_and_marks_read(session):
    alice = _make_user_with_profile(session, "alice@example.com", "alice")
    bob = _make_user_with_profile(session, "bob@example.com", "bob")

    conversation = create_conversation(
        payload=ConversationCreate(other_user_id=bob.user_id), current_user=alice, db=session
    )
    conv_row = session.get(Conversation, conversation.id)

    base = datetime.now(timezone.utc)
    for i, text in enumerate(["hi", "how are you", "good, you?"]):
        session.add(
            Message(
                conversation_id=conv_row.conversation_id,
                sender_id=alice.user_id,
                body=text,
                # Explicit, strictly increasing timestamps — messages created in a
                # tight loop can otherwise share the same datetime.now() value and
                # make the ORDER BY created_at tie-break nondeterministic.
                created_at=base + timedelta(seconds=i),
            )
        )
    session.commit()

    results = list_messages(
        conversation_id=conv_row.conversation_id, limit=50, current_user=bob, db=session
    )

    assert [m.body for m in results] == ["hi", "how are you", "good, you?"]

    session.refresh(conv_row)
    # Participant normalization sorts by raw UUID value (random per run), so bob
    # may land in either slot — check whichever field actually corresponds to him.
    bobs_last_read_at = (
        conv_row.user_a_last_read_at
        if conv_row.user_a_id == bob.user_id
        else conv_row.user_b_last_read_at
    )
    assert bobs_last_read_at is not None


def test_list_messages_rejects_non_participant(session):
    alice = _make_user_with_profile(session, "alice@example.com", "alice")
    bob = _make_user_with_profile(session, "bob@example.com", "bob")
    eve = _make_user_with_profile(session, "eve@example.com", "eve")

    conversation = create_conversation(
        payload=ConversationCreate(other_user_id=bob.user_id), current_user=alice, db=session
    )

    with pytest.raises(HTTPException) as exc_info:
        list_messages(conversation_id=conversation.id, current_user=eve, db=session)

    assert exc_info.value.status_code == 404


def test_presign_attachment_rejects_disallowed_content_type(session):
    alice = _make_user_with_profile(session, "alice@example.com", "alice")
    bob = _make_user_with_profile(session, "bob@example.com", "bob")

    conversation = create_conversation(
        payload=ConversationCreate(other_user_id=bob.user_id), current_user=alice, db=session
    )

    with pytest.raises(HTTPException) as exc_info:
        presign_attachment(
            conversation_id=conversation.id,
            payload=AttachmentPresignRequest(filename="doc.pdf", content_type="application/pdf"),
            current_user=alice,
            db=session,
        )

    assert exc_info.value.status_code == 400
