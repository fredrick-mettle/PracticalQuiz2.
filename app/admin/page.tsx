import type { Metadata } from "next";
import Link from "next/link";
import {
  getAdminStats,
  listModerationQueue,
} from "@/lib/services/admin";
import {
  PROPERTY_STATUSES,
  PROPERTY_STATUS_LABELS,
} from "@/lib/constants";
import { roleLabel } from "@/lib/utils";
import { StatusBadge } from "@/components/properties/status-badge";

export const metadata: Metadata = { title: "Admin Overview" };

function formatWhen(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminOverviewPage() {
  const [stats, queue] = await Promise.all([
    getAdminStats(),
    listModerationQueue(1, 5),
  ]);

  const cards = [
    {
      label: "Awaiting moderation",
      value: stats.statusCounts.PENDING,
      href: "/admin/moderation",
      highlight: stats.statusCounts.PENDING > 0,
    },
    {
      label: "Live listings",
      value: stats.statusCounts.APPROVED,
      href: "/admin/properties?status=APPROVED",
    },
    { label: "Total users", value: stats.usersTotal, href: "/admin/users" },
    {
      label: "Inquiries (new)",
      value: `${stats.inquiriesTotal} (${stats.inquiriesNew} new)`,
      href: "/admin/properties",
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`rounded-xl border p-5 shadow-sm transition hover:shadow-md ${
              card.highlight
                ? "border-amber-300 bg-amber-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <p className="text-2xl font-bold text-slate-900 sm:text-3xl">
              {card.value}
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
              {card.label}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-900">
            Listings by status{" "}
            <span className="text-sm font-normal text-slate-500">
              ({stats.propertiesTotal} total · {stats.favoritesTotal} saves)
            </span>
          </h2>
          <ul className="mt-4 space-y-2.5">
            {PROPERTY_STATUSES.map((status) => (
              <li key={status}>
                <Link
                  href={`/admin/properties?status=${status}`}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-50"
                >
                  <span className="inline-flex items-center gap-2">
                    <StatusBadge status={status} />
                    <span className="text-sm text-slate-600">
                      {PROPERTY_STATUS_LABELS[status]}
                    </span>
                  </span>
                  <span className="font-semibold text-slate-900">
                    {stats.statusCounts[status]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-900">Users by role</h2>
          <ul className="mt-4 space-y-2.5">
            {(["TENANT", "AGENT", "ADMIN"] as const).map((role) => (
              <li key={role}>
                <Link
                  href={`/admin/users?role=${role}`}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-50"
                >
                  <span className="text-sm text-slate-700">
                    {roleLabel(role)}
                  </span>
                  <span className="font-semibold text-slate-900">
                    {stats.roleCounts[role]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-900">
            Oldest awaiting moderation
          </h2>
          <Link
            href="/admin/moderation"
            className="text-sm font-semibold text-emerald-700 hover:underline"
          >
            Open queue →
          </Link>
        </div>
        {queue.properties.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">
            🎉 The moderation queue is empty.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {queue.properties.map((property) => (
              <li key={property.id}>
                <Link
                  href={`/admin/properties/${property.id}`}
                  className="flex items-center justify-between gap-3 py-2.5 hover:bg-slate-50"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-slate-900">
                      {property.title}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {property.owner.name} · {property.city},{" "}
                      {property.region}
                    </span>
                  </span>
                  <span className="flex-none text-xs text-slate-500">
                    {formatWhen(property.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
