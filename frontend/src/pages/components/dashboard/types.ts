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