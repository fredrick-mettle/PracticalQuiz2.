import { afterEach, describe, expect, it, vi } from "vitest";
import { ipFromHeaders, rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows up to the limit, then blocks with a retry hint", () => {
    const key = "t-basic";
    for (let i = 0; i < 3; i++) {
      expect(rateLimit(key, 3, 60_000).ok).toBe(true);
    }
    const blocked = rateLimit(key, 3, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
    expect(blocked.retryAfterSec).toBeLessThanOrEqual(60);
  });

  it("tracks keys independently", () => {
    expect(rateLimit("t-a", 1, 60_000).ok).toBe(true);
    expect(rateLimit("t-a", 1, 60_000).ok).toBe(false);
    expect(rateLimit("t-b", 1, 60_000).ok).toBe(true);
  });

  it("recovers after the window slides past, and blocked hits don't extend it", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
    const key = "t-window";
    expect(rateLimit(key, 2, 10_000).ok).toBe(true);
    expect(rateLimit(key, 2, 10_000).ok).toBe(true);

    vi.setSystemTime(1_000_000 + 9_000);
    expect(rateLimit(key, 2, 10_000).ok).toBe(false);
    // If blocked hits were recorded, this would still be blocked at +10.5s.
    vi.setSystemTime(1_000_000 + 10_500);
    expect(rateLimit(key, 2, 10_000).ok).toBe(true);
  });
});

describe("ipFromHeaders", () => {
  const getter =
    (map: Record<string, string>) =>
    (name: string): string | null =>
      map[name] ?? null;

  it("prefers the first x-forwarded-for entry", () => {
    expect(ipFromHeaders(getter({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip, then 'unknown'", () => {
    expect(ipFromHeaders(getter({ "x-real-ip": "9.9.9.9" }))).toBe("9.9.9.9");
    expect(ipFromHeaders(getter({}))).toBe("unknown");
  });
});
