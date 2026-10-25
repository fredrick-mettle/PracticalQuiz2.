"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { roleLabel } from "@/lib/utils";
import type { NavLink, NavUser } from "./nav-types";

interface Props {
  user: NavUser | null;
  roleLink: NavLink | null;
}

/** Hamburger menu for small screens. */
export function MobileMenu({ user, roleLink }: Props) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
      >
        {open ? (
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-16 border-b border-slate-200 bg-white px-4 pb-4 pt-2 shadow-lg">
          {user ? (
            <div className="space-y-1">
              <div className="px-2 pb-2 pt-1">
                <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                <p className="text-xs text-slate-500">
                  {user.email} · {roleLabel(user.role)}
                </p>
              </div>
              {roleLink && (
                <Link
                  href={roleLink.href}
                  onClick={close}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  {roleLink.label}
                </Link>
              )}
              <Link
                href="/profile"
                onClick={close}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                My Profile
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <Link
                href="/login"
                onClick={close}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Log in
              </Link>
              <Link
                href="/register"
                onClick={close}
                className="block rounded-lg bg-emerald-700 px-3 py-2.5 text-center text-sm font-semibold text-white hover:bg-emerald-800"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
