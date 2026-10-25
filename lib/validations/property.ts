import { z } from "zod";
import {
  AMENITIES,
  GHANA_REGION_NAMES,
  LISTING_TYPES,
  PRICE_PERIODS,
  PROPERTY_TYPES,
} from "@/lib/constants";

/** Approximate bounding box of Ghana (catches swapped/invalid coordinates). */
const GHANA_LAT = { min: 4.5, max: 11.3 };
const GHANA_LNG = { min: -3.4, max: 1.3 };

const optionalRoomCount = (label: string) =>
  z
    .number(`${label} must be a number`)
    .int(`${label} must be a whole number`)
    .min(0, `${label} cannot be negative`)
    .max(50, `${label} looks too high`)
    .nullable();

/**
 * Create/edit property form schema, shared by the client form
 * (React Hook Form) and the server (service layer re-validates).
 *
 * Numbers arrive as real numbers (form uses setValueAs), empty optional
 * numbers arrive as null. Status is deliberately NOT part of this schema:
 * the server forces new listings to PENDING and controls all transitions.
 */
export const propertyFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(5, "Title must be at least 5 characters")
      .max(100, "Title must be at most 100 characters"),
    description: z
      .string()
      .trim()
      .min(20, "Please describe the property in at least 20 characters")
      .max(4000, "Description is too long"),
    type: z.enum(PROPERTY_TYPES),
    listingType: z.enum(LISTING_TYPES),
    price: z
      .number("Enter the price in cedis")
      .int("Price must be a whole number of cedis")
      .min(1, "Price must be at least GH₵1")
      .max(999_999_999, "Price looks too high"),
    pricePeriod: z.enum(PRICE_PERIODS),
    bedrooms: optionalRoomCount("Bedrooms"),
    bathrooms: optionalRoomCount("Bathrooms"),
    region: z
      .string()
      .refine((v) => GHANA_REGION_NAMES.includes(v), "Select a valid region"),
    city: z
      .string()
      .trim()
      .min(2, "City/town is required")
      .max(60, "City/town is too long"),
    area: z.string().trim().max(80, "Area is too long").nullable(),
    address: z
      .string()
      .trim()
      .min(5, "Address must be at least 5 characters")
      .max(200, "Address is too long"),
    latitude: z
      .number("Latitude must be a number")
      .min(GHANA_LAT.min, "Latitude must be within Ghana")
      .max(GHANA_LAT.max, "Latitude must be within Ghana")
      .nullable(),
    longitude: z
      .number("Longitude must be a number")
      .min(GHANA_LNG.min, "Longitude must be within Ghana")
      .max(GHANA_LNG.max, "Longitude must be within Ghana")
      .nullable(),
    amenities: z.array(z.enum(AMENITIES)).max(AMENITIES.length),
  })
  .superRefine((values, ctx) => {
    if (values.listingType === "SALE" && values.pricePeriod !== "ONE_OFF") {
      ctx.addIssue({
        code: "custom",
        path: ["pricePeriod"],
        message: "Sale listings are priced as a one-off amount",
      });
    }
    if (values.listingType === "RENT" && values.pricePeriod === "ONE_OFF") {
      ctx.addIssue({
        code: "custom",
        path: ["pricePeriod"],
        message: "Rental listings are priced per month or per year",
      });
    }
    if ((values.latitude == null) !== (values.longitude == null)) {
      ctx.addIssue({
        code: "custom",
        path: ["latitude"],
        message: "Provide both latitude and longitude, or neither",
      });
    }
    if (values.type === "LAND" && (values.bedrooms != null || values.bathrooms != null)) {
      ctx.addIssue({
        code: "custom",
        path: ["bedrooms"],
        message: "Land listings do not have bedrooms or bathrooms",
      });
    }
  });

export type PropertyFormValues = z.infer<typeof propertyFormSchema>;
