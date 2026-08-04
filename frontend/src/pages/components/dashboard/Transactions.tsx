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

export interface Category {
  id: string;
  name: string;
  activeGigs: number;
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