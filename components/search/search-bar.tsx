"use client";

import { useRouter } from "next/navigation";
import { useId, useMemo, useState, type FormEvent } from "react";
import {
  GHANA_REGIONS,
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABELS,
} from "@/lib/constants";
import {
  EMPTY_SEARCH_QUERY,
  propertiesHref,
  type PropertySearchQuery,
} from "@/lib/validations/search";

/**
 * Property search form (home hero + /properties). On submit it navigates to
 * /properties with the filters as URL params — the server re-validates them
 * (lib/validations/search.ts), so URLs stay shareable and safe.
 */

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";
const labelClass = "mb-1 block text-xs font-semibold text-slate-600";

type ListingFilter = "" | "RENT" | "SALE";

function parsePositiveInt(value: string): number | undefined {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return undefined;
  const n = Number(trimmed);
  return n > 0 ? n : undefined;
}

export function SearchBar({
  initialQuery,
}: {
  initialQuery: PropertySearchQuery;
}) {
  const router = useRouter();
  const datalistId = useId();

  const [listingType, setListingType] = useState<ListingFilter>(
    initialQuery.listingType ?? ""
  );
  const [q, setQ] = useState(initialQuery.q ?? "");
  const [region, setRegion] = useState(initialQuery.region ?? "");
  const [city, setCity] = useState(initialQuery.city ?? "");
  const [type, setType] = useState<string>(initialQuery.type ?? "");
  const [minPrice, setMinPrice] = useState(
    initialQuery.minPrice ? String(initialQuery.minPrice) : ""
  );
  const [maxPrice, setMaxPrice] = useState(
    initialQuery.maxPrice ? String(initialQuery.maxPrice) : ""
  );
  const [bedrooms, setBedrooms] = useState(
    initialQuery.minBedrooms ? String(initialQuery.minBedrooms) : ""
  );

  const cityOptions = useMemo(() => {
    const selected = GHANA_REGIONS.find((r) => r.name === region);
    const cities = selected
      ? selected.cities
      : GHANA_REGIONS.flatMap((r) => r.cities);
    return Array.from(new Set(cities)).sort();
  }, [region]);

  const hasFilters =
    listingType || q || region || city || type || minPrice || maxPrice || bedrooms;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    router.push(
      propertiesHref({
        ...EMPTY_SEARCH_QUERY,
        sort: initialQuery.sort,
        q: q.trim() || undefined,
        region: region || undefined,
        city: city.trim() || undefined,
        type: (type || undefined) as PropertySearchQuery["type"],
        listingType: listingType || undefined,
        minPrice: parsePositiveInt(minPrice),
        maxPrice: parsePositiveInt(maxPrice),
        minBedrooms: parsePositiveInt(bedrooms),
      })
    );
  }

  function handleClear() {
    setListingType("");
    setQ("");
    setRegion("");
    setCity("");
    setType("");
    setMinPrice("");
    setMaxPrice("");
    setBedrooms("");
    router.push("/properties");
  }

  const segments: { value: ListingFilter; label: string }[] = [
    { value: "", label: "All" },
    { value: "RENT", label: "For Rent" },
    { value: "SALE", label: "For Sale" },
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg sm:p-5"
    >
      <div
        className="mb-4 inline-flex rounded-lg bg-slate-100 p-1"
        role="group"
        aria-label="Rent or sale"
      >
        {segments.map((segment) => (
          <button
            key={segment.label}
            type="button"
            onClick={() => setListingType(segment.value)}
            className={
              listingType === segment.value
                ? "rounded-md bg-emerald-700 px-4 py-1.5 text-sm font-semibold text-white shadow-sm"
                : "rounded-md px-4 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
            }
          >
            {segment.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <label htmlFor={`${datalistId}-q`} className={labelClass}>
            Keyword
          </label>
          <input
            id={`${datalistId}-q`}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. Osu, 3 bedroom, East Legon…"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`${datalistId}-region`} className={labelClass}>
            Region
          </label>
          <select
            id={`${datalistId}-region`}
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className={inputClass}
          >
            <option value="">All regions</option>
            {GHANA_REGIONS.map((r) => (
              <option key={r.name} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${datalistId}-city`} className={labelClass}>
            City / Town
          </label>
          <input
            id={`${datalistId}-city`}
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Any city"
            list={datalistId}
            className={inputClass}
          />
          <datalist id={datalistId}>
            {cityOptions.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div>
          <label htmlFor={`${datalistId}-type`} className={labelClass}>
            Property type
          </label>
          <select
            id={`${datalistId}-type`}
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={inputClass}
          >
            <option value="">All types</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>
                {PROPERTY_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${datalistId}-min`} className={labelClass}>
            Min price (GH₵)
          </label>
          <input
            id={`${datalistId}-min`}
            type="number"
            min={0}
            inputMode="numeric"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="No min"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`${datalistId}-max`} className={labelClass}>
            Max price (GH₵)
          </label>
          <input
            id={`${datalistId}-max`}
            type="number"
            min={0}
            inputMode="numeric"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="No max"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`${datalistId}-beds`} className={labelClass}>
            Bedrooms
          </label>
          <select
            id={`${datalistId}-beds`}
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
            className={inputClass}
          >
            <option value="">Any</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}+
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-3">
        {hasFilters && (
          <button
            type="button"
            onClick={handleClear}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Clear all
          </button>
        )}
        <button
          type="submit"
          className="rounded-lg bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          Search properties
        </button>
      </div>
    </form>
  );
}
