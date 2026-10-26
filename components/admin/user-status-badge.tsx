import { USER_STATUS_LABELS } from "@/lib/constants";
import type { UserStatus } from "@/lib/generated/prisma/enums";

const STYLES: Record<UserStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  SUSPENDED: "bg-amber-100 text-amber-800 ring-amber-200",
  BANNED: "bg-red-100 text-red-800 ring-red-200",
};

/** Color-coded account status pill (Phase 10). */
export function UserStatusBadge({ status }: { status: UserStatus }) {
  return (
    <span
      className={`inline-flex flex-none items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${STYLES[status]}`}
    >
      {USER_STATUS_LABELS[status]}
    </span>
  );
}
