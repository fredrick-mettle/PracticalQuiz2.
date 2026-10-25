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

/** Shared with the favorites service so saved cards render identically. */
export const propertyCardInclude = cardInclude;

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

/**
 * Full detail for one public property (detail page, Phase 6).
 * APPROVED only — anything else returns null and the page 404s, exactly
 * like the agent-side ownership rule: don't leak that a listing exists.
 */
export async function getPublicProperty(id: string) {
  return prisma.property.findFirst({
    where: { id, status: "APPROVED" },
    include: {
      images: { orderBy: { order: "asc" } },
      owner: {
        select: {
          id: true,
          name: true,
          phone: true,
          role: true,
          createdAt: true,
        },
      },
    },
  });
}

export type PublicPropertyDetail = NonNullable<
  Awaited<ReturnType<typeof getPublicProperty>>
>;

/**
 * Similar listings for the detail page: fill from same city + same
 * rent/sale first, then same region, then same type. APPROVED only and
 * never includes the property itself.
 */
export async function getSimilarProperties(
  property: Pick<
    PublicPropertyDetail,
    "id" | "city" | "region" | "type" | "listingType"
  >,
  limit = 4
): Promise<PublicPropertyCardData[]> {
  const collected: PublicPropertyCardData[] = [];
  const seen = new Set<string>([property.id]);

  const tiers: Prisma.PropertyWhereInput[] = [
    { city: property.city, listingType: property.listingType },
    { region: property.region },
    { type: property.type },
  ];

  for (const tier of tiers) {
    if (collected.length >= limit) break;
    const rows = await prisma.property.findMany({
      where: { status: "APPROVED", id: { notIn: Array.from(seen) }, ...tier },
      orderBy: { createdAt: "desc" },
      take: limit - collected.length,
      include: cardInclude,
    });
    for (const row of rows) {
      seen.add(row.id);
      collected.push(row);
    }
  }
  return collected;
}

/**
 * Lightweight pins for the /properties map view (Phase 7): every APPROVED
 * listing matching the filters that has coordinates (capped at 100),
 * plus the full match count so the UI can say how many aren't mappable.
 */
export async function getMapPins(query: PropertySearchQuery) {
  const where = buildWhere(query);
  const [total, rows] = await Promise.all([
    prisma.property.count({ where }),
    prisma.property.findMany({
      where: { ...where, latitude: { not: null }, longitude: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        title: true,
        price: true,
        pricePeriod: true,
        area: true,
        city: true,
        latitude: true,
        longitude: true,
        images: { orderBy: { order: "asc" }, take: 1, select: { url: true } },
      },
    }),
  ]);

  // Narrow number|null → number for the map component.
  const pins = rows.flatMap((row) =>
    row.latitude != null && row.longitude != null
      ? [{ ...row, latitude: row.latitude, longitude: row.longitude }]
      : []
  );
  return { pins, total, mapped: pins.length };
}

export type PropertyMapPin = Awaited<
  ReturnType<typeof getMapPins>
>["pins"][number];
