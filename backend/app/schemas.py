

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlmodel import Field, SQLModel

from .models import AccountStatus


# ---------- UserAccount ----------

class UserAccountRead(SQLModel):
    user_id: uuid.UUID
    email: str
    is_email_verified: bool
    account_status: AccountStatus
    created_at: datetime
    last_login: Optional[datetime] = None


class UserAccountUpdate(SQLModel):
    email: Optional[str] = None


# ---------- UserWallet ----------

class UserWalletRead(SQLModel):
    wallet_id: uuid.UUID
    user_id: uuid.UUID
    available_tokens: Decimal
    tokens_escrowed: Decimal
    total_services_provided: int
    total_services_received: int


# ---------- StudentProfile ----------

class StudentProfileCreate(SQLModel):
    first_name: str
    last_name: str
    profile_picture_url: Optional[str] = None
    university_name: Optional[str] = None
    major_field_of_study: Optional[str] = None
    graduation_year: Optional[int] = Field(default=None, ge=1900, le=2100)
    bio: Optional[str] = Field(default=None, max_length=1000)
    timezone: Optional[str] = None


class StudentProfileUpdate(SQLModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    profile_picture_url: Optional[str] = None
    university_name: Optional[str] = None
    major_field_of_study: Optional[str] = None
    graduation_year: Optional[int] = Field(default=None, ge=1900, le=2100)
    bio: Optional[str] = Field(default=None, max_length=1000)
    timezone: Optional[str] = None


class StudentProfileRead(SQLModel):
    profile_id: uuid.UUID
    user_id: uuid.UUID
    first_name: str
    last_name: str
    profile_picture_url: Optional[str] = None
    university_name: Optional[str] = None
    major_field_of_study: Optional[str] = None
    graduation_year: Optional[int] = None
    bio: Optional[str] = None
    timezone: Optional[str] = None


# ---------- UserSkill ----------

class UserSkillCreate(SQLModel):
    category: str
    skill_name: str
    description: Optional[str] = Field(default=None, max_length=1000)
    hourly_rate_token_cost: Decimal = Field(gt=0)
    is_active: bool = True


class UserSkillUpdate(SQLModel):
    category: Optional[str] = None
    skill_name: Optional[str] = None
    description: Optional[str] = Field(default=None, max_length=1000)
    hourly_rate_token_cost: Optional[Decimal] = Field(default=None, gt=0)
    is_active: Optional[bool] = None


class UserSkillRead(SQLModel):
    skill_id: uuid.UUID
    user_id: uuid.UUID
    category: str
    skill_name: str
    description: Optional[str] = None
    hourly_rate_token_cost: Decimal
    is_active: bool


# ---------- UserReview ----------

class UserReviewCreate(SQLModel):
    reviewee_id: uuid.UUID
    service_id: uuid.UUID
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = Field(default=None, max_length=2000)


class UserReviewRead(SQLModel):
    review_id: uuid.UUID
    reviewer_id: uuid.UUID
    reviewee_id: uuid.UUID
    service_id: uuid.UUID
    rating: int
    comment: Optional[str] = None
    created_at: datetime


# ---------- Composite / convenience ----------

class UserAccountWithProfile(UserAccountRead):
    """Handy when an endpoint wants account + profile + wallet in one response
    instead of forcing the frontend to make three calls."""
    profile: Optional[StudentProfileRead] = None
    wallet: Optional[UserWalletRead] = None