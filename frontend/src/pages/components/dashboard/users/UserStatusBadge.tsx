import { ACCOUNT_STATUS_LABELS, ACCOUNT_STATUS_STYLES, AdminAccountStatus } from "./types";

export default function UserStatusBadge({ status }: { status: AdminAccountStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ACCOUNT_STATUS_STYLES[status]}`}
    >
      {ACCOUNT_STATUS_LABELS[status]}
    </span>
  );
}
