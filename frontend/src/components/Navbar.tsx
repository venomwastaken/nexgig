import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, ArrowRight, Search, Plus, MessageCircle, ChevronDown, User as UserIcon, LogOut } from "lucide-react";
import { Show, useClerk, useUser } from "@clerk/react";
import Logo from "./Logo";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";

const NAV_LINKS = [
    { label: "Explore", to: "/gigs" },
    { label: "Contact Us", to: "/" },
];

function NavSearch({ className = "" }: { className?: string }) {
    const [value, setValue] = useState("");
    const navigate = useNavigate();

    const submit = () => {
        const q = value.trim();
        navigate(q ? `/gigs?q=${encodeURIComponent(q)}` : "/gigs");
    };

    return (
        <form
            role="search"
            onSubmit={(e) => {
                e.preventDefault();
                submit();
            }}
            className={`relative ${className}`}
        >
            <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B8F9B]"
            />
            <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Search gigs, skills, people…"
                className="py-4 w-full rounded-full border border-[#1F1F1F] bg-[#161616] pl-9 pr-4 text-sm text-[#ffffff] placeholder:text-[#6b6f78] outline-none transition-colors focus:border-[#1b976f]"
            />
        </form>
    );
}

export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useUser();
    const { signOut } = useClerk();

    const isActive = (to: string) =>
        to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

    const initials =
        [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join("") ||
        user?.username?.slice(0, 2) ||
        "U";

    const handleSignOut = () => {
        void signOut(() => navigate("/"));
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-[#1F1F1F] bg-[#0B0B0B]/95 backdrop-blur supports-backdrop-filter:bg-background/80">
            <div className="mx-auto flex py-3 items-center gap-6 px-6">
                <Link to="/" className="shrink-0">
                    <Logo />
                </Link>

                {/* Desktop nav */}
                <nav
                    className="hidden shrink-0 items-center gap-6 md:flex"
                >
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className={`text-sm transition-colors font- ${
                                isActive(link.to)
                                    ? "text-[#ffffff]"
                                    : "text-[#8B8F9B] hover:text-[#ffffff]"
                            }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                {/* Search */}
                <div className="hidden flex-1 md:flex md:justify-center">
                    <NavSearch className="w-full max-w-sm" />
                </div>

                <div className="ml-auto flex items-center gap-2 md:ml-0">
                    {/* Desktop auth actions */}
                    <div className="hidden items-center gap-2 md:flex">
                        <Show when="signed-out">
                            <Link
                                to="/login"
                                className="px-3 text-sm text-[#8B8F9B] transition-colors hover:text-[#ffffff]"
                            >
                                Log in
                            </Link>
                            <Link
                                to="/signup"
                                className="flex items-center gap-1.5 rounded-full bg-[#1b976f] px-4 py-2 text-sm font-medium text-[#0B0B0B] transition-opacity hover:opacity-90"
                            >
                                Sign up
                                <ArrowRight size={14} />
                            </Link>
                        </Show>
                        <Show when="signed-in">
                            <Link
                                to="/gig/create"
                            >
                                <Button variant="outline" className="bg-transparent rounded-full px-3! py-3!" size="lg">
                                    <Plus data-icon="inline-start"/>
                                    Create                                    
                                </Button>

                            </Link>
                            <Link
                                to="/messages"
                                aria-label="Messages"
                                
                            >
                                <Button variant="outline" className="rounded-full px-3! py-3! bg-transparent" size="icon-lg">
                                    <MessageCircle size={18} />
                                </Button>
                                
                            </Link>

                            <DropdownMenu>
                                <DropdownMenuTrigger className="flex items-center rounded-full py-2 px-2 outline-none transition-colors hover:bg-[#1F1F1F] data-popup-open:bg-[#1F1F1F] gap-2">
                                    <Avatar>
                                        <AvatarImage src={user?.imageUrl} alt={user?.fullName ?? "Account"} />
                                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                                    </Avatar>
                                    <ChevronDown size={18} className="text-[#8B8F9B]" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" sideOffset={10} className="w-56">
                                    <DropdownMenuGroup>
                                        <DropdownMenuLabel>
                                            <div className="flex flex-col gap-0.5 py-0.5">
                                                <span className="truncate text-sm font-medium text-foreground">
                                                    {user?.fullName || user?.username}
                                                </span>
                                                <span className="truncate text-xs text-muted-foreground">
                                                    {user?.primaryEmailAddress?.emailAddress}
                                                </span>
                                            </div>
                                        </DropdownMenuLabel>
                                    </DropdownMenuGroup>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => navigate("/account")}>
                                        <UserIcon />
                                        Account
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
                                        <LogOut />
                                        Sign out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </Show>
                    </div>

                    {/* Mobile toggle */}
                    <button
                        type="button"
                        className="flex items-center justify-center rounded-md p-2 text-[#8B8F9B] hover:text-[#ffffff] md:hidden"
                        onClick={() => setMobileOpen((open) => !open)}
                        aria-label={mobileOpen ? "Close menu" : "Open menu"}
                        aria-expanded={mobileOpen}
                    >
                        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="border-t border-[#1F1F1F] bg-[#0B0B0B] px-4 pb-6 pt-4 md:hidden">
                    <NavSearch className="mb-5" />

                    <nav
                        className="flex flex-col gap-4"
                        style={{ fontFamily: "'Space Grotesk', ui-sans-serif, system-ui" }}
                    >
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                onClick={() => setMobileOpen(false)}
                                className={`text-sm ${
                                    isActive(link.to)
                                        ? "text-[#ffffff]"
                                        : "text-[#8B8F9B] hover:text-[#ffffff]"
                                }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="mt-6 flex flex-col gap-3">
                        <Show when="signed-out">
                            <Link
                                to="/login"
                                onClick={() => setMobileOpen(false)}
                                className="rounded-md border-2 border-[#2F2F2F] bg-transparent px-4 py-2.5 text-center text-sm font-medium text-[#ffffff]"
                            >
                                Log in
                            </Link>
                            <Link
                                to="/signup"
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center justify-center gap-1.5 rounded-md bg-[#1b976f] px-4 py-2.5 text-sm font-medium text-[#0B0B0B]"
                            >
                                Sign up
                                <ArrowRight size={14} />
                            </Link>
                        </Show>
                        <Show when="signed-in">
                            <div className="flex items-center gap-3 rounded-md border border-[#2F2F2F] px-3 py-2.5">
                                <Avatar>
                                    <AvatarImage src={user?.imageUrl} alt={user?.fullName ?? "Account"} />
                                    <AvatarFallback>{initials}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <div className="truncate text-sm font-medium text-[#ffffff]">
                                        {user?.fullName || user?.username}
                                    </div>
                                    <div className="truncate text-xs text-[#8B8F9B]">
                                        {user?.primaryEmailAddress?.emailAddress}
                                    </div>
                                </div>
                            </div>
                            <Link
                                to="/gig/create"
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center justify-center gap-1.5 rounded-md bg-[#1b976f] px-4 py-2.5 text-center text-sm font-medium text-[#0B0B0B]"
                            >
                                <Plus size={16} />
                                Post a gig
                            </Link>
                            <Link
                                to="/messages"
                                onClick={() => setMobileOpen(false)}
                                className="rounded-md border-2 border-[#2F2F2F] bg-transparent px-4 py-2.5 text-center text-sm font-medium text-[#ffffff]"
                            >
                                Messages
                            </Link>
                            <Link
                                to="/account"
                                onClick={() => setMobileOpen(false)}
                                className="rounded-md border-2 border-[#2F2F2F] bg-transparent px-4 py-2.5 text-center text-sm font-medium text-[#ffffff]"
                            >
                                Account
                            </Link>
                            <button
                                type="button"
                                onClick={() => {
                                    setMobileOpen(false);
                                    handleSignOut();
                                }}
                                className="rounded-md border-2 border-[#3a2a2a] bg-transparent px-4 py-2.5 text-center text-sm font-medium text-[#f2a0a0]"
                            >
                                Sign out
                            </button>
                        </Show>
                    </div>
                </div>
            )}
        </header>
    );
}
