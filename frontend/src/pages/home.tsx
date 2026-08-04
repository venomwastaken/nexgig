
import { ArrowUpRight, Sparkle } from "lucide-react";
import { Link } from "react-router-dom";


const GREEN = "#1b976f";

function Accent({ children }: { children: React.ReactNode }) {
  return <span style={{ color: GREEN }}>{children}</span>;
}

function LearnMore({ to }: { to: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 text-sm font-medium text-white/80 transition-colors hover:text-white"
    >
      <span
        className="grid h-7 w-7 place-items-center rounded-full border"
        style={{ borderColor: "rgba(255,255,255,0.18)", color: GREEN }}
      >
        <ArrowUpRight size={14} />
      </span>
      Learn more
    </Link>
  );
}

type Service = { title: string; body: string; to: string };

const services: Service[] = [
  {
    title: "Post a gig",
    body: "Turn your skills into paid work — design, tutoring, errands, editing. Set your price, tell your story.",
    to: "/gigs/new",
  },
  {
    title: "Find help fast",
    body: "Search by skill, filter by category and hire a classmate in under three clicks.",
    to: "/gigs",
  },
  {
    title: "Message directly",
    body: "Agree the details in chat, no middlemen and no agency fees eating your budget.",
    to: "/messages",
  },
  {
    title: "Campus verified",
    body: "Everyone signs in with a school email, so you only ever deal with real students.",
    to: "/signup",
  },
];

const caseStudies = [
  "A second-year design student booked 12 poster jobs in her first month and covered her rent.",
  "A society needed a last-minute promo video and had three student editors quoting within an hour.",
  "A CS fresher picked up paid tutoring hours between lectures without leaving campus.",
];

function SectionHead({ label, copy }: { label: string; copy: string }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-10">
      <h2 className="text-2xl font-semibold tracking-tight">{label}</h2>
      <p className="max-w-md text-sm text-[#9a9a9a]">{copy}</p>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#1b1b1b] text-white">
      <main className="mx-auto px-5 md:px-12">
        {/* Hero */}
        <section className="grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <div>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
              Navigating campus <Accent>freelance work</Accent> for students
            </h1>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-[#9a9a9a]">
              NexGig connects students who offer skills with peers who need them.
              Post a gig, book a classmate, get it done — all inside your campus
              community.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/gigs"
                className="rounded-lg px-6 py-3 text-sm font-medium text-[#0d0d0d] transition-opacity hover:opacity-90"
                style={{ backgroundColor: GREEN }}
              >
                Explore
              </Link>
              <Link
                to="/signup"
                className="rounded-lg border border-white/18 bg-[#232323] px-6 py-3 text-sm font-medium transition-colors hover:bg-[#2a2a2a]"
              >
                Join Us
              </Link>
            </div>
          </div>

          {/* Orbit graphic */}
          <div className="relative mx-auto grid h-64 w-full max-w-sm place-items-center md:h-80">
            <div className="absolute inset-0 rotate-18 rounded-[50%] border border-white/[0.08]" />
            <div className="absolute inset-4 rotate-[-8deg] rounded-[50%] border border-white/[0.08]" />
            <div className="absolute inset-10 rotate-35 rounded-[50%] border border-white/[0.08]" />
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

        {/* Trust row */}
        <section className="flex flex-wrap items-center justify-between gap-6 border-y border-white/[0.08] py-8 text-xs uppercase tracking-[0.18em] text-[#9a9a9a]">
          {["Design", "Tutoring", "Video", "Code", "Photography", "Errands"].map(
            (c) => (
              <span key={c}>{c}</span>
            ),
          )}
        </section>

        {/* Services */}
        <section className="py-16 md:py-20">
          <SectionHead
            label="How it works"
            copy="Everything you need to trade skills with people on your course, in your halls, and across your campus."
          />

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {services.map((s) => (
              <div
                key={s.title}
                className="flex min-h-[200px] flex-col justify-between rounded-lg border border-white/[0.08] bg-[#232323] p-7 transition-colors hover:border-white/[0.18]"
              >
                <div>
                  <h3 className="text-lg font-semibold leading-snug">
                    {s.title}
                  </h3>
                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#9a9a9a]">
                    {s.body}
                  </p>
                </div>
                <div className="mt-6">
                  <LearnMore to={s.to} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="pb-16">
          <div className="relative overflow-hidden rounded-lg border border-white/[0.08] bg-[#232323] p-8 md:p-12">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Let&apos;s make things happen
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[#9a9a9a]">
              Sign up with your school email and start earning from the skills
              you already have — or find someone who has the ones you don&apos;t.
            </p>
            <Link
              to="/signup"
              className="mt-7 inline-block rounded-lg px-6 py-3 text-sm font-medium text-[#0d0d0d] transition-opacity hover:opacity-90"
              style={{ backgroundColor: GREEN }}
            >
              Join NexGig
            </Link>
            <div className="pointer-events-none absolute inset-y-0 right-10 hidden place-items-center md:grid">
              <div className="relative h-40 w-40">
                <div className="absolute inset-0 rotate-12 rounded-[50%] border border-white/[0.08]" />
                <div className="absolute inset-6 -rotate-6 rounded-[50%] border border-white/[0.08]" />
                <div
                  className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{ backgroundColor: "rgba(27,151,111,0.18)" }}
                />
                <div
                  className="absolute bottom-4 right-6 h-8 w-8 rotate-45 rounded-[6px]"
                  style={{ backgroundColor: "rgba(27,151,111,0.45)" }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Stories */}
        <section className="pb-24">
          <SectionHead
            label="Student stories"
            copy="Real gigs booked by real students on NexGig."
          />

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {caseStudies.map((c) => (
              <div
                key={c}
                className="rounded-lg border border-white/[0.08] bg-[#232323] p-6"
              >
                <p className="text-sm leading-relaxed text-[#9a9a9a]">{c}</p>
                <Link
                  to="/gigs"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium"
                  style={{ color: GREEN }}
                >
                  Learn more <ArrowUpRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}


