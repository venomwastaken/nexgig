import { User, Gig } from "./types";

export const CURRENT_USER_ID = "u1";

export const users: User[] = [
  { id: "u1", name: "Joshua", role: "freelancer", rating: 4.9, reviewCount: 21 },
  { id: "u2", name: "Efua Owusu", role: "admin", rating: 4.7, reviewCount: 15 },
];

export const categoryNames = [
  { id: "CAT-1", name: "Web Development" },
  { id: "CAT-2", name: "Graphic Design" },
  { id: "CAT-3", name: "Data Entry" },
];

export const gigs: Gig[] = [
  { id: "TX-1042", userId: "u1", categoryId: "CAT-1", title: "Landing page redesign", client: "Ama K.", amount: 450, paymentStatus: "pending", projectStatus: "requested", date: "Jul 24" },
  { id: "TX-1038", userId: "u1", categoryId: "CAT-2", title: "Logo + brand kit", client: "Kwabena O.", amount: 180, paymentStatus: "completed", projectStatus: "completed", date: "Jul 20" },
  { id: "TX-1031", userId: "u1", categoryId: "CAT-3", title: "CSV data cleanup", client: "Efua T.", amount: 90, paymentStatus: "refunded", projectStatus: "cancelled", date: "Jul 15" },
  { id: "TX-1050", userId: "u1", categoryId: "CAT-1", title: "Portfolio website", client: "Yaw A.", amount: 620, paymentStatus: "pending", projectStatus: "in_progress", date: "Jul 26" },
  { id: "TX-1051", userId: "u2", categoryId: "CAT-2", title: "Business card design", client: "Adjoa P.", amount: 75, paymentStatus: "completed", projectStatus: "completed", date: "Jul 22" },
];

import { ServiceListing } from "./types";

export const services: ServiceListing[] = [
  { id: "SVC-1", title: "Landing page redesign", categoryId: "CAT-1", price: 450, description: "A modern, responsive landing page revamp." },
  { id: "SVC-2", title: "Portfolio website", categoryId: "CAT-1", price: 620, description: "A full personal portfolio site, built and deployed." },
  { id: "SVC-3", title: "Logo + brand kit", categoryId: "CAT-2", price: 180, description: "Logo, colour palette, and basic brand guidelines." },
  { id: "SVC-4", title: "Business card design", categoryId: "CAT-2", price: 75, description: "Print-ready business card design, 2 concepts." },
  { id: "SVC-5", title: "CSV data cleanup", categoryId: "CAT-3", price: 90, description: "Cleaning and structuring messy spreadsheet data." },
];

import { Notification } from "./types";

export const notifications: Notification[] = [
  {
    id: "N1",
    userId: "u1",
    message: "Ama K. sent GH₵450 into escrow for \"Landing page redesign.\"",
    date: "Jul 24",
    read: false,
  },
  {
    id: "N2",
    userId: "u1",
    message: "Yaw A. requested \"Portfolio website.\"",
    date: "Jul 26",
    read: false,
  },
  {
    id: "N3",
    userId: "u1",
    message: "Your gig \"Logo + brand kit\" was marked completed.",
    date: "Jul 20",
    read: true,
  },
];