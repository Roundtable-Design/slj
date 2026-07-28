import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { authConfig } from "@/auth.config";
import { getDb } from "@/lib/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "@/lib/db/schema";

const emailFrom =
  process.env.AUTH_EMAIL_FROM ??
  "Simplicity Love & Justice <onboarding@resend.dev>";

function buildProviders(): Provider[] {
  const providers: Provider[] = [
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY ?? process.env.RESEND_API_KEY,
      from: emailFrom,
    }),
  ];

  if (process.env.AUTH_E2E_SECRET || process.env.AUTH_DEV_LOGIN === "1") {
    providers.push(
      Credentials({
        id: "e2e",
        name: "E2E",
        credentials: {
          email: { label: "Email", type: "email" },
          secret: { label: "Secret", type: "password" },
        },
        async authorize(credentials) {
          const email =
            typeof credentials?.email === "string"
              ? credentials.email.trim().toLowerCase()
              : "";
          const secret =
            typeof credentials?.secret === "string" ? credentials.secret : "";
          const expected = process.env.AUTH_E2E_SECRET;
          const allowDev =
            process.env.AUTH_DEV_LOGIN === "1" &&
            process.env.NODE_ENV !== "production";

          if (!email || !email.includes("@")) return null;
          if (expected) {
            if (secret !== expected) return null;
          } else if (!allowDev) {
            return null;
          }

          const db = getDb();
          const existing = await db.query.users.findFirst({
            where: eq(users.email, email),
          });
          if (existing) {
            return {
              id: existing.id,
              email: existing.email ?? email,
              name: existing.name,
              image: existing.image,
            };
          }
          const [created] = await db
            .insert(users)
            .values({
              email,
              emailVerified: new Date(),
            })
            .returning();
          return {
            id: created.id,
            email: created.email ?? email,
            name: created.name,
            image: created.image,
          };
        },
      })
    );
  }

  return providers;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(getDb(), {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: buildProviders(),
});
