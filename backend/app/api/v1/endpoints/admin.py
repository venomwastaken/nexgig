from datetime import datetime, timedelta, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlmodel import Session, func, or_, select

from app.core.database import get_db
from app.clerk_admin import trigger_password_reset
from app.models import (
    AccountStatus,
    Gig,
    GigApprovalStatus,
    GigOrder,
    NotificationType,
    OrderStatus,
    StudentVerification,
    UserAccount,
    UserProfile,
    UserReview,
    UserRole,
    VerificationStatus,
)
from app.moderation import effective_status, heal_expired_suspension
# Adjust the import below to match your actual authentication dependency
from app.api.v1.endpoints.users import get_or_create_user
from app.schemas import (
    AdminBanRequest,
    AdminBulkUserActionRequest,
    AdminBulkUserActionResponse,
    AdminProfileRead,
    AdminRoleUpdate,
    AdminSuspendRequest,
    AdminUserListResponse,
    AdminUserRead,
    AdminUserStats,
    AdminUserSuspension,
    AdminUserUpdate,
    GigRead,
)
from app.services.notification_service import NotificationService

router = APIRouter()


class RejectGigRequest(BaseModel):
    rejection_reason: str


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


# --- Gig moderation endpoints ---
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


# ---------- User management ----------
# Matches frontend/src/pages/components/dashboard/users/api.ts.

_SORT_COLUMNS = {
    "created_at": UserAccount.created_at,
    "last_login": UserAccount.last_login,
    "username": UserProfile.username,
    "email": UserAccount.email,
}


def _compute_stats(session: Session, user_id: UUID) -> AdminUserStats:
    gigs_posted = session.exec(
        select(func.count(Gig.gig_id)).where(Gig.user_id == user_id)
    ).one()

    orders_completed = session.exec(
        select(func.count(GigOrder.order_id)).where(
            GigOrder.status == OrderStatus.COMPLETED,
            or_(GigOrder.buyer_id == user_id, GigOrder.provider_id == user_id),
        )
    ).one()

    reviews_received = session.exec(
        select(func.count(UserReview.review_id)).where(UserReview.reviewee_id == user_id)
    ).one()

    average_rating = session.exec(
        select(func.avg(UserReview.rating)).where(UserReview.reviewee_id == user_id)
    ).one()

    return AdminUserStats(
        gigs_posted=gigs_posted,
        orders_completed=orders_completed,
        reviews_received=reviews_received,
        average_rating=float(average_rating) if average_rating is not None else None,
    )


def _is_verified(session: Session, user: UserAccount) -> bool:
    verification = session.exec(
        select(StudentVerification).where(StudentVerification.user_id == user.clerk_id)
    ).first()
    return verification is not None and verification.status == VerificationStatus.verified


def _to_admin_user_read(
    session: Session, user: UserAccount, profile: Optional[UserProfile]
) -> AdminUserRead:
    suspension = None
    if user.account_status == AccountStatus.SUSPENDED and not user.is_banned:
        suspension = AdminUserSuspension(reason=user.suspension_reason, expires_at=user.suspended_until)

    return AdminUserRead(
        user_id=user.user_id,
        email=user.email,
        account_status=effective_status(user),
        role=user.role,
        is_admin=user.is_admin,
        verified=_is_verified(session, user),
        created_at=user.created_at,
        last_login=user.last_login,
        profile=(
            AdminProfileRead(
                username=profile.username,
                first_name=profile.first_name,
                last_name=profile.last_name,
                avatar_url=profile.avatar_url,
            )
            if profile
            else None
        ),
        suspension=suspension,
        ban_reason=user.ban_reason,
        stats=_compute_stats(session, user.user_id),
    )


def _filtered_users_query(base_query, q: Optional[str], role: Optional[UserRole], status_filter: Optional[str]):
    if q:
        pattern = f"%{q}%"
        base_query = base_query.where(
            or_(
                UserAccount.email.ilike(pattern),
                UserProfile.username.ilike(pattern),
                UserProfile.first_name.ilike(pattern),
                UserProfile.last_name.ilike(pattern),
            )
        )

    if role is not None:
        base_query = base_query.where(UserAccount.role == role)

    if status_filter and status_filter != "all":
        if status_filter == "banned":
            base_query = base_query.where(UserAccount.is_banned == True)  # noqa: E712
        else:
            try:
                status_enum = AccountStatus(status_filter)
            except ValueError:
                raise HTTPException(status_code=422, detail=f"Invalid status filter '{status_filter}'")
            base_query = base_query.where(
                UserAccount.is_banned == False,  # noqa: E712
                UserAccount.account_status == status_enum,
            )

    return base_query


def _get_target_user(session: Session, user_id: UUID) -> UserAccount:
    user = session.get(UserAccount, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


def _get_profile(session: Session, user_id: UUID) -> Optional[UserProfile]:
    return session.exec(select(UserProfile).where(UserProfile.user_id == user_id)).first()


def _guard_not_self(admin_user: UserAccount, target: UserAccount, action: str) -> None:
    if admin_user.user_id == target.user_id:
        raise HTTPException(status_code=400, detail=f"You can't {action} your own account.")


@router.get("/users", response_model=AdminUserListResponse)
def list_users(
    q: Optional[str] = Query(default=None),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    role: Optional[UserRole] = Query(default=None),
    sort: str = Query(default="created_at"),
    order: str = Query(default="desc"),
    limit: int = Query(default=25, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    session: Session = Depends(get_db),
    admin_user: UserAccount = Depends(require_admin),
):
    count_query = _filtered_users_query(
        select(func.count(UserAccount.user_id))
        .select_from(UserAccount)
        .outerjoin(UserProfile, UserProfile.user_id == UserAccount.user_id),
        q,
        role,
        status_filter,
    )
    total = session.exec(count_query).one()

    sort_column = _SORT_COLUMNS.get(sort, UserAccount.created_at)
    list_query = _filtered_users_query(
        select(UserAccount, UserProfile).outerjoin(UserProfile, UserProfile.user_id == UserAccount.user_id),
        q,
        role,
        status_filter,
    )
    list_query = list_query.order_by(sort_column.asc() if order == "asc" else sort_column.desc())
    list_query = list_query.offset(offset).limit(limit)

    rows = session.exec(list_query).all()

    healed = False
    items = []
    for user, profile in rows:
        healed = heal_expired_suspension(user) or healed
        items.append(_to_admin_user_read(session, user, profile))

    if healed:
        session.commit()

    return AdminUserListResponse(items=items, total=total)


@router.get("/users/{user_id}", response_model=AdminUserRead)
def get_user(
    user_id: UUID,
    session: Session = Depends(get_db),
    admin_user: UserAccount = Depends(require_admin),
):
    user = _get_target_user(session, user_id)
    profile = _get_profile(session, user_id)

    if heal_expired_suspension(user):
        session.add(user)
        session.commit()
        session.refresh(user)

    return _to_admin_user_read(session, user, profile)


@router.patch("/users/{user_id}", response_model=AdminUserRead)
def update_user(
    user_id: UUID,
    payload: AdminUserUpdate,
    session: Session = Depends(get_db),
    admin_user: UserAccount = Depends(require_admin),
):
    user = _get_target_user(session, user_id)
    profile = _get_profile(session, user_id)

    if payload.email is not None and payload.email != user.email:
        email_taken = session.exec(
            select(UserAccount).where(UserAccount.email == payload.email, UserAccount.user_id != user_id)
        ).first()
        if email_taken:
            raise HTTPException(status_code=409, detail="Email already in use")
        user.email = payload.email
        session.add(user)

    profile_updates = {
        field: value
        for field, value in {
            "username": payload.username,
            "first_name": payload.first_name,
            "last_name": payload.last_name,
        }.items()
        if value is not None
    }

    if profile_updates:
        if payload.username is not None and (not profile or payload.username != profile.username):
            username_taken = session.exec(
                select(UserProfile).where(
                    UserProfile.username == payload.username, UserProfile.user_id != user_id
                )
            ).first()
            if username_taken:
                raise HTTPException(status_code=409, detail="Username already taken")

        if profile is None:
            profile = UserProfile(
                user_id=user_id,
                first_name=profile_updates.get("first_name", ""),
                last_name=profile_updates.get("last_name", ""),
                username=profile_updates.get("username") or f"user-{str(user_id)[:8]}",
            )
        else:
            for field, value in profile_updates.items():
                setattr(profile, field, value)
            profile.updated_at = datetime.now(timezone.utc)
        session.add(profile)

    session.commit()
    session.refresh(user)
    if profile:
        session.refresh(profile)

    return _to_admin_user_read(session, user, profile)


@router.patch("/users/{user_id}/role", response_model=AdminUserRead)
def update_user_role(
    user_id: UUID,
    payload: AdminRoleUpdate,
    session: Session = Depends(get_db),
    admin_user: UserAccount = Depends(require_admin),
):
    user = _get_target_user(session, user_id)
    if user.user_id == admin_user.user_id and payload.role != UserRole.ADMIN:
        raise HTTPException(status_code=400, detail="You can't change your own role away from admin.")

    user.role = payload.role
    user.is_admin = payload.role == UserRole.ADMIN
    session.add(user)
    session.commit()
    session.refresh(user)

    return _to_admin_user_read(session, user, _get_profile(session, user_id))


@router.post("/users/{user_id}/ban", response_model=AdminUserRead)
def ban_user(
    user_id: UUID,
    payload: AdminBanRequest,
    session: Session = Depends(get_db),
    admin_user: UserAccount = Depends(require_admin),
):
    user = _get_target_user(session, user_id)
    _guard_not_self(admin_user, user, "ban")

    user.is_banned = True
    user.ban_reason = payload.reason
    user.banned_at = datetime.now(timezone.utc)
    session.add(user)
    session.commit()
    session.refresh(user)

    return _to_admin_user_read(session, user, _get_profile(session, user_id))


@router.post("/users/{user_id}/unban", response_model=AdminUserRead)
def unban_user(
    user_id: UUID,
    session: Session = Depends(get_db),
    admin_user: UserAccount = Depends(require_admin),
):
    user = _get_target_user(session, user_id)

    user.is_banned = False
    user.ban_reason = None
    user.banned_at = None
    session.add(user)
    session.commit()
    session.refresh(user)

    return _to_admin_user_read(session, user, _get_profile(session, user_id))


@router.post("/users/{user_id}/suspend", response_model=AdminUserRead)
def suspend_user(
    user_id: UUID,
    payload: AdminSuspendRequest,
    session: Session = Depends(get_db),
    admin_user: UserAccount = Depends(require_admin),
):
    user = _get_target_user(session, user_id)
    _guard_not_self(admin_user, user, "suspend")

    user.account_status = AccountStatus.SUSPENDED
    user.suspension_reason = payload.reason
    user.suspended_until = (
        datetime.now(timezone.utc) + timedelta(hours=payload.duration_hours) if payload.duration_hours else None
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    return _to_admin_user_read(session, user, _get_profile(session, user_id))


@router.post("/users/{user_id}/unsuspend", response_model=AdminUserRead)
def unsuspend_user(
    user_id: UUID,
    session: Session = Depends(get_db),
    admin_user: UserAccount = Depends(require_admin),
):
    user = _get_target_user(session, user_id)

    if user.account_status == AccountStatus.SUSPENDED:
        user.account_status = AccountStatus.ACTIVE
        user.suspended_until = None
        user.suspension_reason = None
        session.add(user)
        session.commit()
        session.refresh(user)

    return _to_admin_user_read(session, user, _get_profile(session, user_id))


@router.delete("/users/{user_id}", response_model=AdminUserRead)
def delete_user(
    user_id: UUID,
    session: Session = Depends(get_db),
    admin_user: UserAccount = Depends(require_admin),
):
    """Soft-deletes the account (account_status -> DEACTIVATED) rather than issuing a
    hard DELETE. Gigs/orders/reviews/messages reference user_account.user_id with no
    ON DELETE CASCADE, so a hard delete would 500 on any user with history; this is
    the safe equivalent of "this account no longer exists / can't be used" without
    corrupting other users' order/review history."""
    user = _get_target_user(session, user_id)
    _guard_not_self(admin_user, user, "delete")

    user.account_status = AccountStatus.DEACTIVATED
    user.is_banned = False
    user.ban_reason = None
    user.banned_at = None
    user.suspended_until = None
    user.suspension_reason = None
    session.add(user)
    session.commit()
    session.refresh(user)

    return _to_admin_user_read(session, user, _get_profile(session, user_id))


@router.post("/users/{user_id}/reset-password")
def reset_user_password(
    user_id: UUID,
    session: Session = Depends(get_db),
    admin_user: UserAccount = Depends(require_admin),
):
    user = _get_target_user(session, user_id)
    triggered = trigger_password_reset(user.clerk_id)
    if not triggered:
        raise HTTPException(
            status_code=503,
            detail=(
                "Couldn't trigger a password reset. Either CLERK_SECRET_KEY isn't "
                "configured on this server, or the request to Clerk failed."
            ),
        )
    return {"status": "ok"}


@router.post("/users/bulk", response_model=AdminBulkUserActionResponse)
def bulk_user_action(
    payload: AdminBulkUserActionRequest,
    session: Session = Depends(get_db),
    admin_user: UserAccount = Depends(require_admin),
):
    if admin_user.user_id in payload.user_ids:
        raise HTTPException(status_code=400, detail="You can't include your own account in a bulk action.")

    if payload.action == "set_role" and payload.role is None:
        raise HTTPException(status_code=422, detail="`role` is required for the set_role action")

    users = session.exec(select(UserAccount).where(UserAccount.user_id.in_(payload.user_ids))).all()
    found_ids = {u.user_id for u in users}
    missing = [str(uid) for uid in payload.user_ids if uid not in found_ids]

    now = datetime.now(timezone.utc)
    for user in users:
        if payload.action == "ban":
            user.is_banned = True
            user.ban_reason = payload.reason
            user.banned_at = now
        elif payload.action == "unban":
            user.is_banned = False
            user.ban_reason = None
            user.banned_at = None
        elif payload.action == "suspend":
            user.account_status = AccountStatus.SUSPENDED
            user.suspension_reason = payload.reason
            user.suspended_until = now + timedelta(hours=payload.duration_hours) if payload.duration_hours else None
        elif payload.action == "unsuspend":
            if user.account_status == AccountStatus.SUSPENDED:
                user.account_status = AccountStatus.ACTIVE
                user.suspended_until = None
                user.suspension_reason = None
        elif payload.action == "delete":
            user.account_status = AccountStatus.DEACTIVATED
            user.is_banned = False
            user.suspended_until = None
            user.suspension_reason = None
        else:  # "set_role", validated above
            user.role = payload.role
            user.is_admin = payload.role == UserRole.ADMIN
        session.add(user)

    session.commit()
    return AdminBulkUserActionResponse(updated=len(users), missing=missing)


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
