import { PROPERTY_STATUS_LABELS } from "@/lib/constants";
import type { PropertyStatus } from "@/lib/generated/prisma/enums";

const STYLES: Record<PropertyStatus, string> = {
  APPROVED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  PENDING: "bg-amber-50 text-amber-800 ring-amber-200",
  REJECTED: "bg-red-50 text-red-800 ring-red-200",
  RENTED_OR_SOLD: "bg-slate-100 text-slate-700 ring-slate-300",
};

/** Color-coded pill for a property's moderation status. */
export function StatusBadge({ status }: { status: PropertyStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${STYLES[status]}`}
    >
      {PROPERTY_STATUS_LABELS[status]}
    </span>
  );
}
