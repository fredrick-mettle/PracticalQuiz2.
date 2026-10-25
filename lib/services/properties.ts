import { prisma } from "@/lib/prisma";
import { propertyFormSchema } from "@/lib/validations/property";
import type { PropertyStatus } from "@/lib/generated/prisma/enums";
import type { Property } from "@/lib/generated/prisma/client";

/**
 * Property listing service (agent-facing).
 *
 * OWNERSHIP RULE: every mutation is scoped by ownerId on the server.
 * A property that does not exist OR belongs to someone else produces the
 * same "not found" result, so listing existence is never leaked.
 */

export type PropertyResult =
  | { success: true; property: Property }
  | { success: false; message: string };

type SimpleResult = { success: true } | { success: false; message: string };

const NOT_FOUND: { success: false; message: string } = {
  success: false,
  message: "Property not found",
};

/** Fetch a property only if it belongs to this owner. */
export async function getOwnedProperty(
  ownerId: string,
  propertyId: string
): Promise<Property | null> {
  return prisma.property.findFirst({
    where: { id: propertyId, ownerId },
  });
}

/** Create a listing. Status is always PENDING (admin moderation, Phase 10). */
export async function createProperty(
  ownerId: string,
  input: unknown
): Promise<PropertyResult> {
  const parsed = propertyFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid property details",
    };
  }

  const property = await prisma.property.create({
    data: {
      ...parsed.data,
      amenities: [...parsed.data.amenities],
      ownerId,
      status: "PENDING",
    },
  });
  return { success: true, property };
}

/**
 * Update a listing the agent owns.
 * Editing a REJECTED listing resubmits it for moderation (back to PENDING,
 * rejection reason cleared); all other statuses are preserved.
 */
export async function updateProperty(
  ownerId: string,
  propertyId: string,
  input: unknown
): Promise<PropertyResult> {
  const parsed = propertyFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid property details",
    };
  }

  const existing = await getOwnedProperty(ownerId, propertyId);
  if (!existing) return NOT_FOUND;

  const resubmit = existing.status === "REJECTED";

  const property = await prisma.property.update({
    where: { id: existing.id },
    data: {
      ...parsed.data,
      amenities: [...parsed.data.amenities],
      ...(resubmit
        ? { status: "PENDING" as PropertyStatus, rejectionReason: null }
        : {}),
    },
  });
  return { success: true, property };
}

/**
 * Delete a listing the agent owns. Images/favorites/inquiries cascade in
 * the database. (Phase 4: also delete the files from Cloudinary.)
 */
export async function deleteProperty(
  ownerId: string,
  propertyId: string
): Promise<SimpleResult> {
  const existing = await getOwnedProperty(ownerId, propertyId);
  if (!existing) return NOT_FOUND;

  await prisma.property.delete({ where: { id: existing.id } });
  return { success: true };
}

/**
 * Mark an APPROVED listing as rented/sold, or relist a RENTED_OR_SOLD one.
 * Relisting goes back through moderation (PENDING) rather than straight to
 * APPROVED, so availability can never bypass admin review.
 */
export async function setPropertyRentedOrSold(
  ownerId: string,
  propertyId: string,
  rentedOrSold: boolean
): Promise<PropertyResult> {
  const existing = await getOwnedProperty(ownerId, propertyId);
  if (!existing) return NOT_FOUND;

  if (rentedOrSold) {
    if (existing.status !== "APPROVED") {
      return {
        success: false,
        message: "Only an approved (live) listing can be marked as rented/sold",
      };
    }
    const property = await prisma.property.update({
      where: { id: existing.id },
      data: { status: "RENTED_OR_SOLD" },
    });
    return { success: true, property };
  }

  if (existing.status !== "RENTED_OR_SOLD") {
    return {
      success: false,
      message: "Only a rented/sold listing can be relisted",
    };
  }
  const property = await prisma.property.update({
    where: { id: existing.id },
    data: { status: "PENDING" },
  });
  return { success: true, property };
}

/** Dashboard search/filter parameters (server-side). */
export interface AgentListingsQuery {
  status?: PropertyStatus;
  q?: string;
  page: number;
  pageSize: number;
}

/** An agent's own listings with cover image, newest first, paginated. */
export async function listAgentProperties(
  ownerId: string,
  query: AgentListingsQuery
) {
  const where = {
    ownerId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.q
      ? { title: { contains: query.q, mode: "insensitive" as const } }
      : {}),
  };

  const [total, properties] = await Promise.all([
    prisma.property.count({ where }),
    prisma.property.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
      },
    }),
  ]);

  return {
    properties,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

/** Counts of an agent's listings per status (dashboard tabs/stats). */
export async function countAgentPropertiesByStatus(ownerId: string) {
  const grouped = await prisma.property.groupBy({
    by: ["status"],
    where: { ownerId },
    _count: true,
  });

  const counts: Record<PropertyStatus, number> = {
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
    RENTED_OR_SOLD: 0,
  };
  for (const row of grouped) counts[row.status] = row._count;
  return counts;
}
