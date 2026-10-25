import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { PropertySearchQuery } from "@/lib/validations/search";

/**
 * Public property queries (Phase 5).
 *
 * PUBLIC VISIBILITY RULE: only APPROVED listings are ever returned here.
 * PENDING/REJECTED/RENTED_OR_SOLD listings are invisible to the public.
 */

export const PROPERTIES_PAGE_SIZE = 12;

/** Cover image + photo count — everything a listing card needs. */
const cardInclude = {
  images: { orderBy: { order: "asc" }, take: 1, select: { url: true } },
  _count: { select: { images: true } },
} satisfies Prisma.PropertyInclude;

function buildWhere(query: PropertySearchQuery): Prisma.PropertyWhereInput {
  const insensitive = (value: string) => ({
    contains: value,
    mode: "insensitive" as const,
  });

  return {
    status: "APPROVED",
    ...(query.q
      ? {
          OR: [
            { title: insensitive(query.q) },
            { city: insensitive(query.q) },
            { area: insensitive(query.q) },
          ],
        }
      : {}),
    ...(query.region ? { region: query.region } : {}),
    ...(query.city ? { city: insensitive(query.city) } : {}),
    ...(query.type ? { type: query.type } : {}),
    ...(query.listingType ? { listingType: query.listingType } : {}),
    ...(query.minPrice || query.maxPrice
      ? {
          price: {
            ...(query.minPrice ? { gte: query.minPrice } : {}),
            ...(query.maxPrice ? { lte: query.maxPrice } : {}),
          },
        }
      : {}),
    // Listings with unknown bedroom counts (e.g. land) never match this.
    ...(query.minBedrooms ? { bedrooms: { gte: query.minBedrooms } } : {}),
  };
}

/** Filtered, sorted, paginated public search over APPROVED listings. */
export async function searchProperties(query: PropertySearchQuery) {
  const where = buildWhere(query);
  const orderBy: Prisma.PropertyOrderByWithRelationInput[] =
    query.sort === "price-asc"
      ? [{ price: "asc" }, { createdAt: "desc" }]
      : query.sort === "price-desc"
        ? [{ price: "desc" }, { createdAt: "desc" }]
        : [{ createdAt: "desc" }];

  const [total, properties] = await Promise.all([
    prisma.property.count({ where }),
    prisma.property.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * PROPERTIES_PAGE_SIZE,
      take: PROPERTIES_PAGE_SIZE,
      include: cardInclude,
    }),
  ]);

  return {
    properties,
    total,
    totalPages: Math.max(1, Math.ceil(total / PROPERTIES_PAGE_SIZE)),
  };
}

export type PublicPropertyCardData = Awaited<
  ReturnType<typeof searchProperties>
>["properties"][number];

/** Home-page featured listings: most photos first, then newest. */
export async function getFeaturedProperties(limit = 8) {
  return prisma.property.findMany({
    where: { status: "APPROVED" },
    orderBy: [{ images: { _count: "desc" } }, { createdAt: "desc" }],
    take: limit,
    include: cardInclude,
  });
}

/** Approved-listing counts per region, busiest first (home page). */
export async function getRegionCounts() {
  const grouped = await prisma.property.groupBy({
    by: ["region"],
    where: { status: "APPROVED" },
    _count: true,
  });
  return grouped
    .map((g) => ({ region: g.region, count: g._count }))
    .sort((a, b) => b.count - a.count);
}

/** Headline numbers for the home page. */
export async function getHomeStats() {
  const [total, forRent, forSale] = await Promise.all([
    prisma.property.count({ where: { status: "APPROVED" } }),
    prisma.property.count({
      where: { status: "APPROVED", listingType: "RENT" },
    }),
    prisma.property.count({
      where: { status: "APPROVED", listingType: "SALE" },
    }),
  ]);
  return { total, forRent, forSale };
}
