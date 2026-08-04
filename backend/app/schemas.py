

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional, List


from pydantic import BaseModel, field_validator
from app.models import GigStatus, OrderStatus


from sqlmodel import Field, SQLModel
from uuid import UUID

from .models import AccountStatus, GigApprovalStatus, UserRole


# ---------- UserAccount ----------

class UserAccountRead(SQLModel):
    user_id: uuid.UUID
    email: str
    account_status: AccountStatus
    is_admin: bool = False
    role: UserRole = UserRole.USER
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
    category_name: str
    skill_name: str
    description: Optional[str] = Field(default=None, max_length=1000)
    hourly_rate_token_cost: Decimal = Field(gt=0)
    is_active: bool = True


class UserSkillUpdate(SQLModel):
    category_name: Optional[str] = None
    skill_name: Optional[str] = None
    description: Optional[str] = Field(default=None, max_length=1000)
    hourly_rate_token_cost: Optional[Decimal] = Field(default=None, gt=0)
    is_active: Optional[bool] = None


class UserSkillRead(SQLModel):
    skill_id: uuid.UUID
    user_id: uuid.UUID
    category_name: str
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


# ---------- Admin: user management ----------
# Matches frontend/src/pages/components/dashboard/users/types.ts (ApiAdminUser etc.)
# — keep field names in sync with that file when changing either side.

# Backend AccountStatus has no "banned" member (see app/moderation.py for why); this
# is the display-only union the admin endpoints actually return.
AdminDisplayStatus = Literal["pending_verification", "active", "suspended", "banned", "deactivated"]


class AdminProfileRead(SQLModel):
    username: str
    first_name: str
    last_name: str
    avatar_url: Optional[str] = None


class AdminUserStats(SQLModel):
    gigs_posted: int
    orders_completed: int
    reviews_received: int
    average_rating: Optional[float] = None


class AdminUserSuspension(SQLModel):
    reason: Optional[str] = None
    expires_at: Optional[datetime] = None


class AdminUserRead(SQLModel):
    user_id: uuid.UUID
    email: str
    account_status: AdminDisplayStatus
    role: UserRole
    is_admin: bool
    verified: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    profile: Optional[AdminProfileRead] = None
    suspension: Optional[AdminUserSuspension] = None
    ban_reason: Optional[str] = None
    stats: AdminUserStats


class AdminUserListResponse(SQLModel):
    items: List[AdminUserRead]
    total: int


class AdminUserUpdate(SQLModel):
    username: Optional[str] = None
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class AdminRoleUpdate(SQLModel):
    role: UserRole


class AdminBanRequest(SQLModel):
    reason: Optional[str] = Field(default=None, max_length=500)


class AdminSuspendRequest(SQLModel):
    reason: Optional[str] = Field(default=None, max_length=500)
    duration_hours: Optional[int] = Field(default=None, gt=0)


AdminBulkAction = Literal["ban", "unban", "suspend", "unsuspend", "delete", "set_role"]


class AdminBulkUserActionRequest(SQLModel):
    user_ids: List[uuid.UUID]
    action: AdminBulkAction
    reason: Optional[str] = Field(default=None, max_length=500)
    duration_hours: Optional[int] = Field(default=None, gt=0)
    role: Optional[UserRole] = None


class AdminBulkUserActionResponse(SQLModel):
    updated: int
    missing: List[str] = []

# ---------- Gigs ----------
# Base properties shared across schemas
class GigBase(SQLModel):
    title: str
    description: str
    price: float
    banner_url: Optional[str] = None
    turnaround_time: str

# Schema for creating a gig
class GigCreate(GigBase):
    tags: List[str] = []
    category_name: str 

# Schema for modifying mutable gig fields
class GigUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category_name: Optional[str] = None
    tag_ids: Optional[List[uuid.UUID]] = None
    banner_url: Optional[str] = None
    turnaround_time: Optional[str] = None

# Schema for updating just the lifecycle state
class GigStatusUpdate(SQLModel):
    status: GigStatus

# Nested simplified object to present related records cleanly
class TagRead(SQLModel):
    id: int
    name: str

    class Config:
        from_attributes = True

# class CategoryRead(SQLModel):
#     name: str

#     class Config:
#         from_attributes = True

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
    category_name: str

    class Config:
        from_attributes = True


# ---------- Orders (a buyer booking a gig) ----------

class OrderCreate(SQLModel):
    gig_id: uuid.UUID
    note: Optional[str] = Field(default=None, max_length=1000)


class OrderStatusUpdate(SQLModel):
    status: OrderStatus


class OrderRead(SQLModel):
    id: uuid.UUID
    gig_id: uuid.UUID
    gig_title: str
    buyer: ProviderRead
    provider_id: uuid.UUID
    price: Decimal
    note: Optional[str] = None
    status: OrderStatus
    created_at: datetime
    updated_at: datetime


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

class EmailRequestIn(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        if not isinstance(value, str):
            raise TypeError("email must be a string")
        value = value.strip()
        if not value or "@" not in value:
            raise ValueError("invalid email")
        return value


class EmailConfirmIn(BaseModel):
    code: str

    @field_validator("code")
    @classmethod
    def validate_code(cls, value: str) -> str:
        if not isinstance(value, str):
            raise TypeError("code must be a string")
        value = value.strip()
        if not value:
            raise ValueError("code is required")
        return value

