import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import Logo from "./Logo";

const PRODUCT_LINKS = [
    { label: "Home", to: "/" },
    { label: "Browse gigs", to: "/gigs" },
    { label: "Post a gig", to: "/gig/create" },
];

const ACCOUNT_LINKS = [
    { label: "Log in", to: "/login" },
    { label: "Sign up", to: "/signup" },
];

const COMPANY_LINKS = [
    { label: "About us", to: "/about" },
    { label: "FAQ", to: "/faq" },
    { label: "Contact us", to: "/contact" },
    { label: "Terms and Conditions", to: "/terms" },
];

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="border-t border-[#1F1F1F] bg-[#0B0B0B]">
            <div className="mx-auto max-w-[95%] px-4 py-12 sm:px-6">
                <div className="grid grid-cols-1 gap-10 sm:grid-cols-[2fr_1fr_1fr_1fr]">
                    {/* Brand */}
                    <div className="max-w-xs">
                        <Logo />
                        <p className="mt-3 text-sm text-muted-foreground">
                            A peer-to-peer marketplace where students post and
                            pick up gigs on campus.
                        </p>
                        <a
                            href="https://github.com/venomwastaken/nexgig"
                            target="_blank"
                            rel="noreferrer"
                            className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-[#ffffff]"
                        >
                            <ExternalLink size={14} />
                            View on GitHub
                        </a>
                    </div>

                    {/* Product links */}
                    <div>
                        <h6 className="text-label mb-4">Product</h6>
                        <ul className="flex flex-col gap-3">
                            {PRODUCT_LINKS.map((link) => (
                                <li key={link.to}>
                                    <Link
                                        to={link.to}
                                        className="text-sm text-muted-foreground transition-colors hover:text-[#ffffff]"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Account links */}
                    <div>
                        <h6 className="text-label mb-4">Account</h6>
                        <ul className="flex flex-col gap-3">
                            {ACCOUNT_LINKS.map((link) => (
                                <li key={link.to}>
                                    <Link
                                        to={link.to}
                                        className="text-sm text-muted-foreground transition-colors hover:text-[#ffffff]"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company links */}
                    <div>
                        <h6 className="text-label mb-4">Company</h6>
                        <ul className="flex flex-col gap-3">
                            {COMPANY_LINKS.map((link) => (
                                <li key={link.to}>
                                    <Link
                                        to={link.to}
                                        className="text-sm text-muted-foreground transition-colors hover:text-[#ffffff]"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="divider mt-10 pt-6">
                    <p className="text-xs text-shadow-muted-foreground">
                        &copy; {year} NexGig. Built as a student project.
                    </p>
                </div>
            </div>
        </footer>
    );
}
