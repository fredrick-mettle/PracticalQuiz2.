"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  deleteImageAction,
  getUploadSignatureAction,
  registerUploadedImageAction,
  reorderImagesAction,
} from "@/lib/actions/images";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGES_PER_PROPERTY,
  MAX_IMAGE_SIZE_MB,
} from "@/lib/constants";

/** Shape shared with the server edit page (plain, serializable). */
export interface PropertyImageItem {
  id: string;
  url: string;
  publicId: string | null;
}

interface ImageManagerProps {
  propertyId: string;
  initialImages: PropertyImageItem[];
  uploadsConfigured: boolean;
}

interface PendingUpload {
  key: number;
  name: string;
  previewUrl: string;
  progress: number;
  error: string | null;
}

interface CloudinaryUploadResponse {
  public_id: string;
  version: number;
  signature: string;
  secure_url: string;
}

/**
 * Upload one file straight from the browser to Cloudinary using a
 * server-issued signature (XHR for progress events; fetch has none).
 * Must send exactly the signed parameters or Cloudinary rejects it.
 */
function uploadFileToCloudinary(
  file: File,
  sig: {
    cloudName: string;
    apiKey: string;
    timestamp: number;
    folder: string;
    allowedFormats: string;
    signature: string;
  },
  onProgress: (percent: number) => void
): Promise<CloudinaryUploadResponse> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    form.append("api_key", sig.apiKey);
    form.append("timestamp", String(sig.timestamp));
    form.append("folder", sig.folder);
    form.append("allowed_formats", sig.allowedFormats);
    form.append("signature", sig.signature);

    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`
    );
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) {
          resolve(data as CloudinaryUploadResponse);
        } else {
          reject(
            new Error(data?.error?.message ?? `Upload failed (${xhr.status})`)
          );
        }
      } catch {
        reject(new Error("Upload failed — unexpected response"));
      }
    };
    xhr.onerror = () =>
      reject(new Error("Network error — check your connection and retry"));
    xhr.send(form);
  });
}

const iconButtonClass =
  "inline-flex h-7 w-7 items-center justify-center rounded-md bg-black/55 text-white transition hover:bg-black/75 disabled:cursor-not-allowed disabled:opacity-35";

export function ImageManager({
  propertyId,
  initialImages,
  uploadsConfigured,
}: ImageManagerProps) {
  const router = useRouter();
  const [images, setImages] = useState<PropertyImageItem[]>(initialImages);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadKeyRef = useRef(0);

  const spaceLeft =
    MAX_IMAGES_PER_PROPERTY -
    images.length -
    pending.filter((p) => !p.error).length;
  const canUpload = uploadsConfigured && spaceLeft > 0;

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setNotice(null);

    const maxBytes = MAX_IMAGE_SIZE_MB * 1024 * 1024;
    const valid: File[] = [];
    const errors: string[] = [];
    for (const file of Array.from(fileList)) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        errors.push(`${file.name}: only JPG, PNG or WebP images are allowed`);
      } else if (file.size > maxBytes) {
        errors.push(`${file.name}: larger than ${MAX_IMAGE_SIZE_MB}MB`);
      } else {
        valid.push(file);
      }
    }
    if (valid.length > spaceLeft) {
      errors.push(
        `Only ${spaceLeft} more photo${spaceLeft === 1 ? "" : "s"} can be added (max ${MAX_IMAGES_PER_PROPERTY})`
      );
      valid.length = Math.max(0, spaceLeft);
    }
    if (errors.length > 0) setNotice(errors.join(". "));
    if (valid.length === 0) return;

    let anySuccess = false;
    for (const file of valid) {
      const key = ++uploadKeyRef.current;
      const previewUrl = URL.createObjectURL(file);
      setPending((prev) => [
        ...prev,
        { key, name: file.name, previewUrl, progress: 0, error: null },
      ]);
      try {
        const sigResult = await getUploadSignatureAction(propertyId);
        if (!sigResult.success) throw new Error(sigResult.message);

        const uploaded = await uploadFileToCloudinary(
          file,
          sigResult.signature,
          (percent) =>
            setPending((prev) =>
              prev.map((p) => (p.key === key ? { ...p, progress: percent } : p))
            )
        );

        const registered = await registerUploadedImageAction(propertyId, {
          publicId: uploaded.public_id,
          url: uploaded.secure_url,
          version: uploaded.version,
          signature: uploaded.signature,
        });
        if (!registered.success) throw new Error(registered.message);

        anySuccess = true;
        setImages((prev) => [...prev, registered.image]);
        setPending((prev) => prev.filter((p) => p.key !== key));
        URL.revokeObjectURL(previewUrl);
      } catch (error) {
        setPending((prev) =>
          prev.map((p) =>
            p.key === key
              ? {
                  ...p,
                  error:
                    error instanceof Error ? error.message : "Upload failed",
                }
              : p
          )
        );
      }
    }
    if (anySuccess) router.refresh();
  }

  function applyOrder(next: PropertyImageItem[]) {
    const previous = images;
    setImages(next);
    setNotice(null);
    startTransition(async () => {
      const result = await reorderImagesAction(
        propertyId,
        next.map((img) => img.id)
      );
      if (!result.success) {
        setImages(previous);
        setNotice(result.message);
      } else {
        router.refresh();
      }
    });
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    applyOrder(next);
  }

  function makeCover(index: number) {
    if (index === 0) return;
    const next = [...images];
    const [moved] = next.splice(index, 1);
    next.unshift(moved);
    applyOrder(next);
  }

  function remove(image: PropertyImageItem) {
    if (!window.confirm("Remove this photo from the listing?")) return;
    const previous = images;
    setImages(images.filter((img) => img.id !== image.id));
    setNotice(null);
    startTransition(async () => {
      const result = await deleteImageAction(propertyId, image.id);
      if (!result.success) {
        setImages(previous);
        setNotice(result.message);
      } else {
        router.refresh();
      }
    });
  }

  function dismissPending(upload: PendingUpload) {
    URL.revokeObjectURL(upload.previewUrl);
    setPending((prev) => prev.filter((p) => p.key !== upload.key));
  }

  return (
    <div>
      {!uploadsConfigured && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          <p className="font-semibold">Photo uploads aren&apos;t configured yet.</p>
          <p>
            Add <code>CLOUDINARY_CLOUD_NAME</code>,{" "}
            <code>CLOUDINARY_API_KEY</code> and{" "}
            <code>CLOUDINARY_API_SECRET</code> to <code>.env</code> and restart
            the server (see README → “Image uploads”). You can still reorder or
            remove existing photos below.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {images.length} of {MAX_IMAGES_PER_PROPERTY} photos · JPG, PNG or
          WebP, up to {MAX_IMAGE_SIZE_MB}MB each
        </p>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            multiple
            className="hidden"
            onChange={(event) => {
              void handleFiles(event.target.files);
              event.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={!canUpload}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            + Add photos
          </button>
        </div>
      </div>

      {notice && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {notice}
        </div>
      )}

      {images.length === 0 && pending.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
          <p className="font-medium text-slate-800">No photos yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-600">
            Listings with good photos get far more inquiries. Add at least one
            clear photo of the front, living area and bedrooms.
          </p>
        </div>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image, index) => (
            <li
              key={image.id}
              className="relative aspect-[4/3] overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
            >
              <Image
                src={image.url}
                alt={`Listing photo ${index + 1}`}
                fill
                sizes="(min-width: 640px) 33vw, 50vw"
                className="object-cover"
              />
              {index === 0 && (
                <span className="absolute left-2 top-2 rounded-full bg-emerald-700 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                  Cover
                </span>
              )}
              <button
                type="button"
                aria-label="Remove photo"
                title="Remove photo"
                disabled={isPending}
                onClick={() => remove(image)}
                className={`${iconButtonClass} absolute right-2 top-2 hover:bg-red-600`}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/45 to-transparent p-2">
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    aria-label="Move photo earlier"
                    title="Move earlier"
                    disabled={isPending || index === 0}
                    onClick={() => move(index, -1)}
                    className={iconButtonClass}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    aria-label="Move photo later"
                    title="Move later"
                    disabled={isPending || index === images.length - 1}
                    onClick={() => move(index, 1)}
                    className={iconButtonClass}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </div>
                {index > 0 && (
                  <button
                    type="button"
                    aria-label="Make cover photo"
                    title="Make cover photo"
                    disabled={isPending}
                    onClick={() => makeCover(index)}
                    className={iconButtonClass}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.563.563 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.563.563 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                    </svg>
                  </button>
                )}
              </div>
            </li>
          ))}

          {pending.map((upload) => (
            <li
              key={upload.key}
              className="relative aspect-[4/3] overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
            >
              {/* Local object-URL preview — next/image can't optimize blob: URLs. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={upload.previewUrl}
                alt={upload.name}
                className="h-full w-full object-cover"
              />
              {upload.error ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-red-900/70 px-3 text-center">
                  <p className="text-xs font-medium leading-5 text-white">
                    {upload.error}
                  </p>
                  <button
                    type="button"
                    onClick={() => dismissPending(upload)}
                    className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-red-800"
                  >
                    Dismiss
                  </button>
                </div>
              ) : (
                <div className="absolute inset-x-0 bottom-0 bg-black/55 px-3 py-2">
                  <p className="mb-1.5 text-xs font-medium text-white">
                    Uploading… {upload.progress}%
                  </p>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/30">
                    <div
                      className="h-full bg-emerald-400 transition-all"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
