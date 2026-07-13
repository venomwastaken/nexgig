import os
from fastapi import Depends, FastAPI, Header, HTTPException,APIRouter
from fastapi.middleware.cors import CORSMiddleware
from typing import Generator, List
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, create_engine, select
 
from app.models import UserAccount
from app.schemas import UserAccountRead
from app.auth import clerk_id_from_token, verify_clerk_token

router = APIRouter()

DATABASE_URL = os.environ["DATABASE_URL"]
engine = create_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
 
 
def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session




# --- Task F: user creation ---
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

@router.get("/create-user", response_model=UserAccountRead)
def read_me(user: UserAccount = Depends(get_or_create_user)):
    return user