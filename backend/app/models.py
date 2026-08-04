import uuid
from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum
from typing import List, Optional
from uuid import UUID

from sqlalchemy import Column, ForeignKey, Numeric, String, Boolean
from sqlmodel import Field, Relationship, SQLModel, UniqueConstraint


class GigStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    PAUSED = "paused"

class GigApprovalStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class OrderStatus(str, Enum):
    REQUESTED = "requested"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class AccountStatus(str, Enum):
    active = "active"
    suspended = "suspended"
    deactivated = "deactivated"
    pending_verification = "pending_verification"

class BookingStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"
    declined = "declined"
    completed = "completed"
    cancelled = "cancelled"

class UserRole(str, Enum):
    USER = "user"
    MODERATOR = "moderator"
    ADMIN = "admin"

class VerificationStatus(str, Enum):
    unverified = "unverified"
    pending = "pending"
    verified = "verified"
    rejected = "rejected"

class UserAccount(SQLModel, table=True):
    __tablename__ = "user_account"

    user_id: UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    is_admin: bool = Field(default=False)
    role: UserRole = Field(default=UserRole.USER)

    # Synced/cached from Clerk
    email: str = Field(unique=True, index=True, nullable=False)

    university_id: Optional[UUID] = Field(default=None)
    account_status: AccountStatus = Field(default=AccountStatus.active, nullable=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)
    last_login: Optional[datetime] = Field(default=None)

    # Moderation. `is_banned` is intentionally separate from `account_status` rather
    # than a new enum member — it avoids an `ALTER TYPE ... ADD VALUE` migration on the
    # existing Postgres `accountstatus` enum, which can't safely run inside the same
    # transaction as other DDL on some Postgres versions.
    is_banned: bool = Field(default=False)
    ban_reason: Optional[str] = Field(default=None, max_length=500)
    banned_at: Optional[datetime] = Field(default=None)
    # Suspension reuses AccountStatus.SUSPENDED; these two fields carry the extra
    # metadata (when it lifts, why) that the enum value alone can't express.
    suspended_until: Optional[datetime] = Field(default=None)
    suspension_reason: Optional[str] = Field(default=None, max_length=500)

    clerk_id: str = Field(unique=True, index=True, nullable=False)

    wallet: Optional["UserWallet"] = Relationship(
        back_populates="user", sa_relationship_kwargs={"uselist": False}
    )
    profile: Optional["UserProfile"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"uselist": False, "cascade": "all, delete-orphan"}
    )
    gigs: List["Gig"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"foreign_keys": "Gig.user_id"},
    )
    reviews_written: List["UserReview"] = Relationship(
        back_populates="reviewer",
        sa_relationship_kwargs={"foreign_keys": "UserReview.reviewer_id"},
    )
    reviews_received: List["UserReview"] = Relationship(
        back_populates="reviewee",
        sa_relationship_kwargs={"foreign_keys": "UserReview.reviewee_id"},
    )
    gig_comments: List["GigComment"] = Relationship(back_populates="user")
    bookings_as_client: List["Booking"] = Relationship(
        back_populates="client",
        sa_relationship_kwargs={"foreign_keys": "Booking.client_id"},
    )
    bookings_as_freelancer: List["Booking"] = Relationship(
        back_populates="freelancer",
        sa_relationship_kwargs={"foreign_keys": "Booking.freelancer_id"},
    )


class UserWallet(SQLModel, table=True):
    __tablename__ = "user_wallet"

    wallet_id: UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    user_id: UUID = Field(foreign_key="user_account.user_id", unique=True, index=True)
    available_tokens: Decimal = Field(
        default=Decimal("0"), sa_column=Column(Numeric(12, 2), nullable=False)
    )
    tokens_escrowed: Decimal = Field(
        default=Decimal("0"), sa_column=Column(Numeric(12, 2), nullable=False)
    )
    total_services_provided: int = Field(default=0)
    total_services_received: int = Field(default=0)

    user: Optional["UserAccount"] = Relationship(back_populates="wallet")


class UserProfile(SQLModel, table=True):
    __tablename__ = "user_profile"

    profile_id: UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    user_id: UUID = Field(foreign_key="user_account.user_id", unique=True, index=True)
    first_name: str
    last_name: str
    username: str = Field(default=None, unique=True, index=True)
    avatar_url: Optional[str] = Field(default=None)
    dob: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc),nullable=False)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc),nullable=False)
    bio: Optional[str] = Field(default=None)
    university: Optional[str] = Field(default=None)

    user: "UserAccount" = Relationship(back_populates="profile")
    skill_links: List["UserSkillLink"] = Relationship(back_populates="profile")


class Skill(SQLModel, table=True):
    __tablename__ = "skill"

    skill_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    name: str = Field(unique=True, index=True)


class UserSkillLink(SQLModel, table=True):
    __tablename__ = "user_skill_link"

    user_profile_id: UUID = Field(foreign_key="user_profile.profile_id", primary_key=True)
    skill_id: UUID = Field(foreign_key="skill.skill_id", primary_key=True)
    profile: "UserProfile" = Relationship(back_populates="skill_links")


class UserReview(SQLModel, table=True):
    __tablename__ = "user_review"
    #one time review for a customer per gig
    __table_args__ = (

        UniqueConstraint("gig_id", "reviewer_id", name="uq_user_review_gig_reviewer"),
    )

    review_id: UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    reviewer_id: UUID = Field(foreign_key="user_account.user_id", index=True)
    reviewee_id: UUID = Field(foreign_key="user_account.user_id", index=True)
    gig_id: UUID = Field(foreign_key="gig.gig_id", index=True)
    rating: int
    comment: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)

    reviewer: Optional["UserAccount"] = Relationship(
        back_populates="reviews_written",
        sa_relationship_kwargs={"foreign_keys": "UserReview.reviewer_id"},
    )
    reviewee: Optional["UserAccount"] = Relationship(
        back_populates="reviews_received",
        sa_relationship_kwargs={"foreign_keys": "UserReview.reviewee_id"},
    )


class Gig(SQLModel, table=True):
    __tablename__ = "gig"
    
    approval_status: GigApprovalStatus = Field(default=GigApprovalStatus.PENDING)
    reviewed_by_id: Optional[UUID] = Field(default=None, foreign_key="user_account.user_id")
    reviewed_at: Optional[datetime] = Field(default=None)
    rejection_reason: Optional[str] = Field(default=None, max_length=500)
    
    gig_id: UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    title: str
    description: str
    price: Decimal = Field(sa_column=Column(Numeric(12, 2), nullable=False))
    status: GigStatus = Field(default=GigStatus.ACTIVE)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc),nullable=False)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc),nullable=False)
    user_id: UUID = Field(foreign_key="user_account.user_id", index=True)
    category_name: str = Field(index=True)
    banner_url: Optional[str] = Field(default=None)
    turnaround_time: str = Field(max_length=100)

    user: Optional["UserAccount"] = Relationship(
        back_populates="gigs",
        sa_relationship_kwargs={"foreign_keys": "Gig.user_id"},
    )
    bookings: List["Booking"] = Relationship(
        back_populates="listing",
        sa_relationship_kwargs={"foreign_keys": "Booking.listing_id"},
    )
    comments: List["GigComment"] = Relationship(
        back_populates="gig",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )

    @property
    def id(self) -> uuid.UUID:
        return self.gig_id

    @property
    def provider_id(self) -> uuid.UUID:
        return self.user_id

    @property
    def provider(self) -> Optional["UserProfile"]:
        return self.user.profile if self.user else None


class Booking(SQLModel, table=True):
    __tablename__ = "booking"

    booking_id: UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    listing_id: UUID = Field(foreign_key="gig.gig_id", index=True)
    client_id: UUID = Field(foreign_key="user_account.user_id", index=True)
    freelancer_id: UUID = Field(foreign_key="user_account.user_id", index=True)
    status: BookingStatus = Field(default=BookingStatus.pending)
    message: Optional[str] = Field(default=None, max_length=4000)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)

    listing: Optional["Gig"] = Relationship(back_populates="bookings")
    client: Optional["UserAccount"] = Relationship(
        back_populates="bookings_as_client",
        sa_relationship_kwargs={"foreign_keys": "Booking.client_id"},
    )
    freelancer: Optional["UserAccount"] = Relationship(
        back_populates="bookings_as_freelancer",
        sa_relationship_kwargs={"foreign_keys": "Booking.freelancer_id"},
    )


class GigOrder(SQLModel, table=True):
    __tablename__ = "gig_order"

    order_id: UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    gig_id: UUID = Field(foreign_key="gig.gig_id", index=True)
    buyer_id: UUID = Field(foreign_key="user_account.user_id", index=True)
    provider_id: UUID = Field(foreign_key="user_account.user_id", index=True)
    price: Decimal = Field(sa_column=Column(Numeric(12, 2), nullable=False))
    note: Optional[str] = Field(default=None, max_length=1000)
    status: OrderStatus = Field(default=OrderStatus.REQUESTED)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)

    @property
    def id(self) -> uuid.UUID:
        return self.order_id


# class Category(SQLModel, table=True):
#     __tablename__ = "category"

#     category_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
#     name: str = Field(unique=True, index=True)
#     description: Optional[str] = Field(default=None)


class Tag(SQLModel, table=True):
    __tablename__ = "tag"

    tag_id: int | None = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)

    @property
    def id(self) -> int | None:
        return self.tag_id


class GigTagLink(SQLModel, table=True):
    __tablename__ = "gig_tag_link"

    gig_id: UUID = Field(foreign_key="gig.gig_id", primary_key=True)
    tag_id: int | None = Field(foreign_key="tag.tag_id", primary_key=True)


class GigComment(SQLModel, table=True):
    __tablename__ = "gig_comment"

    comment_id: UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    gig_id: UUID = Field(foreign_key="gig.gig_id", index=True)
    user_id: UUID = Field(foreign_key="user_account.user_id", index=True)
    parent_comment_id: Optional[UUID] = Field(
        default=None, foreign_key="gig_comment.comment_id", index=True
    )
    body: str = Field(max_length=2000)
    is_edited: bool = Field(default=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)

    gig: Optional["Gig"] = Relationship(back_populates="comments")
    user: Optional["UserAccount"] = Relationship(back_populates="gig_comments")

    @property
    def id(self) -> UUID:
        return self.comment_id


class Conversation(SQLModel, table=True):
    __tablename__ = "conversation"

    conversation_id: UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    # Normalized unordered pair: user_a_id is always the smaller UUID (via uuid.UUID's
    # built-in comparison), so UNIQUE(user_a_id, user_b_id) guarantees exactly one
    # conversation per participant pair regardless of who messages first.
    user_a_id: UUID = Field(foreign_key="user_account.user_id", index=True)
    user_b_id: UUID = Field(foreign_key="user_account.user_id", index=True)
    gig_id: Optional[uuid.UUID] = Field(default=None, foreign_key="gig.gig_id", index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)
    last_message_at: Optional[datetime] = Field(default=None, index=True)
    user_a_last_read_at: Optional[datetime] = Field(default=None)
    user_b_last_read_at: Optional[datetime] = Field(default=None)


class Message(SQLModel, table=True):
    __tablename__ = "message"

    message_id: UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    conversation_id: UUID = Field(foreign_key="conversation.conversation_id", index=True)
    sender_id: UUID = Field(foreign_key="user_account.user_id", index=True)
    body: Optional[str] = Field(default=None, max_length=4000)
    attachment_url: Optional[str] = Field(default=None, max_length=2048)
    attachment_type: Optional[str] = Field(default=None, max_length=100)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False, index=True)


class NotificationType(str, Enum):
    MESSAGE = "message"
    BOOKING_CREATED = "booking_created"
    BOOKING_ACCEPTED = "booking_accepted"
    BOOKING_DECLINED = "booking_declined"
    BOOKING_COMPLETED = "booking_completed"
    BOOKING_CANCELLED = "booking_cancelled"
    ADMIN_UPDATE = "admin_update"
    SYSTEM = "system"


class Notification(SQLModel, table=True):
    __tablename__ = "notifications"

    id: UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    recipient_id: UUID = Field(foreign_key="user_account.user_id", index=True)
    actor_id: Optional[UUID] = Field(default=None, foreign_key="user_account.user_id")
    type: NotificationType = Field(sa_column=Column(String, index=True))
    title: str
    body: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    link: Optional[str] = None
    is_read: bool = Field(default=False, index=True)
    read_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), index=True)

class StudentVerification(SQLModel, table=True):
    __tablename__ = "student_verification"

    id: int | None = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="user_account.clerk_id", unique=True, index=True)
    status: VerificationStatus = Field(default=VerificationStatus.unverified)
    method: str | None = None  # "edu_email" or "document"
    school_email: str | None = None
    email_code_hash: str | None = None
    email_code_expires_at: datetime | None = None
    email_send_attempts: int = 0
    last_email_sent_at: datetime | None = None
    document_url: str | None = None
    reviewed_by: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    verified_at: datetime | None = None
