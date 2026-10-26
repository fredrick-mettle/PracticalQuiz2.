"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AMENITIES,
  GHANA_REGIONS,
  LISTING_TYPES,
  LISTING_TYPE_LABELS,
  PRICE_PERIODS,
  PRICE_PERIOD_LABELS,
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABELS,
} from "@/lib/constants";
import {
  propertyFormSchema,
  type PropertyFormValues,
} from "@/lib/validations/property";
import {
  createPropertyAction,
  updatePropertyAction,
} from "@/lib/actions/properties";
import { LocationPicker } from "@/components/maps/location-picker";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";
const errorClass = "mt-1 text-sm text-red-600";

const toNumberOrNull = (v: unknown) =>
  v === "" || v == null ? null : Number(v);
const toRequiredNumber = (v: unknown) =>
  v === "" || v == null ? NaN : Number(v);

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

interface Props {
  /** Present in edit mode. */
  propertyId?: string;
  /** Prefilled values in edit mode. */
  initialValues?: PropertyFormValues;
}

/**
 * Create/edit property form (agent dashboard).
 * Client validation mirrors the server schema; the server action
 * re-validates everything (including ownership) before saving.
 */
export function PropertyForm({ propertyId, initialValues }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEdit = Boolean(propertyId);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: initialValues ?? {
      title: "",
      description: "",
      type: "HOUSE",
      listingType: "RENT",
      price: "" as unknown as number,
      pricePeriod: "MONTH",
      bedrooms: null,
      bathrooms: null,
      region: "Greater Accra",
      city: "",
      area: null,
      address: "",
      latitude: null,
      longitude: null,
      amenities: [],
    },
  });

  const propertyType = watch("type");
  const listingType = watch("listingType");
  const region = watch("region");
  const latitudeValue = watch("latitude");
  const longitudeValue = watch("longitude");

  const showBedrooms = propertyType !== "LAND" && propertyType !== "COMMERCIAL";
  const showBathrooms = propertyType !== "LAND";
  const citySuggestions =
    GHANA_REGIONS.find((r) => r.name === region)?.cities ?? [];
  const pricePeriodOptions =
    listingType === "SALE"
      ? PRICE_PERIODS.filter((p) => p === "ONE_OFF")
      : PRICE_PERIODS.filter((p) => p !== "ONE_OFF");

  // Keep pricePeriod consistent with the listing type.
  useEffect(() => {
    if (listingType === "SALE") {
      setValue("pricePeriod", "ONE_OFF");
    } else if (getValues("pricePeriod") === "ONE_OFF") {
      setValue("pricePeriod", "MONTH");
    }
  }, [listingType, setValue, getValues]);

  // Land has no rooms; commercial spaces have no bedrooms.
  useEffect(() => {
    if (propertyType === "LAND") {
      setValue("bedrooms", null);
      setValue("bathrooms", null);
    } else if (propertyType === "COMMERCIAL") {
      setValue("bedrooms", null);
    }
  }, [propertyType, setValue]);

  async function onSubmit(values: PropertyFormValues) {
    setServerError(null);
    const result = propertyId
      ? await updatePropertyAction(propertyId, values)
      : await createPropertyAction(values);

    if (!result.success) {
      setServerError(result.message);
      return;
    }
    if (propertyId) {
      router.push("/dashboard");
    } else {
      // New listing: land on its edit page to add photos right away.
      router.push(`/dashboard/properties/${result.propertyId}/edit?created=1`);
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {serverError}
        </div>
      )}

      {!isEdit && (
        <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          New listings are reviewed by an admin before they appear publicly.
          You can track the review status on your dashboard.
        </div>
      )}

      <Section title="Basic details">
        <div>
          <label htmlFor="title" className={labelClass}>
            Listing title
          </label>
          <input
            id="title"
            type="text"
            placeholder="e.g. 3 Bedroom House in East Legon"
            className={inputClass}
            {...register("title")}
          />
          {errors.title && <p className={errorClass}>{errors.title.message}</p>}
        </div>

        <div>
          <label htmlFor="description" className={labelClass}>
            Description
          </label>
          <textarea
            id="description"
            rows={5}
            placeholder="Describe the property: rooms, condition, water/power situation, advance terms, nearby landmarks…"
            className={inputClass}
            {...register("description")}
          />
          {errors.description && (
            <p className={errorClass}>{errors.description.message}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="listingType" className={labelClass}>
              Listing type
            </label>
            <select
              id="listingType"
              className={inputClass}
              {...register("listingType")}
            >
              {LISTING_TYPES.map((t) => (
                <option key={t} value={t}>
                  {LISTING_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            {errors.listingType && (
              <p className={errorClass}>{errors.listingType.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="type" className={labelClass}>
              Property type
            </label>
            <select id="type" className={inputClass} {...register("type")}>
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {PROPERTY_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            {errors.type && <p className={errorClass}>{errors.type.message}</p>}
          </div>
        </div>
      </Section>

      <Section title="Price">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="price" className={labelClass}>
              Price (GH₵)
            </label>
            <input
              id="price"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="e.g. 2500"
              className={inputClass}
              {...register("price", { setValueAs: toRequiredNumber })}
            />
            {errors.price && (
              <p className={errorClass}>{errors.price.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="pricePeriod" className={labelClass}>
              Price period
            </label>
            <select
              id="pricePeriod"
              className={inputClass}
              {...register("pricePeriod")}
            >
              {pricePeriodOptions.map((p) => (
                <option key={p} value={p}>
                  {PRICE_PERIOD_LABELS[p]}
                </option>
              ))}
            </select>
            {errors.pricePeriod && (
              <p className={errorClass}>{errors.pricePeriod.message}</p>
            )}
          </div>
        </div>
      </Section>

      {(showBedrooms || showBathrooms) && (
        <Section title="Rooms">
          <div className="grid gap-4 sm:grid-cols-2">
            {showBedrooms && (
              <div>
                <label htmlFor="bedrooms" className={labelClass}>
                  Bedrooms
                </label>
                <input
                  id="bedrooms"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={50}
                  placeholder="e.g. 3"
                  className={inputClass}
                  {...register("bedrooms", { setValueAs: toNumberOrNull })}
                />
                {errors.bedrooms && (
                  <p className={errorClass}>{errors.bedrooms.message}</p>
                )}
              </div>
            )}
            {showBathrooms && (
              <div>
                <label htmlFor="bathrooms" className={labelClass}>
                  Bathrooms
                </label>
                <input
                  id="bathrooms"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={50}
                  placeholder="e.g. 2"
                  className={inputClass}
                  {...register("bathrooms", { setValueAs: toNumberOrNull })}
                />
                {errors.bathrooms && (
                  <p className={errorClass}>{errors.bathrooms.message}</p>
                )}
              </div>
            )}
          </div>
        </Section>
      )}

      <Section title="Location">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="region" className={labelClass}>
              Region
            </label>
            <select id="region" className={inputClass} {...register("region")}>
              {GHANA_REGIONS.map((r) => (
                <option key={r.name} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
            {errors.region && (
              <p className={errorClass}>{errors.region.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="city" className={labelClass}>
              City / town
            </label>
            <input
              id="city"
              type="text"
              list="city-suggestions"
              placeholder="e.g. Kumasi"
              className={inputClass}
              {...register("city")}
            />
            <datalist id="city-suggestions">
              {citySuggestions.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            {errors.city && <p className={errorClass}>{errors.city.message}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="area" className={labelClass}>
              Area / neighbourhood (optional)
            </label>
            <input
              id="area"
              type="text"
              placeholder="e.g. East Legon"
              className={inputClass}
              {...register("area", {
                setValueAs: (v) =>
                  typeof v === "string" && v.trim() === "" ? null : v,
              })}
            />
            {errors.area && <p className={errorClass}>{errors.area.message}</p>}
          </div>
          <div>
            <label htmlFor="address" className={labelClass}>
              Address / directions
            </label>
            <input
              id="address"
              type="text"
              placeholder="e.g. No. 14 Lagos Avenue, near the Melcom"
              className={inputClass}
              {...register("address")}
            />
            {errors.address && (
              <p className={errorClass}>{errors.address.message}</p>
            )}
          </div>
        </div>

        <div>
          <span className={labelClass}>Map location (optional)</span>
          <LocationPicker
            latitude={
              typeof latitudeValue === "number" && !Number.isNaN(latitudeValue)
                ? latitudeValue
                : null
            }
            longitude={
              typeof longitudeValue === "number" &&
              !Number.isNaN(longitudeValue)
                ? longitudeValue
                : null
            }
            onChange={(lat, lng) => {
              setValue("latitude", lat, {
                shouldDirty: true,
                shouldValidate: true,
              });
              setValue("longitude", lng, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="latitude" className={labelClass}>
              Latitude (optional)
            </label>
            <input
              id="latitude"
              type="number"
              inputMode="decimal"
              step="any"
              placeholder="e.g. 5.6037"
              className={inputClass}
              {...register("latitude", { setValueAs: toNumberOrNull })}
            />
            {errors.latitude && (
              <p className={errorClass}>{errors.latitude.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="longitude" className={labelClass}>
              Longitude (optional)
            </label>
            <input
              id="longitude"
              type="number"
              inputMode="decimal"
              step="any"
              placeholder="e.g. -0.1870"
              className={inputClass}
              {...register("longitude", { setValueAs: toNumberOrNull })}
            />
            {errors.longitude && (
              <p className={errorClass}>{errors.longitude.message}</p>
            )}
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Drop a pin so your listing appears on the property map — or type
          the coordinates if you know them. You can also leave both blank.
        </p>
      </Section>

      <Section title="Amenities">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {AMENITIES.map((amenity) => (
            <label
              key={amenity}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50/50"
            >
              <input
                type="checkbox"
                value={amenity}
                className="h-4 w-4 rounded accent-emerald-700"
                {...register("amenities")}
              />
              {amenity}
            </label>
          ))}
        </div>
        {errors.amenities && (
          <p className={errorClass}>{errors.amenities.message}</p>
        )}
      </Section>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link
          href="/dashboard"
          className="rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? "Saving…"
            : isEdit
              ? "Save changes"
              : "Create listing"}
        </button>
      </div>
    </form>
  );
}
