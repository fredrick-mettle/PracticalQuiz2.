import { describe, expect, it } from "vitest";
import {
  EMPTY_SEARCH_QUERY,
  parseSearchParams,
  propertiesHref,
} from "@/lib/validations/search";

describe("parseSearchParams", () => {
  it("defaults when nothing is given", () => {
    expect(parseSearchParams({})).toEqual(EMPTY_SEARCH_QUERY);
  });

  it("parses a full valid query", () => {
    const q = parseSearchParams({
      q: "East Legon",
      region: "Greater Accra",
      city: "Accra",
      type: "HOUSE",
      listingType: "RENT",
      minPrice: "1000",
      maxPrice: "5000",
      bedrooms: "2",
      sort: "price-asc",
      page: "3",
      view: "map",
    });
    expect(q).toMatchObject({
      q: "East Legon",
      region: "Greater Accra",
      type: "HOUSE",
      listingType: "RENT",
      minPrice: 1000,
      maxPrice: 5000,
      minBedrooms: 2,
      sort: "price-asc",
      page: 3,
      view: "map",
    });
  });

  it("silently drops junk instead of erroring", () => {
    const q = parseSearchParams({
      region: "Narnia",
      type: "CASTLE",
      minPrice: "abc",
      maxPrice: "-50",
      bedrooms: "0",
      sort: "random",
      page: "0",
      view: "satellite",
    });
    expect(q.region).toBeUndefined();
    expect(q.type).toBeUndefined();
    expect(q.minPrice).toBeUndefined();
    expect(q.maxPrice).toBeUndefined();
    expect(q.minBedrooms).toBeUndefined();
    expect(q.sort).toBe("newest");
    expect(q.page).toBe(1);
    expect(q.view).toBe("grid");
  });

  it("forgivingly swaps an inverted price range", () => {
    const q = parseSearchParams({ minPrice: "9000", maxPrice: "1000" });
    expect(q.minPrice).toBe(1000);
    expect(q.maxPrice).toBe(9000);
  });

  it("takes the first of repeated params and trims q to 100 chars", () => {
    const q = parseSearchParams({ region: ["Ashanti", "Volta"], q: "x".repeat(250) });
    expect(q.region).toBe("Ashanti");
    expect(q.q).toHaveLength(100);
  });
});

describe("propertiesHref", () => {
  it("omits defaults", () => {
    expect(propertiesHref(EMPTY_SEARCH_QUERY)).toBe("/properties");
  });

  it("round-trips filters and applies overrides", () => {
    const href = propertiesHref(
      { ...EMPTY_SEARCH_QUERY, region: "Ashanti", view: "map" },
      { page: 2 }
    );
    expect(href).toContain("region=Ashanti");
    expect(href).toContain("view=map");
    expect(href).toContain("page=2");
    expect(href).not.toContain("sort=");
  });
});
