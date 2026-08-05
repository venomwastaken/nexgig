import time
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.core.database import get_db
from app.models import EscrowStatus, Gig, GigOrder, OrderStatus, PaymentStatus, PayoutAccount, UserAccount
from app.schemas import (
    BankRead,
    OrderRead,
    PaymentInitializeRead,
    PayoutAccountResolveRead,
    PayoutAccountResolveRequest,
    PayoutAccountRead,
    PayoutAccountUpsert,
)
from app.api.v1.endpoints.users import get_or_create_user
from app.api.v1.endpoints.orders import _to_order_read
from app.services import paystack

router = APIRouter()


def _paystack_error(exc: paystack.PaystackError) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail=exc.message)


@router.get("/banks", response_model=list[BankRead])
def get_banks(user: UserAccount = Depends(get_or_create_user)):
    try:
        return paystack.list_banks()
    except paystack.PaystackError as exc:
        raise _paystack_error(exc)


@router.post("/payout-account/resolve", response_model=PayoutAccountResolveRead)
def resolve_payout_account(
    payload: PayoutAccountResolveRequest,
    user: UserAccount = Depends(get_or_create_user),
):
    try:
        data = paystack.resolve_account(account_number=payload.account_number, bank_code=payload.bank_code)
    except paystack.PaystackError as exc:
        raise _paystack_error(exc)
    return PayoutAccountResolveRead(account_name=data["account_name"])


@router.get("/payout-account", response_model=PayoutAccountRead)
def get_payout_account(
    user: UserAccount = Depends(get_or_create_user),
    db: Session = Depends(get_db),
):
    account = db.exec(select(PayoutAccount).where(PayoutAccount.user_id == user.user_id)).first()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No payout account on file")
    return account


@router.put("/payout-account", response_model=PayoutAccountRead)
def upsert_payout_account(
    payload: PayoutAccountUpsert,
    user: UserAccount = Depends(get_or_create_user),
    db: Session = Depends(get_db),
):
    # Re-resolve server-side rather than trusting a client-supplied name — the
    # request body doesn't even carry one, only what the buyer is meant to see.
    try:
        resolved = paystack.resolve_account(account_number=payload.account_number, bank_code=payload.bank_code)
        account_name = resolved["account_name"]
        recipient_code = paystack.create_transfer_recipient(
            name=account_name,
            account_number=payload.account_number,
            bank_code=payload.bank_code,
        )
    except paystack.PaystackError as exc:
        raise _paystack_error(exc)

    account = db.exec(select(PayoutAccount).where(PayoutAccount.user_id == user.user_id)).first()
    now = datetime.now(timezone.utc)
    if account:
        account.bank_code = payload.bank_code
        account.bank_name = payload.bank_name
        account.account_number = payload.account_number
        account.account_name = account_name
        account.paystack_recipient_code = recipient_code
        account.verified = True
        account.updated_at = now
    else:
        account = PayoutAccount(
            user_id=user.user_id,
            bank_code=payload.bank_code,
            bank_name=payload.bank_name,
            account_number=payload.account_number,
            account_name=account_name,
            paystack_recipient_code=recipient_code,
            verified=True,
        )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@router.post("/orders/{order_id}/initialize", response_model=PaymentInitializeRead)
def initialize_payment(
    order_id: uuid.UUID,
    user: UserAccount = Depends(get_or_create_user),
    db: Session = Depends(get_db),
):
    order = db.get(GigOrder, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.buyer_id != user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the buyer can pay for this order")
    if order.status != OrderStatus.CONFIRMED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This order isn't ready for payment")
    if order.payment_status == PaymentStatus.SUCCESS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This order has already been paid")

    reference = f"nexgig-{order.order_id}-{int(time.time())}"
    try:
        data = paystack.initialize_transaction(
            email=user.email,
            amount_pesewas=int(order.price * 100),
            reference=reference,
        )
    except paystack.PaystackError as exc:
        raise _paystack_error(exc)

    order.payment_status = PaymentStatus.PENDING
    order.payment_reference = reference
    order.updated_at = datetime.now(timezone.utc)
    db.add(order)
    db.commit()

    return PaymentInitializeRead(
        reference=reference,
        access_code=data["access_code"],
        public_key=paystack.PAYSTACK_PUBLIC_KEY or "",
        amount=order.price,
    )


@router.post("/verify/{reference}", response_model=OrderRead)
def verify_payment(
    reference: str,
    user: UserAccount = Depends(get_or_create_user),
    db: Session = Depends(get_db),
):
    order = db.exec(select(GigOrder).where(GigOrder.payment_reference == reference)).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No order matches this payment")
    if order.buyer_id != user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to verify this payment")

    try:
        data = paystack.verify_transaction(reference)
    except paystack.PaystackError as exc:
        raise _paystack_error(exc)

    if data.get("status") != "success" or int(data.get("amount", 0)) != int(order.price * 100):
        order.payment_status = PaymentStatus.FAILED
        db.add(order)
        db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment could not be verified")

    order.payment_status = PaymentStatus.SUCCESS
    order.escrow_status = EscrowStatus.HELD
    if order.status == OrderStatus.CONFIRMED:
        order.status = OrderStatus.IN_PROGRESS
    order.updated_at = datetime.now(timezone.utc)
    db.add(order)
    db.commit()
    db.refresh(order)

    gig = db.get(Gig, order.gig_id)
    return _to_order_read(order, gig.title if gig else "", db)
