from datetime import datetime, timezone
from typing import Optional, Sequence
from uuid import UUID

from sqlmodel import Session, func, select

from app.models import Notification, NotificationType
from app.services.realtime import realtime_manager


class NotificationService:
    def __init__(self, session: Session):
        self.session = session

    def create(
        self,
        *,
        recipient_id: UUID,
        type: NotificationType,
        title: str,
        body: str,
        actor_id: Optional[UUID] = None,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        link: Optional[str] = None,
    ) -> Notification:
        notif = Notification(
            recipient_id=recipient_id,
            actor_id=actor_id,
            type=type,
            title=title,
            body=body,
            entity_type=entity_type,
            entity_id=entity_id,
            link=link,
        )
        self.session.add(notif)
        self.session.commit()
        self.session.refresh(notif)

        try:
            realtime_manager.push_to_user(str(recipient_id), notif)
        except Exception:
            pass

        return notif

    def list_for_user(
        self,
        user_id: UUID,
        *,
        unread_only: bool = False,
        limit: int = 30,
        offset: int = 0,
    ) -> Sequence[Notification]:
        stmt = select(Notification).where(Notification.recipient_id == user_id)
        if unread_only:
            stmt = stmt.where(Notification.is_read == False)  # noqa: E712
        stmt = stmt.order_by(Notification.created_at.desc()).offset(offset).limit(limit)
        return self.session.exec(stmt).all()

    def unread_count(self, user_id: UUID) -> int:
        stmt = select(func.count()).select_from(Notification).where(
            Notification.recipient_id == user_id,
            Notification.is_read == False,  # noqa: E712
        )
        return int(self.session.exec(stmt).one())

    def mark_read(self, user_id: UUID, notification_id: UUID) -> Optional[Notification]:
        notif = self.session.get(Notification, notification_id)
        if not notif or notif.recipient_id != user_id:
            return None
        if not notif.is_read:
            notif.is_read = True
            notif.read_at = datetime.now(timezone.utc)
            self.session.add(notif)
            self.session.commit()
            self.session.refresh(notif)
        return notif

    def mark_all_read(self, user_id: UUID) -> int:
        unread = self.list_for_user(user_id, unread_only=True, limit=1000)
        now = datetime.now(timezone.utc)
        for notif in unread:
            notif.is_read = True
            notif.read_at = now
            self.session.add(notif)
        self.session.commit()
        return len(unread)
