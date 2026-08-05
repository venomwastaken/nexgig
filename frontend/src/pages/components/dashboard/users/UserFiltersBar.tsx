import { ArrowDownAZ, ArrowUpAZ, Filter, Search, X as XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ACCOUNT_STATUS_LABELS,
  ADMIN_ROLE_LABELS,
  AdminAccountStatus,
  AdminRole,
  SortField,
  SortOrder,
} from "./types";

const SORT_LABELS: Record<SortField, string> = {
  created_at: "Registration date",
  last_login: "Last login",
  username: "Username",
  email: "Email",
};

interface UserFiltersBarProps {
  q: string;
  onQChange: (q: string) => void;
  status: AdminAccountStatus | "all";
  onStatusChange: (status: AdminAccountStatus | "all") => void;
  role: AdminRole | "all";
  onRoleChange: (role: AdminRole | "all") => void;
  sort: SortField;
  order: SortOrder;
  onSortChange: (sort: SortField, order: SortOrder) => void;
}

export default function UserFiltersBar({
  q,
  onQChange,
  status,
  onStatusChange,
  role,
  onRoleChange,
  sort,
  order,
  onSortChange,
}: UserFiltersBarProps) {
  const hasFilters = status !== "all" || role !== "all" || q.trim() !== "";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          placeholder="Search name, username, or email…"
          className="pl-7"
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
          <Filter /> Status
          {status !== "all" && <span className="text-foreground">· {ACCOUNT_STATUS_LABELS[status]}</span>}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Account status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={status}
            onValueChange={(v) => onStatusChange(v as AdminAccountStatus | "all")}
          >
            <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
            {(Object.keys(ACCOUNT_STATUS_LABELS) as AdminAccountStatus[]).map((s) => (
              <DropdownMenuRadioItem key={s} value={s}>
                {ACCOUNT_STATUS_LABELS[s]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
          <Filter /> Role
          {role !== "all" && <span className="text-foreground">· {ADMIN_ROLE_LABELS[role]}</span>}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Role</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={role} onValueChange={(v) => onRoleChange(v as AdminRole | "all")}>
            <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
            {(Object.keys(ADMIN_ROLE_LABELS) as AdminRole[]).map((r) => (
              <DropdownMenuRadioItem key={r} value={r}>
                {ADMIN_ROLE_LABELS[r]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
          {order === "asc" ? <ArrowUpAZ /> : <ArrowDownAZ />} Sort · {SORT_LABELS[sort]}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Sort by</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={sort} onValueChange={(v) => onSortChange(v as SortField, order)}>
            {(Object.keys(SORT_LABELS) as SortField[]).map((f) => (
              <DropdownMenuRadioItem key={f} value={f}>
                {SORT_LABELS[f]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Order</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={order} onValueChange={(v) => onSortChange(sort, v as SortOrder)}>
            <DropdownMenuRadioItem value="desc">Descending</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="asc">Ascending</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onQChange("");
            onStatusChange("all");
            onRoleChange("all");
          }}
        >
          <XIcon /> Clear filters
        </Button>
      )}
    </div>
  );
}
