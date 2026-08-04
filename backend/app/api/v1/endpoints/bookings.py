from datetime import datetime, timezone
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import or_
from sqlmodel import Session, select

from app.auth import get_current_user
from app.core.database import get_db
from app.models import Booking, BookingStatus, Gig, GigApprovalStatus, UserAccount, UserProfile, NotificationType
from app.services.notification_copy import booking_created_copy, booking_status_copy
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/bookings", tags=["bookings"])


def _display_name(session: Session, user_id: uuid.UUID, fallback: str) -> str:
    profile = session.exec(select(UserProfile).where(UserProfile.user_id == user_id)).first()
    if profile:
        if profile.username:
            return profile.username
        return f"{profile.first_name} {profile.last_name}".strip()
    return fallback


class BookingCreate(BaseModel):
    listing_id: uuid.UUID
    message: Optional[str] = None


class BookingStatusUpdate(BaseModel):
    status: BookingStatus


@router.post("", response_model=Booking, status_code=status.HTTP_201_CREATED)
def create_booking(
    booking_in: BookingCreate,
    current_user: UserAccount = Depends(get_current_user),
    session: Session = Depends(get_db),
):
    listing = session.exec(select(Gig).where(Gig.gig_id == booking_in.listing_id)).one_or_none()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")

    if listing.approval_status != GigApprovalStatus.APPROVED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Listing is not approved")

    if listing.user_id == current_user.user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot book your own listing")

    booking = Booking(
        listing_id=booking_in.listing_id,
        client_id=current_user.user_id,
        freelancer_id=listing.user_id,
        message=booking_in.message,
        status=BookingStatus.pending,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    session.add(booking)
    session.commit()
    session.refresh(booking)

    notification_service = NotificationService(session)
    actor_name = _display_name(session, current_user.user_id, current_user.email)
    title, body = booking_created_copy(actor_name, listing.title)
    notification_service.create(
        recipient_id=listing.user_id,
        actor_id=current_user.user_id,
        type=NotificationType.BOOKING_CREATED,
        title=title,
        body=body,
        entity_type="booking",
        entity_id=str(booking.booking_id),
        link=f"/bookings/{booking.booking_id}",
    )
    return booking


@router.get("/me", response_model=List[Booking])
def get_my_bookings(
    role: str = Query("all", regex="^(client|freelancer|all)$"),
    current_user: UserAccount = Depends(get_current_user),
    session: Session = Depends(get_db),
):
    stmt = select(Booking)
    if role == "client":
        stmt = stmt.where(Booking.client_id == current_user.user_id)
    elif role == "freelancer":
        stmt = stmt.where(Booking.freelancer_id == current_user.user_id)
    else:
        stmt = stmt.where(
            or_(Booking.client_id == current_user.user_id, Booking.freelancer_id == current_user.user_id)
        )
    return session.exec(stmt).all()


@router.patch("/{booking_id}/status", response_model=Booking)
def update_booking_status(
    booking_id: uuid.UUID,
    status_update: BookingStatusUpdate,
    current_user: UserAccount = Depends(get_current_user),
    session: Session = Depends(get_db),
):
    booking = session.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    requested = status_update.status

    if requested in {BookingStatus.accepted, BookingStatus.declined, BookingStatus.completed}:
        if booking.freelancer_id != current_user.user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only freelancer can update this booking")

    if requested == BookingStatus.cancelled:
        if booking.status == BookingStatus.pending:
            if booking.client_id != current_user.user_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only client can cancel pending bookings")
        elif current_user.user_id not in {booking.client_id, booking.freelancer_id}:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only booking participants can cancel this booking")

    if booking.status in {BookingStatus.declined, BookingStatus.cancelled, BookingStatus.completed}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot update a finalized booking")

    if requested in {BookingStatus.accepted, BookingStatus.declined} and booking.status != BookingStatus.pending:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only pending bookings can be accepted or declined")

    booking.status = requested
    booking.updated_at = datetime.now(timezone.utc)
    session.add(booking)
    session.commit()
    session.refresh(booking)

    listing = session.get(Gig, booking.listing_id)
    actor_name = _display_name(session, current_user.user_id, current_user.email)
    recipient_id = booking.freelancer_id if current_user.user_id == booking.client_id else booking.client_id
    title, body = booking_status_copy(requested, actor_name, listing.title if listing else "your booking")
    NotificationService(session).create(
        recipient_id=recipient_id,
        actor_id=current_user.user_id,
        type={
            BookingStatus.accepted: NotificationType.BOOKING_ACCEPTED,
            BookingStatus.declined: NotificationType.BOOKING_DECLINED,
            BookingStatus.completed: NotificationType.BOOKING_COMPLETED,
            BookingStatus.cancelled: NotificationType.BOOKING_CANCELLED,
        }.get(requested, NotificationType.SYSTEM),
        title=title,
        body=body,
        entity_type="booking",
        entity_id=str(booking.booking_id),
        link=f"/bookings/{booking.booking_id}",
    )
    return booking