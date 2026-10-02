/**
 * RightWay Foods — Pricing Update Script
 * Updates Palm Oil and Coconut Oil variants with correct prices
 * Safe to run multiple times (idempotent)
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("💰 Updating product pricing...");

  // ─── PALM OIL PRICES ────────────────────────────────────
  // 200ml = ₵10, 500ml = ₵25, 1L = ₵45, 5L = ₵230

  await db.productVariant.upsert({
    where: { sku: "RW-PO-200ML" },
    update: { retailPrice: 10, costPrice: 6, wholesalePrice: 8, minSellingPrice: 8, name: "200ml", unit: "200ml bottle" },
    create: { productId: (await db.product.findUniqueOrThrow({ where: { slug: "palm-oil" } })).id, name: "200ml", sku: "RW-PO-200ML", unit: "200ml bottle", costPrice: 6, retailPrice: 10, wholesalePrice: 8, minSellingPrice: 8 },
  });

  await db.productVariant.upsert({
    where: { sku: "RW-PO-500ML" },
    update: { retailPrice: 25, costPrice: 15, wholesalePrice: 22, minSellingPrice: 20, name: "500ml", unit: "500ml bottle" },
    create: { productId: (await db.product.findUniqueOrThrow({ where: { slug: "palm-oil" } })).id, name: "500ml", sku: "RW-PO-500ML", unit: "500ml bottle", costPrice: 15, retailPrice: 25, wholesalePrice: 22, minSellingPrice: 20 },
  });

  await db.productVariant.upsert({
    where: { sku: "RW-PO-1L" },
    update: { retailPrice: 45, costPrice: 28, wholesalePrice: 40, minSellingPrice: 35, name: "1 Litre", unit: "1 litre bottle" },
    create: { productId: (await db.product.findUniqueOrThrow({ where: { slug: "palm-oil" } })).id, name: "1 Litre", sku: "RW-PO-1L", unit: "1 litre bottle", costPrice: 28, retailPrice: 45, wholesalePrice: 40, minSellingPrice: 35 },
  });

  await db.productVariant.upsert({
    where: { sku: "RW-PO-5L" },
    update: { retailPrice: 230, costPrice: 150, wholesalePrice: 210, minSellingPrice: 190, name: "5 Litres", unit: "5 litre container" },
    create: { productId: (await db.product.findUniqueOrThrow({ where: { slug: "palm-oil" } })).id, name: "5 Litres", sku: "RW-PO-5L", unit: "5 litre container", costPrice: 150, retailPrice: 230, wholesalePrice: 210, minSellingPrice: 190 },
  });

  console.log("✅ Palm Oil: 200ml=₵10 | 500ml=₵25 | 1L=₵45 | 5L=₵230");

  // ─── COCONUT OIL PRICES ─────────────────────────────────
  // 500ml = ₵40, 1L = ₵80, 5L = ₵400

  await db.productVariant.upsert({
    where: { sku: "RW-CO-500ML" },
    update: { retailPrice: 40, costPrice: 25, wholesalePrice: 35, minSellingPrice: 32, name: "500ml", unit: "500ml bottle" },
    create: { productId: (await db.product.findUniqueOrThrow({ where: { slug: "coconut-oil" } })).id, name: "500ml", sku: "RW-CO-500ML", unit: "500ml bottle", costPrice: 25, retailPrice: 40, wholesalePrice: 35, minSellingPrice: 32 },
  });

  await db.productVariant.upsert({
    where: { sku: "RW-CO-1L" },
    update: { retailPrice: 80, costPrice: 50, wholesalePrice: 70, minSellingPrice: 65, name: "1 Litre", unit: "1 litre bottle" },
    create: { productId: (await db.product.findUniqueOrThrow({ where: { slug: "coconut-oil" } })).id, name: "1 Litre", sku: "RW-CO-1L", unit: "1 litre bottle", costPrice: 50, retailPrice: 80, wholesalePrice: 70, minSellingPrice: 65 },
  });

  await db.productVariant.upsert({
    where: { sku: "RW-CO-5L" },
    update: { retailPrice: 400, costPrice: 260, wholesalePrice: 360, minSellingPrice: 330, name: "5 Litres", unit: "5 litre container" },
    create: { productId: (await db.product.findUniqueOrThrow({ where: { slug: "coconut-oil" } })).id, name: "5 Litres", sku: "RW-CO-5L", unit: "5 litre container", costPrice: 260, retailPrice: 400, wholesalePrice: 360, minSellingPrice: 330 },
  });

  console.log("✅ Coconut Oil: 500ml=₵40 | 1L=₵80 | 5L=₵400");
  console.log("🎉 Pricing update complete!");
  await db.$disconnect();
}

main().catch((e) => { console.error("❌ Failed:", e.message); process.exit(1); });
