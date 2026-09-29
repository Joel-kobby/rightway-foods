import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dateFrom = searchParams.get("from");
  const dateTo = searchParams.get("to");
  const isAdmin = ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "BRANCH_MANAGER", "AUDITOR"].includes(session.user.role);

  const where: Record<string, unknown> = {};
  if (!isAdmin) where.salespersonId = session.user.id; // salesperson sees only own sales
  if (dateFrom || dateTo) {
    where.saleDate = {
      ...(dateFrom && { gte: new Date(dateFrom) }),
      ...(dateTo && { lte: new Date(dateTo) }),
    };
  }

  const sales = await db.sale.findMany({
    where,
    include: {
      customer: { select: { firstName: true, lastName: true, businessName: true, customerId: true } },
      salesperson: { select: { name: true } },
      items: {
        include: {
          product: { select: { name: true } },
          variant: { select: { name: true, sku: true } },
        },
      },
      payments: true,
    },
    orderBy: { saleDate: "desc" },
    take: 200,
  });

  return NextResponse.json(sales);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = ["SUPER_ADMIN", "ADMIN", "SALESPERSON", "BRANCH_MANAGER"];
  if (!allowed.includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { customerId, items, paymentStatus, paymentMethod, discount, notes, cashSessionId } = body;

  if (!items?.length) return NextResponse.json({ error: "At least one item is required." }, { status: 400 });

  // Generate sale number
  const count = await db.sale.count();
  const saleNumber = `RWS-${new Date().getFullYear()}-${String(count + 1).padStart(6, "0")}`;

  // Fetch variant prices and validate stock
  let subtotal = 0, costTotal = 0;
  const resolvedItems: {
    productId: string; variantId: string; quantity: number;
    unitPrice: number; costPrice: number; discount: number; total: number; grossProfit: number;
  }[] = [];

  for (const item of items) {
    const variant = await db.productVariant.findUnique({
      where: { id: item.variantId },
      include: { inventory: true },
    });
    if (!variant || !variant.isActive) {
      return NextResponse.json({ error: `Product variant not found or inactive.` }, { status: 400 });
    }

    const unitPrice = item.overridePrice ?? variant.retailPrice;
    const itemDiscount = item.discount ?? 0;

    // Enforce minimum selling price
    if (unitPrice < variant.minSellingPrice && session.user.role === "SALESPERSON") {
      return NextResponse.json({
        error: `Price for ${variant.name} (₵${unitPrice}) is below the minimum allowed (₵${variant.minSellingPrice}). Requires approval.`,
        requiresApproval: true,
      }, { status: 422 });
    }

    const itemTotal = (unitPrice * item.quantity) - itemDiscount;
    const itemCost = Number(variant.costPrice) * item.quantity;
    const itemProfit = itemTotal - itemCost;

    subtotal += itemTotal;
    costTotal += itemCost;

    resolvedItems.push({
      productId: variant.productId,
      variantId: variant.id,
      quantity: item.quantity,
      unitPrice,
      costPrice: Number(variant.costPrice),
      discount: itemDiscount,
      total: itemTotal,
      grossProfit: itemProfit,
    });
  }

  const totalDiscount = discount ?? 0;
  const total = subtotal - totalDiscount;
  const grossProfit = total - costTotal;

  // Create sale + items + update inventory in a transaction
  const sale = await db.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        saleNumber,
        customerId: customerId ?? null,
        salespersonId: session.user.id,
        cashSessionId: cashSessionId ?? null,
        subtotal,
        discount: totalDiscount,
        total,
        costTotal,
        grossProfit,
        paymentStatus: paymentStatus ?? "UNPAID",
        notes,
        items: {
          create: resolvedItems,
        },
      },
      include: { items: true },
    });

    // Reduce inventory for each item
    for (const item of resolvedItems) {
      const inv = await tx.inventory.findUnique({ where: { variantId: item.variantId } });
      if (!inv) continue;

      const newQty = Number(inv.quantity) - item.quantity;

      await tx.inventory.update({
        where: { id: inv.id },
        data: { quantity: newQty },
      });

      await tx.inventoryMovement.create({
        data: {
          inventoryId: inv.id,
          type: "SALE",
          quantity: -item.quantity,
          balanceAfter: newQty,
          reason: `Sale ${saleNumber}`,
          reference: sale.id,
          performedById: session.user.id,
        },
      });
    }

    // Update customer totals
    if (customerId) {
      await tx.customer.update({
        where: { id: customerId },
        data: {
          totalPurchases: { increment: total },
          outstandingBalance: paymentStatus === "UNPAID" ? { increment: total } : undefined,
          lastPurchaseAt: new Date(),
        },
      });
    }

    // Record payment if paid immediately
    if (paymentStatus === "PAID" && paymentMethod) {
      const pCount = await tx.payment.count();
      await tx.payment.create({
        data: {
          transactionId: `RWP-${new Date().getFullYear()}-${String(pCount + 1).padStart(6, "0")}`,
          saleId: sale.id,
          customerId: customerId ?? null,
          cashierId: session.user.id,
          cashSessionId: cashSessionId ?? null,
          amount: total,
          paymentMethod: paymentMethod,
          status: "CONFIRMED",
        },
      });
    }

    return sale;
  });

  // Audit log
  await db.auditLog.create({
    data: {
      userId: session.user.id,
      userRole: session.user.role,
      action: "SALE_CREATED",
      entity: "Sale",
      entityId: sale.id,
      newValue: JSON.stringify({ saleNumber, total, items: resolvedItems.length }),
    },
  });

  return NextResponse.json(sale, { status: 201 });
}
