import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getDashboardRoute } from "@/lib/permissions";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET ?? "rightway-foods-fallback-secret-2026",
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email.toLowerCase().trim();
        const password = credentials.password;

        const user = await db.user.findUnique({
          where: { email },
          select: { id: true, name: true, email: true, password: true, role: true, isActive: true },
        });

        if (!user || !user.isActive) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as { id: string; role: string; dashboardRoute: string }).id = token.id as string;
        (session.user as { id: string; role: string; dashboardRoute: string }).role = token.role as string;
        (session.user as { id: string; role: string; dashboardRoute: string }).dashboardRoute = getDashboardRoute(token.role as string);
      }
      return session;
    },
  },
};

// Type augmentation for NextAuth v4
declare module "next-auth" {
  interface User {
    role: string;
  }
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      dashboardRoute: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}

// Re-export auth() helper for server components (v4 compatibility)
import { getServerSession } from "next-auth";
export async function auth() {
  return getServerSession(authOptions);
}
