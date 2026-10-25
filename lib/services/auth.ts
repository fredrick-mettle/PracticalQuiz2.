import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import type { Role } from "@/lib/generated/prisma/enums";

export type RegisterResult =
  | { success: true; user: { id: string; email: string; role: Role } }
  | { success: false; message: string };

/** "024 123 4567" → "+233241234567" (stored in international format). */
function normalizeGhanaPhone(raw: string): string {
  const compact = raw.replace(/[\s-]/g, "");
  return compact.startsWith("0") ? `+233${compact.slice(1)}` : compact;
}

/**
 * Create a TENANT or AGENT account. Input is (re)validated with Zod here —
 * client-side validation is only for UX and is never trusted on its own.
 */
export async function registerUser(input: unknown): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid details",
    };
  }

  const { name, password, role } = parsed.data;
  const email = parsed.data.email.trim().toLowerCase();
  const phone = normalizeGhanaPhone(parsed.data.phone);

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    return {
      success: false,
      message: "An account with this email already exists. Try logging in.",
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, phone, passwordHash, role },
    select: { id: true, email: true, role: true },
  });

  return { success: true, user };
}
