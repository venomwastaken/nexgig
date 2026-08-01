

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from app.models import GigStatus

from sqlmodel import Field, SQLModel
from uuid import UUID

from .models import AccountStatus, GigApprovalStatus


# ---------- UserAccount ----------

class UserAccountRead(SQLModel):
    user_id: uuid.UUID
    email: str
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


# ---------- UserProfile ----------

class UserProfileCreate(SQLModel):
    first_name: str
    last_name: str
    username: str
    dob: Optional[datetime] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = Field(default=None, max_length=1000)
    created_at: Optional[datetime] = None


class UserProfileUpdate(SQLModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = Field(default=None, max_length=1000)
    updated_at: Optional[datetime] = None


class UserProfileRead(SQLModel):
    id: uuid.UUID
    user_id: uuid.UUID
    first_name: str
    last_name: str
    username: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    created_at: datetime
    updated_at: datetime


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
    profile: Optional[UserProfileRead] = None
    wallet: Optional[UserWalletRead] = None

# ---------- Gigs ----------
# Base properties shared across schemas
class GigBase(SQLModel):
    title: str
    description: str
    price: float

# Schema for creating a gig
class GigCreate(GigBase):
    tags: List[str] = []
    category_id: Optional[uuid.UUID] = None

# Schema for modifying mutable gig fields
class GigUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category_id: Optional[uuid.UUID] = None
    tag_ids: Optional[List[uuid.UUID]] = None

# Schema for updating just the lifecycle state
class GigStatusUpdate(SQLModel):
    status: GigStatus

# Nested simplified object to present related records cleanly
class TagRead(SQLModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class CategoryRead(SQLModel):
    category_id: uuid.UUID
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

class ProviderRead(SQLModel):
    user_id: uuid.UUID
    first_name: str
    last_name: str
    username: str
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True

# Publicly visible representation of a Gig
class GigRead(GigBase):
    id: uuid.UUID
    provider: Optional[ProviderRead] = None
    status: GigStatus
    created_at: datetime
    tags: List[TagRead] = []
# Additional fields for admin review
    approval_status: GigApprovalStatus
    rejection_reason: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    reviewed_by_id: Optional[UUID] = None
    category: Optional[CategoryRead] = None

    class Config:
        from_attributes = True


# ---------- Messaging ----------

class ConversationCreate(SQLModel):
    other_user_id: uuid.UUID
    gig_id: Optional[uuid.UUID] = None


class ConversationRead(SQLModel):
    id: uuid.UUID
    other_participant: ProviderRead
    gig_id: Optional[uuid.UUID] = None
    last_message_at: Optional[datetime] = None
    last_message_preview: Optional[str] = None
    unread_count: int = 0
    created_at: datetime


class MessageRead(SQLModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    sender_id: uuid.UUID
    body: Optional[str] = None
    attachment_url: Optional[str] = None
    attachment_type: Optional[str] = None
    created_at: datetime


class AttachmentPresignRequest(SQLModel):
    filename: str
    content_type: str


class AttachmentPresignResponse(SQLModel):
    upload_url: str
    object_url: str
    object_key: str

