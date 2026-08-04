import {
    Avatar,
    AvatarBadge,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import { useUser } from "@clerk/react";
import { Search, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface TopbarProps {
    avatarUrl?: string | null;
}

const Topbar = ({ avatarUrl }: TopbarProps) => {
    const { user } = useUser();
    const initials =
        [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join("") ||
        user?.username?.slice(0, 2) ||
        "U";

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 relative">
            <div
                className="text-2xl tracking-tight ml-0"
                style={{
                    fontFamily: "'Syne', ui-sans-serif, system-ui",
                    fontWeight: 700,
                }}
            >
                <span className="text-[#ffffff]">Nex</span>
                <span className="text-[#1b976f]">Gig</span>
            </div>

            <div className="relative order-3 sm:order-0 w-full sm:flex-1 sm:max-w-md sm:mx-6">
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
                <Link
                    to="/messages"
                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#1b1b1b] transition-colors"
                >
                    <MessageCircle size={19} className="text-[#f5f5f4]" />
                </Link>

                <Link to="/account">
                    <Avatar>
                        <AvatarImage
                            src={user?.imageUrl}
                            alt={user?.fullName ?? "Account"}
                        />
                        <AvatarFallback className="text-xs">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                </Link>
            </div>
        </div>
    );
};

export default Topbar;
