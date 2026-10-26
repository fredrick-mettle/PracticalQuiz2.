"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  deletePropertyAction,
  setPropertyRentedOrSoldAction,
} from "@/lib/actions/properties";
import type { PropertyStatus } from "@/lib/generated/prisma/enums";

interface Props {
  propertyId: string;
  propertyTitle: string;
  status: PropertyStatus;
}

const editButtonClass =
  "rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50";
const neutralButtonClass =
  "rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";
const dangerButtonClass =
  "rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60";

/** Edit / mark-as-rented / relist / delete controls on the agent dashboard. */
export function ListingActions({ propertyId, propertyTitle, status }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<{ success: boolean; message?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        setError(result.message ?? "Something went wrong");
        return;
      }
      router.refresh();
    });
  }

  function markRentedOrSold() {
    if (
      !window.confirm(
        `Mark "${propertyTitle}" as rented/sold? It will no longer appear in public listings.`
      )
    )
      return;
    run(() => setPropertyRentedOrSoldAction(propertyId, true));
  }

  function relist() {
    run(() => setPropertyRentedOrSoldAction(propertyId, false));
  }

  function remove() {
    if (
      !window.confirm(
        `Delete "${propertyTitle}" permanently? This cannot be undone.`
      )
    )
      return;
    run(() => deletePropertyAction(propertyId));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/dashboard/properties/${propertyId}/edit`}
          className={editButtonClass}
        >
          Edit
        </Link>
        {status === "APPROVED" && (
          <button
            type="button"
            onClick={markRentedOrSold}
            disabled={isPending}
            className={neutralButtonClass}
          >
            Mark as rented/sold
          </button>
        )}
        {status === "RENTED_OR_SOLD" && (
          <button
            type="button"
            onClick={relist}
            disabled={isPending}
            className={neutralButtonClass}
            title="Send the listing back for admin review"
          >
            Relist
          </button>
        )}
        <button
          type="button"
          onClick={remove}
          disabled={isPending}
          className={dangerButtonClass}
        >
          Delete
        </button>
        {isPending && <span className="text-xs text-slate-500">Working…</span>}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
