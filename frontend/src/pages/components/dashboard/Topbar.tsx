import { useState } from "react";
import { Search, Bell, MessageCircle } from "lucide-react";
import { Notification } from "./types";

interface TopbarProps {
  notifications: Notification[];
  onMarkRead?: (id: string) => void;
}

const Topbar = ({ notifications, onMarkRead }: TopbarProps) => {
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 relative">
      <div
        className="text-2xl tracking-tight ml-0 sm:ml-12"
        style={{ fontFamily: "'Syne', ui-sans-serif, system-ui", fontWeight: 700 }}
      >
        <span className="text-[#ffffff]">Nex</span>
        <span className="text-[#1b976f]">Gig</span>
      </div>

      <div className="relative order-3 sm:order-none w-full sm:flex-1 sm:max-w-md sm:mx-6">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a8a8a]"
        />
        <input
          type="text"
          placeholder="What service are you looking for today?"
          className="w-full bg-[#1b1b1b] border border-[#2a2a2a] rounded-full pl-11 pr-4 py-2.5 text-sm text-[#f5f5f4] outline-none focus:border-[#1b976f] placeholder:text-[#8a8a8a]"
        />
      </div>

      <div className="flex gap-4 items-center ml-auto">
        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#1b1b1b] transition-colors"
          >
            <Bell size={19} className="text-[#f5f5f4]" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[15px] h-[15px] px-[3px] flex items-center justify-center rounded-full bg-[#1b976f] text-[9px] font-semibold text-[#0f0f0f]">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-11 w-72 bg-[#1b1b1b] border border-[#2a2a2a] rounded-lg shadow-lg z-20 overflow-hidden">
              <div className="px-4 py-3 border-b border-[#2a2a2a] flex items-center justify-between">
                <p className="text-sm font-medium text-[#f5f5f4]">Notifications</p>
                {unreadCount > 0 && (
                  <span className="text-[10px] text-[#8a8a8a]">{unreadCount} unread</span>
                )}
              </div>

              {notifications.length === 0 ? (
                <p className="text-xs text-[#8a8a8a] px-4 py-6 text-center">
                  No notifications yet.
                </p>
              ) : (
                <div className="max-h-72 overflow-y-auto divide-y divide-[#2a2a2a]">
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => onMarkRead?.(n.id)}
                      className="w-full text-left px-4 py-3 flex gap-2.5 hover:bg-[#242424] transition-colors"
                    >
                      <span
                        className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${n.read ? "bg-transparent" : "bg-[#1b976f]"
                          }`}
                      />
                      <div>
                        <p className={`text-xs leading-snug ${n.read ? "text-[#8a8a8a]" : "text-[#f5f5f4]"}`}>
                          {n.message}
                        </p>
                        <p className="text-[10px] text-[#8a8a8a] mt-1">{n.date}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#1b1b1b] transition-colors">
          <MessageCircle size={19} className="text-[#f5f5f4]" />
        </button>

        <img
          src="https://placehold.co/40"
          alt="profile"
          className="rounded-full w-9 h-9"
        />
      </div>
    </div>
  );
};

export default Topbar;