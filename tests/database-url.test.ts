import { describe, expect, it } from "vitest";
import { withLibpqSslCompat } from "@/lib/database-url";

const base = "postgresql://user:pass@db.example.com:6543/postgres";

describe("withLibpqSslCompat", () => {
  it("adds libpq compatibility for sslmode=require", () => {
    expect(withLibpqSslCompat(`${base}?sslmode=require`)).toBe(
      `${base}?sslmode=require&uselibpqcompat=true`
    );
  });

  it("adds libpq compatibility for sslmode=prefer", () => {
    expect(withLibpqSslCompat(`${base}?sslmode=prefer`)).toBe(
      `${base}?sslmode=prefer&uselibpqcompat=true`
    );
  });

  it("adds libpq compatibility for sslmode=verify-ca", () => {
    expect(withLibpqSslCompat(`${base}?sslmode=verify-ca`)).toBe(
      `${base}?sslmode=verify-ca&uselibpqcompat=true`
    );
  });

  it("matches sslmode case-insensitively", () => {
    expect(withLibpqSslCompat(`${base}?sslmode=REQUIRE`)).toBe(
      `${base}?sslmode=REQUIRE&uselibpqcompat=true`
    );
  });

  it("appends after unrelated parameters without rewriting the URL", () => {
    expect(
      withLibpqSslCompat(`${base}?connect_timeout=10&sslmode=require&schema=public`)
    ).toBe(`${base}?connect_timeout=10&sslmode=require&schema=public&uselibpqcompat=true`);
  });

  it("leaves verify-full untouched", () => {
    expect(withLibpqSslCompat(`${base}?sslmode=verify-full`)).toBe(
      `${base}?sslmode=verify-full`
    );
  });

  it("leaves sslmode=disable untouched", () => {
    expect(withLibpqSslCompat(`${base}?sslmode=disable`)).toBe(
      `${base}?sslmode=disable`
    );
  });

  it("leaves strings without sslmode untouched", () => {
    expect(withLibpqSslCompat(`${base}?connect_timeout=10`)).toBe(
      `${base}?connect_timeout=10`
    );
    expect(withLibpqSslCompat(base)).toBe(base);
  });

  it("respects an existing uselibpqcompat value", () => {
    expect(
      withLibpqSslCompat(`${base}?sslmode=require&uselibpqcompat=false`)
    ).toBe(`${base}?sslmode=require&uselibpqcompat=false`);
  });

  it("does not treat sslmode text in userinfo as a query parameter", () => {
    const cs = "postgresql://user:sslmode%3Drequire@db.example.com/postgres";
    expect(withLibpqSslCompat(cs)).toBe(cs);
  });
});
