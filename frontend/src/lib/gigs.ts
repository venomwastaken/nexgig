export type Category = {
    label: string;
    value: string;
};

export const CATEGORIES: Category[] = [
    { label: "Tutoring & Lessons", value: "tutoring" },
    { label: "Design & Creative", value: "design" },
    { label: "Writing & Editing", value: "writing" },
    { label: "Tech & Programming", value: "tech" },
    { label: "Photography & Video", value: "photo-video" },
    { label: "Music & Audio", value: "music" },
    { label: "Errands & Delivery", value: "errands" },
    { label: "Event Help", value: "events" },
    { label: "Fitness & Sports Coaching", value: "fitness" },
    { label: "Beauty & Grooming", value: "beauty" },
    { label: "Moving & Labor", value: "moving" },
    { label: "Other", value: "other" },
];

export type DeliveryOption = {
    label: string;
    value: string;
};

export const DELIVERY_OPTIONS: DeliveryOption[] = [
    { label: "1 day", value: "1 day" },
    { label: "3 days", value: "3 days" },
    { label: "1 week", value: "1 week" },
    { label: "2 weeks", value: "2 weeks" },
    { label: "1 month", value: "1 month" },
];

export type Gig =   {
    title: string,
    description: string,
    price: number,
    id: string,
    provider: {
      user_id: string
      first_name: string,
      last_name: string,
      username: string,
      avatar_url?: string
    },
    status: string,
    created_at: string,
    tags: string[],
    // approval_status: "PENDING",
    // rejection_reason: string,
    // reviewed_at: string,
    // reviewed_by_id: string,
    category_name: string,
    banner_url?: string | null
    // {
    //   category_id: string,
    //   name: string,
    //   description: string
    // }
  }

// Shape returned by the backend's GigRead schema (backend/app/schemas.py).
export type ApiGig = {
  id: string;
  title: string;
  description: string;
  price: number;
  banner_url?: string | null;
  provider: Gig["provider"] | null;
  status: string;
  created_at: string;
  tags: { id: number; name: string }[];
  category_name: string | null;
};

export function mapApiGigToGig(g: ApiGig): Gig {
  return {
    id: g.id,
    title: g.title,
    description: g.description,
    price: g.price,
    banner_url: g.banner_url,
    provider: g.provider ?? {
      user_id: "",
      first_name: "Unknown",
      last_name: "Provider",
      username: "unknown",
    },
    status: g.status,
    created_at: g.created_at,
    tags: g.tags.map((t) => t.name),
    category_name: g.category_name ?? "Other",
  };
}


// {
//   id: string;
//   title: string;
//   category: string;
//   price: number;
//   currency: string;
//   description: string;
//   seller: { name: string; initials: string; department: string; rating?: number };
//   tags: string[];
//   turnaround: string;
// };

// export const GIGS: Gig[] = [
//   {
//     id: "logo-brand-kit",
//     title: "Minimalist logo & brand kit for your side project",
//     category: "Design",
//     price: 120,
//     description:
//       "Clean, modern logo design with color palette, typography guide, and social profile assets. Two revision rounds included.",
//     provider: {
//       user_id: "usr-ab1",
//       first_name: "Ama",
//       last_name: "Boateng",
//       username: "amaboateng",
//     },
//     tags: ["Logo", "Branding", "Figma"],
//     status: "active",
//     created_at: "2026-07-31T10:00:00Z"
//   },
//   {
//     id: "calc-tutor",
//     title: "1-on-1 Calculus tutoring — MATH 151 & 161",
//     category: "Tutoring",
//     price: 40,
//     description:
//       "Struggling with limits, derivatives or integrals? I'll walk you through past questions and build your intuition. Hour-long sessions.",
//     provider: {
//       user_id: "usr-ka1",
//       first_name: "Kwesi",
//       last_name: "Adom",
//       username: "kwesiadom",
//     },
//     tags: ["Math", "Tutoring", "Exam prep"],
//     status: "active",
//     created_at: "2026-07-31T11:15:00Z"
//   },
//   {
//     id: "essay-editor",
//     title: "Proofread & edit your term paper (up to 3,000 words)",
//     category: "Writing",
//     price: 60,
//     description:
//       "Grammar, flow, citations and structure. I return a clean copy plus a tracked-changes version so you can see every edit.",
//     provider: {
//       user_id: "usr-no1",
//       first_name: "Nana",
//       last_name: "Osei",
//       username: "nanaosei",
//       avatar_url: "https://example.com"
//     },
//     tags: ["Editing", "APA", "Proofreading"],
//     status: "active",
//     created_at: "2026-07-30T14:20:00Z"
//   },
//   {
//     id: "portrait-shoot",
//     title: "Campus portrait shoot — 20 edited photos",
//     category: "Photography",
//     price: 200,
//     description:
//       "Golden-hour portraits around Independence Hall or Paa Joe stadium. I bring the camera; you bring the fits.",
//     provider: {
//       user_id: "usr-ym1",
//       first_name: "Yaw",
//       last_name: "Mensah",
//       username: "yawmensah",
//       avatar_url: "https://example.com"
//     },
//     tags: ["Portraits", "Editing", "Outdoor"],
//     status: "active",
//     created_at: "2026-07-29T16:45:00Z"
//   },
//   {
//     id: "laptop-fix",
//     title: "Laptop diagnostics + Windows reinstall",
//     category: "Tech",
//     price: 80,
//     description:
//       "Slow laptop? Stuck on boot? I'll diagnose, back up your files, and give you a clean install with the drivers you need.",
//     provider: {
//       user_id: "usr-sk1",
//       first_name: "Selorm",
//       last_name: "Kudjo",
//       username: "selormk",
//       avatar_url: "https://example.com"
//     },
//     tags: ["Windows", "Repair", "Backup"],
//     status: "active",
//     created_at: "2026-07-31T08:00:00Z"
//   },
//   {
//     id: "reel-editor",
//     title: "Short-form video edit for IG / TikTok (up to 60s)",
//     category: "Video",
//     price: 90,
//     description:
//       "Send me raw clips and a vibe. I'll return a punchy, captioned reel ready to post. Music sync included.",
//     provider: {
//       user_id: "usr-at1",
//       first_name: "Adjoa",
//       last_name: "Twum",
//       username: "adjoatwum",
//       avatar_url: "https://example.com"
//     },
//     tags: ["Reels", "TikTok", "Captions"],
//     status: "active",
//     created_at: "2026-07-31T09:30:00Z"
//   },
//   {
//     id: "grocery-runs",
//     title: "Weekly grocery + laundry pickup runs",
//     category: "Errands",
//     price: 25,
//     description:
//       "Too much on your plate this week? I'll pick up from Tech Junction or Ayeduase and drop it at your hall.",
//     provider: {
//       user_id: "usr-ed1",
//       first_name: "Efua",
//       last_name: "Danso",
//       username: "efuadanso",
//       avatar_url: "https://example.com"
//     },
//     tags: ["Errands", "On-campus"],
//     status: "active",
//     created_at: "2026-07-31T11:00:00Z"
//   },
//   {
//     id: "resume-review",
//     title: "Internship-ready CV + LinkedIn tune-up",
//     category: "Writing",
//     price: 50,
//     description:
//       "I'll rewrite your CV for the roles you're targeting and rework your LinkedIn headline & about section.",
//     provider: {
//       user_id: "usr-ka2",
//       first_name: "Kojo",
//       last_name: "Amankwah",
//       username: "kojoamankwah",
//       avatar_url: "https://example.com"
//     },
//     tags: ["Career", "CV", "LinkedIn"],
//     status: "active",
//     created_at: "2026-07-28T12:00:00Z"
//   },
// ];
