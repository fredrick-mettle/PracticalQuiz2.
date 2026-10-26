import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { listFavorites } from "@/lib/services/favorites";
import { PROPERTY_STATUS_LABELS } from "@/lib/constants";
import { formatGHS, pricePeriodSuffix } from "@/lib/utils";
import { PropertyCard } from "@/components/properties/property-card";
import { FavoriteButton } from "@/components/properties/favorite-button";

export const metadata: Metadata = { title: "Saved Properties" };

function formatWhen(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function FavoritesPage() {
  const user = await requireUser();
  const favorites = await listFavorites(user.id);

  const available = favorites.filter((f) => f.property.status === "APPROVED");
  const unavailable = favorites.filter(
    (f) => f.property.status !== "APPROVED"
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
        Saved Properties
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        {favorites.length}{" "}
        {favorites.length === 1 ? "property" : "properties"} you&apos;re
        keeping an eye on
      </p>

      {favorites.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
          <svg
            className="mx-auto h-12 w-12 text-slate-300"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
          <p className="mt-3 text-lg font-semibold text-slate-800">
            No saved properties yet
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-600">
            Tap the heart on any property to save it here for later.
          </p>
          <Link
            href="/properties"
            className="mt-5 inline-block rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Browse properties
          </Link>
        </div>
      ) : (
        <>
          {available.length > 0 && (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {available.map((favorite) => (
                <PropertyCard
                  key={favorite.propertyId}
                  property={favorite.property}
                  isFavorited
                  isSignedIn
                />
              ))}
            </div>
          )}

          {unavailable.length > 0 && (
            <section className="mt-10">
              <h2 className="text-lg font-bold text-slate-900">
                No longer available
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                These have been rented, sold or removed since you saved
                them.
              </p>
              <ul className="mt-4 space-y-3">
                {unavailable.map((favorite) => {
                  const cover = favorite.property.images[0];
                  return (
                    <li
                      key={favorite.propertyId}
                      className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="relative h-16 w-20 flex-none overflow-hidden rounded-lg bg-slate-200">
                        {cover && (
                          <Image
                            src={cover.url}
                            alt=""
                            fill
                            sizes="80px"
                            className="object-cover opacity-60 grayscale"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-700">
                          {favorite.property.title}
                        </p>
                        <p className="text-sm text-slate-500">
                          {formatGHS(favorite.property.price)}
                          {pricePeriodSuffix(favorite.property.pricePeriod)}{" "}
                          · {favorite.property.city},{" "}
                          {favorite.property.region} · Saved{" "}
                          {formatWhen(favorite.createdAt)}
                        </p>
                        <span className="mt-1 inline-flex rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                          {PROPERTY_STATUS_LABELS[favorite.property.status] ??
                            "Unavailable"}
                        </span>
                      </div>
                      <FavoriteButton
                        propertyId={favorite.propertyId}
                        initialFavorited
                        isSignedIn
                      />
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
