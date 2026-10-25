import { z } from "zod";
import {
  GHANA_REGION_NAMES,
  LISTING_TYPES,
  PROPERTY_TYPES,
} from "@/lib/constants";
import type {
  ListingType,
  PropertyType,
} from "@/lib/generated/prisma/enums";

/**
 * Public property search parameters (Phase 5; map view added in Phase 7).
 *
 * URL search params are untrusted strings: `parseSearchParams` coerces and
 * validates them into a typed query, silently dropping anything invalid
 * (unknown region/type, non-numeric price…) instead of erroring — a public
 * search page should never 500 because of a hand-edited URL.
 */

export const SORT_OPTIONS = ["newest", "price-asc", "price-desc"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest first",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
};

export type ViewMode = "grid" | "map";

export interface PropertySearchQuery {
  q?: string;
  region?: string;
  city?: string;
  type?: PropertyType;
  listingType?: ListingType;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  sort: SortOption;
  page: number;
  view: ViewMode;
}

export const EMPTY_SEARCH_QUERY: PropertySearchQuery = {
  sort: "newest",
  page: 1,
  view: "grid",
};

type RawParams = Record<string, string | string[] | undefined>;

function first(raw: RawParams, key: string): string | undefined {
  const value = raw[key];
  const single = Array.isArray(value) ? value[0] : value;
  const trimmed = single?.trim();
  return trimmed ? trimmed : undefined;
}

function parseBoundedInt(
  value: string | undefined,
  min: number,
  max: number
): number | undefined {
  if (!value || !/^\d+$/.test(value)) return undefined;
  const n = Number(value);
  return n >= min && n <= max ? n : undefined;
}

const typeSchema = z.enum(PROPERTY_TYPES);
const listingTypeSchema = z.enum(LISTING_TYPES);
const sortSchema = z.enum(SORT_OPTIONS);

const MAX_PRICE = 100_000_000;

export function parseSearchParams(raw: RawParams): PropertySearchQuery {
  const regionRaw = first(raw, "region");
  const type = typeSchema.safeParse(first(raw, "type"));
  const listingType = listingTypeSchema.safeParse(first(raw, "listingType"));
  const sort = sortSchema.safeParse(first(raw, "sort"));

  let minPrice = parseBoundedInt(first(raw, "minPrice"), 1, MAX_PRICE);
  let maxPrice = parseBoundedInt(first(raw, "maxPrice"), 1, MAX_PRICE);
  // A swapped range (min > max) is almost certainly a typo — be forgiving.
  if (minPrice && maxPrice && minPrice > maxPrice) {
    [minPrice, maxPrice] = [maxPrice, minPrice];
  }

  return {
    q: first(raw, "q")?.slice(0, 100),
    region:
      regionRaw && GHANA_REGION_NAMES.includes(regionRaw)
        ? regionRaw
        : undefined,
    city: first(raw, "city")?.slice(0, 80),
    type: type.success ? type.data : undefined,
    listingType: listingType.success ? listingType.data : undefined,
    minPrice,
    maxPrice,
    minBedrooms: parseBoundedInt(first(raw, "bedrooms"), 1, 20),
    sort: sort.success ? sort.data : "newest",
    page: parseBoundedInt(first(raw, "page"), 1, 10_000) ?? 1,
    view: first(raw, "view") === "map" ? "map" : "grid",
  };
}

/**
 * Serialize a query back into URL params (omitting defaults), optionally
 * overriding fields — used for sort/pagination/filter-chip links.
 */
export function propertiesHref(
  query: PropertySearchQuery,
  overrides: Partial<PropertySearchQuery> = {}
): string {
  const merged = { ...query, ...overrides };
  const sp = new URLSearchParams();
  if (merged.q) sp.set("q", merged.q);
  if (merged.region) sp.set("region", merged.region);
  if (merged.city) sp.set("city", merged.city);
  if (merged.type) sp.set("type", merged.type);
  if (merged.listingType) sp.set("listingType", merged.listingType);
  if (merged.minPrice) sp.set("minPrice", String(merged.minPrice));
  if (merged.maxPrice) sp.set("maxPrice", String(merged.maxPrice));
  if (merged.minBedrooms) sp.set("bedrooms", String(merged.minBedrooms));
  if (merged.sort !== "newest") sp.set("sort", merged.sort);
  if (merged.view === "map") sp.set("view", "map");
  if (merged.page > 1) sp.set("page", String(merged.page));
  const qs = sp.toString();
  return qs ? `/properties?${qs}` : "/properties";
}
