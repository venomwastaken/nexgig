import { useMemo } from "react";
import { ChevronRight, CheckCheck, Inbox } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";

function formatDayLabel(value: string) {
    const date = new Date(value);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const sameDay = (a: Date, b: Date) =>
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();

    if (sameDay(date, today)) return "Today";
    if (sameDay(date, yesterday)) return "Yesterday";
    return new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric", year: "numeric" }).format(date);
}

function formatTime(value: string) {
    return new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
    }).format(new Date(value));
}

export default function NotificationsPage() {
    const navigate = useNavigate();
    const { items, unreadCount, isLoading, hasMore, loadMore, markRead, markAllRead } = useNotifications();

    const grouped = useMemo(() => {
        return items.reduce<Record<string, typeof items>>((acc, item) => {
            const label = formatDayLabel(item.created_at);
            acc[label] = acc[label] || [];
            acc[label].push(item);
            return acc;
        }, {});
    }, [items]);

    return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-[#1F1F1F] bg-[linear-gradient(180deg,rgba(27,151,111,0.10),rgba(11,11,11,0.96)_38%)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-[#7ea894]">Inbox</p>
                        <h1 className="mt-2 text-3xl font-semibold text-white">Notifications</h1>
                        <p className="mt-2 max-w-2xl text-sm text-[#9aa0ab]">
                            Catch up on messages, bookings, and platform updates in one place.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button
                            variant="outline"
                            className="rounded-full border-[#2F2F2F] bg-transparent px-4"
                            onClick={() => void markAllRead()}
                            disabled={unreadCount === 0}
                        >
                            <CheckCheck size={16} />
                            Mark all read
                        </Button>
                    </div>
                </div>

                <div className="mt-8 space-y-8">
                    {isLoading && items.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-[#2F2F2F] bg-[#101010] px-6 py-16 text-center text-sm text-[#9aa0ab]">
                            Loading notifications...
                        </div>
                    ) : items.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-[#2F2F2F] bg-[#101010] px-6 py-16 text-center">
                            <Inbox className="mx-auto text-[#1b976f]" size={36} />
                            <h2 className="mt-4 text-lg font-semibold text-white">No notifications yet</h2>
                            <p className="mt-2 text-sm text-[#9aa0ab]">
                                You’ll see booking, message, and admin updates here as they arrive.
                            </p>
                        </div>
                    ) : (
                        Object.entries(grouped).map(([group, groupItems]) => (
                            <section key={group} className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7ea894]">
                                        {group}
                                    </h2>
                                    <div className="h-px flex-1 bg-[#1F1F1F]" />
                                </div>
                                <div className="space-y-3">
                                    {groupItems.map((notification) => (
                                        <button
                                            key={notification.id}
                                            type="button"
                                            onClick={async () => {
                                                await markRead(notification.id);
                                                if (notification.link) {
                                                    navigate(notification.link);
                                                }
                                            }}
                                            className={`flex w-full items-start gap-4 rounded-2xl border px-4 py-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#1b976f]/40 hover:bg-[#121212] ${notification.is_read ? "border-[#1F1F1F] bg-[#101010]" : "border-[#1b976f]/35 bg-[rgba(27,151,111,0.08)]"}`}
                                        >
                                            <span className={`mt-2 h-2.5 w-2.5 rounded-full ${notification.is_read ? "bg-[#343434]" : "bg-[#1b976f]"}`} />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                    <div>
                                                        <h3 className="text-base font-semibold text-white">
                                                            {notification.title}
                                                        </h3>
                                                        <p className="mt-1 text-sm leading-6 text-[#b0b6c2]">
                                                            {notification.body}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-[#8B8F9B]">
                                                        <span>{formatTime(notification.created_at)}</span>
                                                        {notification.link && <ChevronRight size={14} />}
                                                    </div>
                                                </div>
                                                {notification.link && (
                                                    <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#1b976f]">
                                                        Open linked item
                                                        <ChevronRight size={14} />
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </section>
                        ))
                    )}
                </div>

                <div className="mt-8 flex items-center justify-between gap-4 border-t border-[#1F1F1F] pt-6">
                    <p className="text-sm text-[#8B8F9B]">
                        Showing the latest notifications first.
                    </p>
                    <Button
                        variant="outline"
                        className="rounded-full border-[#2F2F2F] bg-transparent px-4"
                        onClick={() => void loadMore()}
                        disabled={!hasMore}
                    >
                        Load more
                    </Button>
                </div>
            </div>
        </div>
    );
}
