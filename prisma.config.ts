import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prisma 7 configuration.
 * - The CLI connection URL lives here (Prisma 7 removed `url` from
 *   schema.prisma). The runtime client connects through the driver adapter
 *   in lib/prisma.ts, also using DATABASE_URL.
 * - `migrations.seed` replaces the old `prisma.seed` key in package.json.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // The fallback keeps `prisma generate` (postinstall) from crashing in
    // environments where env vars are wired up after install; every real
    // environment must set DATABASE_URL (see .env.example).
    url:
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@localhost:54329/rentgh",
  },
});
