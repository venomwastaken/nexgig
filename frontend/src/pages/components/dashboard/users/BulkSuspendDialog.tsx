import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

const DURATION_OPTIONS: { label: string; hours: number | null }[] = [
  { label: "24 hours", hours: 24 },
  { label: "3 days", hours: 72 },
  { label: "7 days", hours: 168 },
  { label: "30 days", hours: 720 },
  { label: "Indefinite", hours: null },
];

interface BulkSuspendDialogProps {
  open: boolean;
  count: number;
  onOpenChange: (open: boolean) => void;
  onConfirm: (payload: { reason?: string; durationHours?: number }) => Promise<void>;
}

export default function BulkSuspendDialog({ open, count, onOpenChange, onConfirm }: BulkSuspendDialogProps) {
  const [reason, setReason] = useState("");
  const [durationHours, setDurationHours] = useState<number | null>(72);
  const [saving, setSaving] = useState(false);

  const durationLabel = DURATION_OPTIONS.find((d) => d.hours === durationHours)?.label ?? "Custom";

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await onConfirm({ reason: reason.trim() || undefined, durationHours: durationHours ?? undefined });
      onOpenChange(false);
      setReason("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suspend {count} users</DialogTitle>
          <DialogDescription>
            They won't be able to sign in until the suspension is lifted or expires.
          </DialogDescription>
        </DialogHeader>

        <Field>
          <FieldLabel>Duration</FieldLabel>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" className="w-fit" />}>
              {durationLabel}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuRadioGroup
                value={String(durationHours)}
                onValueChange={(v) => setDurationHours(v === "null" ? null : Number(v))}
              >
                {DURATION_OPTIONS.map((opt) => (
                  <DropdownMenuRadioItem key={opt.label} value={String(opt.hours)}>
                    {opt.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </Field>

        <Field>
          <FieldLabel htmlFor="bulk-suspend-reason">Reason (optional)</FieldLabel>
          <Textarea
            id="bulk-suspend-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </Field>

        <DialogFooter>
          <Button variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={saving} onClick={handleConfirm}>
            {saving && <Loader2 className="animate-spin" />}
            Suspend {count} users
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
