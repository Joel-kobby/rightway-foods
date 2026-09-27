import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";

// GET /api/products — list all products (admin) or active only (public)
export async function GET(req: NextRequest) {
  const session = await auth();
  const isAdminUser = session?.user && isAdmin(session.user.role);
  const { searchParams } = new URL(req.url);
  const categorySlug = searchParams.get("category");
  const search = searchParams.get("q");

  const where: Record<string, unknown> = {};
  if (!isAdminUser) where.isActive = true;
  if (categorySlug) where.category = { slug: categorySlug };
  if (search) where.name = { contains: search };

  const products = await db.product.findMany({
    where,
    include: {
      category: { select: { id: true, name: true, slug: true } },
      variants: {
        where: isAdminUser ? {} : { isActive: true },
        include: { inventory: { select: { quantity: true } } },
      },
      supplier: { select: { id: true, name: true } },
      _count: { select: { saleItems: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(products);
}

// POST /api/products — create product (admin only)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, description, categoryId, unit, imageUrl, supplierId, reorderLevel, variants } = body;

  if (!name || !categoryId || !unit || !variants?.length) {
    return NextResponse.json({ error: "Missing required fields: name, categoryId, unit, variants" }, { status: 400 });
  }

  const slug = slugify(name);
  const sku = `RW-${name.slice(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  // Check slug uniqueness
  const existing = await db.product.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "A product with this name already exists." }, { status: 409 });
  }

  const product = await db.product.create({
    data: {
      sku,
      name,
      slug,
      description,
      categoryId,
      unit,
      imageUrl,
      supplierId,
      reorderLevel: reorderLevel ?? 10,
      variants: {
        create: variants.map((v: {
          name: string; unit: string; costPrice: number; retailPrice: number;
          wholesalePrice?: number; minSellingPrice: number;
        }) => ({
          name: v.name,
          sku: `${sku}-${slugify(v.name).toUpperCase().slice(0, 4)}`,
          unit: v.unit,
          costPrice: v.costPrice,
          retailPrice: v.retailPrice,
          wholesalePrice: v.wholesalePrice ?? null,
          minSellingPrice: v.minSellingPrice,
        })),
      },
    },
    include: { variants: true, category: true },
  });

  // Create inventory records for each variant
  for (const variant of product.variants) {
    const inv = await db.inventory.create({
      data: { productId: product.id, variantId: variant.id, quantity: 0 },
    });
    await db.inventoryMovement.create({
      data: {
        inventoryId: inv.id,
        type: "OPENING_STOCK",
        quantity: 0,
        balanceAfter: 0,
        reason: "Product created",
        performedById: session.user.id,
      },
    });
  }

  // Audit log
  await db.auditLog.create({
    data: {
      userId: session.user.id,
      userRole: session.user.role,
      action: "PRODUCT_CREATED",
      entity: "Product",
      entityId: product.id,
      newValue: JSON.stringify({ name, sku }),
    },
  });

  return NextResponse.json(product, { status: 201 });
}
