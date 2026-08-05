from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlmodel import Session, select

from app.api.v1.endpoints.users import get_or_create_user
from app.core.database import get_db
from app.models import AccountStatus, Gig, GigApprovalStatus, NotificationType, UserAccount
from app.schemas import GigRead
from app.services.notification_service import NotificationService

router = APIRouter()


class RejectGigRequest(BaseModel):
    rejection_reason: str


class UserStatusUpdate(BaseModel):
    status: AccountStatus


class BroadcastNotificationIn(BaseModel):
    title: str
    body: str
    link: Optional[str] = None
    user_ids: Optional[List[UUID]] = None


# --- Security Dependency ---
def require_admin(
    current_user: UserAccount = Depends(get_or_create_user),
) -> UserAccount:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user


# --- Endpoints ---
@router.get("/gigs/pending", response_model=List[GigRead])
def list_pending_gigs(
    session: Session = Depends(get_db),
    admin_user: UserAccount = Depends(require_admin),
):
    statement = select(Gig).where(Gig.approval_status == GigApprovalStatus.PENDING)
    gigs = session.exec(statement).all()
    return gigs


@router.patch("/gigs/{gig_id}/approve", response_model=GigRead)
def approve_gig(
    gig_id: UUID,
    session: Session = Depends(get_db),
    admin_user: UserAccount = Depends(require_admin),
):
    gig = session.get(Gig, gig_id)
    if not gig:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gig not found")

    gig.approval_status = GigApprovalStatus.APPROVED
    gig.reviewed_by_id = admin_user.user_id
    gig.reviewed_at = datetime.now(timezone.utc)

    session.add(gig)
    session.commit()
    session.refresh(gig)
    return gig


@router.patch("/gigs/{gig_id}/reject", response_model=GigRead)
def reject_gig(
    gig_id: UUID,
    payload: RejectGigRequest,
    session: Session = Depends(get_db),
    admin_user: UserAccount = Depends(require_admin),
):
    if not payload.rejection_reason.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Rejection reason is required",
        )

    gig = session.get(Gig, gig_id)
    if not gig:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gig not found")

    gig.approval_status = GigApprovalStatus.REJECTED
    gig.rejection_reason = payload.rejection_reason
    gig.reviewed_by_id = admin_user.user_id
    gig.reviewed_at = datetime.now(timezone.utc)

    session.add(gig)
    session.commit()
    session.refresh(gig)
    return gig


@router.get("/users", response_model=List[UserAccount])
def list_users(
    search: Optional[str] = Query(None),
    status: Optional[AccountStatus] = Query(None),
    skip: int = 0,
    limit: int = 50,
    _admin: UserAccount = Depends(require_admin),
    session: Session = Depends(get_db),
):
    stmt = select(UserAccount)
    if search:
        stmt = stmt.where(UserAccount.email.ilike(f"%{search}%"))
    if status:
        stmt = stmt.where(UserAccount.status == status)
    stmt = stmt.offset(skip).limit(limit)
    return session.exec(stmt).all()


@router.patch("/users/{user_id}/status", response_model=UserAccount)
def update_user_status(
    user_id: str,
    payload: UserStatusUpdate,
    _admin: UserAccount = Depends(require_admin),
    session: Session = Depends(get_db),
):
    user = session.get(UserAccount, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.user_id == _admin.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admins cannot change their own status",
        )
    user.status = payload.status
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.post("/notifications/broadcast")
def broadcast_notification(
    payload: BroadcastNotificationIn,
    _admin: UserAccount = Depends(require_admin),
    session: Session = Depends(get_db),
):
    if payload.user_ids is None:
        recipients = session.exec(select(UserAccount)).all()
        user_ids = [user.user_id for user in recipients]
    else:
        user_ids = payload.user_ids

    service = NotificationService(session)
    for user_id in user_ids:
        service.create(
            recipient_id=user_id,
            type=NotificationType.ADMIN_UPDATE,
            title=payload.title,
            body=payload.body,
            link=payload.link,
        )
    return {"sent": len(user_ids)}