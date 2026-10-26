"use client";

import Image from "next/image";
import { useState } from "react";

interface PropertyGalleryProps {
  images: { id: string; url: string }[];
  title: string;
  listingLabel: string;
  forSale: boolean;
}

const arrowClass =
  "absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow transition hover:bg-white";

/** Detail-page photo gallery: main photo, arrows, counter, thumbnails. */
export function PropertyGallery({
  images,
  title,
  listingLabel,
  forSale,
}: PropertyGalleryProps) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[16/10] flex-col items-center justify-center gap-2 rounded-2xl bg-slate-100 text-slate-400">
        <svg
          className="h-16 w-16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75"
          />
        </svg>
        <p className="text-sm font-medium">No photos available</p>
      </div>
    );
  }

  const current = images[Math.min(index, images.length - 1)];
  const step = (direction: 1 | -1) =>
    setIndex((i) => (i + direction + images.length) % images.length);

  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100">
        <Image
          key={current.id}
          src={current.url}
          alt={`${title} — photo ${index + 1} of ${images.length}`}
          fill
          priority
          sizes="(min-width: 1024px) 66vw, 100vw"
          className="object-cover"
        />
        <span
          className={`absolute left-4 top-4 rounded-full px-3 py-1 text-sm font-semibold shadow-sm ${
            forSale ? "bg-amber-400 text-slate-900" : "bg-emerald-700 text-white"
          }`}
        >
          {listingLabel}
        </span>

        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() => step(-1)}
              className={`${arrowClass} left-3`}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={() => step(1)}
              className={`${arrowClass} right-3`}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
              {index + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((image, i) => (
            <button
              key={image.id}
              type="button"
              aria-label={`View photo ${i + 1}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={`relative h-20 w-28 flex-none overflow-hidden rounded-lg ${
                i === index
                  ? "ring-2 ring-emerald-600 ring-offset-1"
                  : "opacity-75 hover:opacity-100"
              }`}
            >
              <Image
                src={image.url}
                alt=""
                fill
                sizes="112px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
