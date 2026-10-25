import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth-helpers";
import { PropertyForm } from "@/components/properties/property-form";

export const metadata: Metadata = { title: "New Listing" };

export default async function NewPropertyPage() {
  await requireRole("AGENT");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/dashboard"
        className="text-sm font-medium text-emerald-700 hover:underline"
      >
        ← Back to my listings
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
        Create a new listing
      </h1>
      <p className="mb-8 mt-2 text-slate-600">
        Fill in the property details below. Photos can be added in Phase 4.
      </p>
      <PropertyForm />
    </div>
  );
}
