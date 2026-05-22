import { cn } from "@/lib/utils";
import type { UserStatus } from "@/types";

const statusStyles: Record<UserStatus, string> = {
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Suspended: "bg-amber-50 text-amber-700 border-amber-200",
  Locked: "bg-red-50 text-red-700 border-red-200",
  Archived: "bg-slate-100 text-slate-600 border-slate-200",
  Disabled: "bg-zinc-100 text-zinc-600 border-zinc-200",
  Pending: "bg-blue-50 text-blue-700 border-blue-200",
  Inactive: "bg-neutral-100 text-neutral-600 border-neutral-200",
};

const statusLabels: Record<UserStatus, string> = {
  Active: "Active",
  Suspended: "Suspended",
  Locked: "Locked",
  Archived: "Archived",
  Disabled: "Disabled",
  Pending: "Pending",
  Inactive: "Inactive",
};

interface Props {
  status: UserStatus;
  className?: string;
}

export function UserStatusBadge({ status, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap",
        statusStyles[status],
        className,
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
