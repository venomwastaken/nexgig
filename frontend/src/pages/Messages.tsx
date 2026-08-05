import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Badge from "@/components/ui/Badge";
import { Bubble, BubbleContent, BubbleGroup } from "@/components/ui/bubble";
import {
    Message,
    MessageAvatar,
    MessageContent,
    MessageFooter,
    MessageGroup,
} from "@/components/ui/message";
import { Textarea } from "@/components/ui/textarea";
import { useApi } from "@/hooks/useApi";
import { useConversationSocket } from "@/hooks/useConversationSocket";
import { cn } from "@/lib/utils";
import type { ChatMessage, ConversationSummary, ProviderSummary } from "@/lib/messages";
import { useUser } from "@clerk/react";
import { ArrowLeft, Loader2, Paperclip, Send } from "lucide-react";
import { ChangeEvent, Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";

function formatMessageTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

type MessageCluster = {
    senderId: string;
    isMine: boolean;
    messages: ChatMessage[];
};

// Consecutive messages from the same sender collapse into one Message row
// (one avatar) with a BubbleGroup of stacked bubbles, matching shadcn's
// grouping pattern instead of repeating an avatar per message.
function clusterMessages(messages: ChatMessage[], currentUserId: string | null): MessageCluster[] {
    const clusters: MessageCluster[] = [];
    for (const m of messages) {
        const last = clusters[clusters.length - 1];
        if (last && last.senderId === m.sender_id) {
            last.messages.push(m);
        } else {
            clusters.push({
                senderId: m.sender_id,
                isMine: m.sender_id === currentUserId,
                messages: [m],
            });
        }
    }
    return clusters;
}

export default function Messages() {
    const { conversationId } = useParams<{ conversationId?: string }>();
    const api = useApi();
    const [conversations, setConversations] = useState<ConversationSummary[]>([]);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const refreshConversations = useCallback(() => {
        api
            .get<ConversationSummary[]>("/messaging/conversations")
            .then((res) => setConversations(res.data))
            .catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        let cancelled = false;
        setLoadingConversations(true);
        Promise.all([
            api.get<ConversationSummary[]>("/messaging/conversations"),
            api.get<{ user_id: string }>("/users/me"),
        ])
            .then(([convRes, meRes]) => {
                if (cancelled) return;
                setConversations(convRes.data);
                setCurrentUserId(meRes.data.user_id);
            })
            .catch(() => {
                if (!cancelled) toast.error("Couldn't load your messages.");
            })
            .finally(() => {
                if (!cancelled) setLoadingConversations(false);
            });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const activeConversation = conversations.find((c) => c.id === conversationId) ?? null;

    return (
        <div className="min-h-screen bg-background">
            <main className="mx-auto max-w-6xl px-4 md:px-6 py-8 md:py-12">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-6">
                    Messages
                </h1>

                <div className="grid md:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-260px)] min-h-120">
                    <div className={cn(conversationId && "hidden md:block")}>
                        <ConversationListPane
                            conversations={conversations}
                            loading={loadingConversations}
                            activeId={conversationId}
                        />
                    </div>
                    <div className={cn(!conversationId && "hidden md:block")}>
                        {conversationId ? (
                            <ThreadPane
                                key={conversationId}
                                conversationId={conversationId}
                                currentUserId={currentUserId}
                                otherParticipant={activeConversation?.other_participant ?? null}
                                onMessageSent={refreshConversations}
                            />
                        ) : (
                            <div className="h-full grid place-items-center rounded-2xl border border-border bg-card text-sm text-muted-foreground">
                                Select a conversation to start chatting.
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

function ConversationListPane({
    conversations,
    loading,
    activeId,
}: {
    conversations: ConversationSummary[];
    loading: boolean;
    activeId?: string;
}) {
    return (
        <div className="h-full flex flex-col rounded-2xl border border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border shrink-0">
                <h2 className="font-semibold">Conversations</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-muted-foreground" size={22} />
                    </div>
                ) : conversations.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground">
                        No conversations yet. Start one from a gig's page.
                    </p>
                ) : (
                    <ul>
                        {conversations.map((c) => (
                            <li key={c.id}>
                                <Link
                                    to={`/messages/${c.id}`}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-muted/50 transition-colors",
                                        c.id === activeId && "bg-muted"
                                    )}
                                >
                                    <Avatar>
                                        <AvatarImage src={c.other_participant.avatar_url ?? undefined} />
                                        <AvatarFallback>
                                            {c.other_participant.first_name[0]}
                                            {c.other_participant.last_name[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-medium truncate">
                                                {c.other_participant.first_name}{" "}
                                                {c.other_participant.last_name}
                                            </span>
                                            {c.unread_count > 0 && (
                                                <Badge variant="accent">{c.unread_count}</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate">
                                            {c.last_message_preview ?? "Say hello"}
                                        </p>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

function ThreadPane({
    conversationId,
    currentUserId,
    otherParticipant,
    onMessageSent,
}: {
    conversationId: string;
    currentUserId: string | null;
    otherParticipant: ProviderSummary | null;
    onMessageSent: () => void;
}) {
    const api = useApi();
    const { user } = useUser();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const clusters = useMemo(
        () => clusterMessages(messages, currentUserId),
        [messages, currentUserId]
    );
    const [loading, setLoading] = useState(true);
    const [text, setText] = useState("");
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    const handleIncoming = useCallback((message: ChatMessage) => {
        setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
        onMessageSent();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const { sendMessage } = useConversationSocket(conversationId, handleIncoming);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        api
            .get<ChatMessage[]>(`/messaging/conversations/${conversationId}/messages`)
            .then((res) => {
                if (!cancelled) setMessages(res.data);
            })
            .catch(() => {
                if (!cancelled) toast.error("Couldn't load this conversation.");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversationId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages.length]);

    async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Only image attachments are supported.");
            return;
        }
        if (file.size > 8 * 1024 * 1024) {
            toast.error("Images must be under 8MB.");
            return;
        }

        setUploading(true);
        try {
            const { data } = await api.post(
                `/messaging/conversations/${conversationId}/attachments/presign`,
                { filename: file.name, content_type: file.type }
            );
            // Direct-to-R2 upload — deliberately not through the `api` axios
            // instance, since no Authorization header should go to R2 and it's
            // a different origin than our own backend.
            await fetch(data.upload_url, {
                method: "PUT",
                headers: { "Content-Type": file.type },
                body: file,
            });
            sendMessage({ attachment_url: data.object_url, attachment_type: file.type });
        } catch {
            toast.error("Couldn't send that image. Please try again.");
        } finally {
            setUploading(false);
        }
    }

    function handleSend() {
        const trimmed = text.trim();
        if (!trimmed) return;
        sendMessage({ body: trimmed });
        setText("");
    }

    return (
        <div className="h-full flex flex-col rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-3 border-b border-border p-4 shrink-0">
                <Link
                    to="/messages"
                    className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft size={18} />
                </Link>
                {otherParticipant && (
                    <>
                        <Avatar size="sm">
                            <AvatarImage src={otherParticipant.avatar_url ?? undefined} />
                            <AvatarFallback>
                                {otherParticipant.first_name[0]}
                                {otherParticipant.last_name[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="font-medium leading-tight">
                                {otherParticipant.first_name} {otherParticipant.last_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                @{otherParticipant.username}
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-muted-foreground" size={22} />
                    </div>
                ) : (
                    <MessageGroup>
                        {clusters.map((cluster) => {
                            const { isMine } = cluster;
                            const lastMessage = cluster.messages[cluster.messages.length - 1];
                            return (
                                <Message
                                    key={cluster.messages[0].id}
                                    align={isMine ? "end" : "start"}
                                >
                                    <MessageAvatar>
                                        <Avatar size="sm">
                                            <AvatarImage
                                                src={
                                                    isMine
                                                        ? user?.imageUrl
                                                        : otherParticipant?.avatar_url ?? undefined
                                                }
                                            />
                                            <AvatarFallback>
                                                {isMine
                                                    ? user?.firstName?.[0]
                                                    : otherParticipant?.first_name?.[0]}
                                                {isMine
                                                    ? user?.lastName?.[0]
                                                    : otherParticipant?.last_name?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                    </MessageAvatar>
                                    <MessageContent>
                                        <BubbleGroup>
                                            {cluster.messages.map((m) => (
                                                <Fragment key={m.id}>
                                                    {m.attachment_url && (
                                                        <Bubble variant="ghost">
                                                            <BubbleContent>
                                                                <img
                                                                    src={m.attachment_url}
                                                                    alt="Attachment"
                                                                    className="max-w-xs rounded-lg"
                                                                />
                                                            </BubbleContent>
                                                        </Bubble>
                                                    )}
                                                    {m.body && (
                                                        <Bubble variant={isMine ? "default" : "muted"}>
                                                            <BubbleContent>{m.body}</BubbleContent>
                                                        </Bubble>
                                                    )}
                                                </Fragment>
                                            ))}
                                        </BubbleGroup>
                                        <MessageFooter>
                                            {formatMessageTime(lastMessage.created_at)}
                                            {isMine && " · Delivered"}
                                        </MessageFooter>
                                    </MessageContent>
                                </Message>
                            );
                        })}
                        <div ref={bottomRef} />
                    </MessageGroup>
                )}
            </div>

            <div className="border-t border-border p-3 flex items-end gap-2 shrink-0">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
                >
                    {uploading ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <Paperclip size={18} />
                    )}
                </button>
                <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    placeholder="Write a message..."
                    className="min-h-10 max-h-32 resize-none"
                />
                <button
                    type="button"
                    onClick={handleSend}
                    disabled={!text.trim()}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50 transition-opacity hover:opacity-90"
                >
                    <Send size={16} />
                </button>
            </div>
        </div>
    );
}
