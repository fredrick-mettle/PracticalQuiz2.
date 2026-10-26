import { z } from "zod";

/**
 * What the browser sends us after a successful direct upload to Cloudinary.
 * Shape-checked here; authenticity (Cloudinary's response signature, our
 * cloud name, our upload folder) is verified in the service layer.
 */
export const cloudinaryUploadResultSchema = z.object({
  publicId: z.string().min(1, "Missing image id").max(255),
  url: z
    .string()
    .min(1)
    .max(1024)
    .refine((value) => {
      try {
        const parsed = new URL(value);
        return (
          parsed.protocol === "https:" &&
          parsed.hostname === "res.cloudinary.com"
        );
      } catch {
        return false;
      }
    }, "Image URL must be an https Cloudinary URL"),
  version: z.number().int().positive("Invalid upload version"),
  // Cloudinary response signatures are SHA-1 hex digests.
  signature: z
    .string()
    .regex(/^[a-f0-9]{40}$/i, "Invalid upload signature"),
});

export type CloudinaryUploadResult = z.infer<
  typeof cloudinaryUploadResultSchema
>;
