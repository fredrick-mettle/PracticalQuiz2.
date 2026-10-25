import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Role-based route protection (Edge runtime).
 *
 * Reads the role from the JWT only — no database access here (the pg driver
 * cannot run on Edge). This is the first line of defence; pages and server
 * actions re-check roles server-side via lib/auth-helpers.
 *
 * Later phases extend the prefix lists (e.g. /saved, /my-inquiries).
 */
const AGENT_PREFIXES = ["/dashboard"];
const ADMIN_PREFIXES = ["/admin"];
const AUTH_PREFIXES = ["/profile", "/inquiries", "/favorites"];

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const needsAgent = matchesPrefix(pathname, AGENT_PREFIXES);
  const needsAdmin = matchesPrefix(pathname, ADMIN_PREFIXES);
  const needsAuth =
    needsAgent || needsAdmin || matchesPrefix(pathname, AUTH_PREFIXES);

  if (!needsAuth) return NextResponse.next();

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (needsAgent && token.role !== "AGENT") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (needsAdmin && token.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/profile/:path*",
    "/inquiries/:path*",
    "/favorites/:path*",
  ],
};
