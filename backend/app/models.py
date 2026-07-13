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
from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum
from typing import List, Optional

from sqlalchemy import Column, Numeric
from sqlmodel import Field, Relationship, SQLModel


class GigStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    PAUSED = "paused"
class AccountStatus(str, Enum):
    PENDING_VERIFICATION = "pending_verification"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    DEACTIVATED = "deactivated"


class UserAccount(SQLModel, table=True):
    __tablename__ = "user_account"

    user_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    # Synced/cached from Clerk — not written or validated by app logic directly.
    # Source of truth is Clerk; treat this as read-mostly until webhook sync exists.
    email: str = Field(unique=True, index=True, nullable=False)  # .edu enforced at app/validation layer

    university_id: Optional[uuid.UUID] = Field(default=None)  # TODO Sprint 2: not modeled yet
    account_status: AccountStatus = Field(default=AccountStatus.PENDING_VERIFICATION)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)

    # --- Clerk identity anchor ---
    clerk_id: str = Field(unique=True, index=True, nullable=False)

    wallet: Optional["UserWallet"] = Relationship(
        back_populates="user", sa_relationship_kwargs={"uselist": False}
    )
    profile: Optional["UserProfile"] = Relationship(
    back_populates="user",
    sa_relationship_kwargs={"uselist": False, "cascade": "all, delete-orphan"}
    )
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


class UserProfile(SQLModel, table=True):
    __tablename__ = "user_profile"

    profile_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user_account.user_id", unique=True, index=True)
    first_name: str
    last_name: str
    username: str = Field(default=None, unique=True, index=True)
    avatar_url: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc),nullable=False)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc),nullable=False)
    bio: Optional[str] = Field(default=None)

    user: UserAccount = Relationship(back_populates="profile")
    skill_links: List["UserSkillLink"] = Relationship(back_populates="profile")
    gigs: List["Gig"] = Relationship(back_populates="profile")

class Skill(SQLModel, table=True):
    __tablename__ = "skill"

    skill_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(unique=True, index=True)

class UserSkillLink(SQLModel, table=True):
    __tablename__ = "user_skill_link"

    user_profile_id: uuid.UUID = Field(foreign_key="user_profile.profile_id", primary_key=True)
    skill_id: uuid.UUID   = Field(foreign_key="skill.skill_id", primary_key=True)
    profile: "UserProfile" = Relationship(back_populates="skill_links")

class UserReview(SQLModel, table=True):
    __tablename__ = "user_review"

    review_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    reviewer_id: uuid.UUID = Field(foreign_key="user_account.user_id", index=True)
    reviewee_id: uuid.UUID = Field(foreign_key="user_account.user_id", index=True)
    service_id: uuid.UUID  # references a Service entity not modeled in this diagram
    rating: int
    comment: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)

    reviewer: Optional[UserAccount] = Relationship(
        back_populates="reviews_written",
        sa_relationship_kwargs={"foreign_keys": "UserReview.reviewer_id"},
    )
    reviewee: Optional[UserAccount] = Relationship(
        back_populates="reviews_received",
        sa_relationship_kwargs={"foreign_keys": "UserReview.reviewee_id"},
    )

class Gig(SQLModel, table=True):
    __tablename__ = "gig"

    gig_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str
    description: str
    price: Decimal = Field(sa_column=Column(Numeric(12, 2), nullable=False))
    status: GigStatus = Field(default=GigStatus.ACTIVE)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc),nullable=False)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc),nullable=False)
    profile_id: uuid.UUID = Field(foreign_key="user_profile.profile_id", index=True)

    profile: Optional[UserProfile] = Relationship(back_populates="gigs")

class GigSkillLink(SQLModel, table=True):
    __tablename__ = "gig_skill_link"

    gig_id: uuid.UUID = Field(foreign_key="gig.gig_id", primary_key=True)
    skill_id: uuid.UUID = Field(foreign_key="skill.skill_id", primary_key=True)