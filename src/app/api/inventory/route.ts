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
  const { inventoryId, type, quantity, reason } = body;

  if (!inventoryId || !type || !quantity || !reason) {
    return NextResponse.json({ error: "inventoryId, type, quantity, and reason are required." }, { status: 400 });
  }

  const inv = await db.inventory.findUnique({ where: { id: inventoryId } });
  if (!inv) return NextResponse.json({ error: "Inventory record not found." }, { status: 404 });

  const isIn = ["PURCHASE","RETURN_IN","ADJUSTMENT_IN","OPENING_STOCK","TRANSFER_IN"].includes(type);
  const delta = isIn ? Math.abs(quantity) : -Math.abs(quantity);
  const newQty = inv.quantity + delta;

  if (newQty < 0) {
    return NextResponse.json({ error: `Insufficient stock. Current: ${inv.quantity}, requested reduction: ${Math.abs(quantity)}` }, { status: 422 });
  }

  await db.$transaction(async (tx) => {
    await tx.inventory.update({ where: { id: inventoryId }, data: { quantity: newQty } });
    await tx.inventoryMovement.create({
      data: {
        inventoryId,
        type,
        quantity:     delta,
        balanceAfter: newQty,
        reason,
        performedById: session.user.id,
      },
    });
    await tx.auditLog.create({
      data: {
        userId:        session.user.id,
        userRole:      session.user.role,
        action:        "INVENTORY_ADJUSTED",
        entity:        "Inventory",
        entityId:      inventoryId,
        previousValue: JSON.stringify({ quantity: inv.quantity }),
        newValue:      JSON.stringify({ quantity: newQty, type, reason }),
      },
    });
  });

  return NextResponse.json({ success: true, newQuantity: newQty });
}
