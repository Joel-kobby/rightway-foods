import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const userCount = await db.user.count();
    const users = await db.user.findMany({
      select: { email: true, role: true, isActive: true },
    });
    return NextResponse.json({
      status: "ok",
      database: "connected",
      userCount,
      users,
      authSecret: process.env.AUTH_SECRET ? "SET" : "MISSING",
      nextauthUrl: process.env.NEXTAUTH_URL ?? "MISSING",
    });
  } catch (e: unknown) {
    return NextResponse.json({
      status: "error",
      message: e instanceof Error ? e.message : "Unknown error",
      authSecret: process.env.AUTH_SECRET ? "SET" : "MISSING",
    }, { status: 500 });
  }
}
