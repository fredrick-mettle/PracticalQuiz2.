import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { roleHomePath } from "@/lib/utils";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect(roleHomePath(user.role));

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <AuthCard
        title="Create your account"
        subtitle="Join RentGH to find a place — or list one"
        footer={
          <>
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-emerald-700 hover:underline"
            >
              Log in
            </Link>
          </>
        }
      >
        <RegisterForm />
      </AuthCard>
    </div>
  );
}
