export type GigReviewer = {
    user_id: string;
    first_name: string;
    last_name: string;
    username: string;
    avatar_url?: string | null;
};

export type GigReview = {
    review_id: string;
    gig_id: string;
    reviewer: GigReviewer;
    rating: number;
    comment?: string | null;
    created_at: string;
};

export type GigReviewSummary = {
    gig_id: string;
    average_rating: number | null;
    review_count: number;
};
