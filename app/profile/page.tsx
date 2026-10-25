import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { roleLabel } from "@/lib/utils";

export const metadata: Metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const sessionUser = await requireUser();

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  // Account was deleted after the session was issued.
  if (!user) redirect("/login");

  const rows = [
    { label: "Full name", value: user.name },
    { label: "Email address", value: user.email },
    { label: "Phone number", value: user.phone },
    { label: "Account type", value: roleLabel(user.role) },
    { label: "Account status", value: user.status },
    {
      label: "Member since",
      value: user.createdAt.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
        My Profile
      </h1>
      <p className="mt-2 text-slate-600">
        Your RentGH account details. Profile editing can be added in a later
        phase.
      </p>

      <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <dl className="divide-y divide-slate-100">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex flex-col gap-0.5 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <dt className="text-sm font-medium text-slate-500">
                {row.label}
              </dt>
              <dd className="text-sm font-medium text-slate-900">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
