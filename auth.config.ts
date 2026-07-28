import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config (no DB adapter / Neon imports).
 * Used by middleware. Full config lives in auth.ts.
 */
export const authConfig = {
  providers: [],
  pages: {
    signIn: "/auth/sign-in",
    verifyRequest: "/auth/sign-in?sent=1",
    error: "/auth/sign-in",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized() {
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
