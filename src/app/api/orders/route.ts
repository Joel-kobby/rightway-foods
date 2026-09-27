import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    guestName, guestPhone, guestEmail, guestAddress, guestRegion, guestCity,
    guestLandmark, deliveryNotes, deliveryZoneId, paymentMethod, items,
  } = body;

  if (!guestName || !guestPhone || !guestAddress || !items?.length) {
    return NextResponse.json({ error: "Name, phone, address, and items are required." }, { status: 400 });
  }

  // Validate and price each item
  let subtotal = 0;
  const resolvedItems: {
    productId: string; variantId: string; quantity: number;
    unitPrice: number; costPrice: number; discount: number; total: number;
  }[] = [];

  for (const item of items) {
    const variant = await db.productVariant.findUnique({
      where: { id: item.variantId },
      include: { inventory: true },
    });
    if (!variant || !variant.isActive) {
      return NextResponse.json({ error: "One or more products are unavailable." }, { status: 400 });
    }
    const unitPrice = item.unitPrice ?? variant.retailPrice;
    const itemTotal = unitPrice * item.quantity;
    subtotal += itemTotal;
    resolvedItems.push({
      productId: variant.productId, variantId: variant.id,
      quantity: item.quantity, unitPrice, costPrice: variant.costPrice,
      discount: 0, total: itemTotal,
    });
  }

  // Delivery fee
  const zone = deliveryZoneId ? await db.deliveryZone.findUnique({ where: { id: deliveryZoneId } }) : null;
  const freeThreshold = zone?.freeDeliveryThreshold;
  const deliveryFee = (freeThreshold && subtotal >= freeThreshold) ? 0 : (zone?.fee ?? 0);
  const total = subtotal + deliveryFee;

  // Generate order number
  const count = await db.order.count();
  const orderNumber = `RW-${new Date().getFullYear()}-${String(count + 1).padStart(6, "0")}`;

  const order = await db.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        orderNumber,
        guestName, guestPhone, guestEmail, guestAddress,
        guestRegion, guestCity, guestLandmark, deliveryNotes,
        deliveryZoneId: deliveryZoneId ?? null,
        deliveryFee, subtotal, total,
        paymentMethod, status: "PENDING", paymentStatus: "UNPAID",
        items: { create: resolvedItems },
      },
    });

    // Reserve inventory
    for (const item of resolvedItems) {
      await tx.inventory.updateMany({
        where: { variantId: item.variantId },
        data:  { reservedQty: { increment: item.quantity } },
      });
    }

    return order;
  });

  // Create delivery record
  await db.delivery.create({
    data: { orderId: order.id, zoneId: deliveryZoneId ?? null, status: "PENDING" },
  });

  return NextResponse.json({ orderNumber: order.orderNumber, id: order.id, total }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const orderNumber = searchParams.get("orderNumber");

  if (orderNumber) {
    const order = await db.order.findUnique({
      where: { orderNumber },
      include: { items: { include: { product: { select: { name: true } }, variant: { select: { name: true } } } }, deliveryZone: true },
    });
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    return NextResponse.json(order);
  }

  return NextResponse.json({ error: "orderNumber parameter required." }, { status: 400 });
}
