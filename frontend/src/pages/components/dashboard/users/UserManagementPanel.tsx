import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useApi } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ConfirmDialog";
import UserFiltersBar from "./UserFiltersBar";
import UsersTable from "./UsersTable";
import UsersPagination from "./UsersPagination";
import BulkActionsBar from "./BulkActionsBar";
import BulkSuspendDialog from "./BulkSuspendDialog";
import UserDetailDialog from "./UserDetailDialog";
import EditUserDialog from "./EditUserDialog";
import SuspendUserDialog from "./SuspendUserDialog";
import {
  banUser,
  deleteUser,
  fetchUsers,
  performBulkAction,
  sendPasswordReset,
  setUserRole,
  suspendUser,
  unbanUser,
  unsuspendUser,
  updateUser,
} from "./api";
import { AdminAccountStatus, AdminRole, AdminUser, SortField, SortOrder } from "./types";

interface ConfirmState {
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  action: () => Promise<void>;
}

const displayName = (user: AdminUser) =>
  user.firstName || user.lastName ? `${user.firstName} ${user.lastName}`.trim() : user.email;

export default function UserManagementPanel() {
  const api = useApi();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState<AdminAccountStatus | "all">("all");
  const [role, setRole] = useState<AdminRole | "all">("all");
  const [sort, setSort] = useState<SortField>("created_at");
  const [order, setOrder] = useState<SortOrder>("desc");
  const [limit, setLimit] = useState(25);
  const [offset, setOffset] = useState(0);

  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [viewUser, setViewUser] = useState<AdminUser | null>(null);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<AdminUser | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [bulkSuspendOpen, setBulkSuspendOpen] = useState(false);

  // Debounce free-text search so we don't fire a request per keystroke.
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedQ(q);
      setOffset(0);
    }, 350);
    return () => clearTimeout(handle);
  }, [q]);

  const loadUsers = useCallback(
    (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      setError(null);
      return fetchUsers(api, { q: debouncedQ, status, role, sort, order, limit, offset })
        .then((res) => {
          setUsers(res.users);
          setTotal(res.total);
        })
        .catch(() => {
          setError("Couldn't load users. The admin user-management API may not be implemented yet.");
        })
        .finally(() => {
          if (!opts?.silent) setLoading(false);
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [debouncedQ, status, role, sort, order, limit, offset]
  );

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const refetch = () => loadUsers({ silent: true });

  const patchUser = (updated: AdminUser) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  };

  const dropSelection = (ids: string[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  };

  // ---------- Selection ----------

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected((prev) => {
      const allSelected = users.length > 0 && users.every((u) => prev.has(u.id));
      if (allSelected) {
        const next = new Set(prev);
        users.forEach((u) => next.delete(u.id));
        return next;
      }
      const next = new Set(prev);
      users.forEach((u) => next.add(u.id));
      return next;
    });
  };

  // ---------- Single-user actions ----------

  const handleSaveEdit = async (userId: string, payload: Parameters<typeof updateUser>[2]) => {
    try {
      const updated = await updateUser(api, userId, payload);
      patchUser(updated);
      toast.success("User updated.");
    } catch {
      toast.error("Couldn't save changes. Please try again.");
      throw new Error("save-failed");
    }
  };

  const handleConfirmSuspend = async (userId: string, payload: Parameters<typeof suspendUser>[2]) => {
    try {
      const updated = await suspendUser(api, userId, payload);
      patchUser(updated);
      toast.success(`${updated.email} has been suspended.`);
    } catch {
      toast.error("Couldn't suspend this user. Please try again.");
      throw new Error("suspend-failed");
    }
  };

  const handleUnsuspend = (user: AdminUser) => {
    setConfirmState({
      title: "Remove suspension",
      description: `${displayName(user)} will regain access immediately.`,
      confirmLabel: "Remove suspension",
      action: async () => {
        try {
          const updated = await unsuspendUser(api, user.id);
          patchUser(updated);
          toast.success(`Suspension removed for ${updated.email}.`);
        } catch {
          toast.error("Couldn't lift the suspension. Please try again.");
          throw new Error("unsuspend-failed");
        }
      },
    });
  };

  const handleBan = (user: AdminUser) => {
    setConfirmState({
      title: "Ban user",
      description: `${displayName(user)} will be permanently blocked from signing in. This can be reversed later.`,
      confirmLabel: "Ban user",
      destructive: true,
      action: async () => {
        try {
          const updated = await banUser(api, user.id);
          patchUser(updated);
          toast.success(`${updated.email} has been banned.`);
        } catch {
          toast.error("Couldn't ban this user. Please try again.");
          throw new Error("ban-failed");
        }
      },
    });
  };

  const handleUnban = (user: AdminUser) => {
    setConfirmState({
      title: "Unban user",
      description: `${displayName(user)} will be able to sign in again.`,
      confirmLabel: "Unban user",
      action: async () => {
        try {
          const updated = await unbanUser(api, user.id);
          patchUser(updated);
          toast.success(`${updated.email} has been unbanned.`);
        } catch {
          toast.error("Couldn't unban this user. Please try again.");
          throw new Error("unban-failed");
        }
      },
    });
  };

  const handleChangeRole = (user: AdminUser, role: AdminRole) => {
    setConfirmState({
      title: `Change role to ${role}`,
      description: `${displayName(user)} will become ${role === "admin" ? "an" : "a"} ${role}.`,
      confirmLabel: "Change role",
      destructive: role === "admin",
      action: async () => {
        try {
          const updated = await setUserRole(api, user.id, role);
          patchUser(updated);
          toast.success(`${updated.email} is now ${role}.`);
        } catch {
          toast.error("Couldn't change this user's role. Please try again.");
          throw new Error("role-failed");
        }
      },
    });
  };

  const handleResetPassword = async (user: AdminUser) => {
    try {
      await sendPasswordReset(api, user.id);
      toast.success(`Password reset email sent to ${user.email}.`);
    } catch {
      toast.error("Couldn't send the password reset email. Please try again.");
    }
  };

  const handleDelete = (user: AdminUser) => {
    setConfirmState({
      title: "Delete account",
      description: `This permanently deletes ${displayName(user)}'s account and cannot be undone.`,
      confirmLabel: "Delete account",
      destructive: true,
      action: async () => {
        try {
          await deleteUser(api, user.id);
          setUsers((prev) => prev.filter((u) => u.id !== user.id));
          setTotal((t) => Math.max(0, t - 1));
          dropSelection([user.id]);
          toast.success(`${displayName(user)}'s account was deleted.`);
        } catch {
          toast.error("Couldn't delete this account. Please try again.");
          throw new Error("delete-failed");
        }
      },
    });
  };

  // ---------- Bulk actions ----------

  const selectedIds = Array.from(selected);

  const handleBulkBan = () => {
    setConfirmState({
      title: `Ban ${selectedIds.length} users`,
      description: "They'll be permanently blocked from signing in. This can be reversed later.",
      confirmLabel: "Ban users",
      destructive: true,
      action: async () => {
        try {
          await performBulkAction(api, { userIds: selectedIds, action: "ban" });
          toast.success(`Banned ${selectedIds.length} users.`);
          setSelected(new Set());
          await refetch();
        } catch {
          toast.error("Couldn't ban the selected users. Please try again.");
          throw new Error("bulk-ban-failed");
        }
      },
    });
  };

  const handleBulkUnban = () => {
    setConfirmState({
      title: `Unban ${selectedIds.length} users`,
      description: "They'll be able to sign in again.",
      confirmLabel: "Unban users",
      action: async () => {
        try {
          await performBulkAction(api, { userIds: selectedIds, action: "unban" });
          toast.success(`Unbanned ${selectedIds.length} users.`);
          setSelected(new Set());
          await refetch();
        } catch {
          toast.error("Couldn't unban the selected users. Please try again.");
          throw new Error("bulk-unban-failed");
        }
      },
    });
  };

  const handleBulkDelete = () => {
    setConfirmState({
      title: `Delete ${selectedIds.length} accounts`,
      description: "This permanently deletes these accounts and cannot be undone.",
      confirmLabel: "Delete accounts",
      destructive: true,
      action: async () => {
        try {
          await performBulkAction(api, { userIds: selectedIds, action: "delete" });
          toast.success(`Deleted ${selectedIds.length} accounts.`);
          setSelected(new Set());
          await refetch();
        } catch {
          toast.error("Couldn't delete the selected accounts. Please try again.");
          throw new Error("bulk-delete-failed");
        }
      },
    });
  };

  const handleBulkChangeRole = (newRole: AdminRole) => {
    setConfirmState({
      title: `Change role to ${newRole}`,
      description: `${selectedIds.length} users will become ${newRole === "admin" ? "an" : "a"} ${newRole}.`,
      confirmLabel: "Change role",
      destructive: newRole === "admin",
      action: async () => {
        try {
          await performBulkAction(api, { userIds: selectedIds, action: "set_role", role: newRole });
          toast.success(`Updated role for ${selectedIds.length} users.`);
          setSelected(new Set());
          await refetch();
        } catch {
          toast.error("Couldn't change roles for the selected users. Please try again.");
          throw new Error("bulk-role-failed");
        }
      },
    });
  };

  const handleBulkSuspendConfirm = async (payload: { reason?: string; durationHours?: number }) => {
    try {
      await performBulkAction(api, { userIds: selectedIds, action: "suspend", ...payload });
      toast.success(`Suspended ${selectedIds.length} users.`);
      setSelected(new Set());
      await refetch();
    } catch {
      toast.error("Couldn't suspend the selected users. Please try again.");
      throw new Error("bulk-suspend-failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <UserFiltersBar
          q={q}
          onQChange={setQ}
          status={status}
          onStatusChange={(s) => {
            setStatus(s);
            setOffset(0);
          }}
          role={role}
          onRoleChange={(r) => {
            setRole(r);
            setOffset(0);
          }}
          sort={sort}
          order={order}
          onSortChange={(s, o) => {
            setSort(s);
            setOrder(o);
          }}
        />
        <Button variant="outline" size="sm" onClick={() => loadUsers()} disabled={loading}>
          <RefreshCw className={loading ? "animate-spin" : ""} /> Refresh
        </Button>
      </div>

      <BulkActionsBar
        count={selected.size}
        onClear={() => setSelected(new Set())}
        onBan={handleBulkBan}
        onUnban={handleBulkUnban}
        onSuspend={() => setBulkSuspendOpen(true)}
        onChangeRole={handleBulkChangeRole}
        onDelete={handleBulkDelete}
      />

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin text-muted-foreground" size={24} />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {error}
        </div>
      ) : (
        <>
          <UsersTable
            users={users}
            selected={selected}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onView={setViewUser}
            onEdit={setEditUser}
            onSuspend={setSuspendTarget}
            onUnsuspend={handleUnsuspend}
            onBan={handleBan}
            onUnban={handleUnban}
            onChangeRole={handleChangeRole}
            onResetPassword={handleResetPassword}
            onDelete={handleDelete}
          />
          <UsersPagination
            total={total}
            limit={limit}
            offset={offset}
            onOffsetChange={setOffset}
            onLimitChange={(l) => {
              setLimit(l);
              setOffset(0);
            }}
          />
        </>
      )}

      <UserDetailDialog
        user={viewUser}
        onOpenChange={(open) => !open && setViewUser(null)}
        onEdit={(user) => {
          setViewUser(null);
          setEditUser(user);
        }}
      />

      <EditUserDialog
        user={editUser}
        onOpenChange={(open) => !open && setEditUser(null)}
        onSave={handleSaveEdit}
      />

      <SuspendUserDialog
        user={suspendTarget}
        onOpenChange={(open) => !open && setSuspendTarget(null)}
        onConfirm={handleConfirmSuspend}
      />

      <BulkSuspendDialog
        open={bulkSuspendOpen}
        count={selectedIds.length}
        onOpenChange={setBulkSuspendOpen}
        onConfirm={handleBulkSuspendConfirm}
      />

      <ConfirmDialog
        open={!!confirmState}
        onOpenChange={(open) => !open && setConfirmState(null)}
        title={confirmState?.title ?? ""}
        description={confirmState?.description ?? ""}
        confirmLabel={confirmState?.confirmLabel}
        destructive={confirmState?.destructive}
        onConfirm={() => (confirmState ? confirmState.action() : Promise.resolve())}
      />
    </div>
  );
}
