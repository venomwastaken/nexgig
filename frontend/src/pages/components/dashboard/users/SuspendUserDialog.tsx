import { useEffect, useState } from "react";
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
import { AdminUser } from "./types";
import { SuspendPayload } from "./api";

const DURATION_OPTIONS: { label: string; hours: number | null }[] = [
  { label: "24 hours", hours: 24 },
  { label: "3 days", hours: 72 },
  { label: "7 days", hours: 168 },
  { label: "30 days", hours: 720 },
  { label: "Indefinite", hours: null },
];

interface SuspendUserDialogProps {
  user: AdminUser | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (userId: string, payload: SuspendPayload) => Promise<void>;
}

export default function SuspendUserDialog({ user, onOpenChange, onConfirm }: SuspendUserDialogProps) {
  const [reason, setReason] = useState("");
  const [durationHours, setDurationHours] = useState<number | null>(72);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setReason("");
      setDurationHours(72);
    }
  }, [user]);

  const durationLabel =
    DURATION_OPTIONS.find((d) => d.hours === durationHours)?.label ?? "Custom";

  const handleConfirm = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await onConfirm(user.id, { reason: reason.trim() || undefined, durationHours: durationHours ?? undefined });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!user} onOpenChange={(open) => !saving && onOpenChange(open)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suspend user</DialogTitle>
          <DialogDescription>
            {user?.email} won't be able to sign in until the suspension is lifted or expires.
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
          <FieldLabel htmlFor="suspend-reason">Reason (optional)</FieldLabel>
          <Textarea
            id="suspend-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Repeated policy violations reported by other users."
            rows={3}
          />
        </Field>

        <DialogFooter>
          <Button variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={saving} onClick={handleConfirm}>
            {saving && <Loader2 className="animate-spin" />}
            Suspend user
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
