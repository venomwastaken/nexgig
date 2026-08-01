import { Gig, Transaction, ServiceRequest, Category } from "./types";

export const gigsForUser = (gigs: Gig[], userId: string): Gig[] =>
  gigs.filter((g) => g.userId === userId);

export const gigToTransaction = (g: Gig): Transaction => ({
  id: g.id,
  gigTitle: g.title,
  counterparty: g.client,
  amount: `GH₵ ${g.amount.toLocaleString()}`,
  status: g.paymentStatus,
  date: g.date,
});

export const gigToServiceRequest = (g: Gig): ServiceRequest => ({
  id: g.id,
  title: g.title,
  client: g.client,
  status: g.projectStatus,
  updatedAt: g.date,
});

export const buildCategories = (
  names: { id: string; name: string }[],
  allGigs: Gig[]
): Category[] =>
  names.map((c) => ({
    id: c.id,
    name: c.name,
    activeGigs: allGigs.filter(
      (g) =>
        g.categoryId === c.id &&
        !["completed", "cancelled"].includes(g.projectStatus)
    ).length,
  }));

export const computeStats = (gigs: Gig[]) => {
  const completed = gigs.filter((g) => g.paymentStatus === "completed");
  const pending = gigs.filter((g) => g.paymentStatus === "pending");
  return {
    availableBalance: completed.reduce((s, g) => s + g.amount, 0),
    inEscrow: pending.reduce((s, g) => s + g.amount, 0),
    activeGigs: gigs.filter((g) =>
      ["requested", "confirmed", "in_progress"].includes(g.projectStatus)
    ).length,
    needsReply: gigs.filter((g) => g.projectStatus === "requested").length,
  };
};

export const STATUS_ORDER: ServiceRequest["status"][] = [
  "requested",
  "confirmed",
  "in_progress",
  "completed",
];

export const nextStatus = (
  current: ServiceRequest["status"]
): ServiceRequest["status"] | null => {
  if (current === "cancelled") return null;
  const idx = STATUS_ORDER.indexOf(current);
  if (idx === -1 || idx === STATUS_ORDER.length - 1) return null;
  return STATUS_ORDER[idx + 1];
};

import { Notification } from "./types";

export const notificationsForUser = (
  notifications: Notification[],
  userId: string
): Notification[] => notifications.filter((n) => n.userId === userId);