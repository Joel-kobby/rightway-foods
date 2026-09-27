import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { settings } = body as { settings: Record<string, string> };

  for (const [key, value] of Object.entries(settings)) {
    await db.systemSetting.upsert({
      where:  { key },
      update: { value },
      create: { key, value, group: "general" },
    });
  }

  return NextResponse.json({ success: true });
}
