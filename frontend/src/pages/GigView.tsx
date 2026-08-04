import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Badge from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/textarea";
import { ApiGig, Gig, mapApiGigToGig } from "@/lib/gigs";
import { GigCard } from "@/pages/Gigs";
import Button from "@/pages/ui/Button";
import { useApi } from "@/hooks/useApi";
import axios from "axios";
import {
    ArrowLeft,
    Clock,
    Heart,
    Loader2,
    MessageCircle,
    ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

function timeAgo(iso: string) {
    const diffMs = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days <= 0) return "Today";
    if (days === 1) return "1 day ago";
    if (days < 7) return `${days} days ago`;
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
}

export default function GigView() {
    const { id } = useParams<{ id: string }>();
    const api = useApi();
    const [gig, setGig] = useState<Gig | null>(null);
    const [otherGigs, setOtherGigs] = useState<Gig[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        setLoading(true);
        setGig(null);
        api
            .get<ApiGig>(`/gigs/${id}`)
            .then((res) => {
                if (!cancelled) setGig(mapApiGigToGig(res.data));
            })
            .catch(() => {
                if (!cancelled) setGig(null);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    useEffect(() => {
        let cancelled = false;
        api
            .get<ApiGig[]>("/gigs/search")
            .then((res) => {
                if (!cancelled) setOtherGigs(res.data.map(mapApiGigToGig));
            })
            .catch(() => {
                // Similar gigs are a nice-to-have; ignore failures.
            });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const similarGigs = useMemo(() => {
        if (!gig) return [];
        const sameCategory = otherGigs.filter(
            (g) => g.id !== gig.id && g.category_name === gig.category_name,
        );
        if (sameCategory.length > 0) return sameCategory.slice(0, 3);
        // Fall back to other gigs so the section still has something to show.
        return otherGigs.filter((g) => g.id !== gig.id).slice(0, 3);
    }, [gig, otherGigs]);

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <Loader2 className="animate-spin text-muted-foreground" size={24} />
            </div>
        );
    }

    if (!gig) {
        return (
            <div className="mx-auto max-w-2xl px-4 py-24 text-center">
                <h1 className="text-2xl font-semibold">Gig not found</h1>
                <p className="mt-2 text-muted-foreground">
                    This gig may have been removed or the link is incorrect.
                </p>
                <Link
                    to="/gigs"
                    className="mt-6 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                    <ArrowLeft size={16} />
                    Back to gigs
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <main className="mx-auto max-w-[95%] px-4 md:px-6 py-8 md:py-12">
                <Link
                    to="/gigs"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft size={16} />
                    Back to gigs
                </Link>

                <div className="mt-6 grid gap-8 lg:grid-cols-5">
                    {/* Left: gig + provider details */}
                    <div className="lg:col-span-3 min-w-0">
                        <GigDetails gig={gig} />
                    </div>

                    {/* Right: booking (kept under half the width on large screens) */}
                    <div className="lg:col-span-2 min-w-0">
                        <BookingPanel gig={gig} />
                    </div>
                </div>

                {similarGigs.length > 0 && (
                    <div className="mt-16">
                        <h2 className="text-xl font-semibold tracking-tight">
                            Similar gigs
                        </h2>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {similarGigs.map((g) => (
                                <GigCard key={g.id} gig={g} />
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

function GigDetails({ gig }: { gig: Gig }) {
    const [liked, setLiked] = useState(false);

    return (
        <div className="flex flex-col gap-6">
            <div className="relative rounded-2xl border border-border bg-card p-2">
                <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-xl">
                    <img
                        src={gig.banner_url || "../../assets/npc_image.jpeg"}
                        alt={gig.title}
                        className="rounded-xl object-cover w-full h-full"
                    />
                </AspectRatio>
                <button
                    type="button"
                    aria-label={liked ? "Unlike gig" : "Like gig"}
                    aria-pressed={liked}
                    onClick={() => setLiked((prev) => !prev)}
                    className="absolute top-4 right-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-background/80 backdrop-blur-sm shadow-sm hover:bg-background transition-colors"
                >
                    <Heart
                        size={17}
                        className={liked ? "fill-primary text-primary" : "text-foreground"}
                    />
                </button>
            </div>

            <div>
                <span className="text-xs text-primary font-medium">
                    {gig.category_name}
                </span>
                <h1 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight">
                    {gig.title}
                </h1>

                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock size={14} /> Posted {timeAgo(gig.created_at)}
                </div>

                {gig.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {gig.tags.map((tag) => (
                            <Badge key={tag}>{tag}</Badge>
                        ))}
                    </div>
                )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
                <h2 className="font-semibold">About this gig</h2>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {gig.description}
                </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
                <h2 className="font-semibold">Meet the provider</h2>
                <div className="mt-4 flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={gig.provider.avatar_url} />
                        <AvatarFallback className="h-12 w-12 rounded-full bg-primary/15 text-primary grid place-items-center text-sm font-semibold">
                            {gig.provider.first_name[0]}
                            {gig.provider.last_name[0]}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-medium flex items-center gap-1.5">
                            {gig.provider.first_name} {gig.provider.last_name}
                            <ShieldCheck size={14} className="text-primary" />
                        </div>
                        <div className="text-sm text-muted-foreground">
                            @{gig.provider.username}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function BookingPanel({ gig }: { gig: Gig }) {
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [messaging, setMessaging] = useState(false);
    const api = useApi();
    const navigate = useNavigate();

    async function handleMessageProvider() {
        setMessaging(true);
        try {
            const { data } = await api.post("/messaging/conversations", {
                other_user_id: gig.provider.user_id,
                gig_id: gig.id,
            });
            navigate(`/messages/${data.id}`);
        } catch {
            toast.error("Couldn't start a conversation. Please try again.");
        } finally {
            setMessaging(false);
        }
    }

    async function handleBook() {
        setSubmitting(true);
        try {
            await api.post("/orders/", { gig_id: gig.id, note: note.trim() || undefined });
            toast.success("Booking request sent to the provider!");
            setNote("");
        } catch (error) {
            const message =
                axios.isAxiosError(error) && error.response?.data?.detail
                    ? String(error.response.data.detail)
                    : "Couldn't send this request. Please try again.";
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="lg:sticky lg:top-8 rounded-2xl border border-border bg-card p-5 flex flex-col gap-5">
            <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Price</span>
                <span className="text-2xl font-bold text-primary">
                    ₵{gig.price}
                </span>
            </div>

            <div>
                <label
                    htmlFor="booking-note"
                    className="text-xs font-medium text-muted-foreground"
                >
                    Message to {gig.provider.first_name} (optional)
                </label>
                <Textarea
                    id="booking-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Share what you need, timing, or any details that'll help."
                    className="mt-2 min-h-28"
                />
            </div>

            <Button
                type="button"
                isLoading={submitting}
                loadingText="Sending request"
                onClick={handleBook}
            >
                Book this gig
            </Button>

            <button
                type="button"
                onClick={handleMessageProvider}
                disabled={messaging}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
                <MessageCircle size={16} />
                {messaging ? "Starting conversation..." : "Message provider"}
            </button>

            <p className="text-xs text-muted-foreground text-center">
                You won't be charged until the provider accepts your request.
            </p>
        </div>
    );
}
