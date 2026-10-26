import { describe, expect, it } from "vitest";
import {
  AMENITIES,
  GHANA_REGION_NAMES,
  INQUIRY_STATUSES,
  INQUIRY_STATUS_LABELS,
  LISTING_TYPES,
  LISTING_TYPE_LABELS,
  PRICE_PERIODS,
  PRICE_PERIOD_LABELS,
  PROPERTY_STATUSES,
  PROPERTY_STATUS_LABELS,
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABELS,
  USER_STATUSES,
  USER_STATUS_LABELS,
} from "@/lib/constants";

describe("Ghana regions", () => {
  it("has exactly the 16 regions, unique", () => {
    expect(GHANA_REGION_NAMES).toHaveLength(16);
    expect(new Set(GHANA_REGION_NAMES).size).toBe(16);
  });

  it("includes old and newly-created regions", () => {
    for (const name of ["Greater Accra", "Ashanti", "Ahafo", "Bono East", "Oti", "Savannah", "Western North"]) {
      expect(GHANA_REGION_NAMES).toContain(name);
    }
  });
});

describe("enum label coverage", () => {
  const cases: Array<[string, readonly string[], Record<string, string>]> = [
    ["property types", PROPERTY_TYPES, PROPERTY_TYPE_LABELS],
    ["listing types", LISTING_TYPES, LISTING_TYPE_LABELS],
    ["price periods", PRICE_PERIODS, PRICE_PERIOD_LABELS],
    ["property statuses", PROPERTY_STATUSES, PROPERTY_STATUS_LABELS],
    ["inquiry statuses", INQUIRY_STATUSES, INQUIRY_STATUS_LABELS],
    ["user statuses", USER_STATUSES, USER_STATUS_LABELS],
  ];

  it.each(cases)("every %s value has a label", (_name, values, labels) => {
    for (const value of values) {
      expect(labels[value], `missing label for ${value}`).toBeTruthy();
    }
  });
});

describe("amenities", () => {
  it("are unique and non-empty", () => {
    expect(AMENITIES.length).toBeGreaterThan(0);
    expect(new Set(AMENITIES).size).toBe(AMENITIES.length);
  });
});
