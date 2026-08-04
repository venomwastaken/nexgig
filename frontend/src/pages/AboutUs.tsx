import { Link } from "react-router-dom";
import {
    ArrowUpRight,
    BadgeCheck,
    Lightbulb,
    Rocket,
    ShieldCheck,
    Sparkle,
    Users,
} from "lucide-react";

const GREEN = "#1b976f";

function Accent({ children }: { children: React.ReactNode }) {
    return <span style={{ color: GREEN }}>{children}</span>;
}

function SectionHead({ label, copy }: { label: string; copy: string }) {
    return (
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-10">
            <h2 className="text-2xl font-semibold tracking-tight">{label}</h2>
            <p className="max-w-md text-sm text-[#9a9a9a]">{copy}</p>
        </div>
    );
}

type Step = { title: string; body: string };

const steps: Step[] = [
    {
        title: "Create a profile",
        body: "Sign up with your school email so everyone on the platform is a verified student.",
    },
    {
        title: "Post or browse gigs",
        body: "Offer a skill you're good at, or search for a classmate who can help with yours.",
    },
    {
        title: "Agree the details",
        body: "Chat directly, settle on scope and price, and lock it in — no middlemen involved.",
    },
    {
        title: "Deliver and get paid",
        body: "Finish the work, release payment through the platform, and leave a review.",
    },
];

type CoreValue = {
    icon: React.ComponentType<{
        size?: number;
        className?: string;
        style?: React.CSSProperties;
    }>;
    title: string;
    body: string;
};

const values: CoreValue[] = [
    {
        icon: ShieldCheck,
        title: "Trust",
        body: "Every account is tied to a verified student email, so you always know who you're working with.",
    },
    {
        icon: Users,
        title: "Collaboration",
        body: "NexGiG is built on students helping students — every gig is a chance to work together.",
    },
    {
        icon: Lightbulb,
        title: "Innovation",
        body: "We keep improving the platform based on what students actually need to get gigs done.",
    },
    {
        icon: BadgeCheck,
        title: "Professionalism",
        body: "Clear expectations, fair pricing, and honest reviews keep every exchange respectful.",
    },
    {
        icon: Rocket,
        title: "Student Empowerment",
        body: "Every gig posted or picked up is real-world experience and income earned on your own terms.",
    },
];

export default function AboutUs() {
    return (
        <div className="min-h-screen bg-[#1b1b1b] text-white">
            <main className="mx-auto px-5 md:px-12">
                {/* Hero */}
                <section className="grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
                    <div>
                        <span className="text-label">About NexGiG</span>
                        <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
                            Built by students, <Accent>for students</Accent>
                        </h1>
                        <p className="mt-6 max-w-md text-sm leading-relaxed text-[#9a9a9a]">
                            NexGiG is a campus freelancing marketplace that
                            connects students who have skills with students
                            who need them — so everyone can earn, collaborate,
                            and build real experience without ever leaving
                            their community.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link
                                to="/gigs"
                                className="rounded-lg px-6 py-3 text-sm font-medium text-[#0d0d0d] transition-opacity hover:opacity-90"
                                style={{ backgroundColor: GREEN }}
                            >
                                Explore gigs
                            </Link>
                            <Link
                                to="/signup"
                                className="rounded-lg border border-white/18 bg-[#232323] px-6 py-3 text-sm font-medium transition-colors hover:bg-[#2a2a2a]"
                            >
                                Join Us
                            </Link>
                        </div>
                    </div>

                    <div className="relative mx-auto grid h-64 w-full max-w-sm place-items-center md:h-80">
                        <div className="absolute inset-0 rotate-18 rounded-[50%] border border-white/8" />
                        <div className="absolute inset-4 rotate-[-8deg] rounded-[50%] border border-white/8" />
                        <div className="absolute inset-10 rotate-35 rounded-[50%] border border-white/8" />
                        <div
                            className="grid h-24 w-24 place-items-center rounded-2xl border"
                            style={{
                                backgroundColor: "rgba(27,151,111,0.14)",
                                borderColor: "rgba(27,151,111,0.35)",
                            }}
                        >
                            <Sparkle size={32} style={{ color: GREEN }} />
                        </div>
                        <span className="absolute left-2 top-6 h-3 w-3 rounded-full bg-white/40" />
                        <span
                            className="absolute right-6 top-10 h-3 w-3 rounded-full"
                            style={{ backgroundColor: GREEN }}
                        />
                        <span className="absolute bottom-8 left-10 h-2 w-2 rounded-full bg-white/25" />
                    </div>
                </section>

                {/* Mission & Vision */}
                <section className="grid gap-5 border-y border-white/8 py-16 md:grid-cols-2 md:py-20">
                    <div className="rounded-lg border border-white/8 bg-[#232323] p-7">
                        <h3 className="text-lg font-semibold leading-snug">
                            Our mission
                        </h3>
                        <p className="mt-3 text-sm leading-relaxed text-[#9a9a9a]">
                            To help students connect through freelancing —
                            turning the skills they're already building in
                            class into paid work, and turning everyday campus
                            needs into opportunities for a classmate to step
                            in and help.
                        </p>
                    </div>
                    <div className="rounded-lg border border-white/8 bg-[#232323] p-7">
                        <h3 className="text-lg font-semibold leading-snug">
                            Our vision
                        </h3>
                        <p className="mt-3 text-sm leading-relaxed text-[#9a9a9a]">
                            A campus where every student has a place to earn,
                            collaborate, and build real experience —
                            graduating not just with a degree, but with a
                            portfolio of work and a network of people they've
                            helped along the way.
                        </p>
                    </div>
                </section>

                {/* How it works */}
                <section className="py-16 md:py-20">
                    <SectionHead
                        label="How it works"
                        copy="From sign-up to payout, NexGiG keeps every gig simple and student-to-student."
                    />

                    <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {steps.map((step, index) => (
                            <div
                                key={step.title}
                                className="flex flex-col gap-3 rounded-lg border border-white/8 bg-[#232323] p-6"
                            >
                                <span
                                    className="grid h-8 w-8 place-items-center rounded-full text-sm font-semibold"
                                    style={{
                                        backgroundColor:
                                            "rgba(27,151,111,0.14)",
                                        color: GREEN,
                                    }}
                                >
                                    {index + 1}
                                </span>
                                <h4 className="text-base font-semibold leading-snug">
                                    {step.title}
                                </h4>
                                <p className="text-sm leading-relaxed text-[#9a9a9a]">
                                    {step.body}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Core values */}
                <section className="border-y border-white/8 py-16 md:py-20">
                    <SectionHead
                        label="Core values"
                        copy="The principles that shape every gig posted, booked, and delivered on NexGiG."
                    />

                    <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {values.map(({ icon: Icon, title, body }) => (
                            <div
                                key={title}
                                className="flex flex-col gap-3 rounded-lg border border-white/8 bg-[#232323] p-6 transition-colors hover:border-white/18"
                            >
                                <div
                                    className="grid h-10 w-10 place-items-center rounded-full"
                                    style={{
                                        backgroundColor:
                                            "rgba(27,151,111,0.14)",
                                    }}
                                >
                                    <Icon size={18} style={{ color: GREEN }} />
                                </div>
                                <h4 className="text-base font-semibold leading-snug">
                                    {title}
                                </h4>
                                <p className="text-sm leading-relaxed text-[#9a9a9a]">
                                    {body}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA */}
                <section className="py-16 md:py-24">
                    <div className="relative overflow-hidden rounded-lg border border-white/8 bg-[#232323] p-8 md:p-12">
                        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                            Ready to get started?
                        </h2>
                        <p className="mt-3 max-w-md text-sm leading-relaxed text-[#9a9a9a]">
                            Browse what your campus is offering, or post your
                            own gig in a couple of minutes.
                        </p>
                        <Link
                            to="/gigs"
                            className="mt-7 inline-flex items-center gap-1.5 rounded-lg px-6 py-3 text-sm font-medium text-[#0d0d0d] transition-opacity hover:opacity-90"
                            style={{ backgroundColor: GREEN }}
                        >
                            Explore gigs
                            <ArrowUpRight size={14} />
                        </Link>
                        <div className="pointer-events-none absolute inset-y-0 right-10 hidden place-items-center md:grid">
                            <div className="relative h-40 w-40">
                                <div className="absolute inset-0 rotate-12 rounded-[50%] border border-white/8" />
                                <div className="absolute inset-6 -rotate-6 rounded-[50%] border border-white/8" />
                                <div
                                    className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full"
                                    style={{
                                        backgroundColor:
                                            "rgba(27,151,111,0.18)",
                                    }}
                                />
                                <div
                                    className="absolute bottom-4 right-6 h-8 w-8 rotate-45 rounded-[6px]"
                                    style={{
                                        backgroundColor:
                                            "rgba(27,151,111,0.45)",
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
