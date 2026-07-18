import os
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Generator, List
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, create_engine, select
 
from app.models import UserAccount
from app.schemas import (
    UserAccountRead,
)
from app.auth import clerk_id_from_token, verify_clerk_token

DATABASE_URL = os.environ["DATABASE_URL"]
engine = create_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
 
 
def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session



# This is the entire backend for now. Its only job in Sprint 0
# is to prove the server starts and responds — nothing about
# gigs, users, or payments lives here yet.

app = FastAPI(title="NexGiG API")

# CORS: by default, browsers block a page on one origin (our Vite
# frontend, http://localhost:5173) from reading responses from a
# different origin (this API, http://localhost:8000). This middleware
# tells FastAPI to explicitly allow that specific frontend origin.
#
# In production, swap this list for your real deployed frontend URL
# (e.g. https://nexgig.vercel.app) — leaving "*" or localhost in a
# production config would defeat the point of the protection.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    """
    A 'health check' endpoint is a tiny convention: it does no
    real work, it just confirms the server is up and can respond.
    Deployment platforms (Railway, Render) and Docker can ping this
    to know if the backend is alive.
    """
    return {"status": "ok"}


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

@app.get("/user", response_model=UserAccountRead)
def read_me(user: UserAccount = Depends(get_or_create_user)):
    return user