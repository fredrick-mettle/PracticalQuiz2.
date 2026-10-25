#!/usr/bin/env node
/**
 * Offline Prisma schema-engine shim (developer tool — not used in production).
 *
 * Why this exists: the Prisma 7 CLI runs migrations by spawning a native
 * `schema-engine` binary that it downloads from binaries.prisma.sh. In
 * network-restricted environments (offline, locked-down sandboxes/CI) that
 * download can fail, which breaks `prisma migrate dev`.
 *
 * This script is a drop-in replacement for that binary: it speaks the same
 * line-delimited JSON-RPC protocol on stdio, but executes every command with
 * Prisma's official WASM build of the schema engine
 * (`@prisma/schema-engine-wasm`, version matched to the installed CLI)
 * talking to Postgres through `@prisma/adapter-pg` — so migrations behave
 * exactly like the native engine, with zero binary downloads.
 *
 * Usage (only needed where binaries.prisma.sh is unreachable):
 *   PRISMA_SCHEMA_ENGINE_BINARY="$(pwd)/scripts/schema-engine-shim.mjs" \
 *     npx prisma migrate dev
 *
 * On any machine with normal internet access, simply do not set that env
 * var and Prisma uses its official native engine.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import readline from "node:readline";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { bindMigrationAwareSqlAdapterFactory } from "@prisma/driver-adapter-utils";

const require = createRequire(import.meta.url);
const logFile = process.env.SHIM_LOG_FILE;
// In one-shot `cli` mode (see below) the Prisma CLI parses stderr lines as
// JSON, so plain-text logging to stderr must be silenced there.
let oneShotMode = false;
const log = (...args) => {
  if (!oneShotMode) console.error("[schema-engine-shim]", ...args);
  if (logFile) {
    try {
      fs.appendFileSync(
        logFile,
        args
          .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
          .join(" ") + "\n"
      );
    } catch {
      // logging must never break the engine
    }
  }
};

// ── Work around an @prisma/adapter-pg limitation ────────────────────────────
// The adapter cannot map Postgres' internal "char" type (OID 18), which
// appears in pg_catalog introspection results (pg_class.relkind,
// pg_constraint.contype, …) and makes schema description fail inside the
// WASM schema engine. The values are single-character strings, so presenting
// those result fields to the adapter as TEXT (OID 25) is safe. We patch the
// node-pg result field metadata for every query in this shim process
// (prototype-level, so it also covers pools the adapter creates internally,
// e.g. for the shadow database).
const OID_PG_CHAR = 18;
const OID_PG_TEXT = 25;

function patchResultFields(result) {
  if (result && Array.isArray(result.fields)) {
    for (const field of result.fields) {
      if (field.dataTypeID === OID_PG_CHAR) field.dataTypeID = OID_PG_TEXT;
    }
  }
  return result;
}

function patchQueryMethod(prototype) {
  const originalQuery = prototype.query;
  prototype.query = function patchedQuery(...args) {
    const callbackIndex = args.findIndex((a) => typeof a === "function");
    if (callbackIndex >= 0) {
      const callback = args[callbackIndex];
      args[callbackIndex] = (err, result) =>
        callback(err, result && patchResultFields(result));
      return originalQuery.apply(this, args);
    }
    const result = originalQuery.apply(this, args);
    return result && typeof result.then === "function"
      ? result.then(patchResultFields)
      : result;
  };
}

patchQueryMethod(pg.Client.prototype);
patchQueryMethod(pg.Pool.prototype);

// ── Parse the arguments the CLI would pass to the native binary ─────────────
// e.g. --datamodels <path> [--datamodels <path> ...] --datasource <json>
const argv = process.argv.slice(2);
const datamodelPaths = [];
let datasourceJson = null;
for (let i = 0; i < argv.length; i++) {
  const arg = argv[i];
  if (arg === "--datamodels" && argv[i + 1]) datamodelPaths.push(argv[++i]);
  else if (arg === "--datasource" && argv[i + 1]) datasourceJson = argv[++i];
  else if (arg.startsWith("--") && argv[i + 1] && !argv[i + 1].startsWith("--")) i++;
}

// ── Resolve the connection string (CLI-provided datasource, else env) ───────
function resolveConnectionString() {
  if (datasourceJson) {
    try {
      const ds = JSON.parse(datasourceJson);
      if (typeof ds === "string") return ds;
      if (ds && typeof ds.url === "string") return ds.url;
    } catch {
      // fall through to env
    }
  }
  return process.env.DATABASE_URL;
}

// ── One-shot `cli` subcommands ──────────────────────────────────────────────
// The Prisma CLI also runs the engine binary as a one-shot command:
//   schema-engine --datasource <json> cli can-connect-to-database
//   schema-engine --datasource <json> cli create-database
// Exit code 0 means success. On failure the CLI parses stderr (from line 2
// onward) as JSON log lines and looks for an entry with
// target "schema_engine::logger" and fields.error_code — e.g. P1003 tells it
// the database does not exist yet, so it may offer to create it.
function printCliError(message, errorCode) {
  console.error(
    JSON.stringify({
      level: "INFO",
      fields: { message: "Starting schema engine" },
      target: "schema_engine",
    })
  );
  console.error(
    JSON.stringify({
      level: "ERROR",
      fields: { message, error_code: errorCode },
      target: "schema_engine::logger",
    })
  );
}

function pgErrorCode(err) {
  if (err?.code === "3D000") return "P1003"; // database does not exist
  if (err?.code === "28P01" || err?.code === "28000") return "P1000"; // auth failed
  return "P1001"; // can't reach the database server
}

async function createDatabaseByUrl(urlString) {
  const target = new URL(urlString);
  const databaseName = decodeURIComponent(target.pathname.replace(/^\//, ""));
  const adminUrl = new URL(target);
  adminUrl.pathname = "/postgres";
  const client = new pg.Client({ connectionString: adminUrl.toString() });
  await client.connect();
  try {
    await client.query(
      `CREATE DATABASE "${databaseName.replace(/"/g, '""')}"`
    );
  } finally {
    await client.end();
  }
  return databaseName;
}

async function runOneShotCommand(command) {
  const connectionString = resolveConnectionString();
  if (!connectionString) {
    printCliError("No connection string provided", "P1001");
    process.exit(1);
  }
  try {
    if (command === "can-connect-to-database") {
      const client = new pg.Client({
        connectionString,
        connectionTimeoutMillis: 10_000,
      });
      await client.connect();
      await client.query("SELECT 1");
      await client.end();
      process.exit(0);
    }
    if (command === "create-database") {
      await createDatabaseByUrl(connectionString);
      process.exit(0);
    }
    printCliError(`Unknown command: ${command}`, "P1001");
    process.exit(1);
  } catch (err) {
    printCliError(err?.message ?? String(err), pgErrorCode(err));
    process.exit(1);
  }
}

// ── Load the official WASM schema engine ────────────────────────────────────
// Same instantiation pattern as @prisma/internals' wasmSchemaEngineLoader:
// the bundler-target glue cannot import the .wasm file in Node directly,
// so the module is compiled from bytes and wired up manually.
async function loadSchemaEngineClass() {
  const runtime = await import("@prisma/schema-engine-wasm/schema_engine_bg");
  const wasmPath = path.join(
    path.dirname(require.resolve("@prisma/schema-engine-wasm")),
    "schema_engine_bg.wasm"
  );
  const bytes = await fs.promises.readFile(wasmPath);
  const wasmModule = new WebAssembly.Module(bytes);
  const instance = new WebAssembly.Instance(wasmModule, {
    "./schema_engine_bg.js": runtime,
  });
  runtime.__wbg_set_wasm(instance.exports);
  instance.exports.__wbindgen_start();
  return runtime.SchemaEngine;
}

// The `createDatabase` RPC is implemented with plain pg: the WASM engine
// has no equivalent (it assumes the target database already exists).
async function createDatabase(params, fallbackUrl) {
  const urlString = params?.datasource?.url ?? fallbackUrl;
  return { databaseName: await createDatabaseByUrl(urlString) };
}

function toRpcError(e) {
  const isObject = e !== null && typeof e === "object";
  const message =
    isObject && "message" in e ? String(e.message) : String(e ?? "Unknown error");
  const data = {
    is_panic: isObject && e.name === "RuntimeError",
    message,
  };
  // Known Prisma engine errors carry a Pxxxx code (e.g. P3005); forwarding it
  // lets the CLI render the proper user-facing error and exit code.
  if (isObject && typeof e.code === "string") data.error_code = e.code;
  if (isObject && "meta" in e) data.meta = e.meta;
  return { code: 4466, message, data };
}

async function main() {
  // One-shot mode: `schema-engine --datasource <json> cli <command>` must
  // run the check and exit — it does not speak JSON-RPC.
  const cliIndex = argv.indexOf("cli");
  if (cliIndex >= 0 && argv[cliIndex + 1]) {
    oneShotMode = true;
    await runOneShotCommand(argv[cliIndex + 1]);
    return;
  }

  log(`argv: ${JSON.stringify(process.argv.slice(2))}`);
  const connectionString = resolveConnectionString();
  if (!connectionString) {
    log("No connection string: pass --datasource or set DATABASE_URL.");
    process.exit(1);
  }

  const datamodels =
    datamodelPaths.length > 0
      ? datamodelPaths.map((p) => [p, fs.readFileSync(p, "utf8")])
      : undefined;

  const SchemaEngine = await loadSchemaEngineClass();
  const adapter = bindMigrationAwareSqlAdapterFactory(
    new PrismaPg({ connectionString })
  );
  // Engine log lines go to stderr only — stdout carries JSON-RPC exclusively.
  const engine = await SchemaEngine.new(
    { datamodels },
    (msg) => log("engine:", msg),
    adapter
  );

  const send = (obj) => process.stdout.write(JSON.stringify(obj) + "\n");

  async function handle({ id, method, params }) {
    log(`>> ${method} (id=${id})`);
    const startedAt = Date.now();
    const slowWarning = setTimeout(
      () => log(`still waiting for ${method} (id=${id}) after 30s…`),
      30_000
    );
    try {
      let result;
      if (method === "getDatabaseVersion") {
        result = await engine.version(params);
      } else if (method === "createDatabase") {
        result = await createDatabase(params, connectionString);
      } else if (typeof engine[method] === "function") {
        result = await engine[method](params);
      } else {
        send({
          jsonrpc: "2.0",
          id,
          error: { code: -32601, message: `Method not found: ${method}` },
        });
        return;
      }
      send({ jsonrpc: "2.0", id, result: result ?? {} });
    } catch (e) {
      send({ jsonrpc: "2.0", id, error: toRpcError(e) });
    } finally {
      clearTimeout(slowWarning);
      log(`${method} (id=${id}) finished in ${Date.now() - startedAt}ms`);
    }
  }

  // The CLI sends one request at a time and waits for the response; chain
  // handlers anyway so even pipelined requests stay serialized.
  let chain = Promise.resolve();
  const rl = readline.createInterface({ input: process.stdin });
  rl.on("line", (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let msg;
    try {
      msg = JSON.parse(trimmed);
    } catch {
      return;
    }
    if (!msg || typeof msg.method !== "string") return; // not a request
    chain = chain.then(() => handle(msg)).catch((e) => log("handler error:", e));
  });
  rl.on("close", () => process.exit(0));
}

main().catch((e) => {
  log("failed to start:", e);
  process.exit(1);
});
