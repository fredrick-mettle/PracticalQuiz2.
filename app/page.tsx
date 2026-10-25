import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth-helpers";
import {
  getFeaturedProperties,
  getHomeStats,
  getRegionCounts,
} from "@/lib/services/public-properties";
import { GHANA_REGIONS } from "@/lib/constants";
import { EMPTY_SEARCH_QUERY, propertiesHref } from "@/lib/validations/search";
import { PropertyCard } from "@/components/properties/property-card";
import { SearchBar } from "@/components/search/search-bar";

export const metadata: Metadata = {
  description:
    "Find verified houses, apartments and land for rent or sale across all 16 regions of Ghana.",
};

export default async function HomePage() {
  const [featured, stats, regionCounts, user] = await Promise.all([
    getFeaturedProperties(8),
    getHomeStats(),
    getRegionCounts(),
    getCurrentUser(),
  ]);

  const capitalOf = (regionName: string) =>
    GHANA_REGIONS.find((r) => r.name === regionName)?.capital;

  return (
    <main>
      {/* ── Hero + search ─────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800">
        <div className="mx-auto max-w-7xl px-4 pb-14 pt-12 sm:px-6 sm:pt-16">
          <div className="max-w-2xl">
            {/* Ghana flag accent */}
            <div className="mb-5 flex h-1.5 w-24 overflow-hidden rounded-full" aria-hidden="true">
              <span className="flex-1 bg-[#CE1126]" />
              <span className="flex-1 bg-[#FCD116]" />
              <span className="flex-1 bg-[#006B3F]" />
            </div>
            <h1 className="text-3xl font-bold leading-tight text-white sm:text-5xl">
              Find your next home in Ghana
            </h1>
            <p className="mt-3 text-base leading-7 text-emerald-100 sm:text-lg">
              Verified houses, apartments, rooms and land for rent or sale —
              from Accra to Tamale, Ho to Takoradi.
            </p>
          </div>

          <div className="mt-8 max-w-4xl">
            <SearchBar initialQuery={EMPTY_SEARCH_QUERY} />
          </div>

          <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-emerald-100">
            <span>{stats.total} verified listings</span>
            <span aria-hidden="true">·</span>
            <span>{stats.forRent} for rent</span>
            <span aria-hidden="true">·</span>
            <span>{stats.forSale} for sale</span>
            <span aria-hidden="true">·</span>
            <span>
              {regionCounts.length} of 16 regions covered
            </span>
          </p>
        </div>
      </section>

      {/* ── Featured listings ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Featured properties
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Hand-approved listings with the best photos, updated daily.
            </p>
          </div>
          <Link
            href="/properties"
            className="flex-none text-sm font-semibold text-emerald-700 hover:underline"
          >
            View all →
          </Link>
        </div>

        {featured.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
            <p className="font-medium text-slate-800">No listings yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-600">
              New verified properties are on the way — please check back soon.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featured.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </section>

      {/* ── Browse by region ──────────────────────────────────────────── */}
      {regionCounts.length > 0 && (
        <section className="border-y border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Browse by region
            </h2>
            <p className="mb-6 mt-1 text-sm text-slate-600">
              Where in Ghana are you looking to live?
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {regionCounts.slice(0, 8).map(({ region, count }) => (
                <Link
                  key={region}
                  href={propertiesHref(EMPTY_SEARCH_QUERY, { region })}
                  className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
                >
                  <p className="font-semibold text-slate-900 group-hover:text-emerald-800">
                    {region}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Capital: {capitalOf(region)}
                  </p>
                  <p className="mt-2 text-sm font-medium text-emerald-700">
                    {count} {count === 1 ? "property" : "properties"} →
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Agent call to action ──────────────────────────────────────── */}
      {(!user || user.role === "AGENT") && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-5 rounded-2xl bg-emerald-800 px-6 py-8 sm:flex-row sm:items-center sm:px-10">
            <div>
              <h2 className="text-xl font-bold text-white sm:text-2xl">
                Have a property to rent or sell?
              </h2>
              <p className="mt-1 max-w-xl text-sm leading-6 text-emerald-100">
                Reach thousands of tenants and buyers across Ghana. List for
                free — every property is reviewed by our team before it goes
                live.
              </p>
            </div>
            <Link
              href={
                user?.role === "AGENT"
                  ? "/dashboard/properties/new"
                  : "/register"
              }
              className="flex-none rounded-lg bg-white px-5 py-3 text-sm font-semibold text-emerald-900 shadow-sm hover:bg-emerald-50"
            >
              {user?.role === "AGENT"
                ? "List a property"
                : "Join as an agent / landlord"}
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
