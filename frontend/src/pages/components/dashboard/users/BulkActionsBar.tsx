import { Ban, ShieldCheck, Timer, Trash2, Undo2, X as XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { AdminRole } from "./types";

interface BulkActionsBarProps {
  count: number;
  onClear: () => void;
  onBan: () => void;
  onUnban: () => void;
  onSuspend: () => void;
  onChangeRole: (role: AdminRole) => void;
  onDelete: () => void;
}

export default function BulkActionsBar({
  count,
  onClear,
  onBan,
  onUnban,
  onSuspend,
  onChangeRole,
  onDelete,
}: BulkActionsBarProps) {
  if (count === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2">
      <span className="text-sm font-medium text-foreground">{count} selected</span>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={onSuspend}>
          <Timer /> Suspend
        </Button>
        <Button size="sm" variant="outline" onClick={onBan}>
          <Ban /> Ban
        </Button>
        <Button size="sm" variant="outline" onClick={onUnban}>
          <Undo2 /> Unban
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button size="sm" variant="outline" />}>
            <ShieldCheck /> Change role
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onChangeRole("user")}>Make User</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onChangeRole("moderator")}>Make Moderator</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onChangeRole("admin")}>Make Admin</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button size="sm" variant="destructive" onClick={onDelete}>
          <Trash2 /> Delete
        </Button>
        <Button size="sm" variant="ghost" onClick={onClear}>
          <XIcon /> Clear
        </Button>
      </div>
    </div>
  );
}
