import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";

// PATCH /api/products/[id]/variants — update pricing for a variant
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { variantId, costPrice, retailPrice, wholesalePrice, minSellingPrice, reason } = body;

  if (!variantId) return NextResponse.json({ error: "variantId required" }, { status: 400 });

  const variant = await db.productVariant.findUnique({ where: { id: variantId } });
  if (!variant || variant.productId !== params.id) {
    return NextResponse.json({ error: "Variant not found" }, { status: 404 });
  }

  // Save price history before changing — critical for historical accuracy
  await db.priceHistory.create({
    data: {
      variantId: variant.id,
      costPrice:       variant.costPrice,
      retailPrice:     variant.retailPrice,
      wholesalePrice:  variant.wholesalePrice ?? null,
      minSellingPrice: variant.minSellingPrice,
      changedById: session.user.id,
      reason: reason ?? "Price update",
    },
  });

  const updated = await db.productVariant.update({
    where: { id: variantId },
    data: {
      ...(costPrice       !== undefined && { costPrice }),
      ...(retailPrice     !== undefined && { retailPrice }),
      ...(wholesalePrice  !== undefined && { wholesalePrice }),
      ...(minSellingPrice !== undefined && { minSellingPrice }),
    },
  });

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      userRole: session.user.role,
      action: "PRICE_CHANGED",
      entity: "ProductVariant",
      entityId: variantId,
      previousValue: JSON.stringify({ costPrice: variant.costPrice, retailPrice: variant.retailPrice }),
      newValue: JSON.stringify({ costPrice: updated.costPrice, retailPrice: updated.retailPrice }),
    },
  });

  return NextResponse.json(updated);
}

// POST /api/products/[id]/variants — add a new variant
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const product = await db.product.findUnique({ where: { id: params.id } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const body = await req.json();
  const { name, unit, costPrice, retailPrice, wholesalePrice, minSellingPrice } = body;

  const sku = `${product.sku}-${slugify(name).toUpperCase().slice(0, 4)}-${Date.now().toString(36).toUpperCase()}`;

  const variant = await db.productVariant.create({
    data: { productId: params.id, name, sku, unit, costPrice, retailPrice, wholesalePrice, minSellingPrice },
  });

  // Create inventory record
  const inv = await db.inventory.create({
    data: { productId: params.id, variantId: variant.id, quantity: 0 },
  });
  await db.inventoryMovement.create({
    data: { inventoryId: inv.id, type: "OPENING_STOCK", quantity: 0, balanceAfter: 0, reason: "Variant added", performedById: session.user.id },
  });

  return NextResponse.json(variant, { status: 201 });
}
