import { prisma } from "@/lib/prisma";
import { propertyCardInclude } from "@/lib/services/public-properties";

/**
 * Saved/favorite properties (Phase 9).
 *
 * Only APPROVED listings can be saved (the public visibility rule), and
 * never your own. Saved rows cascade away if the property is deleted;
 * if it merely leaves APPROVED (e.g. marked rented), the row stays and
 * the /favorites page shows it as no longer available.
 */

export type ToggleFavoriteResult =
  | { success: true; favorited: boolean }
  | { success: false; message: string };

export async function toggleFavorite(
  userId: string,
  propertyId: string
): Promise<ToggleFavoriteResult> {
  const key = { userId_propertyId: { userId, propertyId } };

  // Removing is always allowed — even if the listing has since been
  // rented/sold (it stays in the "no longer available" section until
  // the user unsaves it).
  const existing = await prisma.favorite.findUnique({ where: key });
  if (existing) {
    await prisma.favorite.delete({ where: key });
    return { success: true, favorited: false };
  }

  // Adding requires a publicly visible listing that isn't your own.
  const property = await prisma.property.findFirst({
    where: { id: propertyId, status: "APPROVED" },
    select: { id: true, ownerId: true },
  });
  if (!property) return { success: false, message: "Property not found" };
  if (property.ownerId === userId) {
    return { success: false, message: "You can't save your own listing" };
  }

  try {
    await prisma.favorite.create({ data: { userId, propertyId } });
  } catch (error) {
    // Double-click race: the row was created between check and insert.
    if ((error as { code?: string }).code === "P2002") {
      return { success: true, favorited: true };
    }
    throw error;
  }
  return { success: true, favorited: true };
}

/** Ids of everything the user has saved (for marking hearts on cards). */
export async function getFavoriteIds(userId: string): Promise<string[]> {
  const rows = await prisma.favorite.findMany({
    where: { userId },
    select: { propertyId: true },
  });
  return rows.map((row) => row.propertyId);
}

/** Saved properties, most recently saved first, card-ready. */
export async function listFavorites(userId: string) {
  return prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { property: { include: propertyCardInclude } },
  });
}

export type FavoriteListItem = Awaited<
  ReturnType<typeof listFavorites>
>[number];
