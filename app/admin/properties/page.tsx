import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  getAdminStats,
  listAdminProperties,
} from "@/lib/services/admin";
import {
  PROPERTY_STATUSES,
  PROPERTY_STATUS_LABELS,
} from "@/lib/constants";
import { formatGHS, pricePeriodSuffix } from "@/lib/utils";
import { StatusBadge } from "@/components/properties/status-badge";
import { DeletePropertyButton } from "@/components/admin/delete-property-button";
import type { PropertyStatus } from "@/lib/generated/prisma/enums";

export const metadata: Metadata = { title: "All Listings (Admin)" };

interface PageProps {
  searchParams: { status?: string; q?: string; page?: string };
}

function parseStatus(raw?: string): PropertyStatus | undefined {
  return PROPERTY_STATUSES.includes(raw as PropertyStatus)
    ? (raw as PropertyStatus)
    : undefined;
}

function href(params: {
  status?: PropertyStatus;
  q?: string;
  page?: number;
}): string {
  const sp = new URLSearchParams();
  if (params.status) sp.set("status", params.status);
  if (params.q) sp.set("q", params.q);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return qs ? `/admin/properties?${qs}` : "/admin/properties";
}

function formatWhen(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminPropertiesPage({ searchParams }: PageProps) {
  const status = parseStatus(searchParams.status);
  const q = searchParams.q?.trim() ? searchParams.q.trim() : undefined;
  const page = Math.max(1, Number.parseInt(searchParams.page ?? "1", 10) || 1);

  const [stats, { properties, total, totalPages }] = await Promise.all([
    getAdminStats(),
    listAdminProperties({ status, q, page }),
  ]);

  const tabs: { label: string; status?: PropertyStatus; count: number }[] = [
    { label: "All", count: stats.propertiesTotal },
    ...PROPERTY_STATUSES.map((s) => ({
      label: PROPERTY_STATUS_LABELS[s],
      status: s as PropertyStatus,
      count: stats.statusCounts[s],
    })),
  ];

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900">All listings</h2>
      <p className="mt-1 text-sm text-slate-600">
        Every property on the platform, whatever its status.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const active = (tab.status ?? undefined) === status;
          return (
            <Link
              key={tab.label}
              href={href({ status: tab.status, q })}
              className={
                active
                  ? "rounded-full bg-slate-900 px-3.5 py-1.5 text-sm font-medium text-white"
                  : "rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              }
            >
              {tab.label}{" "}
              <span className={active ? "text-slate-300" : "text-slate-400"}>
                {tab.count}
              </span>
            </Link>
          );
        })}
      </div>

      <form method="get" className="mt-4 flex gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by title, city or owner…"
          className="w-full max-w-md rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        />
        <button
          type="submit"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Search
        </button>
        {(q || status) && (
          <Link
            href="/admin/properties"
            className="inline-flex items-center px-2 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Clear
          </Link>
        )}
      </form>

      {properties.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
          <p className="font-semibold text-slate-800">No listings found</p>
          <p className="mt-1 text-sm text-slate-600">
            Try a different search or status tab.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {properties.map((property) => {
            const cover = property.images[0];
            return (
              <li
                key={property.id}
                className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="relative h-16 w-20 flex-none overflow-hidden rounded-lg bg-slate-100">
                  {cover && (
                    <Image
                      src={cover.url}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/properties/${property.id}`}
                      className="font-semibold text-slate-900 hover:text-emerald-800 hover:underline"
                    >
                      {property.title}
                    </Link>
                    <StatusBadge status={property.status} />
                  </div>
                  <p className="mt-0.5 text-sm text-slate-600">
                    {formatGHS(property.price)}
                    {pricePeriodSuffix(property.pricePeriod)} ·{" "}
                    {property.city}, {property.region} · By{" "}
                    {property.owner.name} · {formatWhen(property.createdAt)}
                  </p>
                </div>
                <div className="flex flex-none items-center gap-2">
                  <Link
                    href={`/admin/properties/${property.id}`}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Inspect
                  </Link>
                  <DeletePropertyButton
                    propertyId={property.id}
                    propertyTitle={property.title}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Page {page} of {totalPages} · {total} listings
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={href({ status, q, page: page - 1 })}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={href({ status, q, page: page + 1 })}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
