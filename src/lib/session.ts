// Helper to get session in Server Components (NextAuth v4)
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function auth() {
  return getServerSession(authOptions);
}
