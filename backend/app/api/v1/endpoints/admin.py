from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.database import get_db
from app.models import Gig, GigApprovalStatus, UserAccount
# Adjust the import below to match your actual authentication dependency
from app.api.v1.endpoints.users import get_or_create_user
from app.schemas import GigRead

router = APIRouter()


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


# --- Request Schemas ---
class RejectGigRequest(BaseModel):
    rejection_reason: str


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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Gig not found"
        )

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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Gig not found"
        )

    gig.approval_status = GigApprovalStatus.REJECTED
    gig.rejection_reason = payload.rejection_reason
    gig.reviewed_by_id = admin_user.user_id
    gig.reviewed_at = datetime.now(timezone.utc)

    session.add(gig)
    session.commit()
    session.refresh(gig)
    return gig