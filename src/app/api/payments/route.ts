import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const ALLOWED = ["SUPER_ADMIN","ADMIN","CASHIER","BRANCH_MANAGER"];

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !ALLOWED.includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const saleId = searchParams.get("saleId");
  const where = saleId ? { saleId } : {};

  const payments = await db.payment.findMany({
    where,
    include: {
      sale:    { select: { saleNumber: true, total: true } },
      customer:{ select: { firstName: true, lastName: true, businessName: true } },
      cashier: { select: { name: true } },
    },
    orderBy: { paidAt: "desc" },
    take: 200,
  });

  return NextResponse.json(payments);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !ALLOWED.includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { saleId, orderId, customerId, amount, paymentMethod, reference, notes, cashSessionId } = body;

  if (!amount || !paymentMethod) {
    return NextResponse.json({ error: "amount and paymentMethod are required." }, { status: 400 });
  }

  if (!saleId && !orderId) {
    return NextResponse.json({ error: "Either saleId or orderId is required." }, { status: 400 });
  }

  // Check for duplicate payment on same sale (idempotency guard)
  if (saleId) {
    const sale = await db.sale.findUnique({ where: { id: saleId } });
    if (!sale) return NextResponse.json({ error: "Sale not found." }, { status: 404 });
    if (sale.paymentStatus === "PAID") {
      return NextResponse.json({ error: "This sale is already fully paid. Duplicate payment blocked." }, { status: 409 });
    }
  }

  const count = await db.payment.count();
  const transactionId = `RWP-${new Date().getFullYear()}-${String(count + 1).padStart(6, "0")}`;

  const payment = await db.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        transactionId, saleId, orderId, customerId,
        cashierId:    session.user.id,
        cashSessionId,
        amount, paymentMethod, reference, notes,
        status: "CONFIRMED",
      },
    });

    // Update sale payment status
    if (saleId) {
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: { payments: true },
      });
      if (sale) {
        const totalPaid = sale.payments.reduce((s, p) => s + p.amount, 0) + amount;
        const newStatus = totalPaid >= sale.total ? "PAID" : "PARTIAL";
        await tx.sale.update({ where: { id: saleId }, data: { paymentStatus: newStatus } });

        // Update customer outstanding
        if (sale.customerId) {
          await tx.customer.update({
            where: { id: sale.customerId },
            data:  { outstandingBalance: { decrement: amount } },
          });
        }
      }
    }

    return payment;
  });

  await db.auditLog.create({
    data: {
      userId:   session.user.id,
      userRole: session.user.role,
      action:   "PAYMENT_RECORDED",
      entity:   "Payment",
      entityId: payment.id,
      newValue: JSON.stringify({ transactionId, amount, paymentMethod }),
    },
  });

  return NextResponse.json(payment, { status: 201 });
}
