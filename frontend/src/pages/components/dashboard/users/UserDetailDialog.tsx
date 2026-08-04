import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import UserStatusBadge from "./UserStatusBadge";
import { ADMIN_ROLE_LABELS, AdminUser } from "./types";

const initials = (first: string, last: string, fallback: string) => {
  const name = `${first} ${last}`.trim();
  if (!name) return fallback.slice(0, 2).toUpperCase();
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const formatDateTime = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Never";

interface UserDetailDialogProps {
  user: AdminUser | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (user: AdminUser) => void;
}

export default function UserDetailDialog({ user, onOpenChange, onEdit }: UserDetailDialogProps) {
  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {user && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <Avatar size="lg">
                  {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
                  <AvatarFallback>{initials(user.firstName, user.lastName, user.email)}</AvatarFallback>
                </Avatar>
                <div>
                  <DialogTitle>
                    {user.firstName || user.lastName ? `${user.firstName} ${user.lastName}`.trim() : user.email}
                  </DialogTitle>
                  <DialogDescription>{user.username ? `@${user.username}` : user.email}</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="flex flex-wrap items-center gap-2">
              <UserStatusBadge status={user.status} />
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                {ADMIN_ROLE_LABELS[user.role]}
              </span>
              {user.verified && (
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20">
                  Verified
                </span>
              )}
            </div>

            <Separator />

            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="text-right text-foreground">{user.email}</dd>
              <dt className="text-muted-foreground">Registered</dt>
              <dd className="text-right text-foreground">{formatDateTime(user.createdAt)}</dd>
              <dt className="text-muted-foreground">Last login</dt>
              <dd className="text-right text-foreground">{formatDateTime(user.lastLoginAt)}</dd>
              {user.status === "suspended" && user.suspension && (
                <>
                  <dt className="text-muted-foreground">Suspended until</dt>
                  <dd className="text-right text-foreground">{formatDateTime(user.suspension.expiresAt)}</dd>
                  {user.suspension.reason && (
                    <>
                      <dt className="text-muted-foreground">Reason</dt>
                      <dd className="text-right text-foreground">{user.suspension.reason}</dd>
                    </>
                  )}
                </>
              )}
              {user.status === "banned" && user.banReason && (
                <>
                  <dt className="text-muted-foreground">Ban reason</dt>
                  <dd className="text-right text-foreground">{user.banReason}</dd>
                </>
              )}
            </dl>

            <Separator />

            <div>
              <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Activity
              </p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="text-lg font-semibold text-foreground">{user.stats.gigsPosted}</p>
                  <p className="text-xs text-muted-foreground">Gigs posted</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="text-lg font-semibold text-foreground">{user.stats.ordersCompleted}</p>
                  <p className="text-xs text-muted-foreground">Orders done</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="text-lg font-semibold text-foreground">
                    {user.stats.averageRating != null ? user.stats.averageRating.toFixed(1) : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Avg rating ({user.stats.reviewsReceived})
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={() => onEdit(user)}>Edit user</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
