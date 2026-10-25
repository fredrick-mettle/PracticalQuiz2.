"use server";

import { revalidatePath } from "next/cache";
import { requireRole, requireUser } from "@/lib/auth-helpers";
import {
  addReply,
  createInquiry,
  setInquiryClosed,
} from "@/lib/services/inquiries";
import type {
  InquiryMessageValues,
  ReplyMessageValues,
} from "@/lib/validations/inquiry";

/**
 * Inquiry actions (Phase 8). Participants/status rules live in the
 * service; actions handle auth + cache revalidation for both inboxes.
 */

function revalidateInquirySurfaces(inquiryId?: string) {
  revalidatePath("/inquiries");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/inquiries");
  if (inquiryId) {
    revalidatePath(`/inquiries/${inquiryId}`);
    revalidatePath(`/dashboard/inquiries/${inquiryId}`);
  }
}

export async function createInquiryAction(
  propertyId: string,
  input: InquiryMessageValues
) {
  const user = await requireUser();
  const result = await createInquiry(user.id, propertyId, input);
  if (!result.success) return result;
  revalidatePath(`/properties/${propertyId}`);
  revalidateInquirySurfaces(result.inquiryId);
  return result;
}

export async function replyToInquiryAction(
  inquiryId: string,
  input: ReplyMessageValues
) {
  const user = await requireUser();
  const result = await addReply(user.id, inquiryId, input);
  if (!result.success) return result;
  revalidateInquirySurfaces(inquiryId);
  return result;
}

export async function setInquiryClosedAction(
  inquiryId: string,
  closed: boolean
) {
  const user = await requireRole("AGENT");
  const result = await setInquiryClosed(user.id, inquiryId, closed);
  if (!result.success) return result;
  revalidateInquirySurfaces(inquiryId);
  return result;
}
