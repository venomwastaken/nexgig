import datetime
import os
from time import timezone
from fastapi import Depends, FastAPI, Header, HTTPException,APIRouter, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Generator, List, Optional
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, create_engine, func, select
 
from app.models import UserAccount, UserAccount, UserProfile
from app.schemas import UserAccountRead,UserAccountWithProfile,UserProfileCreate,UserProfileRead,UserProfileUpdate
from app.auth import clerk_id_from_token, verify_clerk_token
from app.core.database import get_db

router = APIRouter()

DATABASE_URL = os.environ["DATABASE_URL"]
engine = create_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
 
 
def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session




# --- user creation ---
def get_or_create_user(
    #clerk_id: str = Depends(clerk_id_from_token),
    payload: dict = Depends(verify_clerk_token),
    db: Session = Depends(get_session),
) -> UserAccount:
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
        avatar_url=profile.avatar_url,
        bio=profile.bio,
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

@router.post("/me/profile", response_model=UserProfileRead, status_code=201)
def create_my_profile(
    payload: UserProfileCreate,
    current_user: UserAccount = Depends(get_or_create_user),
    session: Session = Depends(get_db),
):
    existing = session.exec(
        select(UserProfile).where(UserProfile.user_id == current_user.user_id)
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Profile already exists")

    # username uniqueness — surfaced as 409 rather than a raw 500 from the DB constraint
    username_taken = session.exec(
        select(UserProfile).where(UserProfile.username == payload.username)
    ).first()
    if username_taken:
        raise HTTPException(status_code=409, detail="Username already taken")

    profile = UserProfile(
        user_id=current_user.user_id,
        first_name=payload.first_name,
        last_name=payload.last_name,
        username=payload.username,
        avatar_url=payload.avatar_url,
        bio=payload.bio,
    )
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return _to_profile_read(profile)


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


