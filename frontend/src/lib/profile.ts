import type { AxiosInstance } from "axios";

// ---------------------------------------------------------------------------
// Base identity profile — backed by the real backend (`UserProfile` model,
// `/api/v1/users/me/profile` endpoints). Shape mirrors `UserProfileRead` in
// backend/app/schemas.py.
// ---------------------------------------------------------------------------

/** Shape returned by the backend's UserProfileRead schema (backend/app/schemas.py) */
export interface ApiUserProfile {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    username: string;
    dob?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
    university?: string | null;
    created_at: string;
    updated_at: string;
}

export interface BaseProfile {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    username: string;
    avatarUrl: string;
    bio: string;
    university: string;
    createdAt: string;
    updatedAt: string;
}

export function mapApiUserProfileToBaseProfile(p: ApiUserProfile): BaseProfile {
    return {
        id: p.id,
        userId: p.user_id,
        firstName: p.first_name,
        lastName: p.last_name,
        username: p.username,
        avatarUrl: p.avatar_url ?? "",
        bio: p.bio ?? "",
        university: p.university ?? "",
        createdAt: p.created_at,
        updatedAt: p.updated_at,
    };
}

export interface BaseProfileInput {
    firstName: string;
    lastName: string;
    username: string;
    avatarUrl?: string;
    bio?: string;
    university?: string;
}

/** POST /users/me/profile — creates the profile if none exists, otherwise upserts it. */
export async function createOrUpdateBaseProfile(
    api: AxiosInstance,
    input: BaseProfileInput,
): Promise<BaseProfile> {
    const res = await api.post<ApiUserProfile>("/users/me/profile", {
        first_name: input.firstName,
        last_name: input.lastName,
        username: input.username,
        avatar_url: input.avatarUrl || null,
        bio: input.bio || null,
        university: input.university || null,
    });
    return mapApiUserProfileToBaseProfile(res.data);
}

/** PATCH /users/me/profile — 404s if the caller has no profile row yet (use create instead). */
export async function patchBaseProfile(
    api: AxiosInstance,
    input: Partial<BaseProfileInput>,
): Promise<BaseProfile> {
    const res = await api.patch<ApiUserProfile>("/users/me/profile", {
        ...(input.firstName !== undefined && { first_name: input.firstName }),
        ...(input.lastName !== undefined && { last_name: input.lastName }),
        ...(input.username !== undefined && { username: input.username }),
        ...(input.avatarUrl !== undefined && { avatar_url: input.avatarUrl }),
        ...(input.bio !== undefined && { bio: input.bio }),
        ...(input.university !== undefined && { university: input.university }),
    });
    return mapApiUserProfileToBaseProfile(res.data);
}

// ---------------------------------------------------------------------------
// Extended freelancer-profile fields — professional title, department, year
// of study, location, skills, portfolio, and contact links. None of this
// exists in the backend yet (no columns, no endpoints), so it's persisted
// to localStorage as a MOCK SERVICE with the same async signature a real API
// call would have. Swap the bodies of `getExtendedProfile` /
// `saveExtendedProfile` for real HTTP calls once endpoints like
//   GET/PUT /api/v1/users/me/profile/extended
//   POST/PUT/DELETE /api/v1/users/me/portfolio/:id
// exist on the backend — callers won't need to change.
// ---------------------------------------------------------------------------

export interface PortfolioItem {
    id: string;
    title: string;
    description: string;
    technologies: string[];
    imageUrl?: string;
    githubUrl?: string;
    demoUrl?: string;
}

export interface ContactInfo {
    email?: string;
    phone?: string;
    linkedin?: string;
    github?: string;
    website?: string;
    twitter?: string;
}

export interface ExtendedProfile {
    professionalTitle: string;
    department: string;
    yearOfStudy: string;
    location: string;
    skills: string[];
    portfolio: PortfolioItem[];
    contact: ContactInfo;
}

export function emptyExtendedProfile(): ExtendedProfile {
    return {
        professionalTitle: "",
        department: "",
        yearOfStudy: "",
        location: "",
        skills: [],
        portfolio: [],
        contact: {},
    };
}

export const YEAR_OF_STUDY_OPTIONS = [
    "1st Year",
    "2nd Year",
    "3rd Year",
    "4th Year",
    "5th Year",
    "Graduate",
    "Postgraduate",
] as const;

export const SUGGESTED_SKILLS = [
    "UI/UX Design",
    "Web Development",
    "Mobile Development",
    "Graphic Design",
    "Content Writing",
    "Video Editing",
    "Data Analysis",
] as const;

const EXTENDED_PROFILE_STORAGE_PREFIX = "nexgig:freelancer-profile:";

function storageKey(userId: string) {
    return `${EXTENDED_PROFILE_STORAGE_PREFIX}${userId}`;
}

/** Simulates network latency so loading states in the UI are real, not instant. */
function withMockLatency<T>(value: T, ms = 250): Promise<T> {
    return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/**
 * MOCK SERVICE (placeholder). Returns `null` when the user has never saved
 * an extended profile — the frontend treats that as "no freelancer profile
 * yet" and shows the empty state / Create Profile prompt.
 */
export async function getExtendedProfile(userId: string): Promise<ExtendedProfile | null> {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return withMockLatency(null);
    try {
        const parsed = JSON.parse(raw) as ExtendedProfile;
        return withMockLatency({ ...emptyExtendedProfile(), ...parsed });
    } catch {
        return withMockLatency(null);
    }
}

/** MOCK SERVICE (placeholder). Persists the full extended profile blob. */
export async function saveExtendedProfile(
    userId: string,
    data: ExtendedProfile,
): Promise<ExtendedProfile> {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(data));
    return withMockLatency(data);
}

const URL_FIELDS: (keyof ContactInfo)[] = ["linkedin", "github", "website", "twitter"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidUrl(value: string): boolean {
    try {
        new URL(value);
        return true;
    } catch {
        return false;
    }
}

/** Validates the contact-info sub-form; returns an errors map (empty = valid). */
export function validateContact(contact: ContactInfo): Partial<Record<keyof ContactInfo, string>> {
    const errors: Partial<Record<keyof ContactInfo, string>> = {};

    if (contact.email && !EMAIL_RE.test(contact.email)) {
        errors.email = "Enter a valid email address";
    }

    for (const field of URL_FIELDS) {
        const value = contact[field];
        if (value && !isValidUrl(value)) {
            errors[field] = "Enter a valid URL (including https://)";
        }
    }

    return errors;
}

export function makePortfolioItemId(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }
    return `portfolio-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
