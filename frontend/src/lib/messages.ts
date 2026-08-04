export type ProviderSummary = {
    user_id: string;
    first_name: string;
    last_name: string;
    username: string;
    avatar_url?: string | null;
};

export type ConversationSummary = {
    id: string;
    other_participant: ProviderSummary;
    gig_id?: string | null;
    last_message_at?: string | null;
    last_message_preview?: string | null;
    unread_count: number;
    created_at: string;
};

export type ChatMessage = {
    id: string;
    conversation_id: string;
    sender_id: string;
    body?: string | null;
    attachment_url?: string | null;
    attachment_type?: string | null;
    created_at: string;
};
