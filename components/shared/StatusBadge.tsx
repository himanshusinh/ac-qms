import { cn } from "@/lib/utils";
import type { DocStatus } from "@/types";

const statusConfig: Record<DocStatus, { label: string; className: string }> = {
  PENDING: {
    label: "Pending",
    className: "bg-gray-100 text-gray-600 border border-gray-200",
  },
  DRAFT: {
    label: "Draft",
    className: "bg-gray-100 text-gray-700 border border-gray-300",
  },
  SUBMITTED: {
    label: "Submitted",
    className: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  QC_APPROVED: {
    label: "QC Approved",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  QA_SIGNED: {
    label: "QA Signed",
    className: "bg-green-50 text-green-800 border border-green-300",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-50 text-red-700 border border-red-200",
  },
  AUTO_GENERATED: {
    label: "Auto-Generated",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  ISSUED: {
    label: "Issued",
    className: "bg-teal-50 text-teal-800 border border-teal-300",
  },
};

interface Props {
  status: DocStatus;
  className?: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, className, size = "sm" }: Props) {
  const config = statusConfig[status] || statusConfig.PENDING;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
