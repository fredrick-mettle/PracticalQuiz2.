import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";
import { ipFromHeaders, rateLimit } from "@/lib/rate-limit";

/**
 * NextAuth (v4) configuration — credentials provider with JWT sessions.
 * The user's id and role are embedded in the JWT so the middleware can do
 * role checks on the Edge runtime without touching the database.
 *
 * Phase 11 hardening:
 * - Login attempts are rate-limited per IP+email and per IP.
 * - Unknown emails still pay a bcrypt compare (timing equalisation, so
 *   response time doesn't reveal whether an account exists).
 * - The JWT re-checks the account's status/role against the DB every
 *   5 minutes, so an admin suspension (Phase 10) also ends live sessions
 *   instead of only blocking the next sign-in.
 */

// Hash of a throwaway string at the same cost factor as real accounts.
// Not a secret and belongs to no user — it only exists so unknown-email
// logins take as long as real ones.
const DUMMY_PASSWORD_HASH =
  "$2b$12$h5i.qflhVIg.1jYPF/H4EOo4oFVVsBCOuKQrAmRiaCUHKynLJE0gm";

const STATUS_RECHECK_MS = 5 * 60 * 1000;

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days (NextAuth default is 30)
    updateAge: 24 * 60 * 60, // refresh the token at most once a day
  },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.trim().toLowerCase();

        const ip = ipFromHeaders((name) => req.headers?.[name]);
        const withinAccountLimit = rateLimit(`login:${ip}:${email}`, 10, 15 * 60 * 1000);
        const withinIpLimit = rateLimit(`login-ip:${ip}`, 30, 15 * 60 * 1000);
        if (!withinAccountLimit.ok || !withinIpLimit.ok) {
          console.warn(`[auth] login rate-limited for ${email} from ${ip}`);
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          await bcrypt.compare(parsed.data.password, DUMMY_PASSWORD_HASH);
          return null;
        }

        const passwordOk = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash
        );
        if (!passwordOk) return null;

        // Suspended/banned accounts (Phase 10) cannot sign in. Checked
        // after the password so the failure is indistinguishable.
        if (user.status !== "ACTIVE") return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.statusCheckedAt = Date.now();
        return token;
      }

      // Periodically re-validate against the DB: suspended, banned or
      // deleted accounts lose their session claims (getCurrentUser then
      // treats them as signed out), and role changes take effect without
      // forcing a fresh login.
      if (
        token.id &&
        Date.now() - (token.statusCheckedAt ?? 0) > STATUS_RECHECK_MS
      ) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { status: true, role: true },
        });
        if (!dbUser || dbUser.status !== "ACTIVE") {
          delete token.id;
          delete token.role;
        } else {
          token.role = dbUser.role;
          token.statusCheckedAt = Date.now();
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id && token.role) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
};
