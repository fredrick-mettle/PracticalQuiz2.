"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toggleFavoriteAction } from "@/lib/actions/favorites";

interface FavoriteButtonProps {
  propertyId: string;
  initialFavorited: boolean;
  isSignedIn: boolean;
  /** "icon" = circular heart on cards; "full" = labeled button (detail page). */
  variant?: "icon" | "full";
}

/**
 * Heart/save toggle (Phase 9). Optimistic; guests are sent to login
 * (and returned here afterwards). On /favorites, unsaving also
 * refreshes the list so the card disappears.
 */
export function FavoriteButton({
  propertyId,
  initialFavorited,
  isSignedIn,
  variant = "icon",
}: FavoriteButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [, startTransition] = useTransition();

  function handleClick() {
    if (!isSignedIn) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    const next = !favorited;
    setFavorited(next);
    startTransition(async () => {
      const result = await toggleFavoriteAction(propertyId);
      if (!result.success) {
        setFavorited(!next);
        return;
      }
      setFavorited(result.favorited);
      if (!result.favorited && pathname === "/favorites") {
        router.refresh();
      }
    });
  }

  const heart = (
    <svg
      viewBox="0 0 24 24"
      className={variant === "icon" ? "h-5 w-5" : "h-[18px] w-[18px]"}
      fill={favorited ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
      />
    </svg>
  );

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={favorited}
        className={`flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
          favorited
            ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
            : "border-slate-300 bg-white text-slate-700 hover:border-red-300 hover:text-red-700"
        }`}
      >
        <span className={favorited ? "text-red-600" : "text-slate-500"}>
          {heart}
        </span>
        {favorited ? "Saved to favorites" : "Save this property"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={favorited}
      aria-label={favorited ? "Remove from favorites" : "Save to favorites"}
      title={favorited ? "Remove from favorites" : "Save to favorites"}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow transition hover:scale-105 ${
        favorited ? "text-red-600" : "text-slate-600 hover:text-red-600"
      }`}
    >
      {heart}
    </button>
  );
}
