import { describe, expect, it } from "vitest";
import { propertyFormSchema } from "@/lib/validations/property";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import { moderationSchema, userStatusSchema } from "@/lib/validations/admin";
import { inquiryMessageSchema } from "@/lib/validations/inquiry";
import { cloudinaryUploadResultSchema } from "@/lib/validations/image";

const validRental = {
  title: "2 Bedroom Apartment in Osu",
  description:
    "A bright, well-ventilated apartment close to Oxford Street, all rooms tiled with fitted wardrobes.",
  type: "APARTMENT",
  listingType: "RENT",
  price: 2500,
  pricePeriod: "MONTH",
  bedrooms: 2,
  bathrooms: 2,
  region: "Greater Accra",
  city: "Accra",
  area: "Osu",
  address: "Oxford Street, Osu",
  latitude: 5.556,
  longitude: -0.176,
  amenities: ["Tiled Floors", "Wardrobes"],
};

describe("propertyFormSchema", () => {
  it("accepts a valid rental", () => {
    expect(propertyFormSchema.safeParse(validRental).success).toBe(true);
  });

  it("ignores any client-supplied status (server controls status)", () => {
    const result = propertyFormSchema.safeParse({ ...validRental, status: "APPROVED" });
    expect(result.success).toBe(true);
    if (result.success) expect("status" in result.data).toBe(false);
  });

  it("enforces SALE ⇔ one-off pricing", () => {
    expect(
      propertyFormSchema.safeParse({ ...validRental, listingType: "SALE" }).success
    ).toBe(false);
    expect(
      propertyFormSchema.safeParse({ ...validRental, listingType: "SALE", pricePeriod: "ONE_OFF" }).success
    ).toBe(true);
  });

  it("enforces RENT ⇔ per-month/year pricing", () => {
    expect(
      propertyFormSchema.safeParse({ ...validRental, pricePeriod: "ONE_OFF" }).success
    ).toBe(false);
  });

  it("rejects bedrooms/bathrooms for LAND, accepts null rooms", () => {
    const land = {
      ...validRental,
      type: "LAND",
      listingType: "SALE",
      pricePeriod: "ONE_OFF",
    };
    expect(propertyFormSchema.safeParse(land).success).toBe(false);
    expect(
      propertyFormSchema.safeParse({ ...land, bedrooms: null, bathrooms: null }).success
    ).toBe(true);
  });

  it("requires coordinates as a pair inside Ghana", () => {
    expect(
      propertyFormSchema.safeParse({ ...validRental, longitude: null }).success
    ).toBe(false);
    expect(
      propertyFormSchema.safeParse({ ...validRental, latitude: null, longitude: null }).success
    ).toBe(true);
    // Lagos latitude, Accra longitude →outside the Ghana bounding box pairing rule
    expect(
      propertyFormSchema.safeParse({ ...validRental, latitude: 12.5 }).success
    ).toBe(false);
    expect(
      propertyFormSchema.safeParse({ ...validRental, longitude: 3.4 }).success
    ).toBe(false);
  });

  it("validates price, title, region and amenities", () => {
    expect(propertyFormSchema.safeParse({ ...validRental, price: 0 }).success).toBe(false);
    expect(propertyFormSchema.safeParse({ ...validRental, price: 1500.5 }).success).toBe(false);
    expect(propertyFormSchema.safeParse({ ...validRental, title: "Nice" }).success).toBe(false);
    expect(propertyFormSchema.safeParse({ ...validRental, region: "Lagos" }).success).toBe(false);
    expect(propertyFormSchema.safeParse({ ...validRental, amenities: ["Helipad"] }).success).toBe(false);
  });
});

describe("auth schemas", () => {
  const validRegistration = {
    name: "Akosua Owusu",
    email: "akosua@example.com",
    phone: "0241234567",
    password: "Password123",
    role: "TENANT",
  };

  it("accepts valid registrations (incl. phone formats)", () => {
    expect(registerSchema.safeParse(validRegistration).success).toBe(true);
    expect(registerSchema.safeParse({ ...validRegistration, phone: "+233241234567" }).success).toBe(true);
    expect(registerSchema.safeParse({ ...validRegistration, phone: "024 123 4567" }).success).toBe(true);
  });

  it("can never self-register an ADMIN", () => {
    expect(registerSchema.safeParse({ ...validRegistration, role: "ADMIN" }).success).toBe(false);
  });

  it("rejects weak passwords and bad phones", () => {
    expect(registerSchema.safeParse({ ...validRegistration, password: "short1" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...validRegistration, password: "onlyletters" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...validRegistration, password: "12345678" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...validRegistration, phone: "12345" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...validRegistration, phone: "+1234567890" }).success).toBe(false);
  });

  it("login requires a password", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "not-an-email", password: "x" }).success).toBe(false);
  });
});

describe("admin schemas", () => {
  it("approve needs no reason; reject demands a real one", () => {
    expect(moderationSchema.safeParse({ decision: "APPROVE" }).success).toBe(true);
    expect(moderationSchema.safeParse({ decision: "REJECT" }).success).toBe(false);
    expect(moderationSchema.safeParse({ decision: "REJECT", reason: "bad" }).success).toBe(false);
    expect(
      moderationSchema.safeParse({ decision: "REJECT", reason: "Photos are screenshots, please retake." }).success
    ).toBe(true);
    expect(moderationSchema.safeParse({ decision: "MAYBE" }).success).toBe(false);
  });

  it("user status is a closed enum", () => {
    expect(userStatusSchema.safeParse("SUSPENDED").success).toBe(true);
    expect(userStatusSchema.safeParse("FROZEN").success).toBe(false);
  });
});

describe("inquiry schema", () => {
  it("enforces message length bounds", () => {
    expect(inquiryMessageSchema.safeParse({ message: "Too short" }).success).toBe(false);
    expect(inquiryMessageSchema.safeParse({ message: "Is this still available?" }).success).toBe(true);
    expect(inquiryMessageSchema.safeParse({ message: "x".repeat(2001) }).success).toBe(false);
  });
});

describe("cloudinary upload result schema", () => {
  const valid = {
    publicId: "rentgh/properties/abc123",
    url: "https://res.cloudinary.com/demo/image/upload/v123/rentgh/properties/abc123.jpg",
    version: 123,
    signature: "a".repeat(40),
  };

  it("accepts a well-formed result", () => {
    expect(cloudinaryUploadResultSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects non-Cloudinary and non-https URLs", () => {
    expect(
      cloudinaryUploadResultSchema.safeParse({ ...valid, url: "https://evil.com/x.jpg" }).success
    ).toBe(false);
    expect(
      cloudinaryUploadResultSchema.safeParse({ ...valid, url: valid.url.replace("https:", "http:") }).success
    ).toBe(false);
  });

  it("rejects malformed signatures", () => {
    expect(
      cloudinaryUploadResultSchema.safeParse({ ...valid, signature: "xyz" }).success
    ).toBe(false);
  });
});
