import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { requireRole } from "@/lib/auth-helpers";
import {
  countAgentPropertiesByStatus,
  listAgentProperties,
} from "@/lib/services/properties";
import { countAgentInquiriesByStatus } from "@/lib/services/inquiries";
import {
  LISTING_TYPE_LABELS,
  PROPERTY_STATUSES,
  PROPERTY_STATUS_LABELS,
  PROPERTY_TYPE_LABELS,
} from "@/lib/constants";
import { formatGHS, pricePeriodSuffix } from "@/lib/utils";
import { StatusBadge } from "@/components/properties/status-badge";
import { ListingActions } from "@/components/properties/listing-actions";
import type { PropertyStatus } from "@/lib/generated/prisma/enums";

export const metadata: Metadata = { title: "My Listings" };

const PAGE_SIZE = 10;

interface PageProps {
  searchParams: { status?: string; q?: string; page?: string };
}

function parseStatus(raw?: string): PropertyStatus | undefined {
  return PROPERTY_STATUSES.includes(raw as PropertyStatus)
    ? (raw as PropertyStatus)
    : undefined;
}

function buildHref(params: {
  status?: PropertyStatus;
  q?: string;
  page?: number;
}): string {
  const sp = new URLSearchParams();
  if (params.status) sp.set("status", params.status);
  if (params.q) sp.set("q", params.q);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return qs ? `/dashboard?${qs}` : "/dashboard";
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const user = await requireRole("AGENT");

  const status = parseStatus(searchParams.status);
  const q = searchParams.q?.trim() ? searchParams.q.trim() : undefined;
  const page = Math.max(1, Number.parseInt(searchParams.page ?? "1", 10) || 1);

  const [counts, { properties, total, totalPages }, inquiryCounts] =
    await Promise.all([
      countAgentPropertiesByStatus(user.id),
      listAgentProperties(user.id, { status, q, page, pageSize: PAGE_SIZE }),
      countAgentInquiriesByStatus(user.id),
    ]);
  const totalListings = Object.values(counts).reduce((a, b) => a + b, 0);

  const tabs: { label: string; status?: PropertyStatus; count: number }[] = [
    { label: "All", count: totalListings },
    ...PROPERTY_STATUSES.map((s) => ({
      label: PROPERTY_STATUS_LABELS[s],
      status: s as PropertyStatus,
      count: counts[s],
    })),
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            My Listings
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {totalListings} {totalListings === 1 ? "listing" : "listings"} in
            total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/inquiries"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Inquiries
            {inquiryCounts.NEW > 0 && (
              <span className="ml-2 inline-flex rounded-full bg-amber-500 px-1.5 py-0.5 text-[11px] font-bold text-white">
                {inquiryCounts.NEW} new
              </span>
            )}
          </Link>
          <Link
            href="/dashboard/properties/new"
            className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            + New listing
          </Link>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const active = (tab.status ?? undefined) === status;
          return (
            <Link
              key={tab.label}
              href={buildHref({ status: tab.status, q })}
              className={
                active
                  ? "rounded-full bg-emerald-700 px-3.5 py-1.5 text-sm font-medium text-white"
                  : "rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              }
            >
              {tab.label}{" "}
              <span className={active ? "text-emerald-200" : "text-slate-400"}>
                {tab.count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Search */}
      <form method="get" className="mt-4 flex gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search your listings by title…"
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
            href="/dashboard"
            className="inline-flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Listings */}
      {properties.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
          {totalListings === 0 ? (
            <>
              <p className="text-lg font-semibold text-slate-800">
                You have no listings yet
              </p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-slate-600">
                Create your first listing and it will go for admin review
                before appearing publicly.
              </p>
              <Link
                href="/dashboard/properties/new"
                className="mt-5 inline-block rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                Create your first listing
              </Link>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold text-slate-800">
                No listings match these filters
              </p>
              <Link
                href="/dashboard"
                className="mt-3 inline-block text-sm font-semibold text-emerald-700 hover:underline"
              >
                Clear filters
              </Link>
            </>
          )}
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {properties.map((property) => {
            const cover = property.images[0];
            return (
              <li
                key={property.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="relative h-40 w-full flex-none bg-slate-100 sm:h-auto sm:w-44">
                    {cover ? (
                      <Image
                        src={cover.url}
                        alt={property.title}
                        fill
                        sizes="(min-width: 640px) 176px, 100vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <svg
                          className="h-10 w-10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75"
                          />
                        </svg>
                      </div>
                    )}
                    {property._count.images > 0 && (
                      <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
                        {property._count.images} photo
                        {property._count.images === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        href={`/dashboard/properties/${property.id}/edit`}
                        className="text-base font-semibold text-slate-900 hover:text-emerald-800 hover:underline"
                      >
                        {property.title}
                      </Link>
                      <p className="flex-none text-base font-bold text-emerald-800">
                        {formatGHS(property.price)}
                        <span className="text-xs font-normal text-slate-500">
                          {pricePeriodSuffix(property.pricePeriod)}
                        </span>
                      </p>
                    </div>

                    <p className="mt-0.5 text-sm text-slate-600">
                      {property.area ? `${property.area}, ` : ""}
                      {property.city} — {property.region}
                    </p>

                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <StatusBadge status={property.status} />
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 ring-1 ring-inset ring-slate-200">
                        {PROPERTY_TYPE_LABELS[property.type]}
                      </span>
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 ring-1 ring-inset ring-slate-200">
                        {LISTING_TYPE_LABELS[property.listingType]}
                      </span>
                      {property.bedrooms != null && (
                        <span className="text-xs text-slate-500">
                          {property.bedrooms} bd
                        </span>
                      )}
                      {property.bathrooms != null && (
                        <span className="text-xs text-slate-500">
                          · {property.bathrooms} ba
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        · Listed{" "}
                        {property.createdAt.toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    {property.status === "REJECTED" &&
                      property.rejectionReason && (
                        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-800">
                          <span className="font-semibold">
                            Rejection reason:
                          </span>{" "}
                          {property.rejectionReason} Edit the listing to
                          resubmit it for review.
                        </div>
                      )}

                    <div className="mt-3.5">
                      <ListingActions
                        propertyId={property.id}
                        propertyTitle={property.title}
                        status={property.status}
                      />
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Page {page} of {totalPages} · {total}{" "}
            {total === 1 ? "listing" : "listings"}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildHref({ status, q, page: page - 1 })}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildHref({ status, q, page: page + 1 })}
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
