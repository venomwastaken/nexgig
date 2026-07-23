import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ArrowRight } from "lucide-react";
import { Show, UserButton } from "@clerk/react";
import Logo from "./Logo";

const NAV_LINKS = [
    { label: "Home", to: "/" },
    { label: "Browse gigs", to: "/gigs" },
    { label: "Post a gig", to: "/gig/create" },
];

export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();

    const isActive = (to: string) =>
        to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

    return (
        <header className="sticky top-0 z-50 w-full border-b border-[#1F1F1F] bg-[#0B0B0B]/95 backdrop-blur supports-backdrop-filter:bg-[#0B0B0B]/80">
            <div className="mx-auto flex h-16 max-w-8xl items-center justify-between px-4 sm:px-6">
                <Link to="/" className="shrink-0">
                    <Logo />
                </Link>

                {/* Desktop nav */}
                <nav
                    className="hidden items-center gap-8 md:flex"
                    style={{ fontFamily: "'Space Grotesk', ui-sans-serif, system-ui" }}
                >
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className={`text-sm transition-colors ${
                                isActive(link.to)
                                    ? "text-[#ffffff]"
                                    : "text-[#8B8F9B] hover:text-[#ffffff]"
                            }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                {/* Desktop auth actions */}
                <div className="hidden items-center gap-4 md:flex">
                    <Show when="signed-out">
                        <Link
                            to="/login"
                            className="text-sm text-[#8B8F9B] hover:text-[#ffffff] transition-colors"
                        >
                            Log in
                        </Link>
                        <Link
                            to="/signup"
                            className="flex items-center gap-1.5 rounded-md bg-[#1b976f] px-4 py-2 text-sm font-medium text-[#0B0B0B] transition-opacity hover:opacity-90"
                        >
                            Sign up
                            <ArrowRight size={14} />
                        </Link>
                    </Show>
                    <Show when="signed-in">
                        <Link
                            to="/gig/create"
                            className="rounded-md bg-[#1b976f] px-4 py-2 text-sm font-medium text-[#0B0B0B] transition-opacity hover:opacity-90"
                        >
                            Post a gig
                        </Link>
                        <UserButton />
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

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="border-t border-[#1F1F1F] bg-[#0B0B0B] px-4 pb-6 pt-4 md:hidden">
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
                            <Link
                                to="/gig/create"
                                onClick={() => setMobileOpen(false)}
                                className="rounded-md bg-[#1b976f] px-4 py-2.5 text-center text-sm font-medium text-[#0B0B0B]"
                            >
                                Post a gig
                            </Link>
                            <div className="flex justify-center pt-1">
                                <UserButton />
                            </div>
                        </Show>
                    </div>
                </div>
            )}
        </header>
    );
}
