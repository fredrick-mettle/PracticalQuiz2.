import { describe, expect, it } from "vitest";
import {
  formatGHS,
  pricePeriodSuffix,
  roleHomePath,
  roleLabel,
} from "@/lib/utils";

describe("formatGHS", () => {
  it("formats whole cedis with thousands separators", () => {
    expect(formatGHS(1500)).toContain("1,500");
    expect(formatGHS(2_500_000)).toContain("2,500,000");
    expect(formatGHS(0)).toContain("0");
  });
});

describe("pricePeriodSuffix", () => {
  it("maps periods to display suffixes", () => {
    expect(pricePeriodSuffix("MONTH")).toBe("/month");
    expect(pricePeriodSuffix("YEAR")).toBe("/year");
    expect(pricePeriodSuffix("ONE_OFF")).toBe("");
    expect(pricePeriodSuffix("junk")).toBe("");
  });
});

describe("roleHomePath / roleLabel", () => {
  it("sends each role to its home", () => {
    expect(roleHomePath("ADMIN")).toBe("/admin");
    expect(roleHomePath("AGENT")).toBe("/dashboard");
    expect(roleHomePath("TENANT")).toBe("/");
    expect(roleHomePath("junk")).toBe("/");
  });

  it("labels roles for display", () => {
    expect(roleLabel("ADMIN")).toBe("Admin");
    expect(roleLabel("AGENT")).toBe("Agent / Landlord");
    expect(roleLabel("TENANT")).toBe("Tenant");
  });
});
