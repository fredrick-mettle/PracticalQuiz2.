import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-helpers";
import { getOwnedProperty } from "@/lib/services/properties";
import { listPropertyImages } from "@/lib/services/images";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { PropertyForm } from "@/components/properties/property-form";
import { ImageManager } from "@/components/properties/image-manager";
import { StatusBadge } from "@/components/properties/status-badge";
import type { PropertyFormValues } from "@/lib/validations/property";

export const metadata: Metadata = { title: "Edit Listing" };

interface PageProps {
  params: { id: string };
  searchParams?: { created?: string };
}

export default async function EditPropertyPage({
  params,
  searchParams,
}: PageProps) {
  const user = await requireRole("AGENT");

  // 404 (not 403) for listings owned by someone else — don't leak existence.
  const property = await getOwnedProperty(user.id, params.id);
  if (!property) notFound();

  const images = await listPropertyImages(user.id, property.id);

  const initialValues: PropertyFormValues = {
    title: property.title,
    description: property.description,
    type: property.type,
    listingType: property.listingType,
    price: property.price,
    pricePeriod: property.pricePeriod,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    region: property.region,
    city: property.city,
    area: property.area,
    address: property.address,
    latitude: property.latitude,
    longitude: property.longitude,
    amenities: property.amenities as PropertyFormValues["amenities"],
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/dashboard"
        className="text-sm font-medium text-emerald-700 hover:underline"
      >
        ← Back to my listings
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Edit listing
        </h1>
        <StatusBadge status={property.status} />
      </div>
      <p className="mb-6 mt-2 text-slate-600">{property.title}</p>

      {searchParams?.created === "1" && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">
          <p className="font-semibold">Listing created 🎉</p>
          <p>
            It&apos;s now pending admin review. Add photos below to make it
            stand out once it goes live.
          </p>
        </div>
      )}

      {property.status === "APPROVED" && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          <p className="font-semibold">This listing is currently live.</p>
          <p>
            Saving changes sends it back for admin review — it will be
            hidden from the public until it&apos;s approved again. (Photo
            changes above don&apos;t trigger re-review.)
          </p>
        </div>
      )}

      {property.status === "REJECTED" && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">
          <p className="font-semibold">This listing was rejected by an admin.</p>
          {property.rejectionReason && (
            <p className="mt-0.5">Reason: {property.rejectionReason}</p>
          )}
          <p className="mt-0.5">
            Fix the issue and save — the listing will be resubmitted for
            review automatically.
          </p>
        </div>
      )}

      <section id="photos" className="mb-10">
        <h2 className="text-lg font-semibold text-slate-900">Photos</h2>
        <p className="mb-4 mt-1 text-sm text-slate-600">
          The first photo is the cover shown everywhere your listing appears.
          Use the arrows or the star to reorder.
        </p>
        <ImageManager
          propertyId={property.id}
          initialImages={images.map((img) => ({
            id: img.id,
            url: img.url,
            publicId: img.publicId,
          }))}
          uploadsConfigured={isCloudinaryConfigured()}
        />
      </section>

      <h2 className="mb-4 text-lg font-semibold text-slate-900">
        Listing details
      </h2>
      <PropertyForm propertyId={property.id} initialValues={initialValues} />
    </div>
  );
}
