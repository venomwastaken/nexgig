# This file will hold our SQLModel classes — the Python classes
# that represent database tables (e.g., a future `Gig` or `User` class).
#
# SQLModel is the library that lets one class definition serve two jobs:
#   1. Define the shape of a database table
#   2. Define the shape of API request/response data
#
# Left empty in Sprint 0 on purpose — no domain modeling (gigs, users,
# applications) happens until Sprint 1, once the backlog says what's
# actually needed first.

import uuid
from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import List, Optional

from sqlalchemy import Column, Numeric
from sqlmodel import Field, Relationship, SQLModel


class AccountStatus(str, Enum):
    PENDING_VERIFICATION = "pending_verification"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    DEACTIVATED = "deactivated"


class UserAccount(SQLModel, table=True):
    __tablename__ = "user_account"

    user_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(unique=True, index=True, nullable=False)  # .edu enforced at app/validation layer
    password_hash: Optional[str] = Field(default=None)
    is_email_verified: bool = Field(default=False)
    university_id: Optional[uuid.UUID] = Field(default=None)  # not modeled in this diagram
    account_status: AccountStatus = Field(default=AccountStatus.PENDING_VERIFICATION)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    last_login: Optional[datetime] = Field(default=None)

    # --- Task E ---
    clerk_id: str = Field(unique=True, index=True, nullable=False)

    wallet: Optional["UserWallet"] = Relationship(
        back_populates="user", sa_relationship_kwargs={"uselist": False}
    )
    profile: Optional["StudentProfile"] = Relationship(
        back_populates="user", sa_relationship_kwargs={"uselist": False}
    )
    skills: List["UserSkill"] = Relationship(back_populates="user")
    reviews_written: List["UserReview"] = Relationship(
        back_populates="reviewer",
        sa_relationship_kwargs={"foreign_keys": "UserReview.reviewer_id"},
    )
    reviews_received: List["UserReview"] = Relationship(
        back_populates="reviewee",
        sa_relationship_kwargs={"foreign_keys": "UserReview.reviewee_id"},
    )


class UserWallet(SQLModel, table=True):
    __tablename__ = "user_wallet"

    wallet_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user_account.user_id", unique=True, index=True)
    available_tokens: Decimal = Field(
        default=Decimal("0"), sa_column=Column(Numeric(12, 2), nullable=False)
    )
    tokens_escrowed: Decimal = Field(
        default=Decimal("0"), sa_column=Column(Numeric(12, 2), nullable=False)
    )
    total_services_provided: int = Field(default=0)
    total_services_received: int = Field(default=0)

    user: Optional[UserAccount] = Relationship(back_populates="wallet")


class StudentProfile(SQLModel, table=True):
    __tablename__ = "student_profile"

    profile_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user_account.user_id", unique=True, index=True)
    first_name: str
    last_name: str
    profile_picture_url: Optional[str] = Field(default=None)
    university_name: Optional[str] = Field(default=None)
    major_field_of_study: Optional[str] = Field(default=None)
    graduation_year: Optional[int] = Field(default=None)
    bio: Optional[str] = Field(default=None)
    timezone: Optional[str] = Field(default=None)

    user: Optional[UserAccount] = Relationship(back_populates="profile")


class UserSkill(SQLModel, table=True):
    __tablename__ = "user_skill"

    skill_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user_account.user_id", index=True)
    category: str
    skill_name: str
    description: Optional[str] = Field(default=None)
    hourly_rate_token_cost: Decimal = Field(sa_column=Column(Numeric(10, 2), nullable=False))
    is_active: bool = Field(default=True)

    user: Optional[UserAccount] = Relationship(back_populates="skills")


class UserReview(SQLModel, table=True):
    __tablename__ = "user_review"

    review_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    reviewer_id: uuid.UUID = Field(foreign_key="user_account.user_id", index=True)
    reviewee_id: uuid.UUID = Field(foreign_key="user_account.user_id", index=True)
    service_id: uuid.UUID  # references a Service entity not modeled in this diagram
    rating: int
    comment: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    reviewer: Optional[UserAccount] = Relationship(
        back_populates="reviews_written",
        sa_relationship_kwargs={"foreign_keys": "UserReview.reviewer_id"},
    )
    reviewee: Optional[UserAccount] = Relationship(
        back_populates="reviews_received",
        sa_relationship_kwargs={"foreign_keys": "UserReview.reviewee_id"},
    )
