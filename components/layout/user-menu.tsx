"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { roleLabel } from "@/lib/utils";
import type { NavLink, NavUser } from "./nav-types";

interface Props {
  user: NavUser;
  roleLink: NavLink | null;
}

/** Avatar dropdown for signed-in users (desktop navbar). */
export function UserMenu({ user, roleLink }: Props) {
  const [open, setOpen] = useState(false);
  const initial = user.name.charAt(0).toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-2.5 transition hover:bg-slate-50"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700 text-sm font-semibold text-white">
          {initial}
        </span>
        <span className="max-w-[10rem] truncate text-sm font-medium text-slate-800">
          {user.name}
        </span>
        <svg
          className={`h-4 w-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <>
          {/* Click-away backdrop */}
          <button
            type="button"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
            aria-hidden="true"
            tabIndex={-1}
          />
          <div
            className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
            role="menu"
          >
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="truncate text-sm font-semibold text-slate-900">
                {user.name}
              </p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
              <span className="mt-1.5 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800 ring-1 ring-inset ring-emerald-200">
                {roleLabel(user.role)}
              </span>
            </div>
            <div className="py-1.5">
              {roleLink && (
                <Link
                  href={roleLink.href}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  role="menuitem"
                >
                  {roleLink.label}
                </Link>
              )}
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                role="menuitem"
              >
                My Profile
              </Link>
            </div>
            <div className="border-t border-slate-100 py-1.5">
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="block w-full px-4 py-2 text-left text-sm font-medium text-red-700 hover:bg-red-50"
                role="menuitem"
              >
                Log out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
