"use server";

import { registerUser } from "@/lib/services/auth";
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
  const result = await registerUser(input);
  if (!result.success) return result;
  return { success: true };
}
