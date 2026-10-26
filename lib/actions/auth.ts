"use server";

import { headers } from "next/headers";
import { registerUser } from "@/lib/services/auth";
import { ipFromHeaders, rateLimit } from "@/lib/rate-limit";
import type { RegisterInput } from "@/lib/validations/auth";

/**
 * Server Actions are the single, consistent mutation mechanism for this app.
 * Each action is a thin wrapper over a service function that validates its
 * input on the server (never trust the client) and returns a serializable
 * result for the form to display.
 */
export async function registerAction(
  input: RegisterInput
): Promise<{ success: true } | { success: false; message: string }> {
  // Blunt credential-stuffing / mass sign-up abuse (Phase 11).
  const ip = ipFromHeaders((name) => headers().get(name));
  const limit = rateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
  if (!limit.ok) {
    const minutes = Math.max(1, Math.ceil(limit.retryAfterSec / 60));
    return {
      success: false,
      message: `Too many sign-up attempts. Please try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    };
  }

  const result = await registerUser(input);
  if (!result.success) return result;
  return { success: true };
}
