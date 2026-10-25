import { INQUIRY_STATUS_LABELS } from "@/lib/constants";
import type { InquiryStatus } from "@/lib/generated/prisma/enums";

const STYLES: Record<InquiryStatus, string> = {
  NEW: "bg-amber-100 text-amber-800 ring-amber-200",
  READ: "bg-slate-100 text-slate-700 ring-slate-200",
  REPLIED: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  CLOSED: "bg-slate-200 text-slate-500 ring-slate-300",
};

/** Color-coded inquiry status pill (Phase 8). */
export function InquiryStatusBadge({ status }: { status: InquiryStatus }) {
  return (
    <span
      className={`inline-flex flex-none items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${STYLES[status]}`}
    >
      {INQUIRY_STATUS_LABELS[status]}
    </span>
  );
}
