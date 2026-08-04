import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { useAuth } from "@clerk/react";
import {
    buildNotificationsSocketUrl,
    fetchNotifications,
    fetchUnreadCount,
    markAllRead as markAllReadRequest,
    markRead as markReadRequest,
    type Notification,
} from "@/lib/notifications";

const PAGE_SIZE = 20;

type NotificationsContextValue = {
    items: Notification[];
    unreadCount: number;
    isLoading: boolean;
    hasMore: boolean;
    refresh: () => Promise<void>;
    loadMore: () => Promise<void>;
    markRead: (id: string) => Promise<void>;
    markAllRead: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
    const { isLoaded, isSignedIn, getToken } = useAuth();
    const [items, setItems] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const restOffsetRef = useRef(0);
    const socketRef = useRef<WebSocket | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const cancelledRef = useRef(false);

    const clearPoll = useCallback(() => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    }, []);

    const syncUnreadCount = useCallback(async () => {
        const token = await getToken();
        if (!token) return;
        const data = await fetchUnreadCount(token);
        setUnreadCount(data.count);
    }, [getToken]);

    const refresh = useCallback(async () => {
        const token = await getToken();
        if (!token) return;
        setIsLoading(true);
        try {
            const [page, count] = await Promise.all([
                fetchNotifications(token, false, PAGE_SIZE, 0),
                fetchUnreadCount(token),
            ]);
            restOffsetRef.current = page.length;
            setItems(page);
            setHasMore(page.length === PAGE_SIZE);
            setUnreadCount(count.count);
        } finally {
            setIsLoading(false);
        }
    }, [getToken]);

    const loadMore = useCallback(async () => {
        const token = await getToken();
        if (!token || !hasMore) return;
        const page = await fetchNotifications(token, false, PAGE_SIZE, restOffsetRef.current);
        restOffsetRef.current += page.length;
        setItems((current) => {
            const existing = new Set(current.map((item) => item.id));
            return [...current, ...page.filter((item) => !existing.has(item.id))];
        });
        setHasMore(page.length === PAGE_SIZE);
    }, [getToken, hasMore]);

    const markRead = useCallback(
        async (id: string) => {
            const token = await getToken();
            if (!token) return;
            const wasUnread = items.some((item) => item.id === id && !item.is_read);
            const updated = await markReadRequest(token, id);
            setItems((current) =>
                current.map((item) => (item.id === updated.id ? updated : item)),
            );
            if (!updated.is_read || !wasUnread) return;
            setUnreadCount((count) => Math.max(0, count - 1));
        },
        [getToken, items],
    );

    const markAllRead = useCallback(async () => {
        const token = await getToken();
        if (!token) return;
        await markAllReadRequest(token);
        setItems((current) => current.map((item) => ({ ...item, is_read: true, read_at: item.read_at ?? new Date().toISOString() })));
        setUnreadCount(0);
    }, [getToken]);

    useEffect(() => {
        cancelledRef.current = false;

        if (!isLoaded) return;
        if (!isSignedIn) {
            socketRef.current?.close(1000);
            socketRef.current = null;
            clearPoll();
            restOffsetRef.current = 0;
            setItems([]);
            setUnreadCount(0);
            setHasMore(false);
            setIsLoading(false);
            return;
        }

        void refresh().catch(() => undefined);

        let retryTimeout: ReturnType<typeof setTimeout> | undefined;

        const connect = async () => {
            const token = await getToken();
            if (!token || cancelledRef.current) return;

            const socket = new WebSocket(buildNotificationsSocketUrl(token));
            socketRef.current = socket;

            socket.onmessage = (event) => {
                try {
                    const notification = JSON.parse(event.data) as Notification;
                    setItems((current) =>
                        current.some((item) => item.id === notification.id)
                            ? current
                            : [notification, ...current],
                    );
                    setUnreadCount((count) => count + 1);
                } catch {
                    // ignore malformed frames
                }
            };

            socket.onclose = (event) => {
                if (cancelledRef.current || event.code === 1000 || event.code === 1008) return;
                clearPoll();
                pollRef.current = setInterval(() => {
                    void syncUnreadCount();
                }, 30_000);
                retryTimeout = setTimeout(() => {
                    void connect().catch(() => undefined);
                }, 30_000);
            };
        };

        void connect().catch(() => undefined);

        return () => {
            cancelledRef.current = true;
            clearPoll();
            if (retryTimeout) clearTimeout(retryTimeout);
            socketRef.current?.close(1000);
            socketRef.current = null;
        };
    }, [clearPoll, getToken, isLoaded, isSignedIn, refresh, syncUnreadCount]);

    const value = useMemo<NotificationsContextValue>(
        () => ({
            items,
            unreadCount,
            isLoading,
            hasMore,
            refresh,
            loadMore,
            markRead,
            markAllRead,
        }),
        [hasMore, isLoading, items, loadMore, markAllRead, markRead, refresh, unreadCount],
    );

    return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
    const ctx = useContext(NotificationsContext);
    if (!ctx) throw new Error("useNotifications must be used within a NotificationsProvider");
    return ctx;
}
