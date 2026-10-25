import { prisma } from "@/lib/prisma";
import { moderationSchema, userStatusSchema } from "@/lib/validations/admin";
import { PROPERTY_STATUS_LABELS } from "@/lib/constants";
import { appBaseUrl, sendEmail } from "@/lib/email";
import { deleteCloudinaryImage } from "@/lib/cloudinary";
import type {
  PropertyStatus,
  Role,
  UserStatus,
} from "@/lib/generated/prisma/enums";

/**
 * Admin operations (Phase 10): platform stats, listing moderation,
 * and user management. Every caller must already be authorized as
 * ADMIN by the action layer; the guard rails that remain here are
 * business rules (allowed status transitions, self/admin protection).
 */

type SimpleResult = { success: true } | { success: false; message: string };

const thumbSelect = {
  orderBy: { order: "asc" },
  take: 1,
  select: { url: true },
} as const;

export async function countPendingProperties(): Promise<number> {
  return prisma.property.count({ where: { status: "PENDING" } });
}

export async function getAdminStats() {
  const [
    usersByRole,
    propertiesByStatus,
    inquiriesTotal,
    inquiriesNew,
    favoritesTotal,
    usersTotal,
  ] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], _count: true }),
    prisma.property.groupBy({ by: ["status"], _count: true }),
    prisma.inquiry.count(),
    prisma.inquiry.count({ where: { status: "NEW" } }),
    prisma.favorite.count(),
    prisma.user.count(),
  ]);

  const roleCounts: Record<Role, number> = { TENANT: 0, AGENT: 0, ADMIN: 0 };
  for (const row of usersByRole) roleCounts[row.role] = row._count;

  const statusCounts: Record<PropertyStatus, number> = {
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
    RENTED_OR_SOLD: 0,
  };
  for (const row of propertiesByStatus) statusCounts[row.status] = row._count;

  return {
    usersTotal,
    roleCounts,
    propertiesTotal: Object.values(statusCounts).reduce((a, b) => a + b, 0),
    statusCounts,
    inquiriesTotal,
    inquiriesNew,
    favoritesTotal,
  };
}

/** Moderation queue: PENDING listings, oldest first (fair FIFO). */
export async function listModerationQueue(page: number, pageSize = 10) {
  const where = { status: "PENDING" as const };
  const [total, properties] = await Promise.all([
    prisma.property.count({ where }),
    prisma.property.findMany({
      where,
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        images: thumbSelect,
        _count: { select: { images: true } },
      },
    }),
  ]);
  return {
    properties,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export interface AdminPropertiesQuery {
  status?: PropertyStatus;
  q?: string;
  page: number;
  pageSize?: number;
}

/** Every listing on the platform, newest first, for admin oversight. */
export async function listAdminProperties(query: AdminPropertiesQuery) {
  const pageSize = query.pageSize ?? 15;
  const where = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.q
      ? {
          OR: [
            { title: { contains: query.q, mode: "insensitive" as const } },
            { city: { contains: query.q, mode: "insensitive" as const } },
            {
              owner: {
                name: { contains: query.q, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {}),
  };

  const [total, properties] = await Promise.all([
    prisma.property.count({ where }),
    prisma.property.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * pageSize,
      take: pageSize,
      include: {
        owner: { select: { id: true, name: true } },
        images: thumbSelect,
      },
    }),
  ]);
  return {
    properties,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/** Full listing detail for moderation — any status (admins see all). */
export async function getAdminProperty(id: string) {
  return prisma.property.findUnique({
    where: { id },
    include: {
      images: { orderBy: { order: "asc" } },
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
        },
      },
      _count: { select: { favorites: true, inquiries: true } },
    },
  });
}

export type AdminPropertyDetail = NonNullable<
  Awaited<ReturnType<typeof getAdminProperty>>
>;

/**
 * Approve or reject a listing.
 * APPROVE: PENDING/REJECTED → APPROVED (clears any rejection reason).
 * REJECT:  PENDING/APPROVED → REJECTED with a mandatory reason
 * (rejecting an APPROVED listing is a takedown).
 * The owner is emailed the outcome either way.
 */
export async function moderateProperty(
  propertyId: string,
  input: unknown
): Promise<SimpleResult> {
  const parsed = moderationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid decision",
    };
  }
  const { decision, reason } = parsed.data;

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      id: true,
      title: true,
      status: true,
      owner: { select: { name: true, email: true } },
    },
  });
  if (!property) return { success: false, message: "Property not found" };

  const allowedFrom: Record<string, PropertyStatus[]> = {
    APPROVE: ["PENDING", "REJECTED"],
    REJECT: ["PENDING", "APPROVED"],
  };
  if (!allowedFrom[decision].includes(property.status)) {
    return {
      success: false,
      message: `This listing can't be ${
        decision === "APPROVE" ? "approved" : "rejected"
      } from its current status (${PROPERTY_STATUS_LABELS[property.status]})`,
    };
  }

  await prisma.property.update({
    where: { id: propertyId },
    data:
      decision === "APPROVE"
        ? { status: "APPROVED", rejectionReason: null }
        : { status: "REJECTED", rejectionReason: reason },
  });

  const base = appBaseUrl();
  if (decision === "APPROVE") {
    void sendEmail({
      to: property.owner.email,
      subject: `Your listing is live: ${property.title}`,
      text: `Hello ${property.owner.name},\n\nGood news — your listing "${property.title}" has been approved and is now live on RentGH.\n\nView it: ${base}/properties/${propertyId}\n\n— RentGH`,
    });
  } else {
    void sendEmail({
      to: property.owner.email,
      subject: `Action needed on your listing: ${property.title}`,
      text: `Hello ${property.owner.name},\n\nYour listing "${property.title}" was not approved.\n\nReason: ${reason}\n\nYou can fix this and resubmit here: ${base}/dashboard/properties/${propertyId}/edit\n\n— RentGH`,
    });
  }

  return { success: true };
}

/** Hard-delete any listing (spam/abuse), cleaning up Cloudinary files. */
export async function deletePropertyAsAdmin(
  propertyId: string
): Promise<SimpleResult> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true },
  });
  if (!property) return { success: false, message: "Property not found" };

  const images = await prisma.propertyImage.findMany({
    where: { propertyId },
    select: { publicId: true },
  });
  await prisma.property.delete({ where: { id: propertyId } });
  await Promise.all(images.map((img) => deleteCloudinaryImage(img.publicId)));
  return { success: true };
}

export interface AdminUsersQuery {
  q?: string;
  role?: Role;
  status?: UserStatus;
  page: number;
  pageSize?: number;
}

export async function listUsers(query: AdminUsersQuery) {
  const pageSize = query.pageSize ?? 15;
  const where = {
    ...(query.role ? { role: query.role } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: "insensitive" as const } },
            { email: { contains: query.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        _count: { select: { properties: true, inquiriesSent: true } },
      },
    }),
  ]);
  return {
    users,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export type AdminUserItem = Awaited<ReturnType<typeof listUsers>>["users"][number];

/**
 * Set a user's account status. Non-ACTIVE users can't sign in (enforced
 * in lib/auth authorize). Guards: never yourself, never another admin.
 * Note: existing sessions are JWTs and stay valid until they expire —
 * suspension blocks the NEXT sign-in (documented limitation).
 */
export async function setUserStatus(
  adminId: string,
  userId: string,
  input: unknown
): Promise<SimpleResult> {
  const parsed = userStatusSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Invalid status" };
  if (userId === adminId) {
    return { success: false, message: "You can't change your own status" };
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, status: true },
  });
  if (!target) return { success: false, message: "User not found" };
  if (target.role === "ADMIN") {
    return { success: false, message: "Admin accounts can't be modified here" };
  }
  if (target.status === parsed.data) return { success: true };

  await prisma.user.update({
    where: { id: userId },
    data: { status: parsed.data },
  });
  return { success: true };
}
