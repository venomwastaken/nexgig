import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { HelpCircle, Search } from "lucide-react";

import {
    Accordion,
    AccordionItem,
    AccordionPanel,
    AccordionTrigger,
} from "@/components/ui/accordion";

const GREEN = "#1b976f";

type FaqItem = {
    id: string;
    question: string;
    answer: string;
};

const FAQ_ITEMS: FaqItem[] = [
    {
        id: "what-is-nexgig",
        question: "What is NexGiG?",
        answer: "NexGiG is a peer-to-peer freelancing marketplace built exclusively for university students. It lets you post gigs to offer a skill, or browse gigs posted by classmates who need help — all within your own campus community.",
    },
    {
        id: "create-account",
        question: "How do I create an account?",
        answer: "Click \"Sign up\" and register with your university email address. We use your school email to verify that you're a current student before you can post or accept gigs.",
    },
    {
        id: "post-a-gig",
        question: "How do I post a gig?",
        answer: "Once signed in, click \"Post a gig\" (or \"Create\" in the navbar). Describe the service, set a price and timeline, and publish — it'll appear in search and browse results immediately.",
    },
    {
        id: "payments-handled",
        question: "How are payments handled?",
        answer: "Payment for an accepted gig is held on the platform until the work is marked complete by both the client and the freelancer, then released to the freelancer. This protects both sides of the transaction.",
    },
    {
        id: "contact-freelancer",
        question: "How do I contact a freelancer?",
        answer: "Every gig listing has a \"Message\" option that opens a direct conversation with the freelancer, so you can discuss details before booking.",
    },
    {
        id: "reviews",
        question: "How do reviews work?",
        answer: "After a gig is marked complete, both the client and the freelancer can leave a rating and a short review. Reviews are public on a user's profile and help build trust across the platform.",
    },
    {
        id: "cancel-gig",
        question: "Can I cancel a gig?",
        answer: "Yes. Either party can request a cancellation before work begins. If a gig is already in progress, we encourage messaging the other party first — unresolved cancellations can be escalated to support.",
    },
    {
        id: "dispute",
        question: "What happens if there is a dispute?",
        answer: "If you and the other party can't resolve a disagreement directly, you can open a dispute from the gig page. Our support team will review the conversation history and gig details to help reach a fair outcome.",
    },
    {
        id: "report-content",
        question: "How do I report inappropriate content?",
        answer: "Use the \"Report\" option on any gig listing, message, or profile. Reports are reviewed by our team, and accounts that violate our Terms and Conditions may be suspended.",
    },
    {
        id: "students-only",
        question: "Is NexGiG only for students?",
        answer: "Yes — NexGiG is built specifically for verified university students, both to post gigs and to take them on. Verification through a school email keeps the community trusted and campus-focused.",
    },
];

export default function FAQ() {
    const [query, setQuery] = useState("");

    const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle) return FAQ_ITEMS;
        return FAQ_ITEMS.filter(
            (item) =>
                item.question.toLowerCase().includes(needle) ||
                item.answer.toLowerCase().includes(needle),
        );
    }, [query]);

    return (
        <div className="min-h-screen bg-[#1b1b1b] text-white">
            <main className="mx-auto max-w-3xl px-5 py-16 md:px-12 md:py-24">
                <header className="text-center">
                    <span className="text-label">Support</span>
                    <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
                        Frequently asked <span style={{ color: GREEN }}>questions</span>
                    </h1>
                    <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-[#9a9a9a]">
                        Everything you need to know about posting, booking,
                        and getting paid for gigs on NexGiG.
                    </p>
                </header>

                {/* Search */}
                <div className="relative mt-10">
                    <Search
                        size={16}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B8F9B]"
                    />
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search questions…"
                        aria-label="Search frequently asked questions"
                        className="w-full rounded-full border border-[#1F1F1F] bg-[#161616] py-3 pl-9 pr-4 text-sm text-white placeholder:text-[#6b6f78] outline-none transition-colors focus:border-[#1b976f]"
                    />
                </div>

                {/* Accordion list */}
                <div className="mt-8 rounded-lg border border-white/8 bg-[#232323] px-6 md:px-8">
                    {filtered.length > 0 ? (
                        <Accordion multiple>
                            {filtered.map((item) => (
                                <AccordionItem key={item.id} value={item.id}>
                                    <AccordionTrigger>
                                        {item.question}
                                    </AccordionTrigger>
                                    <AccordionPanel>
                                        {item.answer}
                                    </AccordionPanel>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <div className="flex flex-col items-center gap-3 py-16 text-center">
                            <HelpCircle
                                size={28}
                                className="text-[#8B8F9B]"
                            />
                            <p className="text-sm text-[#9a9a9a]">
                                No questions match &ldquo;{query}&rdquo;. Try a
                                different search term.
                            </p>
                        </div>
                    )}
                </div>

                {/* CTA */}
                <div className="mt-12 flex flex-col items-center gap-3 rounded-lg border border-white/8 bg-[#232323] p-8 text-center">
                    <h2 className="text-lg font-semibold tracking-tight">
                        Still have questions?
                    </h2>
                    <p className="max-w-sm text-sm text-[#9a9a9a]">
                        Can&apos;t find what you&apos;re looking for? Reach
                        out and our team will help you directly.
                    </p>
                    <Link
                        to="/contact"
                        className="mt-2 rounded-lg px-5 py-2.5 text-sm font-medium text-[#0d0d0d] transition-opacity hover:opacity-90"
                        style={{ backgroundColor: GREEN }}
                    >
                        Contact us
                    </Link>
                </div>
            </main>
        </div>
    );
}
