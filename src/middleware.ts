// Middleware runs on Edge Runtime — must NOT import bcrypt, Prisma, or Node.js modules.
// We decode the JWT directly to read role + dashboardRoute.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PROTECTED_PREFIXES = ["/admin", "/sales", "/cashier", "/inventory", "/reports", "/audit", "/delivery"];
const ADMIN_ONLY_PREFIXES = ["/admin"];
const PUBLIC_PREFIXES = [
  "/home", "/products", "/about", "/contact", "/cart",
  "/checkout", "/order", "/askgod", "/delivery-policy", "/privacy",
  "/_next", "/favicon.ico", "/api/auth",
];

function isAdmin(role: string) { return ["SUPER_ADMIN", "ADMIN"].includes(role); }
function isStaff(role: string) {
  return ["SUPER_ADMIN", "ADMIN", "SALESPERSON", "CASHIER", "INVENTORY_OFFICER",
    "ACCOUNTANT", "BRANCH_MANAGER", "CUSTOMER_SERVICE", "DELIVERY_RIDER", "AUDITOR"].includes(role);
}

function getDashboard(role: string): string {
  switch (role) {
    case "SUPER_ADMIN": case "ADMIN": case "BRANCH_MANAGER": return "/admin";
    case "SALESPERSON": return "/sales";
    case "CASHIER": return "/cashier";
    case "INVENTORY_OFFICER": return "/inventory";
    case "ACCOUNTANT": return "/reports";
    default: return "/sales";
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always pass public paths through
  if (PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Decode JWT — edge-safe, no bcrypt
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? "rightway-foods-fallback-secret-2026",
  });

  const role = token?.role as string | undefined;
  const dashboardRoute = role ? getDashboard(role) : "/login";

  // Unauthenticated → login
  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p));
  if (isProtected && !token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin-only
  const isAdminRoute = ADMIN_ONLY_PREFIXES.some(p => pathname.startsWith(p));
  if (isAdminRoute && role && !isAdmin(role)) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // Staff-only
  if (isProtected && role && !isStaff(role)) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // Already logged in + visiting /login → go to dashboard
  if (pathname === "/login" && token) {
    return NextResponse.redirect(new URL(dashboardRoute, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$).*)",
  ],
};
