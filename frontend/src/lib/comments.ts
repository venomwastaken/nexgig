export type GigCommentAuthor = {
    user_id: string;
    first_name: string;
    last_name: string;
    username: string;
    avatar_url?: string | null;
};

export type GigComment = {
    id: string;
    gig_id: string;
    author: GigCommentAuthor;
    parent_comment_id?: string | null;
    body: string;
    created_at: string;
    updated_at: string;
    is_edited: boolean;
};
