import datetime
import os
from time import timezone
from fastapi import Depends, FastAPI, Header, HTTPException,APIRouter, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from typing import Generator, List, Optional
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, create_engine, func, select
 
from app.models import UserAccount, UserAccount, UserProfile
from app.schemas import (
    AttachmentPresignRequest,
    AttachmentPresignResponse,
    UserAccountRead,
    UserAccountWithProfile,
    UsernameAvailabilityRead,
    UserProfileCreate,
    UserProfileRead,
    UserProfileUpdate,
)
from app.auth import clerk_id_from_token, verify_clerk_token
from app.core.database import get_db
from app.core.storage import (
    ALLOWED_IMAGE_CONTENT_TYPES,
    build_avatar_object_key,
    generate_presigned_put,
    public_url_for_key,
)

router = APIRouter()

DATABASE_URL = os.environ["DATABASE_URL"]
engine = create_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
 
 
def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session




# --- user creation ---
def get_or_create_user_from_payload(payload: dict, db: Session) -> UserAccount:
    """Core of get_or_create_user, usable by callers that can't rely on FastAPI's
    Depends() chain (e.g. a WebSocket route, which verifies its own `?token=` query
    param before accept() rather than via the HTTPBearer dependency)."""
    clerk_id = payload["sub"]
    email = payload.get("email")

    print(f"DEBUG payload keys: {list(payload.keys())}")
    print(f"DEBUG payload: {payload}")

    user = db.exec(select(UserAccount).where(UserAccount.clerk_id == clerk_id)).first()
    if user:
        return user

    user = UserAccount(clerk_id=clerk_id, email=email)
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        # two near-simultaneous first requests for the same brand-new user
        db.rollback()
        user = db.exec(select(UserAccount).where(UserAccount.clerk_id == clerk_id)).first()
        if user is None:
            raise
    else:
        db.refresh(user)

    return user


def get_or_create_user(
    #clerk_id: str = Depends(clerk_id_from_token),
    payload: dict = Depends(verify_clerk_token),
    db: Session = Depends(get_session),
) -> UserAccount:
    return get_or_create_user_from_payload(payload, db)

@router.get("/me/account", response_model=UserAccountRead)
def read_me(user: UserAccount = Depends(get_or_create_user)):
    return user

# --- user profile creation and retrieval ---
def _to_profile_read(profile: Optional[UserProfile]) -> Optional[UserProfileRead]:
    """
    UserProfile's primary key is profile_id, but UserProfileRead's schema
    (and the frontend contract) expects it as `id`. FastAPI's automatic
    from_attributes matching can't bridge that name difference, so it has
    to be mapped explicitly here rather than returned as a raw ORM object.
    """
    if profile is None:
        return None
    return UserProfileRead(
        id=profile.profile_id,
        user_id=profile.user_id,
        first_name=profile.first_name,
        last_name=profile.last_name,
        username=profile.username,
        dob=profile.dob,
        avatar_url=profile.avatar_url,
        bio=profile.bio,
        university=profile.university,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )

# ---------- Current user ----------

@router.get("/me", response_model=UserAccountWithProfile)
def get_me(
    current_user: UserAccount = Depends(get_or_create_user),
    session: Session = Depends(get_db),
):
    profile = session.exec(
        select(UserProfile).where(UserProfile.user_id == current_user.user_id)
    ).first()

    return UserAccountWithProfile(
        user_id=current_user.user_id,
        email=current_user.email,
        account_status=current_user.account_status,
        created_at=current_user.created_at,
        profile=_to_profile_read(profile),
        wallet=current_user.wallet,
    )

# ---------- Profile ----------

@router.post("/me/profile", response_model=UserProfileRead)
def create_my_profile(
    payload: UserProfileCreate,
    response: Response,
    current_user: UserAccount = Depends(get_or_create_user),
    session: Session = Depends(get_db),
):
    existing = session.exec(
        select(UserProfile).where(UserProfile.user_id == current_user.user_id)
    ).first()

    # username uniqueness — surfaced as 409 rather than a raw 500 from the DB
    # constraint. Excludes the caller's own row so re-submitting onboarding
    # with an unchanged username doesn't false-positive against yourself.
    username_taken = session.exec(
        select(UserProfile).where(
            UserProfile.username == payload.username,
            UserProfile.user_id != current_user.user_id,
        )
    ).first()
    if username_taken:
        raise HTTPException(status_code=409, detail="Username already taken")

    if existing:
        # Onboarding may be re-submitted (e.g. a refresh mid-flow followed by
        # resuming and completing later) — update the existing row instead of
        # creating a duplicate.
        existing.first_name = payload.first_name
        existing.last_name = payload.last_name
        existing.username = payload.username
        existing.dob = payload.dob
        existing.avatar_url = payload.avatar_url
        existing.bio = payload.bio
        existing.university = payload.university
        existing.updated_at = datetime.datetime.now(datetime.timezone.utc)
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return _to_profile_read(existing)

    profile = UserProfile(
        user_id=current_user.user_id,
        first_name=payload.first_name,
        last_name=payload.last_name,
        username=payload.username,
        dob=payload.dob,
        avatar_url=payload.avatar_url,
        bio=payload.bio,
        university=payload.university,
    )
    session.add(profile)
    session.commit()
    session.refresh(profile)
    response.status_code = 201
    return _to_profile_read(profile)


@router.get("/username-available", response_model=UsernameAvailabilityRead)
def check_username_available(
    username: str = Query(..., min_length=1),
    current_user: UserAccount = Depends(get_or_create_user),
    session: Session = Depends(get_db),
):
    taken = session.exec(
        select(UserProfile).where(
            UserProfile.username == username,
            UserProfile.user_id != current_user.user_id,
        )
    ).first()
    return UsernameAvailabilityRead(available=taken is None)


@router.post("/avatar-presign", response_model=AttachmentPresignResponse)
def presign_avatar(
    payload: AttachmentPresignRequest,
    user: UserAccount = Depends(get_or_create_user),
):
    if payload.content_type not in ALLOWED_IMAGE_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Only image uploads are supported")

    object_key = build_avatar_object_key(user.user_id, payload.filename)
    try:
        upload_url = generate_presigned_put(object_key, payload.content_type)
        object_url = public_url_for_key(object_key)
    except KeyError:
        raise HTTPException(status_code=503, detail="Image uploads aren't configured yet")

    return AttachmentPresignResponse(upload_url=upload_url, object_url=object_url, object_key=object_key)


@router.patch("/me/profile", response_model=UserProfileRead)
def update_my_profile(
    payload: UserProfileUpdate,
    current_user: UserAccount = Depends(get_or_create_user),
    session: Session = Depends(get_db),
):
    profile = session.exec(
        select(UserProfile).where(UserProfile.user_id == current_user.user_id)
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # exclude_unset -> only fields the client actually sent get applied;
    # exclude updated_at since we stamp that ourselves below rather than
    # trust a client-supplied timestamp
    update_data = payload.model_dump(exclude_unset=True, exclude={"updated_at"})
    for field, value in update_data.items():
        setattr(profile, field, value)

    profile.updated_at = datetime.datetime.now(datetime.timezone.utc)

    session.add(profile)
    session.commit()
    session.refresh(profile)
    return _to_profile_read(profile)


