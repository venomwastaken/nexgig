// Types for the Admin "User management" panel.
//
// IMPORTANT: none of the `/admin/users*` endpoints referenced by api.ts exist on the
// backend yet. The shapes below (`ApiAdminUser`, `AdminUserListResponse`, ...) are the
// PROPOSED contract this UI is built against. See `backend/ADMIN_USERS_API_TODO.md`
// for the full list of endpoints/model changes that need to be implemented, including
// the new `role` field and `banned` status that don't exist on `UserAccount` today.

export type AdminAccountStatus =
  | "pending_verification"
  | "active"
  | "suspended"
  | "banned"
  | "deactivated";

export type AdminRole = "user" | "moderator" | "admin";

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  user: "User",
  moderator: "Moderator",
  admin: "Admin",
};

export const ACCOUNT_STATUS_LABELS: Record<AdminAccountStatus, string> = {
  pending_verification: "Pending verification",
  active: "Active",
  suspended: "Suspended",
  banned: "Banned",
  deactivated: "Deactivated",
};

export const ACCOUNT_STATUS_STYLES: Record<AdminAccountStatus, string> = {
  pending_verification: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20",
  active: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
  suspended: "bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20",
  banned: "bg-red-500/10 text-red-400 ring-1 ring-red-500/20",
  deactivated: "bg-muted text-muted-foreground ring-1 ring-border",
};

export interface AdminUserStats {
  gigsPosted: number;
  ordersCompleted: number;
  reviewsReceived: number;
  averageRating?: number | null;
}

export interface AdminUserSuspension {
  reason?: string | null;
  expiresAt?: string | null;
}

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  role: AdminRole;
  status: AdminAccountStatus;
  verified: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
  suspension?: AdminUserSuspension | null;
  banReason?: string | null;
  stats: AdminUserStats;
}

// ---------- Proposed backend response shape (AdminUserRead) ----------

export interface ApiAdminUser {
  user_id: string;
  email: string;
  account_status: AdminAccountStatus;
  // Proposed new field (backend currently only has boolean `is_admin`). Until the
  // migration lands, mapApiAdminUser() falls back to deriving this from is_admin.
  role?: AdminRole;
  is_admin: boolean;
  verified: boolean;
  created_at: string;
  last_login: string | null;
  profile: {
    username: string;
    first_name: string;
    last_name: string;
    avatar_url?: string | null;
  } | null;
  suspension?: {
    reason?: string | null;
    expires_at?: string | null;
  } | null;
  ban_reason?: string | null;
  stats: {
    gigs_posted: number;
    orders_completed: number;
    reviews_received: number;
    average_rating?: number | null;
  };
}

export interface AdminUserListResponse {
  items: ApiAdminUser[];
  total: number;
}

export function mapApiAdminUser(u: ApiAdminUser): AdminUser {
  return {
    id: u.user_id,
    email: u.email,
    username: u.profile?.username ?? "",
    firstName: u.profile?.first_name ?? "",
    lastName: u.profile?.last_name ?? "",
    avatarUrl: u.profile?.avatar_url ?? undefined,
    role: u.role ?? (u.is_admin ? "admin" : "user"),
    status: u.account_status,
    verified: u.verified,
    createdAt: u.created_at,
    lastLoginAt: u.last_login,
    suspension: u.suspension ?? undefined,
    banReason: u.ban_reason ?? undefined,
    stats: {
      gigsPosted: u.stats?.gigs_posted ?? 0,
      ordersCompleted: u.stats?.orders_completed ?? 0,
      reviewsReceived: u.stats?.reviews_received ?? 0,
      averageRating: u.stats?.average_rating ?? null,
    },
  };
}

export type SortField = "created_at" | "last_login" | "username" | "email";
export type SortOrder = "asc" | "desc";

export type BulkAction = "ban" | "unban" | "suspend" | "unsuspend" | "delete" | "set_role";

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
