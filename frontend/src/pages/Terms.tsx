import { Link } from "react-router-dom";

type TermsSection = {
    id: string;
    title: string;
    body: React.ReactNode;
};

const LAST_UPDATED = "August 4, 2026";

const sections: TermsSection[] = [
    {
        id: "introduction",
        title: "1. Introduction",
        body: (
            <p>
                Welcome to NexGiG (&ldquo;NexGiG&rdquo;, &ldquo;we&rdquo;,
                &ldquo;us&rdquo;, or &ldquo;our&rdquo;), a peer-to-peer
                marketplace that lets verified university students post and
                take on freelance gigs within their campus community. By
                creating an account or otherwise using the platform, you
                agree to be bound by these Terms and Conditions
                (&ldquo;Terms&rdquo;). If you do not agree to these Terms,
                please do not use NexGiG.
            </p>
        ),
    },
    {
        id: "user-responsibilities",
        title: "2. User Responsibilities",
        body: (
            <>
                <p>As a user of NexGiG, you agree to:</p>
                <ul className="mt-3 list-disc space-y-2 pl-5">
                    <li>
                        Provide accurate, current, and complete information
                        when creating and maintaining your account.
                    </li>
                    <li>
                        Use the platform only for lawful purposes and in a
                        manner consistent with your institution&apos;s code
                        of conduct.
                    </li>
                    <li>
                        Treat other students professionally and respectfully
                        in all gig-related communication.
                    </li>
                    <li>
                        Keep your login credentials confidential and notify
                        us promptly of any unauthorized use of your account.
                    </li>
                </ul>
            </>
        ),
    },
    {
        id: "account-registration",
        title: "3. Account Registration",
        body: (
            <p>
                NexGiG accounts must be created with a valid university-issued
                email address. We use this to verify that all users are
                current students. You must be at least 18 years old, or the
                age of majority in your jurisdiction, to register. You are
                responsible for all activity that occurs under your account,
                and accounts are non-transferable.
            </p>
        ),
    },
    {
        id: "gig-posting-rules",
        title: "4. Gig Posting Rules",
        body: (
            <>
                <p>
                    When posting a gig, you must accurately describe the
                    service being offered, including scope, timeline, and
                    price. Gig listings must not:
                </p>
                <ul className="mt-3 list-disc space-y-2 pl-5">
                    <li>
                        Advertise academic dishonesty, including completing
                        graded coursework, assignments, or exams on another
                        student&apos;s behalf.
                    </li>
                    <li>
                        Offer illegal goods or services, or violate campus
                        policy.
                    </li>
                    <li>
                        Misrepresent the poster&apos;s qualifications,
                        pricing, or availability.
                    </li>
                </ul>
                <p className="mt-3">
                    NexGiG reserves the right to remove any gig listing that
                    violates these Terms without prior notice.
                </p>
            </>
        ),
    },
    {
        id: "payment-and-transactions",
        title: "5. Payment and Transactions",
        body: (
            <p>
                Payments between students are arranged and settled through
                the payment method(s) made available on the platform. Funds
                for an accepted gig are held until the work is marked
                complete by both parties, at which point they are released to
                the freelancer. NexGiG is not a bank or licensed money
                transmitter, and is not responsible for payment disputes
                arising from off-platform arrangements between users.
            </p>
        ),
    },
    {
        id: "intellectual-property",
        title: "6. Intellectual Property",
        body: (
            <p>
                Unless otherwise agreed in writing between the parties to a
                gig, ownership of work product transfers to the client upon
                full payment. The NexGiG name, logo, and platform design
                remain the exclusive property of NexGiG and may not be
                copied, reproduced, or used without prior written permission.
            </p>
        ),
    },
    {
        id: "prohibited-activities",
        title: "7. Prohibited Activities",
        body: (
            <>
                <p>You may not use NexGiG to:</p>
                <ul className="mt-3 list-disc space-y-2 pl-5">
                    <li>Harass, threaten, or discriminate against another user.</li>
                    <li>
                        Circumvent the platform to avoid fees or bypass its
                        safety and verification features.
                    </li>
                    <li>
                        Upload malicious code, scrape data, or attempt to
                        disrupt the platform&apos;s normal operation.
                    </li>
                    <li>
                        Create multiple accounts to manipulate reviews or
                        ratings.
                    </li>
                </ul>
            </>
        ),
    },
    {
        id: "limitation-of-liability",
        title: "8. Limitation of Liability",
        body: (
            <p>
                NexGiG is provided on an &ldquo;as is&rdquo; and &ldquo;as
                available&rdquo; basis. We facilitate connections between
                students but are not a party to the agreements formed between
                them. To the fullest extent permitted by law, NexGiG
                disclaims liability for any indirect, incidental, or
                consequential damages arising from the use of the platform or
                the conduct of any user, whether online or offline.
            </p>
        ),
    },
    {
        id: "privacy",
        title: "9. Privacy",
        body: (
            <p>
                We collect only the information needed to operate NexGiG,
                such as your student email, profile details, and gig
                activity. We do not sell your personal data. Information may
                be shared with other users only as necessary to facilitate a
                gig (for example, sharing contact details after a booking is
                confirmed). For more detail on how your data is handled,
                contact us using the details below.
            </p>
        ),
    },
    {
        id: "account-suspension",
        title: "10. Account Suspension or Termination",
        body: (
            <p>
                We may suspend or terminate your account, with or without
                notice, if we believe you have violated these Terms, engaged
                in fraudulent activity, or put another user&apos;s safety at
                risk. You may deactivate your own account at any time from
                your account settings. Outstanding gig obligations should be
                resolved before deactivation.
            </p>
        ),
    },
    {
        id: "changes-to-terms",
        title: "11. Changes to the Terms",
        body: (
            <p>
                We may update these Terms from time to time to reflect
                changes to the platform or applicable law. When we do, we
                will update the &ldquo;last updated&rdquo; date above and, for
                material changes, notify users by email or an in-app notice.
                Continued use of NexGiG after a change takes effect
                constitutes acceptance of the revised Terms.
            </p>
        ),
    },
    {
        id: "contact-information",
        title: "12. Contact Information",
        body: (
            <p>
                Questions about these Terms can be sent to{" "}
                <a
                    href="mailto:support@nexgig.app"
                    className="text-[#1b976f] hover:underline underline-offset-4"
                >
                    support@nexgig.app
                </a>{" "}
                or through our{" "}
                <Link
                    to="/contact"
                    className="text-[#1b976f] hover:underline underline-offset-4"
                >
                    Contact Us
                </Link>{" "}
                page.
            </p>
        ),
    },
];

export default function Terms() {
    return (
        <div className="min-h-screen bg-[#1b1b1b] text-white">
            <main className="mx-auto max-w-5xl px-5 py-16 md:px-12 md:py-24">
                <header className="max-w-2xl">
                    <span className="text-label">Legal</span>
                    <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
                        Terms and Conditions
                    </h1>
                    <p className="mt-6 text-sm leading-relaxed text-[#9a9a9a]">
                        These Terms govern your access to and use of NexGiG.
                        Please read them carefully before creating an account
                        or posting a gig.
                    </p>
                    <p className="mt-3 text-xs uppercase tracking-[0.12em] text-[#6b6f78]">
                        Last updated: {LAST_UPDATED}
                    </p>
                </header>

                <div className="mt-12 grid gap-10 md:grid-cols-[220px_1fr]">
                    {/* Jump-to navigation */}
                    <nav
                        aria-label="Table of contents"
                        className="h-fit rounded-lg border border-white/8 bg-[#232323] p-5 md:sticky md:top-24"
                    >
                        <h2 className="text-label mb-3">On this page</h2>
                        <ul className="flex flex-col gap-2.5">
                            {sections.map((section) => (
                                <li key={section.id}>
                                    <a
                                        href={`#${section.id}`}
                                        className="text-sm text-[#9a9a9a] transition-colors hover:text-white"
                                    >
                                        {section.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Sections */}
                    <div className="flex flex-col divide-y divide-white/8 rounded-lg border border-white/8 bg-[#232323]">
                        {sections.map((section) => (
                            <section
                                key={section.id}
                                id={section.id}
                                className="scroll-mt-24 p-6 text-sm leading-relaxed text-[#9a9a9a] md:p-8"
                            >
                                <h2 className="text-xl font-semibold tracking-tight text-white">
                                    {section.title}
                                </h2>
                                <div className="mt-3">{section.body}</div>
                            </section>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
