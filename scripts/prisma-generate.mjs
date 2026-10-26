/**
 * Runs `prisma generate` for postinstall / `npm run db:generate`.
 *
 * Normally the Prisma CLI downloads its native schema-engine binary on
 * startup (even though `generate` never executes it). If that download is
 * unavailable (offline / restricted network), retry with the local WASM
 * schema-engine shim so client generation still succeeds — see
 * scripts/schema-engine-shim.mjs.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const shimPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "schema-engine-shim.mjs"
);

function runPrismaGenerate(extraEnv) {
  return spawnSync("npx", ["prisma", "generate"], {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, ...extraEnv },
  });
}

let result = runPrismaGenerate({});
if (result.status !== 0 && !process.env.PRISMA_SCHEMA_ENGINE_BINARY) {
  console.error(
    "[prisma-generate] Standard generate failed; retrying with the offline schema-engine shim…"
  );
  result = runPrismaGenerate({ PRISMA_SCHEMA_ENGINE_BINARY: shimPath });
}

process.exit(result.status ?? 1);
