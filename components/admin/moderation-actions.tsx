"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { moderatePropertyAction } from "@/lib/actions/admin";
import type { PropertyStatus } from "@/lib/generated/prisma/enums";

interface ModerationActionsProps {
  propertyId: string;
  status: PropertyStatus;
}

/**
 * Approve / reject controls (Phase 10). Available actions depend on the
 * listing's status; rejecting always requires a reason for the agent.
 */
export function ModerationActions({
  propertyId,
  status,
}: ModerationActionsProps) {
  const router = useRouter();
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canApprove = status === "PENDING" || status === "REJECTED";
  const canReject = status === "PENDING" || status === "APPROVED";
  if (!canApprove && !canReject) {
    return (
      <p className="text-sm text-slate-500">
        Availability is managed by the agent.
      </p>
    );
  }

  function decide(decision: "APPROVE" | "REJECT") {
    setError(null);
    startTransition(async () => {
      const result = await moderatePropertyAction(propertyId, {
        decision,
        reason: decision === "REJECT" ? reason : undefined,
      });
      if (!result.success) {
        setError(result.message);
        return;
      }
      setShowReject(false);
      setReason("");
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {canApprove && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => decide("APPROVE")}
            className="rounded-lg bg-emerald-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            {status === "REJECTED" ? "Reinstate" : "Approve"}
          </button>
        )}
        {canReject && !showReject && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => setShowReject(true)}
            className="rounded-lg border border-red-300 bg-white px-3.5 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            {status === "APPROVED" ? "Take down" : "Reject"}
          </button>
        )}
      </div>

      {showReject && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
          <label
            htmlFor={`reject-reason-${propertyId}`}
            className="mb-1.5 block text-sm font-medium text-red-900"
          >
            Reason for the agent (required)
          </label>
          <textarea
            id={`reject-reason-${propertyId}`}
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Photos are too blurry to verify the property — please upload clearer ones."
            className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => decide("REJECT")}
              className="rounded-lg bg-red-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
            >
              {status === "APPROVED"
                ? "Confirm takedown"
                : "Confirm rejection"}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setShowReject(false)}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
