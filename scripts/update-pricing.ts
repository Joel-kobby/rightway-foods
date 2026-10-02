/**
 * RightWay Foods — Pricing Update Script
 * Updates Palm Oil and Coconut Oil variants to correct prices
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("💰 Updating product pricing...");

  // ─── PALM OIL ───────────────────────────────────────────
  const palmOil = await db.product.findUnique({ where: { slug: "palm-oil" } });
  if (!palmOil) { console.error("Palm Oil not found"); return; }

  // Delete existing variants and recreate with correct sizes
  await db.productVariant.deleteMany({ where: { productId: palmOil.id } });

  const palmVariants = [
    { name: "200ml",    sku: "RW-PO-200ML", unit: "200ml bottle",    costPrice: 6,   retailPrice: 10,  wholesalePrice: 8,   minSellingPrice: 8  },
    { name: "500ml",    sku: "RW-PO-500ML", unit: "500ml bottle",    costPrice: 15,  retailPrice: 25,  wholesalePrice: 22,  minSellingPrice: 20 },
    { name: "1 Litre",  sku: "RW-PO-1L",   unit: "1 litre bottle",  costPrice: 28,  retailPrice: 45,  wholesalePrice: 40,  minSellingPrice: 35 },
    { name: "5 Litres", sku: "RW-PO-5L",   unit: "5 litre container",costPrice: 150, retailPrice: 230, wholesalePrice: 210, minSellingPrice: 190},
  ];

  for (const v of palmVariants) {
    const variant = await db.productVariant.create({
      data: { productId: palmOil.id, ...v },
    });
    // Create inventory
    const inv = await db.inventory.upsert({
      where: { variantId: variant.id },
      update: {},
      create: { productId: palmOil.id, variantId: variant.id, quantity: 100 },
    });
    await db.inventoryMovement.create({
      data: { inventoryId: inv.id, type: "OPENING_STOCK", quantity: 100, balanceAfter: 100, reason: "Pricing update restock" },
    });
  }
  console.log("✅ Palm Oil variants updated");

  // ─── COCONUT OIL ────────────────────────────────────────
  const coconutOil = await db.product.findUnique({ where: { slug: "coconut-oil" } });
  if (!coconutOil) { console.error("Coconut Oil not found"); return; }

  await db.productVariant.deleteMany({ where: { productId: coconutOil.id } });

  const coconutVariants = [
    { name: "500ml",    sku: "RW-CO-500ML", unit: "500ml bottle",     costPrice: 25,  retailPrice: 40,  wholesalePrice: 35,  minSellingPrice: 32 },
    { name: "1 Litre",  sku: "RW-CO-1L",   unit: "1 litre bottle",   costPrice: 50,  retailPrice: 80,  wholesalePrice: 70,  minSellingPrice: 65 },
    { name: "5 Litres", sku: "RW-CO-5L",   unit: "5 litre container", costPrice: 260, retailPrice: 400, wholesalePrice: 360, minSellingPrice: 330},
  ];

  for (const v of coconutVariants) {
    const variant = await db.productVariant.create({
      data: { productId: coconutOil.id, ...v },
    });
    const inv = await db.inventory.upsert({
      where: { variantId: variant.id },
      update: {},
      create: { productId: coconutOil.id, variantId: variant.id, quantity: 80 },
    });
    await db.inventoryMovement.create({
      data: { inventoryId: inv.id, type: "OPENING_STOCK", quantity: 80, balanceAfter: 80, reason: "Pricing update restock" },
    });
  }
  console.log("✅ Coconut Oil variants updated");

  console.log("\n📋 Final Pricing Summary:");
  console.log("PALM OIL:    200ml=₵10 | 500ml=₵25 | 1L=₵45 | 5L=₵230");
  console.log("COCONUT OIL: 500ml=₵40 | 1L=₵80   | 5L=₵400");

  await db.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
