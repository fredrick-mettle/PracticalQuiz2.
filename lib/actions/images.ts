"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-helpers";
import {
  addPropertyImage,
  createPropertyUploadSignature,
  deletePropertyImage,
  reorderPropertyImages,
} from "@/lib/services/images";
import type { CloudinaryUploadResult } from "@/lib/validations/image";

/**
 * Photo actions for agents (Phase 4). Same layering as property actions:
 * AGENT role check here, ownership + verification in the service layer.
 */

function revalidateListing(propertyId: string) {
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/properties/${propertyId}/edit`);
}

/** Signature for one direct browser → Cloudinary upload. */
export async function getUploadSignatureAction(propertyId: string) {
  const user = await requireRole("AGENT");
  return createPropertyUploadSignature(user.id, propertyId);
}

/** Record an image the browser just uploaded to Cloudinary. */
export async function registerUploadedImageAction(
  propertyId: string,
  input: CloudinaryUploadResult
) {
  const user = await requireRole("AGENT");
  const result = await addPropertyImage(user.id, propertyId, input);
  if (!result.success) {
    return { success: false as const, message: result.message };
  }
  revalidateListing(propertyId);
  return {
    success: true as const,
    image: {
      id: result.image.id,
      url: result.image.url,
      publicId: result.image.publicId,
    },
  };
}

export async function deleteImageAction(propertyId: string, imageId: string) {
  const user = await requireRole("AGENT");
  const result = await deletePropertyImage(user.id, propertyId, imageId);
  if (result.success) revalidateListing(propertyId);
  return result;
}

export async function reorderImagesAction(
  propertyId: string,
  orderedIds: string[]
) {
  const user = await requireRole("AGENT");
  const result = await reorderPropertyImages(user.id, propertyId, orderedIds);
  if (result.success) revalidateListing(propertyId);
  return result;
}
