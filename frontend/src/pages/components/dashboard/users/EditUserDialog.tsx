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
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import { AdminUser } from "./types";
import { UpdateUserPayload } from "./api";

interface EditUserDialogProps {
  user: AdminUser | null;
  onOpenChange: (open: boolean) => void;
  onSave: (userId: string, payload: UpdateUserPayload) => Promise<void>;
}

export default function EditUserDialog({ user, onOpenChange, onSave }: EditUserDialogProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setUsername(user.username);
      setEmail(user.email);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await onSave(user.id, { firstName, lastName, username, email });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!user} onOpenChange={(open) => !saving && onOpenChange(open)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
          <DialogDescription>
            Update account details for {user?.email}. Changes take effect immediately.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="edit-first-name">First name</FieldLabel>
              <Input id="edit-first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-last-name">Last name</FieldLabel>
              <Input id="edit-last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="edit-username">Username</FieldLabel>
            <Input id="edit-username" value={username} onChange={(e) => setUsername(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="edit-email">Email</FieldLabel>
            <Input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={saving || !username.trim() || !email.trim()} onClick={handleSave}>
            {saving && <Loader2 className="animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
