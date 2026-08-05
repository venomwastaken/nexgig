import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.models import EscrowStatus, Gig, GigOrder, GigStatus, OrderStatus, PayoutAccount, UserAccount, UserProfile
from app.core.database import get_db
from app.schemas import OrderCreate, OrderRead, OrderStatusUpdate, ProviderRead
from app.api.v1.endpoints.users import get_or_create_user
from app.services import paystack

router = APIRouter()

# Forward-only lifecycle a provider can push a request through.
_NEXT_STATUS = {
    OrderStatus.REQUESTED: OrderStatus.CONFIRMED,
    OrderStatus.CONFIRMED: OrderStatus.IN_PROGRESS,
    OrderStatus.IN_PROGRESS: OrderStatus.COMPLETED,
}


def _load_user_summary(user_id: uuid.UUID, db: Session) -> ProviderRead:
    profile = db.exec(select(UserProfile).where(UserProfile.user_id == user_id)).first()
    if not profile:
        return ProviderRead(user_id=user_id, first_name="Unknown", last_name="User", username="unknown")
    return ProviderRead(
        user_id=profile.user_id,
        first_name=profile.first_name,
        last_name=profile.last_name,
        username=profile.username,
        avatar_url=profile.avatar_url,
    )


def _to_order_read(order: GigOrder, gig_title: str, db: Session) -> OrderRead:
    return OrderRead(
        id=order.order_id,
        gig_id=order.gig_id,
        gig_title=gig_title,
        buyer=_load_user_summary(order.buyer_id, db),
        provider_id=order.provider_id,
        provider=_load_user_summary(order.provider_id, db),
        price=order.price,
        note=order.note,
        status=order.status,
        payment_status=order.payment_status,
        escrow_status=order.escrow_status,
        buyer_confirmed_at=order.buyer_confirmed_at,
        provider_confirmed_at=order.provider_confirmed_at,
        created_at=order.created_at,
        updated_at=order.updated_at,
    )


@router.post("/", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: OrderCreate,
    user: UserAccount = Depends(get_or_create_user),
    db: Session = Depends(get_db),
):
    gig = db.get(Gig, payload.gig_id)
    if not gig:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gig not found")

    if gig.user_id == user.user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You can't book your own gig")

    if gig.status != GigStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="This gig isn't accepting requests right now"
        )

    order = GigOrder(
        gig_id=gig.gig_id,
        buyer_id=user.user_id,
        provider_id=gig.user_id,
        price=gig.price,
        note=payload.note,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return _to_order_read(order, gig.title, db)


@router.get("/incoming", response_model=List[OrderRead])
def list_incoming_orders(
    user: UserAccount = Depends(get_or_create_user),
    db: Session = Depends(get_db),
):
    """Requests other people have placed against gigs the current user posted."""
    rows = db.exec(
        select(GigOrder, Gig.title)
        .join(Gig, Gig.gig_id == GigOrder.gig_id)
        .where(GigOrder.provider_id == user.user_id)
        .order_by(GigOrder.created_at.desc())
    ).all()
    return [_to_order_read(order, title, db) for order, title in rows]


@router.get("/mine", response_model=List[OrderRead])
def list_my_orders(
    user: UserAccount = Depends(get_or_create_user),
    db: Session = Depends(get_db),
):
    """Requests the current user has placed as a buyer."""
    rows = db.exec(
        select(GigOrder, Gig.title)
        .join(Gig, Gig.gig_id == GigOrder.gig_id)
        .where(GigOrder.buyer_id == user.user_id)
        .order_by(GigOrder.created_at.desc())
    ).all()
    return [_to_order_read(order, title, db) for order, title in rows]


@router.patch("/{order_id}/status", response_model=OrderRead)
def update_order_status(
    order_id: uuid.UUID,
    payload: OrderStatusUpdate,
    user: UserAccount = Depends(get_or_create_user),
    db: Session = Depends(get_db),
):
    order = db.get(GigOrder, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")

    is_provider = order.provider_id == user.user_id
    is_buyer = order.buyer_id == user.user_id
    if not (is_provider or is_buyer):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to modify this request")

    if payload.status == OrderStatus.CANCELLED:
        if order.status not in (OrderStatus.REQUESTED, OrderStatus.CONFIRMED):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="This request can no longer be cancelled"
            )
    else:
        if not is_provider:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Only the provider can advance this request"
            )
        if _NEXT_STATUS.get(order.status) != payload.status:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status transition")

    order.status = payload.status
    order.updated_at = datetime.now(timezone.utc)
    db.add(order)
    db.commit()
    db.refresh(order)

    gig = db.get(Gig, order.gig_id)
    return _to_order_read(order, gig.title if gig else "", db)


@router.post("/{order_id}/confirm-complete", response_model=OrderRead)
def confirm_complete(
    order_id: uuid.UUID,
    user: UserAccount = Depends(get_or_create_user),
    db: Session = Depends(get_db),
):
    order = db.get(GigOrder, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")

    is_provider = order.provider_id == user.user_id
    is_buyer = order.buyer_id == user.user_id
    if not (is_provider or is_buyer):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to modify this request")

    if order.status != OrderStatus.IN_PROGRESS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This request isn't in progress yet — payment must clear first",
        )

    now = datetime.now(timezone.utc)
    if is_buyer and not order.buyer_confirmed_at:
        order.buyer_confirmed_at = now
    if is_provider and not order.provider_confirmed_at:
        order.provider_confirmed_at = now

    if order.buyer_confirmed_at and order.provider_confirmed_at:
        order.status = OrderStatus.COMPLETED
        order.updated_at = now
        db.add(order)
        db.commit()
        db.refresh(order)
        _release_escrow(order, db)
    else:
        order.updated_at = now
        db.add(order)
        db.commit()
        db.refresh(order)

    gig = db.get(Gig, order.gig_id)
    return _to_order_read(order, gig.title if gig else "", db)


def _release_escrow(order: GigOrder, db: Session) -> None:
    """Best-effort: transfer the held amount to the provider's payout account.
    If they haven't set one up (or Paystack rejects the transfer), the order still
    completes — escrow just stays 'held' until the provider adds payout details."""
    if order.escrow_status != EscrowStatus.HELD:
        return

    payout_account = db.exec(
        select(PayoutAccount).where(PayoutAccount.user_id == order.provider_id)
    ).first()
    if not payout_account or not payout_account.paystack_recipient_code:
        return

    try:
        paystack.initiate_transfer(
            amount_pesewas=int(order.price * 100),
            recipient_code=payout_account.paystack_recipient_code,
            reason=f"NexGiG order {order.order_id} payout",
            reference=f"nexgig-payout-{order.order_id}",
        )
    except paystack.PaystackError:
        return

    order.escrow_status = EscrowStatus.RELEASED
    db.add(order)
    db.commit()
    db.refresh(order)
