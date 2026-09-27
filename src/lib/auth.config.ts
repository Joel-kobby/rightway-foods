// Lightweight auth config — edge-safe (no bcrypt, no Prisma)
import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [],
  callbacks: {
    authorized() {
      return true; // full RBAC handled in middleware.ts via getToken()
    },
  },
};
