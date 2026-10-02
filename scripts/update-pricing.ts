/**
 * RightWay Foods — Pricing Update Script
 * Updates Palm Oil and Coconut Oil variants with correct prices and sizes
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("💰 Updating product pricing...");

  // ─── PALM OIL ───────────────────────────────────────────
  const palmOil = await db.product.findUnique({ where: { slug: "palm-oil" } });
  if (!palmOil) { console.error("Palm Oil not found"); return; }

  // Update existing variants prices
  await db.productVariant.updateMany({
    where: { productId: palmOil.id, sku: "RW-PO-1L" },
    data: { name: "1 Litre", retailPrice: 45, costPrice: 28, wholesalePrice: 40, minSellingPrice: 35 },
  });

  await db.productVariant.updateMany({
    where: { productId: palmOil.id, sku: "RW-PO-5L" },
    data: { name: "5 Litres", retailPrice: 230, costPrice: 150, wholesalePrice: 210, minSellingPrice: 190 },
  });

  // Add new Palm Oil variants if they don't exist
  const po200 = await db.productVariant.findUnique({ where: { sku: "RW-PO-200ML" } });
  if (!po200) {
    const v = await db.productVariant.create({
      data: { productId: palmOil.id, name: "200ml", sku: "RW-PO-200ML", unit: "200ml bottle", costPrice: 6, retailPrice: 10, wholesalePrice: 8, minSellingPrice: 8 },
    });
    const inv = await db.inventory.create({ data: { productId: palmOil.id, variantId: v.id, quantity: 100 } });
    await db.inventoryMovement.create({ data: { inventoryId: inv.id, type: "OPENING_STOCK", quantity: 100, balanceAfter: 100, reason: "New variant added" } });
    console.log("  + Added Palm Oil 200ml");
  }

  const po500 = await db.productVariant.findUnique({ where: { sku: "RW-PO-500ML" } });
  if (!po500) {
    const v = await db.productVariant.create({
      data: { productId: palmOil.id, name: "500ml", sku: "RW-PO-500ML", unit: "500ml bottle", costPrice: 15, retailPrice: 25, wholesalePrice: 22, minSellingPrice: 20 },
    });
    const inv = await db.inventory.create({ data: { productId: palmOil.id, variantId: v.id, quantity: 100 } });
    await db.inventoryMovement.create({ data: { inventoryId: inv.id, type: "OPENING_STOCK", quantity: 100, balanceAfter: 100, reason: "New variant added" } });
    console.log("  + Added Palm Oil 500ml");
  }

  console.log("✅ Palm Oil updated: 200ml=₵10 | 500ml=₵25 | 1L=₵45 | 5L=₵230");

  // ─── COCONUT OIL ────────────────────────────────────────
  const coconutOil = await db.product.findUnique({ where: { slug: "coconut-oil" } });
  if (!coconutOil) { console.error("Coconut Oil not found"); return; }

  await db.productVariant.updateMany({
    where: { productId: coconutOil.id, sku: "RW-CO-1L" },
    data: { name: "1 Litre", retailPrice: 80, costPrice: 50, wholesalePrice: 70, minSellingPrice: 65 },
  });

  await db.productVariant.updateMany({
    where: { productId: coconutOil.id, sku: "RW-CO-5L" },
    data: { name: "5 Litres", retailPrice: 400, costPrice: 260, wholesalePrice: 360, minSellingPrice: 330 },
  });

  // Add 500ml Coconut Oil if doesn't exist
  const co500 = await db.productVariant.findUnique({ where: { sku: "RW-CO-500ML" } });
  if (!co500) {
    const v = await db.productVariant.create({
      data: { productId: coconutOil.id, name: "500ml", sku: "RW-CO-500ML", unit: "500ml bottle", costPrice: 25, retailPrice: 40, wholesalePrice: 35, minSellingPrice: 32 },
    });
    const inv = await db.inventory.create({ data: { productId: coconutOil.id, variantId: v.id, quantity: 80 } });
    await db.inventoryMovement.create({ data: { inventoryId: inv.id, type: "OPENING_STOCK", quantity: 80, balanceAfter: 80, reason: "New variant added" } });
    console.log("  + Added Coconut Oil 500ml");
  }

  console.log("✅ Coconut Oil updated: 500ml=₵40 | 1L=₵80 | 5L=₵400");
  console.log("\n🎉 Pricing update complete!");

  await db.$disconnect();
}

main().catch((e) => { console.error("❌ Pricing update failed:", e.message); process.exit(1); });
