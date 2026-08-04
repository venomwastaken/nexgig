import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import Button from "@/pages/ui/Button";
import { useApi } from "@/hooks/useApi";
import { GigReview, GigReviewSummary } from "@/lib/reviews";
import { Star, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
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

function StarRating({ value, onChange }: { value: number; onChange?: (next: number) => void }) {
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
                <button
                    key={n}
                    type="button"
                    disabled={!onChange}
                    aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    onClick={() => onChange?.(n)}
                    className={onChange ? "cursor-pointer" : "cursor-default"}
                >
                    <Star
                        size={16}
                        className={n <= value ? "fill-primary text-primary" : "text-muted-foreground"}
                    />
                </button>
            ))}
        </div>
    );
}

export default function ReviewsSection({ gigId, gigOwnerId }: { gigId: string; gigOwnerId?: string }) {
    const api = useApi();
    const [reviews, setReviews] = useState<GigReview[]>([]);
    const [summary, setSummary] = useState<GigReviewSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            try {
                const [reviewsRes, summaryRes, meRes] = await Promise.all([
                    api.get<GigReview[]>(`/gigs/${gigId}/reviews`),
                    api.get<GigReviewSummary>(`/gigs/${gigId}/reviews/summary`),
                    api.get<{ user_id: string }>('/users/me/account'),
                ]);
                if (cancelled) return;
                setReviews(reviewsRes.data);
                setSummary(summaryRes.data);
                setCurrentUserId(meRes.data.user_id);
            } catch {
                if (!cancelled) toast.error("Couldn't load reviews.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [api, gigId]);

    const alreadyReviewed = reviews.some((r) => r.reviewer.user_id === currentUserId);
    const isOwnGig = currentUserId !== null && currentUserId === gigOwnerId;

    async function handleSubmit() {
        if (rating < 1) {
            toast.error("Pick a star rating first.");
            return;
        }
        setSubmitting(true);
        try {
            const { data } = await api.post<GigReview>(`/gigs/${gigId}/reviews`, {
                rating,
                comment: comment.trim() || undefined,
            });
            setReviews((prev) => [data, ...prev]);
            setSummary((prev: GigReviewSummary | null) => {
                const count = (prev?.review_count ?? 0) + 1;
                const total = (prev?.average_rating ?? 0) * (prev?.review_count ?? 0) + rating;
                return { gig_id: gigId, review_count: count, average_rating: total / count };
            });
            setRating(0);
            setComment("");
            toast.success("Review posted!");
        } catch (err: any) {
            toast.error(err?.response?.data?.detail || "Couldn't post your review.");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(reviewId: string) {
        const removed = reviews.find((r) => r.review_id === reviewId);
        try {
            await api.delete(`/reviews/${reviewId}`);
            setReviews((prev) => prev.filter((r) => r.review_id !== reviewId));
            setSummary((prev: GigReviewSummary | null) => {
                if (!prev || prev.review_count <= 1) {
                    return { gig_id: gigId, review_count: 0, average_rating: null };
                }
                const count = prev.review_count - 1;
                const total = (prev.average_rating ?? 0) * prev.review_count - (removed?.rating ?? 0);
                return { gig_id: gigId, review_count: count, average_rating: total / count };
            });
            toast.success("Review removed.");
        } catch {
            toast.error("Couldn't remove that review.");
        }
    }

    return (
        <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
                <h2 className="font-semibold">Reviews</h2>
                {summary && summary.review_count > 0 && (
                    <div className="flex items-center gap-1.5 text-sm">
                        <Star size={15} className="fill-primary text-primary" />
                        <span className="font-medium">{summary.average_rating?.toFixed(1)}</span>
                        <span className="text-muted-foreground">({summary.review_count})</span>
                    </div>
                )}
            </div>

            {!isOwnGig && !alreadyReviewed && currentUserId && (
                <div className="mt-4 flex flex-col gap-3 rounded-xl border border-border p-4">
                    <StarRating value={rating} onChange={setRating} />
                    <Textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share how this gig went (optional)"
                        className="min-h-20"
                    />
                    <Button
                        type="button"
                        isLoading={submitting}
                        loadingText="Posting"
                        onClick={handleSubmit}
                        className="w-auto self-end px-4"
                    >
                        Post review
                    </Button>
                </div>
            )}

            <div className="mt-5 flex flex-col gap-4">
                {loading && <p className="text-sm text-muted-foreground">Loading reviews...</p>}
                {!loading && reviews.length === 0 && (
                    <p className="text-sm text-muted-foreground">No reviews yet. Be the first to leave one.</p>
                )}
                {reviews.map((review) => (
                    <div key={review.review_id} className="flex gap-3">
                        <Avatar>
                            <AvatarImage src={review.reviewer.avatar_url ?? undefined} />
                            <AvatarFallback>
                                {review.reviewer.first_name[0]}
                                {review.reviewer.last_name[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <div className="text-sm font-medium">
                                    {review.reviewer.first_name} {review.reviewer.last_name}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">{timeAgo(review.created_at)}</span>
                                    {review.reviewer.user_id === currentUserId && (
                                        <button
                                            type="button"
                                            aria-label="Delete review"
                                            onClick={() => handleDelete(review.review_id)}
                                            className="text-muted-foreground hover:text-destructive"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <StarRating value={review.rating} />
                            {review.comment && (
                                <p className="mt-1 text-sm text-muted-foreground whitespace-pre-line">{review.comment}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
