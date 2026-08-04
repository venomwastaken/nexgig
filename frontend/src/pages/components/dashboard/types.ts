export type GigApprovalStatus = "pending" | "approved" | "rejected";

export interface GigSubmission {
  id: string;
  title: string;
  category: string;
  price: number;
  description: string;
  tags: string[];
  submittedAt: string;
  provider: {
    name: string;
    username: string;
    avatarUrl?: string;
  };
  status: GigApprovalStatus;
  rejectionReason?: string;
}

// Shape returned by the backend's GigRead schema (backend/app/schemas.py)
export interface ApiGigSubmission {
  id: string;
  title: string;
  description: string;
  price: number;
  category_name: string;
  tags: { id: number; name: string }[];
  created_at: string;
  provider: {
    user_id: string;
    first_name: string;
    last_name: string;
    username: string;
    avatar_url?: string | null;
  } | null;
  approval_status: "PENDING" | "APPROVED" | "REJECTED";
  rejection_reason?: string | null;
}

// ---------- Real dashboard data (current user + gigs they've posted) ----------

export interface Me {
  userId: string;
  firstName: string;
  lastName: string;
  username: string;
  avatarUrl?: string | null;
  availableTokens: number;
  tokensEscrowed: number;
}

// Shape returned by the backend's UserAccountWithProfile schema (backend/app/schemas.py)
export interface ApiMe {
  user_id: string;
  email: string;
  account_status: string;
  created_at: string;
  profile: {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    username: string;
    avatar_url?: string | null;
    bio?: string | null;
  } | null;
  wallet: {
    wallet_id: string;
    user_id: string;
    available_tokens: number | string;
    tokens_escrowed: number | string;
    total_services_provided: number;
    total_services_received: number;
  } | null;
}

export function mapApiMe(d: ApiMe): Me {
  return {
    userId: d.user_id,
    firstName: d.profile?.first_name ?? "there",
    lastName: d.profile?.last_name ?? "",
    username: d.profile?.username ?? "",
    avatarUrl: d.profile?.avatar_url ?? undefined,
    availableTokens: Number(d.wallet?.available_tokens ?? 0),
    tokensEscrowed: Number(d.wallet?.tokens_escrowed ?? 0),
  };
}

export type GigLifecycleStatus = "active" | "completed" | "paused";

export interface MyGig {
  id: string;
  title: string;
  description: string;
  price: number;
  categoryName: string;
  bannerUrl?: string | null;
  turnaroundTime: string;
  tags: string[];
  status: GigLifecycleStatus;
  approvalStatus: GigApprovalStatus;
  rejectionReason?: string | null;
  createdAt: string;
}

// Shape returned by the backend's GigRead schema (backend/app/schemas.py) for
// gigs owned by the current user (a subset of what GET /gigs/ returns).
export interface ApiMyGig {
  id: string;
  title: string;
  description: string;
  price: number;
  banner_url?: string | null;
  turnaround_time: string;
  provider: {
    user_id: string;
    first_name: string;
    last_name: string;
    username: string;
    avatar_url?: string | null;
  } | null;
  status: GigLifecycleStatus;
  created_at: string;
  tags: { id: number; name: string }[];
  category_name: string;
  approval_status: "PENDING" | "APPROVED" | "REJECTED";
  rejection_reason?: string | null;
}

export function mapApiMyGig(g: ApiMyGig): MyGig {
  return {
    id: g.id,
    title: g.title,
    description: g.description,
    price: g.price,
    categoryName: g.category_name,
    bannerUrl: g.banner_url,
    turnaroundTime: g.turnaround_time,
    tags: g.tags.map((t) => t.name),
    status: g.status,
    approvalStatus: g.approval_status.toLowerCase() as GigApprovalStatus,
    rejectionReason: g.rejection_reason ?? undefined,
    createdAt: g.created_at,
  };
}

// ---------- Incoming service requests (real bookings against gigs the user owns) ----------

export type OrderStatus = "requested" | "confirmed" | "in_progress" | "completed" | "cancelled";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  requested: "Requested",
  confirmed: "Confirmed",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  requested: "#d9a441",
  confirmed: "#1b976f",
  in_progress: "#3b82f6",
  completed: "#8a8a8a",
  cancelled: "#ef4444",
};

// The forward lifecycle a provider can advance a request through; matches
// the transitions the backend accepts in PATCH /orders/{id}/status.
export const ORDER_STATUS_ORDER: OrderStatus[] = [
  "requested",
  "confirmed",
  "in_progress",
  "completed",
];

export const nextOrderStatus = (current: OrderStatus): OrderStatus | null => {
  if (current === "cancelled") return null;
  const idx = ORDER_STATUS_ORDER.indexOf(current);
  if (idx === -1 || idx === ORDER_STATUS_ORDER.length - 1) return null;
  return ORDER_STATUS_ORDER[idx + 1];
};

export interface IncomingRequest {
  id: string;
  gigId: string;
  gigTitle: string;
  buyerName: string;
  buyerUsername: string;
  buyerAvatarUrl?: string;
  price: number;
  note?: string | null;
  status: OrderStatus;
  createdAt: string;
}

// Shape returned by the backend's OrderRead schema (backend/app/schemas.py)
export interface ApiOrder {
  id: string;
  gig_id: string;
  gig_title: string;
  buyer: {
    user_id: string;
    first_name: string;
    last_name: string;
    username: string;
    avatar_url?: string | null;
  };
  provider_id: string;
  provider: {
    user_id: string;
    first_name: string;
    last_name: string;
    username: string;
    avatar_url?: string | null;
  };
  price: number;
  note?: string | null;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

export function mapApiOrder(o: ApiOrder): IncomingRequest {
  return {
    id: o.id,
    gigId: o.gig_id,
    gigTitle: o.gig_title,
    buyerName: `${o.buyer.first_name} ${o.buyer.last_name}`,
    buyerUsername: o.buyer.username,
    buyerAvatarUrl: o.buyer.avatar_url ?? undefined,
    price: o.price,
    note: o.note,
    status: o.status,
    createdAt: o.created_at,
  };
}

// ---------- Ordered services (gigs the current user has booked as a buyer) ----------

export interface OrderedService {
  id: string;
  gigId: string;
  gigTitle: string;
  providerName: string;
  providerUsername: string;
  providerAvatarUrl?: string;
  price: number;
  note?: string | null;
  status: OrderStatus;
  createdAt: string;
}

export function mapApiOrderToOrderedService(o: ApiOrder): OrderedService {
  return {
    id: o.id,
    gigId: o.gig_id,
    gigTitle: o.gig_title,
    providerName: `${o.provider.first_name} ${o.provider.last_name}`,
    providerUsername: o.provider.username,
    providerAvatarUrl: o.provider.avatar_url ?? undefined,
    price: o.price,
    note: o.note,
    status: o.status,
    createdAt: o.created_at,
  };
}

export function mapApiGigSubmission(g: ApiGigSubmission): GigSubmission {
  return {
    id: g.id,
    title: g.title,
    category: g.category_name,
    price: g.price,
    description: g.description,
    tags: g.tags.map((t) => t.name),
    submittedAt: new Date(g.created_at).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    provider: g.provider
      ? {
          name: `${g.provider.first_name} ${g.provider.last_name}`,
          username: g.provider.username,
          avatarUrl: g.provider.avatar_url ?? undefined,
        }
      : { name: "Unknown provider", username: "unknown" },
    status: g.approval_status.toLowerCase() as GigApprovalStatus,
    rejectionReason: g.rejection_reason ?? undefined,
  };
}