import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, or_, select

from app.auth import verify_clerk_token_string
from app.core.database import get_db
from app.core.storage import (
    ALLOWED_IMAGE_CONTENT_TYPES,
    build_chat_object_key,
    generate_presigned_put,
    public_url_for_key,
)
from app.core.ws_manager import manager
from app.models import Conversation, Gig, Message, NotificationType, UserAccount, UserProfile
from app.schemas import (
    AttachmentPresignRequest,
    AttachmentPresignResponse,
    ConversationCreate,
    ConversationRead,
    MessageRead,
    ProviderRead,
)
from app.api.v1.endpoints.users import get_or_create_user, get_or_create_user_from_payload
from app.services.notification_copy import message_copy
from app.services.notification_service import NotificationService

router = APIRouter()


def _normalize_pair(a: uuid.UUID, b: uuid.UUID) -> tuple[uuid.UUID, uuid.UUID]:
    return (a, b) if a < b else (b, a)


def _is_participant(conversation: Conversation, user_id: uuid.UUID) -> bool:
    return user_id in (conversation.user_a_id, conversation.user_b_id)


def _other_user_id(conversation: Conversation, current_user_id: uuid.UUID) -> uuid.UUID:
    return conversation.user_b_id if conversation.user_a_id == current_user_id else conversation.user_a_id


def _load_provider_summary(user_id: uuid.UUID, db: Session) -> Optional[ProviderRead]:
    profile = db.exec(select(UserProfile).where(UserProfile.user_id == user_id)).first()
    if not profile:
        return None
    return ProviderRead(
        user_id=profile.user_id,
        first_name=profile.first_name,
        last_name=profile.last_name,
        username=profile.username,
        avatar_url=profile.avatar_url,
    )


def _to_message_read(message: Message) -> MessageRead:
    return MessageRead(
        id=message.message_id,
        conversation_id=message.conversation_id,
        sender_id=message.sender_id,
        body=message.body,
        attachment_url=message.attachment_url,
        attachment_type=message.attachment_type,
        created_at=message.created_at,
    )


def _to_conversation_read(conversation: Conversation, current_user_id: uuid.UUID, db: Session) -> ConversationRead:
    other_id = _other_user_id(conversation, current_user_id)
    provider = _load_provider_summary(other_id, db)
    if provider is None:
        # Shouldn't happen — a profile is required to create a conversation — but
        # guard against it rather than 500ing on an inbox list.
        provider = ProviderRead(user_id=other_id, first_name="Unknown", last_name="User", username="unknown")

    last_read = (
        conversation.user_a_last_read_at
        if conversation.user_a_id == current_user_id
        else conversation.user_b_last_read_at
    )
    unread_statement = select(Message).where(
        Message.conversation_id == conversation.conversation_id,
        Message.sender_id != current_user_id,
    )
    if last_read is not None:
        unread_statement = unread_statement.where(Message.created_at > last_read)
    unread_count = len(db.exec(unread_statement).all())

    last_message = db.exec(
        select(Message)
        .where(Message.conversation_id == conversation.conversation_id)
        .order_by(Message.created_at.desc())
    ).first()
    preview = None
    if last_message is not None:
        preview = last_message.body or ("Photo" if last_message.attachment_url else None)

    return ConversationRead(
        id=conversation.conversation_id,
        other_participant=provider,
        gig_id=conversation.gig_id,
        last_message_at=conversation.last_message_at,
        last_message_preview=preview,
        unread_count=unread_count,
        created_at=conversation.created_at,
    )


# ---------- REST ----------

@router.get("/conversations", response_model=List[ConversationRead])
def list_conversations(
    current_user: UserAccount = Depends(get_or_create_user),
    db: Session = Depends(get_db),
):
    statement = select(Conversation).where(
        or_(
            Conversation.user_a_id == current_user.user_id,
            Conversation.user_b_id == current_user.user_id,
        )
    )
    conversations = db.exec(statement).all()
    reads = [_to_conversation_read(c, current_user.user_id, db) for c in conversations]
    reads.sort(key=lambda c: c.last_message_at or c.created_at, reverse=True)
    return reads


@router.post("/conversations", response_model=ConversationRead, status_code=status.HTTP_201_CREATED)
def create_conversation(
    payload: ConversationCreate,
    current_user: UserAccount = Depends(get_or_create_user),
    db: Session = Depends(get_db),
):
    if payload.other_user_id == current_user.user_id:
        raise HTTPException(status_code=400, detail="Cannot start a conversation with yourself")

    other_user = db.get(UserAccount, payload.other_user_id)
    if not other_user:
        raise HTTPException(status_code=404, detail="User not found")

    if not _load_provider_summary(other_user.user_id, db):
        raise HTTPException(status_code=400, detail="This user hasn't finished setting up their profile yet")

    if payload.gig_id is not None and not db.get(Gig, payload.gig_id):
        raise HTTPException(status_code=400, detail="Invalid gig_id")

    user_a_id, user_b_id = _normalize_pair(current_user.user_id, other_user.user_id)

    existing = db.exec(
        select(Conversation).where(
            Conversation.user_a_id == user_a_id, Conversation.user_b_id == user_b_id
        )
    ).first()
    if existing:
        if existing.gig_id is None and payload.gig_id is not None:
            existing.gig_id = payload.gig_id
            db.add(existing)
            db.commit()
            db.refresh(existing)
        return _to_conversation_read(existing, current_user.user_id, db)

    conversation = Conversation(user_a_id=user_a_id, user_b_id=user_b_id, gig_id=payload.gig_id)
    db.add(conversation)
    try:
        db.commit()
    except IntegrityError:
        # two near-simultaneous "start conversation" clicks from the same pair
        db.rollback()
        conversation = db.exec(
            select(Conversation).where(
                Conversation.user_a_id == user_a_id, Conversation.user_b_id == user_b_id
            )
        ).first()
        if conversation is None:
            raise
    else:
        db.refresh(conversation)

    return _to_conversation_read(conversation, current_user.user_id, db)


@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageRead])
def list_messages(
    conversation_id: uuid.UUID,
    limit: int = Query(default=50, ge=1, le=100),
    before: Optional[datetime] = None,
    current_user: UserAccount = Depends(get_or_create_user),
    db: Session = Depends(get_db),
):
    conversation = db.get(Conversation, conversation_id)
    if not conversation or not _is_participant(conversation, current_user.user_id):
        raise HTTPException(status_code=404, detail="Conversation not found")

    statement = select(Message).where(Message.conversation_id == conversation_id)
    if before is not None:
        statement = statement.where(Message.created_at < before)
    statement = statement.order_by(Message.created_at.desc()).limit(limit)
    messages = db.exec(statement).all()
    messages.reverse()

    now = datetime.now(timezone.utc)
    if conversation.user_a_id == current_user.user_id:
        conversation.user_a_last_read_at = now
    else:
        conversation.user_b_last_read_at = now
    db.add(conversation)
    db.commit()

    return [_to_message_read(m) for m in messages]


@router.post(
    "/conversations/{conversation_id}/attachments/presign",
    response_model=AttachmentPresignResponse,
)
def presign_attachment(
    conversation_id: uuid.UUID,
    payload: AttachmentPresignRequest,
    current_user: UserAccount = Depends(get_or_create_user),
    db: Session = Depends(get_db),
):
    conversation = db.get(Conversation, conversation_id)
    if not conversation or not _is_participant(conversation, current_user.user_id):
        raise HTTPException(status_code=404, detail="Conversation not found")

    if payload.content_type not in ALLOWED_IMAGE_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Only image attachments are supported")

    object_key = build_chat_object_key(conversation_id, payload.filename)
    try:
        upload_url = generate_presigned_put(object_key, payload.content_type)
        object_url = public_url_for_key(object_key)
    except KeyError:
        raise HTTPException(status_code=503, detail="Image attachments aren't configured yet")

    return AttachmentPresignResponse(upload_url=upload_url, object_url=object_url, object_key=object_key)


# ---------- WebSocket ----------

@router.websocket("/ws/{conversation_id}")
async def conversation_ws(
    websocket: WebSocket,
    conversation_id: uuid.UUID,
    token: str = Query(...),
    db: Session = Depends(get_db),
):
    try:
        payload = verify_clerk_token_string(token)
    except HTTPException:
        await websocket.close(code=1008)
        return

    user = get_or_create_user_from_payload(payload, db)
    conversation = db.get(Conversation, conversation_id)
    if not conversation or not _is_participant(conversation, user.user_id):
        await websocket.close(code=1008)
        return

    await manager.connect(conversation_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            body = data.get("body")
            attachment_url = data.get("attachment_url")
            attachment_type = data.get("attachment_type")

            if not body and not attachment_url:
                await websocket.send_json({"error": "message must have a body or attachment_url"})
                continue

            message = Message(
                conversation_id=conversation_id,
                sender_id=user.user_id,
                body=body,
                attachment_url=attachment_url,
                attachment_type=attachment_type,
            )
            db.add(message)
            conversation.last_message_at = message.created_at
            db.add(conversation)
            db.commit()
            db.refresh(message)

            other_user_id = _other_user_id(conversation, user.user_id)
            sender_provider = _load_provider_summary(user.user_id, db)
            sender_name = (
                sender_provider.username
                if sender_provider and sender_provider.username
                else f"{sender_provider.first_name} {sender_provider.last_name}".strip()
                if sender_provider
                else "Someone"
            )
            preview = message.body or ("Photo" if message.attachment_url else None)
            title, body = message_copy(sender_name, preview)
            NotificationService(db).create(
                recipient_id=other_user_id,
                actor_id=user.user_id,
                type=NotificationType.MESSAGE,
                title=title,
                body=body,
                entity_type="conversation",
                entity_id=str(conversation_id),
                link=f"/messages/{conversation_id}",
            )

            await manager.broadcast(conversation_id, _to_message_read(message).model_dump(mode="json"))
    except WebSocketDisconnect:
        manager.disconnect(conversation_id, websocket)
