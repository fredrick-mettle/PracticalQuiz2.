import { prisma } from "@/lib/prisma";
import { GHANA_REGIONS } from "@/lib/constants";
import { formatGHS, pricePeriodSuffix } from "@/lib/utils";

// TEMPORARY Phase 1 status page: proves the full stack works end-to-end
// (Next.js → Prisma → PostgreSQL) by reading live counts from the database.
// It is replaced by the real home page in Phase 5.
export const dynamic = "force-dynamic";

async function getStats() {
  const [usersByRole, propertiesByStatus, propertiesByRegion, latest] =
    await Promise.all([
      prisma.user.groupBy({ by: ["role"], _count: true }),
      prisma.property.groupBy({ by: ["status"], _count: true }),
      prisma.property.groupBy({
        by: ["region"],
        _count: true,
        orderBy: { _count: { region: "desc" } },
      }),
      prisma.property.findMany({
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          price: true,
          pricePeriod: true,
          region: true,
          city: true,
          area: true,
        },
      }),
    ]);
  return { usersByRole, propertiesByStatus, propertiesByRegion, latest };
}

export default async function HomePage() {
  let stats: Awaited<ReturnType<typeof getStats>> | null = null;
  try {
    stats = await getStats();
  } catch {
    stats = null;
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          RentGH — Ghana Rental &amp; Property Finder
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          Phase 1 of 12: Setup complete ✅
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Next.js 14 + TypeScript + Tailwind CSS, Prisma ORM with a real
          PostgreSQL database, first migration applied and seeded with sample
          data. The numbers below are read live from the database.
        </p>
      </header>

      {!stats ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-900">
          <h2 className="font-semibold">Database not reachable</h2>
          <p className="mt-2 text-sm">
            Start the local PostgreSQL with{" "}
            <code className="rounded bg-red-100 px-1.5 py-0.5 font-mono text-xs">
              npm run db:local
            </code>{" "}
            (separate terminal), make sure{" "}
            <code className="rounded bg-red-100 px-1.5 py-0.5 font-mono text-xs">
              .env
            </code>{" "}
            contains a valid{" "}
            <code className="rounded bg-red-100 px-1.5 py-0.5 font-mono text-xs">
              DATABASE_URL
            </code>
            , then run{" "}
            <code className="rounded bg-red-100 px-1.5 py-0.5 font-mono text-xs">
              npm run db:seed
            </code>{" "}
            and refresh this page.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Database
            </h2>
            <p className="mt-2 flex items-center gap-2 text-lg font-semibold text-emerald-700">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Connected
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {GHANA_REGIONS.length} Ghana regions loaded from{" "}
              <code className="font-mono text-xs">lib/constants.ts</code>
            </p>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Users by role
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {stats.usersByRole.map((r) => (
                <li key={r.role} className="flex justify-between">
                  <span className="text-slate-700">{r.role}</span>
                  <span className="font-semibold">{r._count}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Properties by status
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {stats.propertiesByStatus.map((s) => (
                <li key={s.status} className="flex justify-between">
                  <span className="text-slate-700">{s.status}</span>
                  <span className="font-semibold">{s._count}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Properties by region
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {stats.propertiesByRegion.map((r) => (
                <li key={r.region} className="flex justify-between">
                  <span className="text-slate-700">{r.region}</span>
                  <span className="font-semibold">{r._count}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Latest approved listings
            </h2>
            <ul className="mt-3 divide-y divide-slate-100 text-sm">
              {stats.latest.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2">
                  <span>
                    <span className="font-medium text-slate-900">{p.title}</span>
                    <span className="block text-xs text-slate-500">
                      {p.area ? `${p.area}, ` : ""}
                      {p.city} — {p.region}
                    </span>
                  </span>
                  <span className="font-semibold text-emerald-800">
                    {formatGHS(p.price)}
                    <span className="text-xs font-normal text-slate-500">
                      {pricePeriodSuffix(p.pricePeriod)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      <footer className="mt-10 text-sm text-slate-500">
        Next up — Phase 2: authentication &amp; roles (NextAuth). Say{" "}
        <span className="font-semibold text-slate-700">&ldquo;next&rdquo;</span>{" "}
        when you are ready.
      </footer>
    </main>
  );
}
