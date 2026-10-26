"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setUserStatusAction } from "@/lib/actions/admin";
import type { UserStatus } from "@/lib/generated/prisma/enums";

interface UserStatusActionsProps {
  userId: string;
  userName: string;
  status: UserStatus;
}

const buttonClass =
  "rounded-lg border px-2.5 py-1.5 text-xs font-semibold disabled:opacity-60";

/**
 * Suspend / ban / reinstate buttons (Phase 10). Suspended and banned
 * users are blocked at sign-in (existing sessions run to expiry).
 */
export function UserStatusActions({
  userId,
  userName,
  status,
}: UserStatusActionsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function apply(next: UserStatus) {
    const confirmations: Partial<Record<UserStatus, string>> = {
      SUSPENDED: `Suspend ${userName}? They won't be able to sign in until reinstated. Their listings stay as they are.`,
      BANNED: `Ban ${userName}? They won't be able to sign in. Use for serious/repeat abuse — reinstate only if you're sure.`,
    };
    const message = confirmations[next];
    if (message && !window.confirm(message)) return;

    setError(null);
    startTransition(async () => {
      const result = await setUserStatusAction(userId, next);
      if (!result.success) {
        setError(result.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <span className="inline-flex flex-wrap justify-end gap-1.5">
        {status !== "ACTIVE" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => apply("ACTIVE")}
            className={`${buttonClass} border-emerald-600 text-emerald-700 hover:bg-emerald-50`}
          >
            Reinstate
          </button>
        )}
        {status === "ACTIVE" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => apply("SUSPENDED")}
            className={`${buttonClass} border-amber-400 text-amber-700 hover:bg-amber-50`}
          >
            Suspend
          </button>
        )}
        {status !== "BANNED" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => apply("BANNED")}
            className={`${buttonClass} border-red-300 text-red-700 hover:bg-red-50`}
          >
            Ban
          </button>
        )}
      </span>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}
