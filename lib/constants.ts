/**
 * Shared constants for RentGH.
 * These mirror the Prisma enums (prisma/schema.prisma) and are used for
 * validation, forms and filters across the app.
 */

export interface GhanaRegion {
  name: string;
  capital: string;
  /** Major cities/towns, used to prefill city dropdowns (free text allowed). */
  cities: string[];
}

/** Ghana's 16 regions. Property.region is validated against these names. */
export const GHANA_REGIONS: GhanaRegion[] = [
  { name: "Ahafo", capital: "Goaso", cities: ["Goaso", "Duayaw Nkwanta", "Bechem", "Kenyasi", "Hwidiem"] },
  { name: "Ashanti", capital: "Kumasi", cities: ["Kumasi", "Obuasi", "Ejisu", "Mampong", "Bekwai", "Konongo"] },
  { name: "Bono", capital: "Sunyani", cities: ["Sunyani", "Berekum", "Dormaa Ahenkro", "Wenchi"] },
  { name: "Bono East", capital: "Techiman", cities: ["Techiman", "Kintampo", "Atebubu", "Nkoranza"] },
  { name: "Central", capital: "Cape Coast", cities: ["Cape Coast", "Winneba", "Kasoa", "Elmina", "Agona Swedru", "Assin Fosu"] },
  { name: "Eastern", capital: "Koforidua", cities: ["Koforidua", "Akim Oda", "Nkawkaw", "Suhum", "Begoro"] },
  { name: "Greater Accra", capital: "Accra", cities: ["Accra", "Tema", "Ashaiman", "Madina", "Adenta", "Amasaman", "Prampram"] },
  { name: "North East", capital: "Nalerigu", cities: ["Nalerigu", "Gambaga", "Walewale"] },
  { name: "Northern", capital: "Tamale", cities: ["Tamale", "Yendi", "Savelugu", "Tolon"] },
  { name: "Oti", capital: "Dambai", cities: ["Dambai", "Kete Krachi", "Jasikan", "Kpassa"] },
  { name: "Savannah", capital: "Damongo", cities: ["Damongo", "Bole", "Salaga", "Buipe"] },
  { name: "Upper East", capital: "Bolgatanga", cities: ["Bolgatanga", "Bawku", "Navrongo", "Paga"] },
  { name: "Upper West", capital: "Wa", cities: ["Wa", "Jirapa", "Lawra", "Tumu"] },
  { name: "Volta", capital: "Ho", cities: ["Ho", "Hohoe", "Keta", "Aflao", "Sogakope", "Anloga"] },
  { name: "Western", capital: "Sekondi-Takoradi", cities: ["Sekondi-Takoradi", "Tarkwa", "Axim", "Prestea"] },
  { name: "Western North", capital: "Sefwi Wiawso", cities: ["Sefwi Wiawso", "Bibiani", "Enchi", "Juaboso"] },
];

export const GHANA_REGION_NAMES = GHANA_REGIONS.map((r) => r.name);

/** Canonical amenity options (agents pick from this list; stored as String[]). */
export const AMENITIES = [
  "Air Conditioning",
  "Backup Generator",
  "Borehole Water",
  "Boys Quarters",
  "CCTV Security",
  "Fitted Kitchen",
  "Inverter / Solar Power",
  "Parking Space",
  "POP Ceiling",
  "Prepaid Meter (ECG)",
  "Security / Watchman",
  "Self-Contained",
  "Store Room",
  "Study Room",
  "Tarred Road Access",
  "Tiled Floors",
  "Walled & Gated",
  "Wardrobes",
  "Water Reservoir / Polytank",
  "Wi-Fi Ready",
] as const;

export type Amenity = (typeof AMENITIES)[number];

/** Mirrors the Prisma `PropertyType` enum. */
export const PROPERTY_TYPES = [
  "HOUSE",
  "APARTMENT",
  "ROOM",
  "HOSTEL",
  "LAND",
  "COMMERCIAL",
] as const;

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  HOUSE: "House",
  APARTMENT: "Apartment",
  ROOM: "Room",
  HOSTEL: "Hostel",
  LAND: "Land",
  COMMERCIAL: "Commercial",
};

/** Mirrors the Prisma `ListingType` enum. */
export const LISTING_TYPES = ["RENT", "SALE"] as const;

export const LISTING_TYPE_LABELS: Record<string, string> = {
  RENT: "For Rent",
  SALE: "For Sale",
};

/** Mirrors the Prisma `PricePeriod` enum. */
export const PRICE_PERIODS = ["MONTH", "YEAR", "ONE_OFF"] as const;

export const PRICE_PERIOD_LABELS: Record<string, string> = {
  MONTH: "per month",
  YEAR: "per year",
  ONE_OFF: "one-off",
};

/** Mirrors the Prisma `PropertyStatus` enum. */
export const PROPERTY_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "RENTED_OR_SOLD",
] as const;

export const PROPERTY_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  RENTED_OR_SOLD: "Rented / Sold",
};

/**
 * Property photo limits (Phase 4) — checked in the browser for fast
 * feedback and enforced again on the server. Client-safe (no secrets).
 */
export const MAX_IMAGES_PER_PROPERTY = 10;
export const MAX_IMAGE_SIZE_MB = 5;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
