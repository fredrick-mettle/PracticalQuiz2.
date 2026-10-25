"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setInquiryClosedAction } from "@/lib/actions/inquiries";

/** Agent-side close/reopen toggle for an inquiry thread (Phase 8). */
export function CloseInquiryButton({
  inquiryId,
  closed,
}: {
  inquiryId: string;
  closed: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    if (
      !closed &&
      !window.confirm(
        "Close this conversation? The tenant won't be able to send more messages (you can reopen it later)."
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await setInquiryClosedAction(inquiryId, !closed);
      if (!result.success) {
        setError(result.message);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        disabled={isPending}
        className={
          closed
            ? "rounded-lg border border-emerald-600 px-3.5 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
            : "rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        }
      >
        {closed ? "Reopen conversation" : "Close conversation"}
      </button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </span>
  );
}
