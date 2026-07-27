import { ArrowRight, MessagesSquare, Search, ShieldCheck, Sparkle } from "lucide-react";
import { Link } from "react-router-dom";


export default function Home() {
    return (
 <div className="min-h-screen bg-background text-foreground">

      <main className="mx-auto max-w-[95%] px-4 md:px-6">
        <section className="py-16 md:py-28">
          <h1 className="mt-6 text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] max-w-3xl">
            Campus freelance,
            <br />
            <span className="text-primary">made easy.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            NexGig connects students who offer skills with peers who need them. Post a gig, book a
            classmate, get it done — all within your campus community.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 font-medium hover:bg-primary-hover transition-colors"
            >
              Create your account <ArrowRight size={18} />
            </Link>
            <Link
              to="/gigs"
              className="inline-flex items-center gap-2 rounded-full border border-border-strong px-6 py-3 font-medium hover:bg-surface transition-colors"
            >
              Browse gigs
            </Link>
          </div>
        </section>

        <section className="py-12 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Sparkle,
              title: "Post what you're good at",
              body: "Turn your skills into gigs — design, tutoring, errands, editing. Set your price, tell your story.",
            },
            {
              icon: Search,
              title: "Find help fast",
              body: "Search by skill, filter by category, and hire a classmate in under three clicks.",
            },
            {
              icon: MessagesSquare,
              title: "Talk it out",
              body: "Message directly, agree on details, and get it done. No middlemen.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-6">
              <div className="h-10 w-10 rounded-full bg-primary/15 text-primary grid place-items-center">
                <f.icon size={18} />
              </div>
              <h3 className="mt-4 font-semibold text-lg">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </section>

        <section className="py-16">
          <div className="rounded-3xl border border-border bg-card p-8 md:p-14 flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <ShieldCheck className="text-primary" size={22} />
              <h2 className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight">
                Verified with your school email.
              </h2>
              <p className="mt-2 text-muted-foreground max-w-xl">
                Only students in your campus community. No randoms, no spam — just people you'd
                bump into at the SU.
              </p>
            </div>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 font-medium hover:bg-primary-hover transition-colors shrink-0"
            >
              Join NexGig <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>
    </div>
    );
}
