"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/moderation", label: "Moderation", exact: false },
  { href: "/admin/properties", label: "Listings", exact: false },
  { href: "/admin/users", label: "Users", exact: false },
];

/** Admin section tabs (Phase 10), with a pending-moderation badge. */
export function AdminNav({ pendingCount }: { pendingCount: number }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="flex flex-wrap gap-2">
      {LINKS.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                : "rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            }
          >
            {link.label}
            {link.href === "/admin/moderation" && pendingCount > 0 && (
              <span className="ml-2 inline-flex rounded-full bg-amber-500 px-1.5 py-0.5 text-[11px] font-bold text-white">
                {pendingCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
