import { useAuth } from "@clerk/react";
import { useCallback, useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/messages";

// Mirrors useApi.ts's base URL normalization, then swaps http(s) for ws(s) —
// the WebSocket connects to the same backend, just a different scheme.
const rawBaseUrl =
    import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000";
const API_BASE_URL = rawBaseUrl.endsWith("/api/v1")
    ? rawBaseUrl
    : `${rawBaseUrl.replace(/\/$/, "")}/api/v1`;
const WS_BASE_URL = API_BASE_URL.replace(/^http/, "ws");

type OutgoingMessage = {
    body?: string;
    attachment_url?: string;
    attachment_type?: string;
};

const MAX_RETRIES = 5;

export function useConversationSocket(
    conversationId: string | undefined,
    onMessage: (message: ChatMessage) => void,
) {
    const { getToken } = useAuth();
    const socketRef = useRef<WebSocket | null>(null);
    const onMessageRef = useRef(onMessage);
    onMessageRef.current = onMessage;

    useEffect(() => {
        if (!conversationId) return;

        let cancelled = false;
        let attempt = 0;
        let retryTimeout: ReturnType<typeof setTimeout> | undefined;

        async function connect() {
            const token = await getToken();
            if (cancelled || !token) return;

            const socket = new WebSocket(
                `${WS_BASE_URL}/messaging/ws/${conversationId}?token=${encodeURIComponent(token)}`,
            );
            socketRef.current = socket;

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data && !data.error) {
                        onMessageRef.current(data as ChatMessage);
                    }
                } catch {
                    // ignore malformed frames
                }
            };

            socket.onclose = (event) => {
                // 1000 = we closed it intentionally (unmount/id change), 1008 = the
                // server rejected auth/authorization — neither is worth retrying.
                if (cancelled || event.code === 1000 || event.code === 1008) return;
                if (attempt >= MAX_RETRIES) return;
                const delay = Math.min(1000 * 2 ** attempt, 10000);
                attempt += 1;
                retryTimeout = setTimeout(connect, delay);
            };
        }

        connect();

        return () => {
            cancelled = true;
            if (retryTimeout) clearTimeout(retryTimeout);
            socketRef.current?.close(1000);
            socketRef.current = null;
        };
    }, [conversationId, getToken]);

    const sendMessage = useCallback((payload: OutgoingMessage) => {
        const socket = socketRef.current;
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(payload));
        }
    }, []);

    return { sendMessage };
}
