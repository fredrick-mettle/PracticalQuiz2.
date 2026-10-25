import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getMapPins,
  searchProperties,
} from "@/lib/services/public-properties";
import {
  parseSearchParams,
  propertiesHref,
  SORT_LABELS,
  SORT_OPTIONS,
  type PropertySearchQuery,
  type ViewMode,
} from "@/lib/validations/search";
import { LISTING_TYPE_LABELS, PROPERTY_TYPE_LABELS } from "@/lib/constants";
import { formatGHS } from "@/lib/utils";
import { PropertyCard } from "@/components/properties/property-card";
import { PropertiesMap } from "@/components/maps/properties-map";
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

const VIEW_TOGGLE: { value: ViewMode; label: string }[] = [
  { value: "grid", label: "▦ Grid" },
  { value: "map", label: "🗺 Map" },
];

export default async function PropertiesPage({ searchParams }: PageProps) {
  const query = parseSearchParams(searchParams);
  const isMapView = query.view === "map";

  const gridResult = !isMapView ? await searchProperties(query) : null;
  const mapResult = isMapView ? await getMapPins(query) : null;

  // Hand-edited page numbers beyond the end go to the last real page.
  if (gridResult && query.page > gridResult.totalPages) {
    redirect(propertiesHref(query, { page: gridResult.totalPages }));
  }

  const total = (isMapView ? mapResult?.total : gridResult?.total) ?? 0;
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
            href={isMapView ? "/properties?view=map" : "/properties"}
            className="text-sm font-medium text-slate-600 underline-offset-2 hover:underline"
          >
            Clear all
          </Link>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="inline-flex rounded-lg bg-slate-100 p-1"
            role="group"
            aria-label="View as grid or map"
          >
            {VIEW_TOGGLE.map((item) => (
              <Link
                key={item.value}
                href={propertiesHref(query, { view: item.value, page: 1 })}
                aria-current={query.view === item.value}
                className={
                  query.view === item.value
                    ? "rounded-md bg-emerald-700 px-4 py-1.5 text-sm font-semibold text-white shadow-sm"
                    : "rounded-md px-4 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
                }
              >
                {item.label}
              </Link>
            ))}
          </div>
          <p className="text-sm text-slate-600">
            {isMapView && mapResult
              ? `${mapResult.mapped} of ${total} shown on map`
              : gridResult
                ? `Page ${query.page} of ${gridResult.totalPages}`
                : null}
          </p>
        </div>

        {!isMapView && (
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
        )}
      </div>

      {isMapView && mapResult ? (
        mapResult.pins.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
            <p className="text-lg font-semibold text-slate-800">
              {total > 0
                ? "No map locations for these properties yet"
                : "No properties match your search"}
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
              {total > 0
                ? `${total} matching ${total === 1 ? "property hasn't" : "properties haven't"} added a location pin. You can still browse them as a list.`
                : "Try a different area, a wider price range, or fewer bedrooms."}
            </p>
            <Link
              href={propertiesHref(query, { view: "grid", page: 1 })}
              className="mt-5 inline-block rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              View as grid
            </Link>
          </div>
        ) : (
          <div className="mt-6">
            <PropertiesMap pins={mapResult.pins} />
            {mapResult.mapped < total && (
              <p className="mt-3 text-sm text-slate-600">
                {total - mapResult.mapped} matching{" "}
                {total - mapResult.mapped === 1 ? "property" : "properties"}{" "}
                don&apos;t have a location pin yet —{" "}
                <Link
                  href={propertiesHref(query, { view: "grid", page: 1 })}
                  className="font-semibold text-emerald-700 hover:underline"
                >
                  see everything in Grid view
                </Link>
                .
              </p>
            )}
          </div>
        )
      ) : gridResult && gridResult.properties.length === 0 ? (
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
      ) : gridResult ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {gridResult.properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : null}

      {!isMapView && gridResult && gridResult.totalPages > 1 && (
        <div className="mt-10 flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Page {query.page} of {gridResult.totalPages} · {total}{" "}
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
            {query.page < gridResult.totalPages && (
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
