import { prisma } from "@/lib/prisma";
import { getOwnedProperty } from "@/lib/services/properties";
import { cloudinaryUploadResultSchema } from "@/lib/validations/image";
import {
  CLOUDINARY_UPLOAD_FOLDER,
  createUploadSignature as createCloudinaryUploadSignature,
  deleteCloudinaryImage,
  expectedUrlPrefix,
  isCloudinaryConfigured,
  verifyUploadResult,
  type UploadSignature,
} from "@/lib/cloudinary";
import { MAX_IMAGES_PER_PROPERTY } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";
import type { PropertyImage } from "@/lib/generated/prisma/client";

/**
 * Property photo service (Phase 4) — same ownership rule as listings:
 * every operation first resolves the property scoped by ownerId, and a
 * non-owned/nonexistent property yields "Property not found".
 * The first image (order 0) is the listing's cover photo.
 */

export type ImageResult =
  | { success: true; image: PropertyImage }
  | { success: false; message: string };

export type SignatureResult =
  | { success: true; signature: UploadSignature }
  | { success: false; message: string };

type SimpleResult = { success: true } | { success: false; message: string };

const NOT_FOUND = { success: false, message: "Property not found" } as const;
const NOT_CONFIGURED = {
  success: false,
  message: "Photo uploads are not configured on this server yet",
} as const;

/** Images of a property the agent owns, cover first ([] if not owner). */
export async function listPropertyImages(
  ownerId: string,
  propertyId: string
): Promise<PropertyImage[]> {
  const property = await getOwnedProperty(ownerId, propertyId);
  if (!property) return [];
  return prisma.propertyImage.findMany({
    where: { propertyId: property.id },
    orderBy: { order: "asc" },
  });
}

/** Signed-upload credentials, gated by config + ownership + photo limit. */
export async function createPropertyUploadSignature(
  ownerId: string,
  propertyId: string
): Promise<SignatureResult> {
  if (!isCloudinaryConfigured()) return NOT_CONFIGURED;

  const property = await getOwnedProperty(ownerId, propertyId);
  if (!property) return NOT_FOUND;

  // Signatures let the holder upload to our Cloudinary account — cap how
  // many one agent can mint (Phase 11).
  if (!rateLimit(`upload-signature:${ownerId}`, 100, 60 * 60 * 1000).ok) {
    return {
      success: false,
      message: "Too many upload requests. Please wait a while and try again.",
    };
  }

  const count = await prisma.propertyImage.count({
    where: { propertyId: property.id },
  });
  if (count >= MAX_IMAGES_PER_PROPERTY) {
    return {
      success: false,
      message: `A listing can have at most ${MAX_IMAGES_PER_PROPERTY} photos`,
    };
  }

  const signature = createCloudinaryUploadSignature();
  if (!signature) return NOT_CONFIGURED;
  return { success: true, signature };
}

/** Save an image after the browser uploaded it directly to Cloudinary. */
export async function addPropertyImage(
  ownerId: string,
  propertyId: string,
  input: unknown
): Promise<ImageResult> {
  const parsed = cloudinaryUploadResultSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid upload result",
    };
  }
  if (!isCloudinaryConfigured()) return NOT_CONFIGURED;

  const property = await getOwnedProperty(ownerId, propertyId);
  if (!property) return NOT_FOUND;

  // Only trust the result if Cloudinary's own response signature checks out
  // and the asset lives on our cloud under our upload folder.
  const { publicId, url, version, signature } = parsed.data;
  const prefix = expectedUrlPrefix();
  if (
    !verifyUploadResult({ publicId, version, signature }) ||
    !prefix ||
    !url.startsWith(prefix) ||
    !publicId.startsWith(`${CLOUDINARY_UPLOAD_FOLDER}/`)
  ) {
    return {
      success: false,
      message: "Could not verify that upload — please try again",
    };
  }

  const existing = await prisma.propertyImage.findMany({
    where: { propertyId: property.id },
    select: { order: true },
  });
  if (existing.length >= MAX_IMAGES_PER_PROPERTY) {
    // Genuine upload but no room left — don't leave an orphaned asset.
    void deleteCloudinaryImage(publicId);
    return {
      success: false,
      message: `A listing can have at most ${MAX_IMAGES_PER_PROPERTY} photos`,
    };
  }

  const nextOrder =
    existing.reduce((max, img) => Math.max(max, img.order), -1) + 1;
  const image = await prisma.propertyImage.create({
    data: { propertyId: property.id, url, publicId, order: nextOrder },
  });
  return { success: true, image };
}

/** Delete one photo (DB row + best-effort Cloudinary cleanup). */
export async function deletePropertyImage(
  ownerId: string,
  propertyId: string,
  imageId: string
): Promise<SimpleResult> {
  const property = await getOwnedProperty(ownerId, propertyId);
  if (!property) return NOT_FOUND;

  const image = await prisma.propertyImage.findFirst({
    where: { id: imageId, propertyId: property.id },
  });
  if (!image) return { success: false, message: "Photo not found" };

  await prisma.propertyImage.delete({ where: { id: image.id } });
  await resequenceImages(property.id);
  // Seeded placeholder rows have no publicId — deletion is skipped for them.
  void deleteCloudinaryImage(image.publicId);
  return { success: true };
}

/**
 * Persist a new photo order (first id becomes the cover).
 * `orderedIds` must be exactly the property's image ids — nothing more,
 * nothing less — so one agent can never affect another's photos.
 */
export async function reorderPropertyImages(
  ownerId: string,
  propertyId: string,
  orderedIds: unknown
): Promise<SimpleResult> {
  const property = await getOwnedProperty(ownerId, propertyId);
  if (!property) return NOT_FOUND;

  if (
    !Array.isArray(orderedIds) ||
    orderedIds.some((id) => typeof id !== "string")
  ) {
    return { success: false, message: "Invalid photo order" };
  }

  const images = await prisma.propertyImage.findMany({
    where: { propertyId: property.id },
    select: { id: true },
  });
  const existingIds = new Set(images.map((img) => img.id));
  const ids = orderedIds as string[];
  if (
    ids.length !== existingIds.size ||
    new Set(ids).size !== ids.length ||
    ids.some((id) => !existingIds.has(id))
  ) {
    return { success: false, message: "Invalid photo order" };
  }

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.propertyImage.update({ where: { id }, data: { order: index } })
    )
  );
  return { success: true };
}

/** Keep `order` contiguous (0…n−1) after deletions. */
async function resequenceImages(propertyId: string): Promise<void> {
  const images = await prisma.propertyImage.findMany({
    where: { propertyId },
    orderBy: { order: "asc" },
    select: { id: true, order: true },
  });
  const updates = images
    .map((img, index) => ({ img, index }))
    .filter(({ img, index }) => img.order !== index)
    .map(({ img, index }) =>
      prisma.propertyImage.update({
        where: { id: img.id },
        data: { order: index },
      })
    );
  if (updates.length > 0) await prisma.$transaction(updates);
}
