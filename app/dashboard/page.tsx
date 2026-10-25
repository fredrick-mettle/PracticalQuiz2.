import type { Metadata } from "next";
import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PROPERTY_STATUS_LABELS } from "@/lib/constants";

export const metadata: Metadata = { title: "Agent Dashboard" };

// Phase 2 placeholder: confirms AGENT-only access and shows the agent's
// real listing counts. Full listing management arrives in Phase 3.
export default async function DashboardPage() {
  const user = await requireRole("AGENT");

  const byStatus = await prisma.property.groupBy({
    by: ["status"],
    where: { ownerId: user.id },
    _count: true,
  });

  const counts: Record<string, number> = {
    APPROVED: 0,
    PENDING: 0,
    REJECTED: 0,
    RENTED_OR_SOLD: 0,
  };
  for (const row of byStatus) counts[row.status] = row._count;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  const cards = [
    { label: "Total listings", value: total },
    { label: PROPERTY_STATUS_LABELS.APPROVED, value: counts.APPROVED },
    { label: PROPERTY_STATUS_LABELS.PENDING, value: counts.PENDING },
    { label: PROPERTY_STATUS_LABELS.REJECTED, value: counts.REJECTED },
    { label: PROPERTY_STATUS_LABELS.RENTED_OR_SOLD, value: counts.RENTED_OR_SOLD },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
        Welcome, {user.name}
      </h1>
      <p className="mt-2 text-slate-600">
        This is your agent dashboard. Creating, editing and deleting listings
        arrives in <strong>Phase 3</strong>; your inquiry inbox arrives in{" "}
        <strong>Phase 8</strong>.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-2xl font-bold text-slate-900">{card.value}</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
              {card.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
