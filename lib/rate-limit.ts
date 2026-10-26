/**
 * In-memory sliding-window rate limiting (Phase 11).
 *
 * Appropriate for a single-instance deployment: state lives in this
 * process's memory and resets on restart. For multi-instance/serverless
 * deployments swap the Map for Redis/Upstash — the call sites stay the
 * same.
 */

const buckets = new Map<string, number[]>();

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the oldest in-window hit expires (0 when ok). */
  retryAfterSec: number;
}

/**
 * Record a hit for `key` and report whether it is within `limit` hits per
 * `windowMs`. Blocked hits are NOT recorded, so the lockout lifts as soon
 * as old hits age out (hammering doesn't extend the ban).
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;
  const hits = (buckets.get(key) ?? []).filter((t) => t > cutoff);

  if (hits.length >= limit) {
    buckets.set(key, hits);
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((hits[0] + windowMs - now) / 1000)),
    };
  }

  hits.push(now);
  buckets.set(key, hits);

  // Opportunistic cleanup so abandoned keys don't accumulate forever.
  if (buckets.size > 10_000) {
    for (const [k, v] of Array.from(buckets)) {
      if (v.length === 0 || v[v.length - 1] <= cutoff) buckets.delete(k);
    }
  }

  return { ok: true, retryAfterSec: 0 };
}

/** Best-effort client IP from proxy headers (Vercel/most hosts set these). */
export function ipFromHeaders(
  get: (name: string) => string | null | undefined
): string {
  const forwarded = get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  if (first) return first;
  return get("x-real-ip")?.trim() || "unknown";
}
