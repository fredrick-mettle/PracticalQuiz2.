import type { Metadata } from "next";
import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Admin Panel" };

// Phase 2 placeholder: confirms ADMIN-only access and shows platform
// totals. The moderation queue and user management arrive in Phase 10.
export default async function AdminPage() {
  await requireRole("ADMIN");

  const [usersByRole, propertiesByStatus] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], _count: true }),
    prisma.property.groupBy({ by: ["status"], _count: true }),
  ]);

  const totalUsers = usersByRole.reduce((sum, r) => sum + r._count, 0);
  const totalProperties = propertiesByStatus.reduce(
    (sum, r) => sum + r._count,
    0
  );
  const pendingCount =
    propertiesByStatus.find((r) => r.status === "PENDING")?._count ?? 0;

  const cards = [
    { label: "Total users", value: totalUsers },
    { label: "Total listings", value: totalProperties },
    { label: "Awaiting moderation", value: pendingCount },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
        Admin Panel
      </h1>
      <p className="mt-2 text-slate-600">
        The moderation queue, user management and platform statistics arrive
        in <strong>Phase 10</strong>. Platform totals so far:
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-3xl font-bold text-slate-900">{card.value}</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
              {card.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
