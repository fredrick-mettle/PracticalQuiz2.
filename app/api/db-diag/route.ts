import { NextResponse } from "next/server";

/**
 * TEMPORARY diagnostic route (Phase 12 deploy debugging — DELETE after use).
 * Token-guarded; reports only non-secret connection metadata and error
 * shapes for: env parsing, raw pg connect, pg with relaxed TLS, the Prisma
 * WASM compiler import, and a real Prisma query.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TOKEN = "rg-diag-9c41x";

function describe(e: unknown): Record<string, string> {
  const err = e as { name?: string; code?: string; message?: string };
  return {
    name: String(err?.name ?? "unknown"),
    code: String(err?.code ?? "none"),
    message: String(err?.message ?? e).slice(0, 400),
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("k") !== TOKEN) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const out: Record<string, unknown> = { node: process.version };
  const cs = process.env.DATABASE_URL;

  // 0) Env shape (never the password itself).
  if (!cs) {
    out.env = { present: false };
  } else {
    try {
      const u = new URL(cs);
      out.env = {
        present: true,
        length: cs.length,
        hasWhitespace: /\s/.test(cs),
        protocol: u.protocol,
        username: u.username,
        passwordPresent: Boolean(u.password),
        passwordLength: u.password.length,
        host: u.hostname,
        port: u.port,
        database: u.pathname,
        search: u.search,
      };
    } catch {
      out.env = { present: true, parseError: true, length: cs.length };
    }
  }

  // 1) WASM compiler module import (same asset the generated client loads).
  try {
    const spec = [
      "@prisma/client/runtime/",
      "query_compiler_fast_bg.postgresql.wasm-base64.mjs",
    ].join("");
    const m: { wasm?: unknown } = await import(spec);
    out.wasmImport = {
      ok: true,
      wasmType: typeof m.wasm,
      wasmLength: typeof m.wasm === "string" ? m.wasm.length : null,
    };
  } catch (e) {
    out.wasmImport = { ok: false, ...describe(e) };
  }

  // 2) Raw pg, exactly like the app connects.
  async function pgTest(extra: Record<string, unknown>) {
    const { Client } = await import("pg");
    const client = new Client({
      connectionString: cs,
      connectionTimeoutMillis: 8000,
      ...extra,
    });
    await client.connect();
    try {
      const r = await client.query(
        'select count(*)::int as n from "Property"'
      );
      return { ok: true, properties: r.rows[0].n as number };
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  try {
    out.rawPg = await pgTest({});
  } catch (e) {
    out.rawPg = { ok: false, ...describe(e) };
  }

  // 3) Raw pg with certificate verification disabled (isolates TLS verify).
  try {
    out.rawPgNoVerify = await pgTest({ ssl: { rejectUnauthorized: false } });
  } catch (e) {
    out.rawPgNoVerify = { ok: false, ...describe(e) };
  }

  // 4) Real Prisma query through the app's client.
  try {
    const { prisma } = await import("@/lib/prisma");
    const n = await prisma.property.count();
    out.prisma = { ok: true, properties: n };
  } catch (e) {
    out.prisma = { ok: false, ...describe(e) };
  }

  return NextResponse.json(out, { status: 200 });
}
