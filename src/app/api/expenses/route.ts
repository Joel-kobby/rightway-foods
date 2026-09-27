import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const RECORD_ALLOWED = ["SUPER_ADMIN","ADMIN","CASHIER","BRANCH_MANAGER"];

export async function GET() {
  const session = await auth();
  if (!session?.user || !RECORD_ALLOWED.includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const expenses = await db.expense.findMany({
    include: {
      category:   { select: { name: true } },
      recordedBy: { select: { name: true } },
    },
    orderBy: { expenseDate: "desc" },
    take: 200,
  });
  return NextResponse.json(expenses);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !RECORD_ALLOWED.includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { categoryId, amount, description, paymentMethod, reference, cashSessionId } = body;

  if (!categoryId || !amount || !description || !paymentMethod) {
    return NextResponse.json({ error: "categoryId, amount, description, and paymentMethod are required." }, { status: 400 });
  }

  const count = await db.expense.count();
  const expenseRef = `RWE-${new Date().getFullYear()}-${String(count + 1).padStart(6, "0")}`;

  const expense = await db.expense.create({
    data: {
      expenseRef, categoryId, amount, description,
      paymentMethod, reference,
      recordedById: session.user.id,
      cashSessionId: cashSessionId ?? null,
      approvalStatus: "APPROVED",
    },
  });

  await db.auditLog.create({
    data: {
      userId: session.user.id, userRole: session.user.role,
      action: "EXPENSE_RECORDED", entity: "Expense", entityId: expense.id,
      newValue: JSON.stringify({ expenseRef, amount, description }),
    },
  });

  return NextResponse.json(expense, { status: 201 });
}
