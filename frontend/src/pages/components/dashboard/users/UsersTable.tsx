import {
  Ban,
  Eye,
  KeyRound,
  MoreHorizontal,
  Pencil,
  ShieldCheck,
  ShieldOff,
  Timer,
  Trash2,
  Undo2,
} from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import UserStatusBadge from "./UserStatusBadge";
import { ADMIN_ROLE_LABELS, AdminRole, AdminUser } from "./types";

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

const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "Never";

interface UsersTableProps {
  users: AdminUser[];
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onView: (user: AdminUser) => void;
  onEdit: (user: AdminUser) => void;
  onSuspend: (user: AdminUser) => void;
  onUnsuspend: (user: AdminUser) => void;
  onBan: (user: AdminUser) => void;
  onUnban: (user: AdminUser) => void;
  onChangeRole: (user: AdminUser, role: AdminRole) => void;
  onResetPassword: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
}

export default function UsersTable({
  users,
  selected,
  onToggleSelect,
  onToggleSelectAll,
  onView,
  onEdit,
  onSuspend,
  onUnsuspend,
  onBan,
  onUnban,
  onChangeRole,
  onResetPassword,
  onDelete,
}: UsersTableProps) {
  const allSelected = users.length > 0 && users.every((u) => selected.has(u.id));

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8">
              <Checkbox checked={allSelected} onCheckedChange={onToggleSelectAll} aria-label="Select all" />
            </TableHead>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Registered</TableHead>
            <TableHead>Last login</TableHead>
            <TableHead>Activity</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                No users match these filters.
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id} data-state={selected.has(user.id) ? "selected" : undefined}>
                <TableCell>
                  <Checkbox
                    checked={selected.has(user.id)}
                    onCheckedChange={() => onToggleSelect(user.id)}
                    aria-label={`Select ${user.email}`}
                  />
                </TableCell>
                <TableCell className="max-w-xs whitespace-normal">
                  <button
                    type="button"
                    onClick={() => onView(user)}
                    className="flex items-center gap-2 text-left hover:underline"
                  >
                    <Avatar size="sm">
                      {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
                      <AvatarFallback>{initials(user.firstName, user.lastName, user.email)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">
                        {user.firstName || user.lastName ? `${user.firstName} ${user.lastName}`.trim() : user.email}
                        {user.verified && (
                          <ShieldCheck className="ml-1 inline size-3.5 text-emerald-400" />
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.username ? `@${user.username}` : user.email}
                      </p>
                    </div>
                  </button>
                </TableCell>
                <TableCell className="capitalize text-foreground">{ADMIN_ROLE_LABELS[user.role]}</TableCell>
                <TableCell>
                  <UserStatusBadge status={user.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(user.lastLoginAt)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {user.stats.gigsPosted} gigs · {user.stats.ordersCompleted} orders
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                      <MoreHorizontal />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem onClick={() => onView(user)}>
                        <Eye /> View details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(user)}>
                        <Pencil /> Edit user
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onResetPassword(user)}>
                        <KeyRound /> Send password reset
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <ShieldCheck /> Change role
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          {(Object.keys(ADMIN_ROLE_LABELS) as AdminRole[])
                            .filter((r) => r !== user.role)
                            .map((r) => (
                              <DropdownMenuItem key={r} onClick={() => onChangeRole(user, r)}>
                                Make {ADMIN_ROLE_LABELS[r]}
                              </DropdownMenuItem>
                            ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>

                      <DropdownMenuSeparator />
                      {user.status === "suspended" ? (
                        <DropdownMenuItem onClick={() => onUnsuspend(user)}>
                          <Undo2 /> Remove suspension
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => onSuspend(user)}>
                          <Timer /> Suspend
                        </DropdownMenuItem>
                      )}
                      {user.status === "banned" ? (
                        <DropdownMenuItem onClick={() => onUnban(user)}>
                          <ShieldOff /> Unban
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem variant="destructive" onClick={() => onBan(user)}>
                          <Ban /> Ban user
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem variant="destructive" onClick={() => onDelete(user)}>
                        <Trash2 /> Delete account
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
