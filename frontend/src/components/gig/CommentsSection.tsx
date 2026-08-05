import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import Button from "@/pages/ui/Button";
import { useApi } from "@/hooks/useApi";
import { GigComment } from "@/lib/comments";
import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

function timeAgo(iso: string) {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / (1000 * 60));
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return days === 1 ? "1 day ago" : `${days} days ago`;
}

export default function CommentsSection({ gigId }: { gigId: string }) {
    const api = useApi();
    const [comments, setComments] = useState<GigComment[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [body, setBody] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [replyTo, setReplyTo] = useState<string | null>(null);
    const [replyBody, setReplyBody] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editBody, setEditBody] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            try {
                const [commentsRes, meRes] = await Promise.all([
                    api.get<GigComment[]>(`/gigs/${gigId}/comments`),
                    api.get<{ user_id: string }>('/users/me/account'),
                ]);
                if (cancelled) return;
                setComments(commentsRes.data);
                setCurrentUserId(meRes.data.user_id);
            } catch {
                if (!cancelled) toast.error("Couldn't load comments.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [api, gigId]);

    const topLevel = useMemo(() => comments.filter((c) => !c.parent_comment_id), [comments]);
    const repliesFor = (id: string) => comments.filter((c) => c.parent_comment_id === id);

    async function postComment(text: string, parentId: string | null) {
        const { data } = await api.post<GigComment>(`/gigs/${gigId}/comments`, {
            body: text,
            parent_comment_id: parentId,
        });
        setComments((prev) => [...prev, data]);
        return data;
    }

    async function handleSubmit() {
        if (!body.trim()) return;
        setSubmitting(true);
        try {
            await postComment(body.trim(), null);
            setBody("");
        } catch {
            toast.error("Couldn't post your comment.");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleReply(parentId: string) {
        if (!replyBody.trim()) return;
        try {
            await postComment(replyBody.trim(), parentId);
            setReplyBody("");
            setReplyTo(null);
        } catch {
            toast.error("Couldn't post your reply.");
        }
    }

    async function handleEdit(commentId: string) {
        if (!editBody.trim()) return;
        try {
            const { data } = await api.patch<GigComment>(`/comments/${commentId}`, {
                body: editBody.trim(),
            });
            setComments((prev) => prev.map((c) => (c.id === commentId ? data : c)));
            setEditingId(null);
        } catch {
            toast.error("Couldn't save your edit.");
        }
    }

    async function handleDelete(commentId: string) {
        try {
            await api.delete(`/comments/${commentId}`);
            setComments((prev) =>
                prev
                    .filter((c) => c.id !== commentId)
                    .map((c) => (c.parent_comment_id === commentId ? { ...c, parent_comment_id: null } : c)),
            );
        } catch {
            toast.error("Couldn't delete that comment.");
        }
    }

    function CommentRow({ comment, isReply = false }: { comment: GigComment; isReply?: boolean }) {
        const mine = comment.author.user_id === currentUserId;
        return (
            <div className={`flex gap-3 ${isReply ? "ml-11 mt-3" : ""}`}>
                <Avatar size={isReply ? "sm" : "default"}>
                    <AvatarImage src={comment.author.avatar_url ?? undefined} />
                    <AvatarFallback>
                        {comment.author.first_name[0]}
                        {comment.author.last_name[0]}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                            {comment.author.first_name} {comment.author.last_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {timeAgo(comment.created_at)}
                            {comment.is_edited ? " · edited" : ""}
                        </span>
                    </div>

                    {editingId === comment.id ? (
                        <div className="mt-1.5 flex flex-col gap-2">
                            <Textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} className="min-h-16" />
                            <div className="flex gap-2">
                                <Button type="button" onClick={() => handleEdit(comment.id)} className="w-auto px-3 py-1.5 text-sm">
                                    Save
                                </Button>
                                <button type="button" onClick={() => setEditingId(null)} className="text-sm text-muted-foreground hover:text-foreground">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="mt-1 text-sm text-muted-foreground whitespace-pre-line">{comment.body}</p>
                    )}

                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        {!isReply && (
                            <button type="button" onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)} className="hover:text-foreground">
                                Reply
                            </button>
                        )}
                        {mine && editingId !== comment.id && (
                            <>
                                <button type="button" onClick={() => { setEditingId(comment.id); setEditBody(comment.body); }} className="inline-flex items-center gap-1 hover:text-foreground">
                                    <Pencil size={12} /> Edit
                                </button>
                                <button type="button" onClick={() => handleDelete(comment.id)} className="inline-flex items-center gap-1 hover:text-destructive">
                                    <Trash2 size={12} /> Delete
                                </button>
                            </>
                        )}
                    </div>

                    {replyTo === comment.id && (
                        <div className="mt-2 flex flex-col gap-2">
                            <Textarea value={replyBody} onChange={(e) => setReplyBody(e.target.value)} placeholder="Write a reply..." className="min-h-14" />
                            <Button type="button" onClick={() => handleReply(comment.id)} className="w-auto self-end px-3 py-1.5 text-sm">
                                Reply
                            </Button>
                        </div>
                    )}

                    {repliesFor(comment.id).map((reply) => (
                        <CommentRow key={reply.id} comment={reply} isReply />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-semibold">Questions &amp; comments</h2>

            {currentUserId && (
                <div className="mt-4 flex flex-col gap-2">
                    <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Ask the provider a question or leave a comment..." className="min-h-20" />
                    <Button type="button" isLoading={submitting} loadingText="Posting" onClick={handleSubmit} className="w-auto self-end px-4">
                        Post comment
                    </Button>
                </div>
            )}

            <div className="mt-5 flex flex-col gap-5">
                {loading && <p className="text-sm text-muted-foreground">Loading comments...</p>}
                {!loading && topLevel.length === 0 && <p className="text-sm text-muted-foreground">No comments yet. Ask the first question.</p>}
                {topLevel.map((comment) => (
                    <CommentRow key={comment.id} comment={comment} />
                ))}
            </div>
        </div>
    );
}
