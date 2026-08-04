export interface Transaction {
  id: string;
  gigTitle: string;
  counterparty: string;
  amount: string;
  status: "pending" | "completed" | "refunded";
  date: string;
}

export interface ServiceRequest {
  id: string;
  title: string;
  client: string;
  status: "requested" | "confirmed" | "in_progress" | "completed" | "cancelled";
  updatedAt: string;
}

export const REQUEST_STATUS_LABELS: Record<ServiceRequest["status"], string> = {
  requested: "Requested",
  confirmed: "Confirmed",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const REQUEST_STATUS_COLORS: Record<ServiceRequest["status"], string> = {
  requested: "#d9a441",
  confirmed: "#1b976f",
  in_progress: "#3b82f6",
  completed: "#8a8a8a",
  cancelled: "#ef4444",
};

/* --- Added: links a real user to a real gig, so Transaction/ServiceRequest/Category
   can all be derived from one source instead of three disconnected mocks --- */

export interface User {
  id: string;
  name: string;
  role: "freelancer" | "admin";
  rating: number;
  reviewCount: number;
}

export interface Gig {
  id: string;
  userId: string;
  categoryId: string;
  title: string;
  client: string;
  amount: number;
  paymentStatus: Transaction["status"];
  projectStatus: ServiceRequest["status"];
  date: string;
}

export interface ServiceListing {
  id: string;
  title: string;
  categoryId: string;
  price: number;
  description: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  date: string;
  read: boolean;
}

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