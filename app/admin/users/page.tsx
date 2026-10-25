import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth-helpers";
import { listUsers } from "@/lib/services/admin";
import {
  USER_STATUSES,
  USER_STATUS_LABELS,
} from "@/lib/constants";
import { roleLabel } from "@/lib/utils";
import { UserStatusBadge } from "@/components/admin/user-status-badge";
import { UserStatusActions } from "@/components/admin/user-status-actions";
import type { Role, UserStatus } from "@/lib/generated/prisma/enums";

export const metadata: Metadata = { title: "Users (Admin)" };

const ROLES = ["TENANT", "AGENT", "ADMIN"] as const;

interface PageProps {
  searchParams: { q?: string; role?: string; status?: string; page?: string };
}

function parseRole(raw?: string): Role | undefined {
  return ROLES.includes(raw as Role) ? (raw as Role) : undefined;
}
function parseStatus(raw?: string): UserStatus | undefined {
  return USER_STATUSES.includes(raw as UserStatus)
    ? (raw as UserStatus)
    : undefined;
}

function href(params: {
  q?: string;
  role?: Role;
  status?: UserStatus;
  page?: number;
}): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.role) sp.set("role", params.role);
  if (params.status) sp.set("status", params.status);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return qs ? `/admin/users?${qs}` : "/admin/users";
}

function formatWhen(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const selectClass =
  "rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const me = await getCurrentUser();
  const q = searchParams.q?.trim() ? searchParams.q.trim() : undefined;
  const role = parseRole(searchParams.role);
  const status = parseStatus(searchParams.status);
  const page = Math.max(1, Number.parseInt(searchParams.page ?? "1", 10) || 1);

  const { users, total, totalPages } = await listUsers({
    q,
    role,
    status,
    page,
  });

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900">Users</h2>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
        Suspended or banned users can&apos;t sign in (a session that&apos;s
        already active runs until it expires). Suspending an agent does
        not unpublish their listings — moderate those separately. You
        can&apos;t change your own account or other admins here.
      </p>

      <form method="get" className="mt-5 flex flex-wrap gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search name or email…"
          className="w-full max-w-xs rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        />
        <select name="role" defaultValue={role ?? ""} className={selectClass} aria-label="Role">
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {roleLabel(r)}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={status ?? ""}
          className={selectClass}
          aria-label="Account status"
        >
          <option value="">All statuses</option>
          {USER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {USER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Filter
        </button>
        {(q || role || status) && (
          <Link
            href="/admin/users"
            className="inline-flex items-center px-2 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Clear
          </Link>
        )}
      </form>

      {users.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
          <p className="font-semibold text-slate-800">No users found</p>
          <p className="mt-1 text-sm text-slate-600">
            Try a different search or filter.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {users.map((user) => {
            const isMe = user.id === me?.id;
            return (
              <li
                key={user.id}
                className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <span
                  className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800"
                  aria-hidden="true"
                >
                  {initials(user.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-slate-900">
                    {user.name}
                    {isMe && (
                      <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-semibold text-white">
                        You
                      </span>
                    )}
                    <UserStatusBadge status={user.status} />
                  </p>
                  <p className="truncate text-sm text-slate-600">
                    {user.email} · {user.phone}
                  </p>
                  <p className="text-xs text-slate-500">
                    {roleLabel(user.role)} · {user._count.properties}{" "}
                    listings · {user._count.inquiriesSent} inquiries sent ·
                    joined {formatWhen(user.createdAt)}
                  </p>
                </div>
                {isMe ? (
                  <span className="text-sm text-slate-400">—</span>
                ) : user.role === "ADMIN" ? (
                  <span className="text-sm font-medium text-slate-400">
                    Admin
                  </span>
                ) : (
                  <UserStatusActions
                    userId={user.id}
                    userName={user.name}
                    status={user.status}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Page {page} of {totalPages} · {total} users
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={href({ q, role, status, page: page - 1 })}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={href({ q, role, status, page: page + 1 })}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
