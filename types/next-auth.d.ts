import type { Role } from "@/lib/generated/prisma/enums";
import "next-auth";
import "next-auth/jwt";

/** Adds `id` and `role` to NextAuth's session/user/JWT types. */
declare module "next-auth" {
  interface User {
    role: Role;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    /** Last DB re-validation of status/role (Phase 11), ms epoch. */
    statusCheckedAt?: number;
  }
}
