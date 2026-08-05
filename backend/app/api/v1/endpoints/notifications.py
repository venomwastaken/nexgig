import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from pydantic import BaseModel
from sqlmodel import Session

from app.api.v1.endpoints.users import get_or_create_user, get_or_create_user_from_payload
from app.auth import verify_clerk_token_string
from app.core.database import get_db
from app.models import Notification, UserAccount
from app.services.notification_service import NotificationService
from app.services.realtime import realtime_manager

router = APIRouter(tags=["notifications"])


class NotificationUnreadCountRead(BaseModel):
    count: int


class NotificationReadAllResponse(BaseModel):
    marked_read: int


class NotificationBroadcastRead(BaseModel):
    title: str
    body: str
    link: Optional[str] = None
    user_ids: Optional[List[uuid.UUID]] = None


@router.get("/notifications", response_model=List[Notification])
def list_notifications(
    unread_only: bool = Query(default=False),
    limit: int = Query(default=30, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: UserAccount = Depends(get_or_create_user),
    session: Session = Depends(get_db),
):
    service = NotificationService(session)
    return service.list_for_user(current_user.user_id, unread_only=unread_only, limit=limit, offset=offset)


@router.get("/notifications/unread-count", response_model=NotificationUnreadCountRead)
def unread_count(
    current_user: UserAccount = Depends(get_or_create_user),
    session: Session = Depends(get_db),
):
    service = NotificationService(session)
    return NotificationUnreadCountRead(count=service.unread_count(current_user.user_id))


@router.post("/notifications/{notification_id}/read", response_model=Notification)
def mark_notification_read(
    notification_id: uuid.UUID,
    current_user: UserAccount = Depends(get_or_create_user),
    session: Session = Depends(get_db),
):
    service = NotificationService(session)
    notif = service.mark_read(current_user.user_id, notification_id)
    if notif is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return notif


@router.post("/notifications/read-all", response_model=NotificationReadAllResponse)
def mark_all_notifications_read(
    current_user: UserAccount = Depends(get_or_create_user),
    session: Session = Depends(get_db),
):
    service = NotificationService(session)
    return NotificationReadAllResponse(marked_read=service.mark_all_read(current_user.user_id))


@router.websocket("/ws/notifications")
async def notifications_ws(websocket: WebSocket, token: str = Query(...), db: Session = Depends(get_db)):
    try:
        payload = verify_clerk_token_string(token)
    except HTTPException:
        await websocket.close(code=1008)
        return

    user = get_or_create_user_from_payload(payload, db)
    await realtime_manager.connect(str(user.user_id), websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        realtime_manager.disconnect(str(user.user_id), websocket)
