import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const product = await db.product.findUnique({
    where: { id: params.id },
    include: {
      category: true,
      supplier: true,
      variants: {
        include: {
          inventory: { select: { quantity: true, reservedQty: true } },
          priceHistory: { orderBy: { effectiveFrom: "desc" }, take: 5 },
        },
      },
    },
  });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, description, categoryId, unit, imageUrl, supplierId, reorderLevel, isActive } = body;

  const existing = await db.product.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const product = await db.product.update({
    where: { id: params.id },
    data: {
      ...(name        !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(categoryId  !== undefined && { categoryId }),
      ...(unit        !== undefined && { unit }),
      ...(imageUrl    !== undefined && { imageUrl }),
      ...(supplierId  !== undefined && { supplierId }),
      ...(reorderLevel!== undefined && { reorderLevel }),
      ...(isActive    !== undefined && { isActive }),
    },
    include: { variants: true, category: true },
  });

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      userRole: session.user.role,
      action: "PRODUCT_UPDATED",
      entity: "Product",
      entityId: params.id,
      previousValue: JSON.stringify({ name: existing.name, isActive: existing.isActive }),
      newValue: JSON.stringify({ name: product.name, isActive: product.isActive }),
    },
  });

  return NextResponse.json(product);
}
