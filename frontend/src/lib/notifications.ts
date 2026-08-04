const rawBaseUrl =
    import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000";
const API_BASE_URL = rawBaseUrl.endsWith("/api/v1")
    ? rawBaseUrl
    : `${rawBaseUrl.replace(/\/$/, "")}/api/v1`;

export type NotificationType =
    | "message"
    | "booking_created"
    | "booking_accepted"
    | "booking_declined"
    | "booking_completed"
    | "booking_cancelled"
    | "admin_update"
    | "system";

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    link: string | null;
    is_read: boolean;
    created_at: string;
    actor_id?: string | null;
    entity_type?: string | null;
    entity_id?: string | null;
    read_at?: string | null;
}

function buildUrl(path: string) {
    return `${API_BASE_URL}${path}`;
}

async function requestJson<T>(
    path: string,
    token: string,
    init?: RequestInit,
): Promise<T> {
    const res = await fetch(buildUrl(path), {
        ...init,
        headers: {
            Authorization: `Bearer ${token}`,
            ...(init?.headers || {}),
        },
    });
    if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
    }
    if (res.status === 204) {
        return undefined as T;
    }
    return (await res.json()) as T;
}

export async function fetchNotifications(
    token: string,
    unreadOnly = false,
    limit = 20,
    offset = 0,
) {
    const query = new URLSearchParams({
        unread_only: String(unreadOnly),
        limit: String(limit),
        offset: String(offset),
    });
    return requestJson<Notification[]>(`/notifications?${query.toString()}`, token);
}

export async function fetchUnreadCount(token: string) {
    return requestJson<{ count: number }>("/notifications/unread-count", token);
}

export async function markRead(token: string, id: string) {
    return requestJson<Notification>(`/notifications/${id}/read`, token, {
        method: "POST",
    });
}

export async function markAllRead(token: string) {
    return requestJson<{ marked_read: number }>("/notifications/read-all", token, {
        method: "POST",
    });
}

export function buildNotificationsSocketUrl(token: string) {
    const wsBaseUrl = API_BASE_URL.replace(/^http/, "ws");
    return `${wsBaseUrl}/ws/notifications?token=${encodeURIComponent(token)}`;
}
