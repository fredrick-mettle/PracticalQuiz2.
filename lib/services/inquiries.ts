import { prisma } from "@/lib/prisma";
import {
  inquiryMessageSchema,
  replyMessageSchema,
} from "@/lib/validations/inquiry";
import { notifyInquiryMessage } from "@/lib/email";
import type { InquiryStatus } from "@/lib/generated/prisma/enums";

/**
 * Inquiry conversations (Phase 8).
 *
 * Participants are exactly two people: the sender (usually a tenant) and
 * the property's owner (agent). Non-participants always get
 * "Inquiry not found" — no existence leaks, same as everywhere else.
 *
 * Status tracks the agent's attention: NEW → READ (agent opened it) →
 * REPLIED (agent answered). A fresh tenant message flips it back to NEW.
 * The agent can CLOSE a thread (and reopen it); closed threads reject
 * new messages. One open thread per sender+property: sending again
 * appends to the existing conversation instead of starting a new one.
 */

export type CreateInquiryResult =
  | { success: true; inquiryId: string; appended: boolean }
  | { success: false; message: string };

type SimpleResult = { success: true } | { success: false; message: string };

const NOT_FOUND = { success: false, message: "Inquiry not found" } as const;

const thumbSelect = {
  orderBy: { order: "asc" },
  take: 1,
  select: { url: true },
} as const;

/** Start (or continue) the sender's open conversation about a property. */
export async function createInquiry(
  senderId: string,
  propertyId: string,
  input: unknown
): Promise<CreateInquiryResult> {
  const parsed = inquiryMessageSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid message",
    };
  }

  // Inquiries only make sense on publicly visible listings.
  const property = await prisma.property.findFirst({
    where: { id: propertyId, status: "APPROVED" },
    select: {
      id: true,
      title: true,
      ownerId: true,
      owner: { select: { name: true, email: true } },
    },
  });
  if (!property) return { success: false, message: "Property not found" };
  if (property.ownerId === senderId) {
    return {
      success: false,
      message: "You can't send an inquiry about your own listing",
    };
  }

  const sender = await prisma.user.findUnique({
    where: { id: senderId },
    select: { name: true },
  });
  const notifyOwner = (inquiryId: string, isNew: boolean) =>
    void notifyInquiryMessage({
      to: property.owner.email,
      recipientName: property.owner.name,
      isNewInquiry: isNew,
      propertyTitle: property.title,
      senderName: sender?.name ?? "A RentGH user",
      message: parsed.data.message,
      threadPath: `/dashboard/inquiries/${inquiryId}`,
    });

  const existing = await prisma.inquiry.findFirst({
    where: { propertyId, senderId, status: { not: "CLOSED" } },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  if (existing) {
    await prisma.inquiryReply.create({
      data: { inquiryId: existing.id, senderId, message: parsed.data.message },
    });
    await prisma.inquiry.update({
      where: { id: existing.id },
      data: { status: "NEW" },
    });
    notifyOwner(existing.id, false);
    return { success: true, inquiryId: existing.id, appended: true };
  }

  const inquiry = await prisma.inquiry.create({
    data: { propertyId, senderId, message: parsed.data.message },
  });
  notifyOwner(inquiry.id, true);
  return { success: true, inquiryId: inquiry.id, appended: false };
}

/** The sender's open thread for a property, if any (detail-page panel). */
export async function getOpenInquiryFor(senderId: string, propertyId: string) {
  return prisma.inquiry.findFirst({
    where: { propertyId, senderId, status: { not: "CLOSED" } },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
}

/** Full thread for a participant (null → 404 for anyone else). */
export async function getInquiryThread(userId: string, inquiryId: string) {
  return prisma.inquiry.findFirst({
    where: {
      id: inquiryId,
      OR: [{ senderId: userId }, { property: { ownerId: userId } }],
    },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          price: true,
          pricePeriod: true,
          area: true,
          city: true,
          region: true,
          ownerId: true,
          owner: { select: { id: true, name: true } },
          images: thumbSelect,
        },
      },
      sender: { select: { id: true, name: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, name: true } } },
      },
    },
  });
}

export type InquiryThread = NonNullable<
  Awaited<ReturnType<typeof getInquiryThread>>
>;

/** Post a follow-up message; flips status and emails the other side. */
export async function addReply(
  userId: string,
  inquiryId: string,
  input: unknown
): Promise<SimpleResult> {
  const parsed = replyMessageSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid reply",
    };
  }

  const inquiry = await prisma.inquiry.findFirst({
    where: {
      id: inquiryId,
      OR: [{ senderId: userId }, { property: { ownerId: userId } }],
    },
    select: {
      id: true,
      status: true,
      senderId: true,
      sender: { select: { name: true, email: true } },
      property: {
        select: {
          title: true,
          ownerId: true,
          owner: { select: { name: true, email: true } },
        },
      },
    },
  });
  if (!inquiry) return NOT_FOUND;
  if (inquiry.status === "CLOSED") {
    return { success: false, message: "This conversation is closed" };
  }

  const isOwner = inquiry.property.ownerId === userId;
  await prisma.inquiryReply.create({
    data: { inquiryId, senderId: userId, message: parsed.data.message },
  });
  await prisma.inquiry.update({
    where: { id: inquiryId },
    data: { status: isOwner ? "REPLIED" : "NEW" },
  });

  const actor = isOwner ? inquiry.property.owner : inquiry.sender;
  const other = isOwner ? inquiry.sender : inquiry.property.owner;
  void notifyInquiryMessage({
    to: other.email,
    recipientName: other.name,
    isNewInquiry: false,
    propertyTitle: inquiry.property.title,
    senderName: actor.name,
    message: parsed.data.message,
    threadPath: isOwner
      ? `/inquiries/${inquiryId}`
      : `/dashboard/inquiries/${inquiryId}`,
  });

  return { success: true };
}

/** Agent opened the thread: NEW → READ (silent no-op otherwise). */
export async function markInquiryRead(
  agentId: string,
  inquiryId: string
): Promise<boolean> {
  const updated = await prisma.inquiry.updateMany({
    where: { id: inquiryId, status: "NEW", property: { ownerId: agentId } },
    data: { status: "READ" },
  });
  return updated.count > 0;
}

/** Agent closes (or reopens → READ) a conversation on their property. */
export async function setInquiryClosed(
  agentId: string,
  inquiryId: string,
  closed: boolean
): Promise<SimpleResult> {
  const updated = await prisma.inquiry.updateMany({
    where: { id: inquiryId, property: { ownerId: agentId } },
    data: { status: closed ? "CLOSED" : "READ" },
  });
  return updated.count > 0 ? { success: true } : NOT_FOUND;
}

/** Conversations the user started (tenant inbox). */
export async function listSentInquiries(userId: string) {
  return prisma.inquiry.findMany({
    where: { senderId: userId },
    orderBy: { updatedAt: "desc" },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          city: true,
          region: true,
          price: true,
          pricePeriod: true,
          owner: { select: { name: true } },
          images: thumbSelect,
        },
      },
      replies: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { message: true, senderId: true, createdAt: true },
      },
      _count: { select: { replies: true } },
    },
  });
}

export type SentInquiryItem = Awaited<
  ReturnType<typeof listSentInquiries>
>[number];

/** Conversations on the agent's own properties (dashboard inbox). */
export async function listReceivedInquiries(
  agentId: string,
  status?: InquiryStatus
) {
  return prisma.inquiry.findMany({
    where: {
      property: { ownerId: agentId },
      ...(status ? { status } : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          city: true,
          region: true,
          images: thumbSelect,
        },
      },
      sender: { select: { id: true, name: true } },
      replies: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { message: true, senderId: true, createdAt: true },
      },
      _count: { select: { replies: true } },
    },
  });
}

export type ReceivedInquiryItem = Awaited<
  ReturnType<typeof listReceivedInquiries>
>[number];

/** Per-status counts for dashboard tabs/badges. */
export async function countAgentInquiriesByStatus(agentId: string) {
  const grouped = await prisma.inquiry.groupBy({
    by: ["status"],
    where: { property: { ownerId: agentId } },
    _count: true,
  });
  const counts: Record<InquiryStatus, number> = {
    NEW: 0,
    READ: 0,
    REPLIED: 0,
    CLOSED: 0,
  };
  for (const row of grouped) counts[row.status] = row._count;
  return counts;
}
