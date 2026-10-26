import { NextResponse } from "next/server";

/**
 * TEMPORARY diagnostic route (Phase 12 deploy debugging — DELETE after use).
 * Token-guarded; runs the real service calls behind /properties and the
 * detail page in isolation and reports the exact error shapes.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TOKEN = "rg-diag-9c41x";
const DETAIL_ID = "cmvp4kpg40004l5nzc8p7pc5z";

function describe(e: unknown): Record<string, string> {
  const err = e as {
    name?: string;
    code?: string;
    message?: string;
    meta?: unknown;
  };
  let meta = "";
  try {
    meta = JSON.stringify(err?.meta ?? null)?.slice(0, 300) ?? "";
  } catch {
    meta = "unserializable";
  }
  return {
    name: String(err?.name ?? "unknown"),
    code: String(err?.code ?? "none"),
    message: String(err?.message ?? e).slice(0, 800),
    meta,
  };
}

async function attempt<T>(
  fn: () => Promise<T>,
  summarize: (v: T) => unknown
): Promise<Record<string, unknown>> {
  try {
    const v = await fn();
    return { ok: true, result: summarize(v) };
  } catch (e) {
    return { ok: false, ...describe(e) };
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("k") !== TOKEN) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const out: Record<string, unknown> = { node: process.version };

  const svc = await import("@/lib/services/public-properties");
  const { parseSearchParams } = await import("@/lib/validations/search");
  const { prisma } = await import("@/lib/prisma");

  // Controls (known-good on home page).
  out.count = await attempt(
    () => prisma.property.count({ where: { status: "APPROVED" } }),
    (n) => n
  );
  out.featured = await attempt(
    () => svc.getFeaturedProperties(8),
    (rows) => rows.length
  );

  // The /properties query, decomposed.
  out.findManySkipNoInclude = await attempt(
    () =>
      prisma.property.findMany({
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        skip: 0,
        take: 12,
      }),
    (rows) => rows.length
  );
  out.findManySkipWithInclude = await attempt(
    () =>
      prisma.property.findMany({
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        skip: 0,
        take: 12,
        include: svc.propertyCardInclude,
      }),
    (rows) => rows.length
  );
  out.searchProperties = await attempt(
    () => svc.searchProperties(parseSearchParams({})),
    (r) => ({ total: r.total, shown: r.properties.length })
  );

  // The detail-page queries.
  const detail = await attempt(
    () => svc.getPublicProperty(DETAIL_ID),
    (p) => (p ? p.title : null)
  );
  out.getPublicProperty = detail;
  if (detail.ok) {
    const p = await svc.getPublicProperty(DETAIL_ID);
    if (p) {
      out.getSimilarProperties = await attempt(
        () => svc.getSimilarProperties(p),
        (rows) => rows.length
      );
    }
  }

  return NextResponse.json(out, { status: 200 });
}
