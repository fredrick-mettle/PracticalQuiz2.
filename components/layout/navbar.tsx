import Link from "next/link";
import { getCurrentUser } from "@/lib/auth-helpers";
import { MobileMenu } from "./mobile-menu";
import { UserMenu } from "./user-menu";
import type { NavUser } from "./nav-types";

/**
 * Top navigation. Server Component: reads the session on the server and
 * renders role-appropriate links; small client components handle the
 * interactive menus.
 */
export async function Navbar() {
  const sessionUser = await getCurrentUser();
  const user: NavUser | null = sessionUser
    ? {
        name: sessionUser.name ?? "Account",
        email: sessionUser.email ?? "",
        role: sessionUser.role,
      }
    : null;

  const roleLink =
    user?.role === "ADMIN"
      ? { href: "/admin", label: "Admin Panel" }
      : user?.role === "AGENT"
        ? { href: "/dashboard", label: "My Dashboard" }
        : user?.role === "TENANT"
          ? { href: "/inquiries", label: "My Inquiries" }
          : null;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="RentGH home">
          {/* Ghana flag colors mark */}
          <span
            className="flex h-8 w-8 flex-none flex-col overflow-hidden rounded-lg shadow-sm"
            aria-hidden="true"
          >
            <span className="flex-1 bg-[#CE1126]" />
            <span className="flex-1 bg-[#FCD116]" />
            <span className="flex-1 bg-[#006B3F]" />
          </span>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Rent<span className="text-emerald-700">GH</span>
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/properties"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          >
            Browse Properties
          </Link>
          {user && (
            <Link
              href="/favorites"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900"
            >
              Saved
            </Link>
          )}
          {roleLink && (
            <Link
              href={roleLink.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900"
            >
              {roleLink.label}
            </Link>
          )}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <UserMenu user={user} roleLink={roleLink} />
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-emerald-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile navigation */}
        <MobileMenu user={user} roleLink={roleLink} />
      </div>
    </header>
  );
}
