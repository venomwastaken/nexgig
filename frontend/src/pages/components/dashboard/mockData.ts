import { User, Gig, GigSubmission } from "./types";

export const CURRENT_USER_ID = "u1";

export const users: User[] = [
  { id: "u1", name: "Joshua", role: "freelancer", rating: 4.9, reviewCount: 21 },
  { id: "u2", name: "Efua Owusu", role: "admin", rating: 4.7, reviewCount: 15 },
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

export const gigSubmissions: GigSubmission[] = [
  {
    id: "GIG-2101",
    title: "Minimalist logo & brand kit for your side project",
    category: "Design",
    price: 120,
    description:
      "Clean, modern logo design with color palette, typography guide, and social profile assets. Two revision rounds included.",
    tags: ["Logo", "Branding", "Figma"],
    submittedAt: "Aug 2",
    provider: { name: "Ama Boateng", username: "amaboateng" },
    status: "pending",
  },
  {
    id: "GIG-2102",
    title: "1-on-1 Calculus tutoring — MATH 151 & 161",
    category: "Tutoring",
    price: 40,
    description:
      "Struggling with limits, derivatives or integrals? I'll walk you through past questions and build your intuition.",
    tags: ["Math", "Tutoring", "Exam prep"],
    submittedAt: "Aug 2",
    provider: { name: "Kwesi Adom", username: "kwesiadom" },
    status: "pending",
  },
  {
    id: "GIG-2098",
    title: "Weekly grocery + laundry pickup runs",
    category: "Errands",
    price: 25,
    description:
      "Too much on your plate this week? I'll pick up from Tech Junction or Ayeduase and drop it at your hall.",
    tags: ["Errands", "On-campus"],
    submittedAt: "Aug 1",
    provider: { name: "Efua Danso", username: "efuadanso" },
    status: "pending",
  },
  {
    id: "GIG-2095",
    title: "Campus portrait shoot — 20 edited photos",
    category: "Photography",
    price: 200,
    description:
      "Golden-hour portraits around Independence Hall or Paa Joe stadium. I bring the camera; you bring the fits.",
    tags: ["Portraits", "Editing", "Outdoor"],
    submittedAt: "Jul 30",
    provider: { name: "Yaw Mensah", username: "yawmensah" },
    status: "approved",
  },
  {
    id: "GIG-2090",
    title: "Sell my old textbooks and notes as PDFs",
    category: "Other",
    price: 15,
    description: "Scanned copies of last semester's course notes, sold per course.",
    tags: ["Notes", "PDF"],
    submittedAt: "Jul 28",
    provider: { name: "Kojo Amankwah", username: "kojoamankwah" },
    status: "rejected",
    rejectionReason: "Reselling copyrighted course material isn't allowed on the platform.",
  },
];