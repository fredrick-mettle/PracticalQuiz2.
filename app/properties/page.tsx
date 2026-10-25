import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { searchProperties } from "@/lib/services/public-properties";
import {
  parseSearchParams,
  propertiesHref,
  SORT_LABELS,
  SORT_OPTIONS,
  type PropertySearchQuery,
} from "@/lib/validations/search";
import { LISTING_TYPE_LABELS, PROPERTY_TYPE_LABELS } from "@/lib/constants";
import { formatGHS } from "@/lib/utils";
import { PropertyCard } from "@/components/properties/property-card";
import { SearchBar } from "@/components/search/search-bar";

export const metadata: Metadata = {
  title: "Browse Properties",
  description:
    "Search verified properties for rent and sale across Ghana by region, city, type and price.",
};

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

/** Removable chips describing the active filters. */
function buildChips(query: PropertySearchQuery) {
  const chips: { label: string; href: string }[] = [];
  const without = (overrides: Partial<PropertySearchQuery>) =>
    propertiesHref(query, { ...overrides, page: 1 });

  if (query.q)
    chips.push({ label: `“${query.q}”`, href: without({ q: undefined }) });
  if (query.listingType)
    chips.push({
      label: LISTING_TYPE_LABELS[query.listingType],
      href: without({ listingType: undefined }),
    });
  if (query.type)
    chips.push({
      label: PROPERTY_TYPE_LABELS[query.type],
      href: without({ type: undefined }),
    });
  if (query.region)
    chips.push({ label: query.region, href: without({ region: undefined }) });
  if (query.city)
    chips.push({ label: query.city, href: without({ city: undefined }) });
  if (query.minPrice)
    chips.push({
      label: `From ${formatGHS(query.minPrice)}`,
      href: without({ minPrice: undefined }),
    });
  if (query.maxPrice)
    chips.push({
      label: `Up to ${formatGHS(query.maxPrice)}`,
      href: without({ maxPrice: undefined }),
    });
  if (query.minBedrooms)
    chips.push({
      label: `${query.minBedrooms}+ bedrooms`,
      href: without({ minBedrooms: undefined }),
    });
  return chips;
}

export default async function PropertiesPage({ searchParams }: PageProps) {
  const query = parseSearchParams(searchParams);
  const { properties, total, totalPages } = await searchProperties(query);

  // Hand-edited page numbers beyond the end go to the last real page.
  if (query.page > totalPages) {
    redirect(propertiesHref(query, { page: totalPages }));
  }

  const chips = buildChips(query);
  const heading =
    query.listingType === "SALE"
      ? "Properties for sale"
      : query.listingType === "RENT"
        ? "Properties for rent"
        : "All properties";
  const place = query.city ?? query.region;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
        {heading}
        {place ? ` in ${place}` : " in Ghana"}
      </h1>
      <p className="mt-1.5 text-slate-600">
        {total} verified {total === 1 ? "property" : "properties"}
        {chips.length > 0 ? " matching your search" : " available now"}
      </p>

      <div className="mt-6">
        {/* Key forces the form to re-sync when filters change via chips/sort */}
        <SearchBar key={JSON.stringify(query)} initialQuery={query} />
      </div>

      {chips.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-600">Filters:</span>
          {chips.map((chip) => (
            <Link
              key={chip.label}
              href={chip.href}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-100"
              title="Remove filter"
            >
              {chip.label}
              <span aria-hidden="true">×</span>
            </Link>
          ))}
          <Link
            href="/properties"
            className="text-sm font-medium text-slate-600 underline-offset-2 hover:underline"
          >
            Clear all
          </Link>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Page {query.page} of {totalPages}
        </p>
        <div className="flex items-center gap-1.5">
          <span className="mr-1 text-sm font-medium text-slate-600">
            Sort:
          </span>
          {SORT_OPTIONS.map((sort) => (
            <Link
              key={sort}
              href={propertiesHref(query, { sort, page: 1 })}
              className={
                query.sort === sort
                  ? "rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white"
                  : "rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              }
            >
              {SORT_LABELS[sort]}
            </Link>
          ))}
        </div>
      </div>

      {properties.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
          <p className="text-lg font-semibold text-slate-800">
            No properties match your search
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
            Try a different area, a wider price range, or fewer bedrooms —
            new verified listings are added regularly.
          </p>
          <Link
            href="/properties"
            className="mt-5 inline-block rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Browse all properties
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Page {query.page} of {totalPages} · {total}{" "}
            {total === 1 ? "property" : "properties"}
          </p>
          <div className="flex gap-2">
            {query.page > 1 && (
              <Link
                href={propertiesHref(query, { page: query.page - 1 })}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Previous
              </Link>
            )}
            {query.page < totalPages && (
              <Link
                href={propertiesHref(query, { page: query.page + 1 })}
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
