import { useMemo } from "react";
import { Bell, Clock3, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useNotifications } from "@/hooks/useNotifications";

function formatTime(value: string) {
    return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(new Date(value));
}

export default function NotificationBell() {
    const navigate = useNavigate();
    const { items, unreadCount, markRead } = useNotifications();

    const recentItems = useMemo(() => items.slice(0, 5), [items]);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="relative inline-flex size-9 items-center justify-center rounded-full border border-[#2F2F2F] bg-transparent outline-none transition-colors hover:bg-[#1F1F1F] data-popup-open:bg-[#1F1F1F]" aria-label="Notifications">
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 min-w-5 rounded-full bg-[#1b976f] px-1.5 py-0.5 text-[11px] font-semibold leading-none text-[#0B0B0B]">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={10} className="w-[22rem] p-2">
                <div className="flex items-center justify-between px-2 pb-2 pt-1">
                    <div>
                        <div className="text-sm font-semibold text-foreground">Notifications</div>
                        <div className="text-xs text-muted-foreground">Live updates and unread items</div>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate("/notifications")}
                        className="text-xs font-medium text-[#1b976f] transition-colors hover:opacity-80"
                    >
                        View all
                    </button>
                </div>
                <DropdownMenuSeparator />
                <div className="max-h-[24rem] overflow-y-auto py-1">
                    {recentItems.length === 0 ? (
                        <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                            No notifications yet.
                        </div>
                    ) : (
                        recentItems.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                onClick={() => {
                                    void markRead(notification.id);
                                    navigate(notification.link || "/notifications");
                                }}
                                className="flex items-start gap-3 rounded-xl px-3 py-3"
                            >
                                <div className={`mt-0.5 h-2.5 w-2.5 rounded-full ${notification.is_read ? "bg-[#343434]" : "bg-[#1b976f]"}`} />
                                <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="truncate text-sm font-medium text-foreground">
                                            {notification.title}
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                            <Clock3 size={11} />
                                            {formatTime(notification.created_at)}
                                        </span>
                                    </div>
                                    <p className="line-clamp-2 text-sm text-muted-foreground">
                                        {notification.body}
                                    </p>
                                    {notification.link && (
                                        <span className="inline-flex items-center gap-1 text-xs text-[#1b976f]">
                                            Open item <ExternalLink size={11} />
                                        </span>
                                    )}
                                </div>
                            </DropdownMenuItem>
                        ))
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
