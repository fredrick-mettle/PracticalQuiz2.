"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-helpers";
import {
  createProperty,
  deleteProperty,
  setPropertyRentedOrSold,
  updateProperty,
} from "@/lib/services/properties";
import type { PropertyFormValues } from "@/lib/validations/property";

type ActionResult =
  | { success: true; propertyId: string }
  | { success: false; message: string };

type SimpleActionResult =
  | { success: true }
  | { success: false; message: string };

/**
 * Property mutations for agents. Every action:
 *  1. requires the AGENT role (server-side),
 *  2. delegates to the service layer, which re-validates input with Zod
 *     and enforces ownership (an agent can only touch their own listings),
 *  3. revalidates the dashboard so lists stay fresh.
 */

export async function createPropertyAction(
  input: PropertyFormValues
): Promise<ActionResult> {
  const user = await requireRole("AGENT");
  const result = await createProperty(user.id, input);
  if (!result.success) return result;
  revalidatePath("/dashboard");
  return { success: true, propertyId: result.property.id };
}

export async function updatePropertyAction(
  propertyId: string,
  input: PropertyFormValues
): Promise<ActionResult> {
  const user = await requireRole("AGENT");
  const result = await updateProperty(user.id, propertyId, input);
  if (!result.success) return result;
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/properties/${propertyId}/edit`);
  return { success: true, propertyId: result.property.id };
}

export async function deletePropertyAction(
  propertyId: string
): Promise<SimpleActionResult> {
  const user = await requireRole("AGENT");
  const result = await deleteProperty(user.id, propertyId);
  if (!result.success) return result;
  revalidatePath("/dashboard");
  return { success: true };
}

export async function setPropertyRentedOrSoldAction(
  propertyId: string,
  rentedOrSold: boolean
): Promise<SimpleActionResult> {
  const user = await requireRole("AGENT");
  const result = await setPropertyRentedOrSold(
    user.id,
    propertyId,
    rentedOrSold
  );
  if (!result.success) return result;
  revalidatePath("/dashboard");
  return { success: true };
}
