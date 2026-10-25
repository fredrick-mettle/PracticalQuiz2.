import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { listModerationQueue } from "@/lib/services/admin";
import {
  LISTING_TYPE_LABELS,
  PROPERTY_TYPE_LABELS,
} from "@/lib/constants";
import { formatGHS, pricePeriodSuffix } from "@/lib/utils";
import { ModerationActions } from "@/components/admin/moderation-actions";

export const metadata: Metadata = { title: "Moderation Queue" };

interface PageProps {
  searchParams: { page?: string };
}

function waitingLabel(createdAt: Date): string {
  const days = Math.floor(
    (Date.now() - createdAt.getTime()) / (24 * 60 * 60 * 1000)
  );
  if (days <= 0) return "today";
  if (days === 1) return "1 day";
  return `${days} days`;
}

export default async function ModerationQueuePage({ searchParams }: PageProps) {
  const page = Math.max(1, Number.parseInt(searchParams.page ?? "1", 10) || 1);
  const { properties, total, totalPages } = await listModerationQueue(page);

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900">Moderation queue</h2>
      <p className="mt-1 text-sm text-slate-600">
        {total} {total === 1 ? "listing" : "listings"} awaiting review —
        oldest first. Approving makes a listing public immediately;
        rejecting asks you for a reason the agent will see.
      </p>

      {properties.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
          <p className="text-lg font-semibold text-slate-800">
            🎉 All caught up
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-600">
            Nothing is waiting for moderation right now.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {properties.map((property) => {
            const cover = property.images[0];
            return (
              <li
                key={property.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="relative h-32 w-full flex-none overflow-hidden rounded-lg bg-slate-100 sm:h-28 sm:w-40">
                    {cover ? (
                      <Image
                        src={cover.url}
                        alt=""
                        fill
                        sizes="160px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs font-medium text-slate-400">
                        No photos
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/properties/${property.id}`}
                      className="font-semibold text-slate-900 hover:text-emerald-800 hover:underline"
                    >
                      {property.title}
                    </Link>
                    <p className="mt-0.5 text-sm text-slate-600">
                      {formatGHS(property.price)}
                      {pricePeriodSuffix(property.pricePeriod)} ·{" "}
                      {PROPERTY_TYPE_LABELS[property.type]} ·{" "}
                      {LISTING_TYPE_LABELS[property.listingType]}
                    </p>
                    <p className="text-sm text-slate-600">
                      {property.area ? `${property.area}, ` : ""}
                      {property.city} — {property.region}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      By {property.owner.name} ({property.owner.email}) ·
                      waiting {waitingLabel(property.createdAt)} ·{" "}
                      {property._count.images}{" "}
                      {property._count.images === 1 ? "photo" : "photos"}
                      {property._count.images === 0 && (
                        <span className="font-semibold text-amber-700">
                          {" "}
                          — consider asking for photos
                        </span>
                      )}
                    </p>
                    <div className="mt-3">
                      <ModerationActions
                        propertyId={property.id}
                        status={property.status}
                      />
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/moderation?page=${page - 1}`}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/moderation?page=${page + 1}`}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
