import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth-helpers";
import { countPendingProperties } from "@/lib/services/admin";
import { AdminNav } from "@/components/admin/admin-nav";

/**
 * Admin shell (Phase 10): ADMIN-only gate for every /admin page,
 * plus the shared header and section tabs.
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireRole("ADMIN");
  const pendingCount = await countPendingProperties();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
        Admin Panel
      </h1>
      <div className="mt-4">
        <AdminNav pendingCount={pendingCount} />
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}
