import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const ALLOWED = ["SUPER_ADMIN","ADMIN","CASHIER","BRANCH_MANAGER"];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !ALLOWED.includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { expectedCash, actualCash, explanation } = body;

  if (expectedCash === undefined || actualCash === undefined) {
    return NextResponse.json({ error: "expectedCash and actualCash are required." }, { status: 400 });
  }

  const difference = actualCash - expectedCash;
  const result     = difference === 0 ? "EXACT" : difference > 0 ? "EXCESS" : "SHORTAGE";

  if (result !== "EXACT" && !explanation) {
    return NextResponse.json({ error: "Explanation required for discrepancy." }, { status: 400 });
  }

  // Create or reuse today's cash session
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  let session_ = await db.cashSession.findFirst({
    where: { cashierId: session.user.id, openedAt: { gte: todayStart }, status: "OPEN" },
  });

  if (!session_) {
    session_ = await db.cashSession.create({
      data: {
        cashierId:      session.user.id,
        openingBalance: 0,
        status:         "OPEN",
      },
    });
  }

  // Close session and create reconciliation
  await db.$transaction(async (tx) => {
    await tx.cashSession.update({
      where: { id: session_.id },
      data:  { closedAt: new Date(), status: "RECONCILED", expectedCash, actualCash, difference },
    });

    await tx.cashReconciliation.upsert({
      where:  { sessionId: session_.id },
      update: { expectedCash, actualCash, difference, result, explanation },
      create: { sessionId: session_.id, expectedCash, actualCash, difference, result, explanation },
    });

    await tx.auditLog.create({
      data: {
        userId:   session.user.id,
        userRole: session.user.role,
        action:   "CASH_RECONCILED",
        entity:   "CashSession",
        entityId: session_.id,
        newValue: JSON.stringify({ expectedCash, actualCash, difference, result }),
      },
    });
  });

  return NextResponse.json({ success: true, result, difference });
}
