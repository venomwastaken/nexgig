import SearchBar from "@/components/SearchBar";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CATEGORIES, Gig, GIGS } from "@/lib/gigs";
import { ArrowUpRight, ChevronLeft, ChevronRight, Clock, Heart } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

function timeAgo(iso: string) {
    const diffMs = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days <= 0) return "Today";
    if (days === 1) return "1 day ago";
    if (days < 7) return `${days} days ago`;
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
}

export default function Gigs() {
    const [q, setQ] = useState("");
    const [cat, setCat] = useState("All");

    const filtered = useMemo(() => {
        return GIGS.filter((g) => {
            if (cat !== "All" && g.category !== cat) return false;
            if (!q.trim()) return true;
            const needle = q.toLowerCase();
            return (
                g.title.toLowerCase().includes(needle) ||
                g.tags.some((t) => t.toLowerCase().includes(needle)) ||
                g.provider.first_name.toLowerCase().includes(needle) ||
                g.provider.last_name.toLowerCase().includes(needle) ||
                g.provider.username.toLowerCase().includes(needle)
            );
        });
    }, [q, cat]);

    return (
        <div className="min-h-screen bg-background">
            <main className="mx-auto max-w-[95%] px-4 md:px-6 py-8 md:py-12">
                <div className="max-w-2xl">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                        Find help from people on campus.
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        {GIGS.length} gigs posted on campus this week.
                    </p>
                </div>

                <div className="mt-8">
                    <SearchBar value={q} onChange={setQ} />
                </div>

                <div className="mt-8 flex flex-col md:flex-row gap-8">
                    <aside className="md:w-60 shrink-0">
                        <CategoryScroller cat={cat} setCat={setCat} />
                        <div className="hidden md:sticky md:top-8 md:flex flex-row flex-wrap gap-2">
                            {CATEGORIES.map((c) => {
                                const active = c.value === cat;
                                return (
                                    <button
                                        key={c.label}
                                        onClick={() =>
                                            // toggle category on click: if already active, reset to "All"
                                            setCat(active ? "All" : c.value)
                                        }
                                        className={`px-3.5 py-1.5 rounded-lg text-sm border text-left transition-all ${
                                            active
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-surface border-border text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {c.label}
                                    </button>
                                );
                            })}
                        </div>
                    </aside>

                    <div className="flex-1 min-w-0">
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {filtered.map((g) => (
                                <GigCard key={g.id} gig={g} />
                            ))}
                        </div>

                        {filtered.length === 0 && (
                            <div className="mt-16 text-center text-muted-foreground">
                                No gigs match that search yet. Try a different
                                keyword or category.
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

function CategoryScroller({
    cat,
    setCat,
}: {
    cat: string;
    setCat: (value: string) => void;
}) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const updateArrows = () => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 4);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };

    useEffect(() => {
        updateArrows();
        const el = scrollRef.current;
        if (!el) return;
        el.addEventListener("scroll", updateArrows, { passive: true });
        window.addEventListener("resize", updateArrows);
        return () => {
            el.removeEventListener("scroll", updateArrows);
            window.removeEventListener("resize", updateArrows);
        };
    }, []);

    const scrollBy = (direction: 1 | -1) => {
        scrollRef.current?.scrollBy({
            left: direction * 160,
            behavior: "smooth",
        });
    };

    return (
        <div className="relative flex items-center md:hidden">
            {canScrollLeft && (
                <>
                    <div className="pointer-events-none absolute left-8 top-0 z-10 h-full w-6 bg-linear-to-r from-background to-transparent" />
                    <button
                        onClick={() => scrollBy(-1)}
                        aria-label="Scroll categories left"
                        className="absolute left-0 z-20 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border bg-background text-foreground shadow-sm"
                    >
                        <ChevronLeft size={16} />
                    </button>
                </>
            )}
            <div
                ref={scrollRef}
                className={`flex flex-nowrap gap-2 overflow-x-auto scroll-smooth scrollbar-none ${
                    canScrollLeft ? "pl-9" : ""
                } ${canScrollRight ? "pr-9" : ""}`}
            >
                {CATEGORIES.map((c) => {
                    const active = c.value === cat;
                    return (
                        <button
                            key={c.label}
                            onClick={() => setCat(c.value)}
                            className={`shrink-0 whitespace-nowrap px-3.5 py-1.5 rounded-full text-sm border transition-all ${
                                active
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-surface border-border text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {c.label}
                        </button>
                    );
                })}
            </div>
            {canScrollRight && (
                <>
                    <div className="pointer-events-none absolute right-8 top-0 z-10 h-full w-6 bg-linear-to-l from-background to-transparent" />
                    <button
                        onClick={() => scrollBy(1)}
                        aria-label="Scroll categories right"
                        className="absolute right-0 z-20 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border bg-background text-foreground shadow-sm"
                    >
                        <ChevronRight size={16} />
                    </button>
                </>
            )}
        </div>
    );
}

export function GigCard({ gig }: { gig: Gig }) {
    const [liked, setLiked] = useState(false);

    return (
        <Link
            to={`/gigs/${gig.id}`}
            className="group rounded-2xl border border-border bg-card p-2 hover:border-primary/60 transition-colors flex flex-col gap-1"
        >
            <AspectRatio ratio={16 / 9} className="relative">
                <img
                    src="../../assets/npc_image.jpeg"
                    alt="Image"
                    className="rounded-md object-cover w-full h-full"
                />
                <button
                    type="button"
                    aria-label={liked ? "Unlike gig" : "Like gig"}
                    aria-pressed={liked}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setLiked((prev) => !prev);
                    }}
                    className="absolute top-2 right-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-background/80 backdrop-blur-sm shadow-sm hover:bg-background transition-colors"
                >
                    <Heart
                        size={16}
                        className={liked ? "fill-primary text-primary" : "text-foreground"}
                    />
                </button>
            </AspectRatio>
            {/* <div className="flex items-start justify-between gap-2">
                <span className="text-xs text-primary font-medium">
                    {gig.category}
                </span>
                <ArrowUpRight
                    size={18}
                    className="text-muted-foreground group-hover:text-primary transition-colors"
                />
            </div> */}
            <div>
                <h3 className="mt-3 font-semibold leading-snug line-clamp-1 text-lg">
                    {gig.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {gig.description}
                </p>
            </div>

            {/* <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock size={14} /> {timeAgo(gig.created_at)}
            </div> */}

            <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Avatar>
                        <AvatarImage src={gig.provider.avatar_url} />
                        <AvatarFallback className="h-8 w-8 rounded-full bg-primary/15 text-primary grid place-items-center text-xs font-semibold">
                            {gig.provider.first_name[0]}
                            {gig.provider.last_name[0]}
                        </AvatarFallback>
                    </Avatar>
                    <div className="text-xs">
                        <div className="font-medium">
                            {gig.provider.first_name} {gig.provider.last_name}
                        </div>
                        <div className="text-muted-foreground truncate max-w-35">
                            @{gig.provider.username}
                        </div>
                    </div>
                </div>
                <div className="text-sm">
                    <span className="text-muted-foreground">from</span>{" "}
                    <span className="font-bold text-lg text-primary">₵{gig.price}</span>
                </div>
            </div>
        </Link>
    );
}
