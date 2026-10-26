/**
 * Dev-only helper: runs a real PostgreSQL server locally without needing a
 * system-wide Postgres install (binaries ship via the `embedded-postgres`
 * npm package). Data lives in `.local-postgres/data` (gitignored).
 *
 * Usage:  npm run db:local     (keep this running in its own terminal)
 *
 * Connection string it provides (matches .env.example default):
 *   postgresql://postgres:postgres@localhost:54329/rentgh
 *
 * If you already have PostgreSQL (or a Neon/Supabase database), skip this
 * script entirely and just point DATABASE_URL at your database instead.
 */
import fs from "node:fs";
import path from "node:path";
import EmbeddedPostgres from "embedded-postgres";

const PORT = Number(process.env.LOCAL_PG_PORT || 54329);
const DB_NAME = process.env.LOCAL_PG_DB || "rentgh";
const dataDir = path.join(process.cwd(), ".local-postgres", "data");

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "postgres",
  password: "postgres",
  port: PORT,
  persistent: true, // keep data between restarts
});

async function main() {
  const alreadyInitialised = fs.existsSync(path.join(dataDir, "PG_VERSION"));
  if (!alreadyInitialised) {
    console.log("[db:local] Initialising new PostgreSQL cluster…");
    await pg.initialise();
  }

  await pg.start();

  try {
    await pg.createDatabase(DB_NAME);
    console.log(`[db:local] Created database "${DB_NAME}"`);
  } catch (err) {
    if (!/already exists/i.test(String(err?.message ?? err))) throw err;
  }

  console.log(
    `[db:local] PostgreSQL ready → postgresql://postgres:postgres@localhost:${PORT}/${DB_NAME}`
  );
  console.log("[db:local] Press Ctrl+C to stop.");
}

async function shutdown(signal) {
  console.log(`\n[db:local] Received ${signal}, stopping PostgreSQL…`);
  try {
    await pg.stop();
  } finally {
    process.exit(0);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

main().catch((err) => {
  console.error("[db:local] Failed to start PostgreSQL:", err);
  process.exit(1);
});

// Keep the Node process alive while Postgres runs.
setInterval(() => {}, 1 << 30);
