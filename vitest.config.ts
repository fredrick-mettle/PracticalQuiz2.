import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Unit tests for pure logic (validation schemas, search-param parsing,
 * formatting, rate limiting). Database-backed flows are covered by the
 * per-phase service smoke tests; these run anywhere with `npm test`.
 */
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
