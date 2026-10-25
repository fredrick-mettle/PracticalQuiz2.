import Image from "next/image";
import Link from "next/link";
import { LISTING_TYPE_LABELS, PROPERTY_TYPE_LABELS } from "@/lib/constants";
import { formatGHS, pricePeriodSuffix } from "@/lib/utils";
import { FavoriteButton } from "./favorite-button";
import type { PublicPropertyCardData } from "@/lib/services/public-properties";

interface PropertyCardProps {
  property: PublicPropertyCardData;
  /** Heart state for signed-in users (Phase 9). */
  isFavorited?: boolean;
  isSignedIn?: boolean;
  /** Hide the heart (e.g. on the owner's own listings). */
  showFavorite?: boolean;
}

/**
 * Public listing card (home, search results, similar, favorites).
 * The whole card links to the detail page; the favorite heart is a
 * sibling overlay so clicking it never triggers navigation.
 */
export function PropertyCard({
  property,
  isFavorited = false,
  isSignedIn = false,
  showFavorite = true,
}: PropertyCardProps) {
  const cover = property.images[0];
  const forSale = property.listingType === "SALE";

  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <Link href={`/properties/${property.id}`} className="block">
        <div className="relative aspect-[4/3] bg-slate-100">
          {cover ? (
            <Image
              src={cover.url}
              alt={property.title}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-300">
              <svg
                className="h-14 w-14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75"
                />
              </svg>
            </div>
          )}
          <span
            className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${
              forSale
                ? "bg-amber-400 text-slate-900"
                : "bg-emerald-700 text-white"
            }`}
          >
            {LISTING_TYPE_LABELS[property.listingType]}
          </span>
          {property._count.images > 1 && (
            <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
              {property._count.images} photos
            </span>
          )}
        </div>

        <div className="p-4">
          <p className="text-lg font-bold text-emerald-800">
            {formatGHS(property.price)}
            <span className="text-sm font-normal text-slate-500">
              {pricePeriodSuffix(property.pricePeriod)}
            </span>
          </p>
          <h3 className="mt-1 line-clamp-2 font-semibold leading-snug text-slate-900 group-hover:text-emerald-800">
            {property.title}
          </h3>
          <p className="mt-1.5 flex items-center gap-1 text-sm text-slate-600">
            <svg
              className="h-4 w-4 flex-none text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
              />
            </svg>
            <span className="truncate">
              {property.area ? `${property.area}, ` : ""}
              {property.city} — {property.region}
            </span>
          </p>
          <p className="mt-2.5 border-t border-slate-100 pt-2.5 text-xs font-medium text-slate-500">
            {PROPERTY_TYPE_LABELS[property.type]}
            {property.bedrooms != null && <> · {property.bedrooms} bd</>}
            {property.bathrooms != null && <> · {property.bathrooms} ba</>}
          </p>
        </div>
      </Link>

      {showFavorite && (
        <div className="absolute right-3 top-3 z-10">
          <FavoriteButton
            propertyId={property.id}
            initialFavorited={isFavorited}
            isSignedIn={isSignedIn}
          />
        </div>
      )}
    </div>
  );
}
