import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminProperty } from "@/lib/services/admin";
import {
  LISTING_TYPE_LABELS,
  PRICE_PERIOD_LABELS,
  PROPERTY_TYPE_LABELS,
} from "@/lib/constants";
import { formatGHS, pricePeriodSuffix, roleLabel } from "@/lib/utils";
import { StatusBadge } from "@/components/properties/status-badge";
import { PropertyGallery } from "@/components/properties/gallery";
import { ModerationActions } from "@/components/admin/moderation-actions";
import { DeletePropertyButton } from "@/components/admin/delete-property-button";
import { UserStatusBadge } from "@/components/admin/user-status-badge";

export const metadata: Metadata = { title: "Inspect Listing" };

interface PageProps {
  params: { id: string };
}

function formatWhen(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminPropertyDetailPage({ params }: PageProps) {
  const property = await getAdminProperty(params.id);
  if (!property) notFound();

  const details: { label: string; value: string }[] = [
    { label: "Type", value: PROPERTY_TYPE_LABELS[property.type] },
    { label: "Listing", value: LISTING_TYPE_LABELS[property.listingType] },
    {
      label: "Price",
      value: `${formatGHS(property.price)}${pricePeriodSuffix(property.pricePeriod)} (${PRICE_PERIOD_LABELS[property.pricePeriod]})`,
    },
    ...(property.bedrooms != null
      ? [{ label: "Bedrooms", value: String(property.bedrooms) }]
      : []),
    ...(property.bathrooms != null
      ? [{ label: "Bathrooms", value: String(property.bathrooms) }]
      : []),
    { label: "Region", value: property.region },
    { label: "City / Town", value: property.city },
    ...(property.area ? [{ label: "Area", value: property.area }] : []),
    { label: "Address", value: property.address },
    {
      label: "Coordinates",
      value:
        property.latitude != null && property.longitude != null
          ? `${property.latitude}, ${property.longitude}`
          : "Not provided",
    },
    { label: "Listed", value: formatWhen(property.createdAt) },
    { label: "Last updated", value: formatWhen(property.updatedAt) },
    {
      label: "Engagement",
      value: `${property._count.favorites} saves · ${property._count.inquiries} inquiries`,
    },
  ];

  return (
    <div>
      <Link
        href="/admin/properties"
        className="text-sm font-medium text-emerald-700 hover:underline"
      >
        ← All listings
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-bold leading-snug text-slate-900 sm:text-2xl">
          {property.title}
        </h2>
        <StatusBadge status={property.status} />
        {property.status === "APPROVED" && (
          <Link
            href={`/properties/${property.id}`}
            className="text-sm font-semibold text-emerald-700 hover:underline"
          >
            View public page →
          </Link>
        )}
      </div>

      {property.status === "REJECTED" && property.rejectionReason && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">
          <span className="font-semibold">Rejection reason:</span>{" "}
          {property.rejectionReason}
        </div>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <PropertyGallery
            images={property.images.map((img) => ({
              id: img.id,
              url: img.url,
            }))}
            title={property.title}
            listingLabel={LISTING_TYPE_LABELS[property.listingType]}
            forSale={property.listingType === "SALE"}
          />

          <section>
            <h3 className="mb-3 font-bold text-slate-900">Description</h3>
            <p className="whitespace-pre-line leading-7 text-slate-700">
              {property.description}
            </p>
          </section>

          {property.amenities.length > 0 && (
            <section>
              <h3 className="mb-3 font-bold text-slate-900">Amenities</h3>
              <ul className="flex flex-wrap gap-2">
                {property.amenities.map((amenity) => (
                  <li
                    key={amenity}
                    className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-inset ring-slate-200"
                  >
                    {amenity}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h3 className="mb-3 font-bold text-slate-900">Full details</h3>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {details.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3"
                >
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {item.label}
                  </dt>
                  <dd className="mt-0.5 break-words font-medium text-slate-900">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <aside className="self-start space-y-4 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-bold text-slate-900">Moderation</h3>
            <ModerationActions
              propertyId={property.id}
              status={property.status}
            />
            <p className="mt-3 text-xs leading-5 text-slate-500">
              The agent is emailed the outcome. Approved listings edited by
              the agent return to the queue automatically.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-bold text-slate-900">Owner</h3>
            <p className="font-semibold text-slate-900">
              {property.owner.name}
            </p>
            <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-slate-600">
              {roleLabel(property.owner.role)}
              <UserStatusBadge status={property.owner.status} />
            </p>
            <p className="mt-2 text-sm text-slate-600">
              <a
                href={`mailto:${property.owner.email}`}
                className="text-emerald-700 hover:underline"
              >
                {property.owner.email}
              </a>
              <br />
              {property.owner.phone}
              <br />
              Member since {formatWhen(property.owner.createdAt)}
            </p>
            <Link
              href={`/admin/users?q=${encodeURIComponent(property.owner.email)}`}
              className="mt-3 inline-block text-sm font-semibold text-emerald-700 hover:underline"
            >
              Manage this user →
            </Link>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <h3 className="mb-2 font-bold text-red-900">Danger zone</h3>
            <p className="mb-3 text-sm leading-6 text-red-800">
              Permanently remove this listing (spam, fraud, duplicates the
              agent won&apos;t fix).
            </p>
            <DeletePropertyButton
              propertyId={property.id}
              propertyTitle={property.title}
              redirectTo="/admin/properties"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
