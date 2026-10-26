import { v2 as cloudinary } from "cloudinary";

/**
 * Server-side Cloudinary helpers (Phase 4).
 *
 * NEVER import this from client components — it uses the API secret.
 * Config is read from the environment at call time, so the app still runs
 * (with photo uploads disabled) when Cloudinary isn't configured yet.
 *
 * Upload flow: the browser uploads directly to Cloudinary using a
 * short-lived signature from `createUploadSignature()`, then reports the
 * result back; we only trust it after `verifyUploadResult()` confirms
 * Cloudinary signed that exact result with our secret.
 */

export const CLOUDINARY_UPLOAD_FOLDER = "rentgh/properties";
export const CLOUDINARY_ALLOWED_FORMATS = "jpg,jpeg,png,webp";

interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

function getConfig(): CloudinaryConfig | null {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

export function isCloudinaryConfigured(): boolean {
  return getConfig() !== null;
}

export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  allowedFormats: string;
  signature: string;
}

/** Everything the browser needs for one direct (signed) upload. */
export function createUploadSignature(): UploadSignature | null {
  const config = getConfig();
  if (!config) return null;

  const timestamp = Math.round(Date.now() / 1000);
  // Only these parameters are signed — the browser must send exactly them
  // (plus file/api_key/signature) or Cloudinary rejects the upload.
  const signature = cloudinary.utils.api_sign_request(
    {
      allowed_formats: CLOUDINARY_ALLOWED_FORMATS,
      folder: CLOUDINARY_UPLOAD_FOLDER,
      timestamp,
    },
    config.apiSecret
  );

  return {
    cloudName: config.cloudName,
    apiKey: config.apiKey,
    timestamp,
    folder: CLOUDINARY_UPLOAD_FOLDER,
    allowedFormats: CLOUDINARY_ALLOWED_FORMATS,
    signature,
  };
}

/**
 * Verify an upload result really came from Cloudinary under our account:
 * Cloudinary signs `public_id` + `version` of every upload response.
 */
export function verifyUploadResult(input: {
  publicId: string;
  version: number;
  signature: string;
}): boolean {
  const config = getConfig();
  if (!config) return false;
  const expected = cloudinary.utils.api_sign_request(
    { public_id: input.publicId, version: input.version },
    config.apiSecret
  );
  return expected === input.signature;
}

/** URLs of images uploaded through this app must start with this prefix. */
export function expectedUrlPrefix(): string | null {
  const config = getConfig();
  return config ? `https://res.cloudinary.com/${config.cloudName}/` : null;
}

/**
 * Best-effort asset deletion. Never throws: the database stays the source
 * of truth for what the site displays, even if Cloudinary is unreachable.
 */
export async function deleteCloudinaryImage(
  publicId: string | null
): Promise<boolean> {
  const config = getConfig();
  if (!config || !publicId) return false;
  try {
    cloudinary.config({
      cloud_name: config.cloudName,
      api_key: config.apiKey,
      api_secret: config.apiSecret,
    });
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.warn(`[cloudinary] could not delete ${publicId}:`, error);
    return false;
  }
}
