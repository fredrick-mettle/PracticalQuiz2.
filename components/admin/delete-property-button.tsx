"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePropertyAsAdminAction } from "@/lib/actions/admin";

interface DeletePropertyButtonProps {
  propertyId: string;
  propertyTitle: string;
  /** Where to go after deletion (e.g. from the detail page). Refresh if omitted. */
  redirectTo?: string;
}

/** Admin hard-delete for spam/abuse listings (Phase 10). */
export function DeletePropertyButton({
  propertyId,
  propertyTitle,
  redirectTo,
}: DeletePropertyButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (
      !window.confirm(
        `Permanently delete "${propertyTitle}"?\n\nThis removes the listing, its photos, inquiries and favorites. This can't be undone.`
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deletePropertyAsAdminAction(propertyId);
      if (!result.success) {
        setError(result.message);
        return;
      }
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    });
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="rounded-lg border border-red-300 bg-white px-3.5 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
      >
        {isPending ? "Deleting…" : "Delete listing"}
      </button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </span>
  );
}
