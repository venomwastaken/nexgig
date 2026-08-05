from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from email.utils import parseaddr

from app.core.database import get_db
from app.api.v1.endpoints.users import get_or_create_user
from app.models import AccountStatus, StudentVerification, UserAccount, VerificationStatus
from app.schemas import EmailRequestIn, EmailConfirmIn
from app.email import send_email

CODE_TTL_MINUTES = 10
MAX_SEND_ATTEMPTS_PER_HOUR = 5

router = APIRouter()

def require_verified_student(
    user=Depends(get_or_create_user),
    session: Session = Depends(get_db),
):
    record = session.exec(
        select(StudentVerification).where(StudentVerification.user_id == user.clerk_id)
    ).first()
    if not record or record.status != VerificationStatus.verified:
        raise HTTPException(403, "Student verification required")
    return user

def get_domain(email: str) -> str:
    parsed = parseaddr(email)
    addr = parsed[1] if parsed[1] else ""
    if not addr or "@" not in addr:
        raise ValueError("invalid email")
    return addr.rsplit("@", 1)[-1].lower().strip()


def is_edu_domain(email: str) -> bool:
    try:
        domain = get_domain(email)
    except ValueError:
        return False

    return (
        domain == "edu"
        or domain.endswith(".edu")
        or domain.endswith(".edu.gh")
        or domain.endswith(".edu.gh")
    )

def generate_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"

def hash_code(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()

def code_matches(code: str, code_hash: str) -> bool:
    return secrets.compare_digest(hash_code(code), code_hash)

def new_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(minutes=CODE_TTL_MINUTES)


def _ensure_utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)

def _get_or_create(session: Session, user_id: str) -> StudentVerification:
    record = session.exec(
        select(StudentVerification).where(StudentVerification.user_id == user_id)
    ).first()
    if not record:
        record = StudentVerification(user_id=user_id)
        session.add(record)
        session.commit()
        session.refresh(record)
    return record

@router.post("/email/request")
def request_email_code(
    body: EmailRequestIn,
    user=Depends(get_or_create_user),
    session: Session = Depends(get_db),
):
    if not is_edu_domain(body.email):
        raise HTTPException(400, "Please use your school (.edu) email address")

    record = _get_or_create(session, user.clerk_id)

    if record.status == VerificationStatus.verified:
        raise HTTPException(400, "Already verified")

    # basic rate limit
    last_sent = _ensure_utc(record.last_email_sent_at)
    if last_sent and datetime.now(timezone.utc) - last_sent >= timedelta(hours=1):
        record.email_send_attempts = 0

    if (
        last_sent
        and record.email_send_attempts >= MAX_SEND_ATTEMPTS_PER_HOUR
        and datetime.now(timezone.utc) - last_sent < timedelta(hours=1)
    ):
        raise HTTPException(429, "Too many attempts, try again later")

    code = generate_code()
    record.school_email = body.email
    record.email_code_hash = hash_code(code)
    record.email_code_expires_at = new_expiry()
    record.method = "edu_email"
    record.status = VerificationStatus.pending
    record.email_send_attempts += 1
    record.last_email_sent_at = datetime.now(timezone.utc)
    session.add(record)
    session.commit()

    send_email(to=body.email, subject="Verify your student status",
               body=f"Your verification code is {code}. It expires in 10 minutes.")
    return {"status": "code_sent"}

@router.post("/email/confirm")
def confirm_email_code(
    body: EmailConfirmIn,
    user=Depends(get_or_create_user),
    session: Session = Depends(get_db),
):
    record = _get_or_create(session, user.clerk_id)

    if not record.email_code_hash or not record.email_code_expires_at:
        raise HTTPException(400, "No pending verification")
    expires_at = _ensure_utc(record.email_code_expires_at)
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(400, "Code expired, request a new one")
    if not code_matches(body.code, record.email_code_hash):
        raise HTTPException(400, "Incorrect code")

    record.status = VerificationStatus.verified
    record.verified_at = datetime.now(timezone.utc)
    record.email_code_hash = None
    record.email_code_expires_at = None
    session.add(record)

    # `user` comes from a dependency chain bound to a different Session than
    # `session`, so it can't be mutated and added here directly — look up the
    # row fresh in this session instead.
    account = session.exec(
        select(UserAccount).where(UserAccount.user_id == user.user_id)
    ).first()
    if account and account.account_status == AccountStatus.pending_verification:
        account.account_status = AccountStatus.active
        session.add(account)

    session.commit()
    return {"status": "verified"}
