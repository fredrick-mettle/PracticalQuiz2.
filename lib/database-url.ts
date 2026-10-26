/**
 * Restores libpq `sslmode` semantics for node-postgres connection strings.
 *
 * Current `pg` / `pg-connection-string` treats `prefer`, `require`, and
 * `verify-ca` as aliases for `verify-full`. That breaks against Supabase's
 * pooler because its certificate chains to Supabase's own root CA, which is
 * not in Node's trust store (SELF_SIGNED_CERT_IN_CHAIN). `uselibpqcompat=true`
 * opts back into libpq semantics for those modes: encrypted, with chain
 * verification only when a root certificate is also supplied.
 * `verify-full` and `disable` are deliberately left untouched.
 */
export function withLibpqSslCompat(connectionString: string): string {
  const queryIndex = connectionString.indexOf("?");
  if (queryIndex === -1) return connectionString;

  const params = new URLSearchParams(connectionString.slice(queryIndex + 1));
  if (params.has("uselibpqcompat")) return connectionString;

  const sslmode = params.get("sslmode")?.toLowerCase();
  if (sslmode === "prefer" || sslmode === "require" || sslmode === "verify-ca") {
    return `${connectionString}&uselibpqcompat=true`;
  }
  return connectionString;
}
