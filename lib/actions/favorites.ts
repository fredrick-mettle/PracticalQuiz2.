"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-helpers";
import { toggleFavorite } from "@/lib/services/favorites";

/**
 * Favorite toggle (Phase 9). The button updates optimistically on the
 * client; only /favorites needs revalidation so it's correct on visit.
 */
export async function toggleFavoriteAction(propertyId: string) {
  const user = await requireUser();
  const result = await toggleFavorite(user.id, propertyId);
  if (result.success) revalidatePath("/favorites");
  return result;
}
