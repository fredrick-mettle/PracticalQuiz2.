import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { roleHomePath } from "@/lib/utils";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(roleHomePath(user.role));

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <AuthCard
        title="Welcome back"
        subtitle="Log in to your RentGH account"
        footer={
          <>
            New to RentGH?{" "}
            <Link
              href="/register"
              className="font-semibold text-emerald-700 hover:underline"
            >
              Create an account
            </Link>
          </>
        }
      >
        {/* LoginForm reads ?callbackUrl= via useSearchParams */}
        <Suspense>
          <LoginForm />
        </Suspense>
      </AuthCard>

      {/* Development convenience: seed accounts (removed before production). */}
      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
        <p className="font-semibold">Demo accounts (seed data)</p>
        <p>
          Admin: admin@rentgh.com · Agent: kwame.mensah@rentgh.com · Tenant:
          yaw.danso@gmail.com — password for all:{" "}
          <span className="font-mono font-semibold">Password123!</span>
        </p>
      </div>
    </div>
  );
}
