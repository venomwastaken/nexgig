import { useState } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  Eye,
  Loader2,
  Pause,
  Pencil,
  Play,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { CATEGORIES, DELIVERY_OPTIONS } from "@/lib/gigs";
import { GigLifecycleStatus, MyGig } from "./types";

const APPROVAL_STYLES: Record<MyGig["approvalStatus"], string> = {
  pending: "bg-[#d9a441]/10 text-[#d9a441]",
  approved: "bg-[#1b976f]/10 text-[#1b976f]",
  rejected: "bg-[#ef4444]/10 text-[#ef4444]",
};

const APPROVAL_LABELS: Record<MyGig["approvalStatus"], string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
};

const LIFECYCLE_LABELS: Record<GigLifecycleStatus, string> = {
  active: "Live",
  paused: "Paused",
  completed: "Completed",
};

interface EditFormState {
  title: string;
  categoryName: string;
  price: string;
  turnaroundTime: string;
  description: string;
}

interface EditPayload {
  title: string;
  category_name: string;
  price: number;
  turnaround_time: string;
  description: string;
}

interface MyGigsPanelProps {
  gigs: MyGig[];
  onSave: (id: string, payload: EditPayload) => Promise<boolean>;
  onToggleStatus: (gig: MyGig) => void;
  onDelete: (id: string) => Promise<void>;
}

function toFormState(gig: MyGig): EditFormState {
  return {
    title: gig.title,
    categoryName: gig.categoryName,
    price: String(gig.price),
    turnaroundTime: gig.turnaroundTime,
    description: gig.description,
  };
}

export default function MyGigsPanel({
  gigs,
  onSave,
  onToggleStatus,
  onDelete,
}: MyGigsPanelProps) {
  const [editingGig, setEditingGig] = useState<MyGig | null>(null);
  const [form, setForm] = useState<EditFormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingGig, setDeletingGig] = useState<MyGig | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openEdit = (gig: MyGig) => {
    setEditingGig(gig);
    setForm(toFormState(gig));
  };

  const closeEdit = () => {
    setEditingGig(null);
    setForm(null);
  };

  const handleSave = async () => {
    if (!editingGig || !form) return;
    const price = Number(form.price);
    if (!form.title.trim() || !form.categoryName || !form.turnaroundTime) {
      toast.error("Title, category and delivery time are required.");
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      toast.error("Price must be greater than 0.");
      return;
    }

    setSaving(true);
    const ok = await onSave(editingGig.id, {
      title: form.title.trim(),
      category_name: form.categoryName,
      price,
      turnaround_time: form.turnaroundTime,
      description: form.description.trim(),
    });
    setSaving(false);
    if (ok) closeEdit();
  };

  const handleDelete = async () => {
    if (!deletingGig) return;
    setDeleting(true);
    await onDelete(deletingGig.id);
    setDeleting(false);
    setDeletingGig(null);
  };

  return (
    <div className="bg-[#1b1b1b] border border-[#2a2a2a] rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm text-[#f5f5f4]">Gigs you've posted</h2>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-[#8a8a8a]">{gigs.length} total</span>
          <Link
            to="/gig/create"
            className="flex items-center gap-1 text-[11px] font-medium text-[#1b976f] hover:text-[#22b384] transition-colors"
          >
            <Plus size={12} /> New gig
          </Link>
        </div>
      </div>

      {gigs.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-xs text-[#8a8a8a]">You haven't posted any gigs yet.</p>
          <Link
            to="/gig/create"
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#1b976f] hover:text-[#22b384] transition-colors"
          >
            <Plus size={12} /> Post your first gig
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {gigs.map((gig) => (
            <div
              key={gig.id}
              className="border border-[#2a2a2a] rounded-lg p-3.5 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-[#f5f5f4] line-clamp-1">
                  {gig.title}
                </p>
                <span className="text-xs font-mono text-[#8a8a8a] shrink-0">
                  GH₵ {gig.price.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-[#8a8a8a]">{gig.categoryName}</p>

              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${APPROVAL_STYLES[gig.approvalStatus]}`}
                >
                  {APPROVAL_LABELS[gig.approvalStatus]}
                </span>
                {gig.approvalStatus === "approved" && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#2a2a2a] text-[#8a8a8a]">
                    {LIFECYCLE_LABELS[gig.status]}
                  </span>
                )}
              </div>

              {gig.approvalStatus === "rejected" && gig.rejectionReason && (
                <p className="text-[11px] text-[#ef4444]">
                  Reason: {gig.rejectionReason}
                </p>
              )}

              <div className="flex items-center justify-between mt-1 pt-2 border-t border-[#2a2a2a]">
                <div className="flex items-center gap-1">
                  <Link
                    to={`/gigs/${gig.id}`}
                    title="View gig"
                    className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#2a2a2a] transition-colors text-[#8a8a8a] hover:text-[#f5f5f4]"
                  >
                    <Eye size={14} />
                  </Link>
                  <button
                    onClick={() => openEdit(gig)}
                    title="Edit gig"
                    className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#2a2a2a] transition-colors text-[#8a8a8a] hover:text-[#f5f5f4]"
                  >
                    <Pencil size={14} />
                  </button>
                  {gig.approvalStatus === "approved" && gig.status !== "completed" && (
                    <button
                      onClick={() => onToggleStatus(gig)}
                      title={gig.status === "active" ? "Pause gig" : "Reactivate gig"}
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#2a2a2a] transition-colors text-[#8a8a8a] hover:text-[#f5f5f4]"
                    >
                      {gig.status === "active" ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setDeletingGig(gig)}
                  title="Delete gig"
                  className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#2a2a2a] transition-colors"
                >
                  <Trash2 size={14} className="text-[#ef4444]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editingGig} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit gig</DialogTitle>
            <DialogDescription>
              Update the details buyers see for "{editingGig?.title}".
            </DialogDescription>
          </DialogHeader>

          {form && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Title</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Category</label>
                <Combobox
                  items={CATEGORIES}
                  value={CATEGORIES.find((c) => c.value === form.categoryName) ?? null}
                  onValueChange={(category) =>
                    setForm({ ...form, categoryName: category?.value ?? "" })
                  }
                >
                  <ComboboxInput placeholder="Select a category" />
                  <ComboboxContent>
                    <ComboboxEmpty>No items found.</ComboboxEmpty>
                    <ComboboxList>
                      {(category) => (
                        <ComboboxItem key={category.value} value={category}>
                          {category.label}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Price (GHS)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Delivery time</label>
                  <Combobox
                    items={DELIVERY_OPTIONS}
                    value={
                      DELIVERY_OPTIONS.find((d) => d.value === form.turnaroundTime) ?? null
                    }
                    onValueChange={(option) =>
                      setForm({ ...form, turnaroundTime: option?.value ?? "" })
                    }
                  >
                    <ComboboxInput placeholder="Delivery time" />
                    <ComboboxContent>
                      <ComboboxEmpty>No items found.</ComboboxEmpty>
                      <ComboboxList>
                        {(option) => (
                          <ComboboxItem key={option.value} value={option}>
                            {option.label}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <Textarea
                  className="min-h-32"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeEdit} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : null}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deletingGig} onOpenChange={(open) => !open && setDeletingGig(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete gig</DialogTitle>
            <DialogDescription>
              This permanently removes "{deletingGig?.title}" from the platform. This can't be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingGig(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="animate-spin" /> : <X />}
              Delete gig
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
