from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
import uuid
from sqlalchemy import or_
from sqlmodel import Session, select

from app.auth import get_current_user
from app.database import get_session
from app.models import Booking, BookingStatus, Gig, GigApprovalStatus, UserAccount

router = APIRouter()

class BookingCreate(SQLModel):
    listing_id: uuid.UUID
    message: Optional[str] = None

class BookingStatusUpdate(SQLModel):
    status: BookingStatus

@router.post("", response_model=Booking, status_code=status.HTTP_201_CREATED)
def create_booking(
    booking_in: BookingCreate,
    current_user: UserAccount = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    # ...your create logic...
    ...

@router.get("/me", response_model=List[Booking])
def get_my_bookings(
    role: str = Query("all", regex="^(client|freelancer|all)$"),
    current_user: UserAccount = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    # ...your query logic...
    ...

@router.patch("/{booking_id}/status", response_model=Booking)
def update_booking_status(
    booking_id: uuid.UUID,
    status_update: BookingStatusUpdate,
    current_user: UserAccount = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    # ...your update logic...
    ...