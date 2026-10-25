import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPublicProperty,
  getSimilarProperties,
} from "@/lib/services/public-properties";
import {
  LISTING_TYPE_LABELS,
  PRICE_PERIOD_LABELS,
  PROPERTY_TYPE_LABELS,
} from "@/lib/constants";
import { formatGHS, pricePeriodSuffix } from "@/lib/utils";
import { EMPTY_SEARCH_QUERY, propertiesHref } from "@/lib/validations/search";
import { PropertyCard } from "@/components/properties/property-card";
import { PropertyGallery } from "@/components/properties/gallery";
import { AgentContactCard } from "@/components/properties/agent-contact-card";
import { PropertyMap } from "@/components/maps/property-map";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getOpenInquiryFor } from "@/lib/services/inquiries";
import { InquiryForm } from "@/components/inquiries/inquiry-form";

interface PageProps {
  params: { id: string };
}

function whereLine(p: { area: string | null; city: string; region: string }) {
  return `${p.area ? `${p.area}, ` : ""}${p.city} — ${p.region}`;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const property = await getPublicProperty(params.id);
  if (!property) return { title: "Property not found" };

  const description = `${PROPERTY_TYPE_LABELS[property.type]} ${
    property.listingType === "SALE" ? "for sale" : "for rent"
  } in ${whereLine(property)} — ${formatGHS(property.price)}${pricePeriodSuffix(
    property.pricePeriod
  )}. View photos, amenities and contact the agent on RentGH.`;
  const cover = property.images[0];

  return {
    title: property.title,
    description,
    openGraph: {
      title: property.title,
      description,
      images: cover ? [cover.url] : [],
    },
  };
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const property = await getPublicProperty(params.id);
  // Non-approved listings 404 exactly like nonexistent ones (no leaks).
  if (!property) notFound();

  const similar = await getSimilarProperties(property);

  const currentUser = await getCurrentUser();
  const isOwner = currentUser?.id === property.ownerId;
  const openInquiry =
    currentUser && !isOwner
      ? await getOpenInquiryFor(currentUser.id, property.id)
      : null;

  const listedOn = property.createdAt.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const memberSince = property.owner.createdAt.toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });

  const stats: { label: string; value: string }[] = [
    { label: "Property type", value: PROPERTY_TYPE_LABELS[property.type] },
    { label: "Listing", value: LISTING_TYPE_LABELS[property.listingType] },
    ...(property.bedrooms != null
      ? [{ label: "Bedrooms", value: String(property.bedrooms) }]
      : []),
    ...(property.bathrooms != null
      ? [{ label: "Bathrooms", value: String(property.bathrooms) }]
      : []),
    {
      label: "Price period",
      value: PRICE_PERIOD_LABELS[property.pricePeriod],
    },
    { label: "Region", value: property.region },
    { label: "City / Town", value: property.city },
    ...(property.area ? [{ label: "Area", value: property.area }] : []),
  ];

  const hasCoords = property.latitude != null && property.longitude != null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/" className="hover:text-emerald-800 hover:underline">
          Home
        </Link>
        <span aria-hidden="true">›</span>
        <Link href="/properties" className="hover:text-emerald-800 hover:underline">
          Properties
        </Link>
        <span aria-hidden="true">›</span>
        <Link
          href={propertiesHref(EMPTY_SEARCH_QUERY, { region: property.region })}
          className="hover:text-emerald-800 hover:underline"
        >
          {property.region}
        </Link>
        <span aria-hidden="true">›</span>
        <span aria-current="page" className="max-w-[180px] truncate font-medium text-slate-700 sm:max-w-xs">
          {property.title}
        </span>
      </nav>

      {/* Header */}
      <header className="mt-4">
        <h1 className="text-2xl font-bold leading-snug text-slate-900 sm:text-3xl">
          {property.title}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-600">
          <span className="inline-flex items-center gap-1">
            <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            {whereLine(property)}
          </span>
          <span>Listed {listedOn}</span>
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200">
            ✓ Verified listing
          </span>
        </div>
      </header>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-10 lg:col-span-2">
          <PropertyGallery
            images={property.images.map((img) => ({ id: img.id, url: img.url }))}
            title={property.title}
            listingLabel={LISTING_TYPE_LABELS[property.listingType]}
            forSale={property.listingType === "SALE"}
          />

          <section>
            <h2 className="mb-4 text-xl font-bold text-slate-900">Key details</h2>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3"
                >
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {stat.label}
                  </dt>
                  <dd className="mt-0.5 font-semibold text-slate-900">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-slate-900">Description</h2>
            <p className="whitespace-pre-line leading-7 text-slate-700">
              {property.description}
            </p>
          </section>

          {property.amenities.length > 0 && (
            <section>
              <h2 className="mb-3 text-xl font-bold text-slate-900">Amenities</h2>
              <ul className="flex flex-wrap gap-2">
                {property.amenities.map((amenity) => (
                  <li
                    key={amenity}
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-inset ring-slate-200"
                  >
                    <svg className="h-3.5 w-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    {amenity}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="mb-3 text-xl font-bold text-slate-900">Location</h2>
            {hasCoords ? (
              <>
                <PropertyMap
                  latitude={property.latitude as number}
                  longitude={property.longitude as number}
                  label={property.title}
                />
                <p className="mt-3 text-sm text-slate-600">
                  {whereLine(property)} · The pin shows the approximate area —
                  the agent will confirm the exact location.{" "}
                  <a
                    href={`https://www.google.com/maps?q=${property.latitude},${property.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-emerald-700 hover:underline"
                  >
                    Open in Google Maps ↗
                  </a>
                </p>
              </>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
                <p className="font-medium text-slate-800">
                  {whereLine(property)}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  The agent will share the exact location and arrange a
                  viewing when you get in touch.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="self-start space-y-4 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {LISTING_TYPE_LABELS[property.listingType]}
            </p>
            <p className="mt-1 text-3xl font-bold text-emerald-800">
              {formatGHS(property.price)}
              <span className="text-base font-normal text-slate-500">
                {pricePeriodSuffix(property.pricePeriod)}
              </span>
            </p>
            <div className="my-5 border-t border-slate-100" />
            <AgentContactCard
              name={property.owner.name}
              phone={property.owner.phone}
              memberSince={memberSince}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-base font-bold text-slate-900">
              Interested in this property?
            </h2>
            {!currentUser ? (
              <>
                <p className="text-sm leading-6 text-slate-600">
                  Log in to send {property.owner.name} an inquiry and arrange
                  a viewing.
                </p>
                <Link
                  href={`/login?callbackUrl=${encodeURIComponent(`/properties/${property.id}`)}`}
                  className="mt-3 block rounded-lg bg-emerald-700 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-emerald-800"
                >
                  Log in to send an inquiry
                </Link>
                <p className="mt-2.5 text-center text-xs text-slate-500">
                  New to RentGH?{" "}
                  <Link href="/register" className="font-semibold text-emerald-700 hover:underline">
                    Create a free account
                  </Link>
                </p>
              </>
            ) : isOwner ? (
              <>
                <p className="text-sm leading-6 text-slate-600">
                  This is your listing. Tenant messages about it land in your
                  inquiries inbox.
                </p>
                <Link
                  href="/dashboard/inquiries"
                  className="mt-3 block rounded-lg border border-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                >
                  View my inquiries
                </Link>
              </>
            ) : openInquiry ? (
              <>
                <p className="text-sm leading-6 text-slate-600">
                  You already have an open conversation with{" "}
                  {property.owner.name} about this property.
                </p>
                <Link
                  href={`/inquiries/${openInquiry.id}`}
                  className="mt-3 block rounded-lg bg-emerald-700 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-emerald-800"
                >
                  Continue conversation
                </Link>
              </>
            ) : (
              <InquiryForm
                propertyId={property.id}
                agentName={property.owner.name}
              />
            )}
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-sm font-semibold text-amber-900">Stay safe</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm leading-6 text-amber-800">
              <li>Inspect the property in person before paying anything.</li>
              <li>Never send money in advance for a home you have not seen.</li>
              <li>Meet the agent at the property or a safe public place.</li>
            </ul>
          </div>
        </aside>
      </div>

      {/* Similar properties */}
      {similar.length > 0 && (
        <section className="mt-14 border-t border-slate-200 pt-10">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="text-2xl font-bold text-slate-900">
              Similar properties
            </h2>
            <Link
              href={propertiesHref(EMPTY_SEARCH_QUERY, {
                region: property.region,
              })}
              className="flex-none text-sm font-semibold text-emerald-700 hover:underline"
            >
              More in {property.region} →
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {similar.map((item) => (
              <PropertyCard key={item.id} property={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
