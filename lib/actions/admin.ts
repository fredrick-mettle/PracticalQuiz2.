"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-helpers";
import {
  deletePropertyAsAdmin,
  moderateProperty,
  setUserStatus,
} from "@/lib/services/admin";
import type { ModerationInput } from "@/lib/validations/admin";
import type { UserStatus } from "@/lib/generated/prisma/enums";

/** Admin mutations (Phase 10) — ADMIN role enforced on the server. */

function revalidateListingSurfaces(propertyId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/moderation");
  revalidatePath("/admin/properties");
  revalidatePath(`/admin/properties/${propertyId}`);
  revalidatePath("/");
  revalidatePath("/properties");
  revalidatePath(`/properties/${propertyId}`);
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/properties/${propertyId}/edit`);
  revalidatePath("/favorites");
}

export async function moderatePropertyAction(
  propertyId: string,
  input: ModerationInput
) {
  await requireRole("ADMIN");
  const result = await moderateProperty(propertyId, input);
  if (!result.success) return result;
  revalidateListingSurfaces(propertyId);
  return result;
}

export async function deletePropertyAsAdminAction(propertyId: string) {
  await requireRole("ADMIN");
  const result = await deletePropertyAsAdmin(propertyId);
  if (!result.success) return result;
  revalidateListingSurfaces(propertyId);
  return result;
}

export async function setUserStatusAction(
  userId: string,
  status: UserStatus
) {
  const admin = await requireRole("ADMIN");
  const result = await setUserStatus(admin.id, userId, status);
  if (result.success) {
    revalidatePath("/admin/users");
    revalidatePath("/admin");
  }
  return result;
}
