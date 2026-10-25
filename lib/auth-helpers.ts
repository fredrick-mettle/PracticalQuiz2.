import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import type { Role } from "@/lib/generated/prisma/enums";

/** The signed-in user (from the JWT session), or null for guests. */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

/** Require any signed-in user; guests are sent to /login. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Require one of the given roles.
 * Guests go to /login; the wrong role goes home. Use in pages/layouts and
 * server actions as the server-side source of truth (middleware is only
 * the first line of defence).
 */
export async function requireRole(...roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/");
  return user;
}
