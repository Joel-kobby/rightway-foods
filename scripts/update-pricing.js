/**
 * Pricing update + inventory fix — plain JavaScript
 */
const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

async function ensureInventory(productId, variantId, qty) {
  const existing = await db.inventory.findUnique({ where: { variantId } });
  if (!existing) {
    const inv = await db.inventory.create({
      data: { productId, variantId, quantity: qty },
    });
    await db.inventoryMovement.create({
      data: { inventoryId: inv.id, type: "OPENING_STOCK", quantity: qty, balanceAfter: qty, reason: "Pricing update — initial stock" },
    });
    console.log(`  + Inventory created for variant ${variantId}`);
  } else if (existing.quantity <= 0) {
    await db.inventory.update({ where: { id: existing.id }, data: { quantity: qty } });
    await db.inventoryMovement.create({
      data: { inventoryId: existing.id, type: "ADJUSTMENT_IN", quantity: qty, balanceAfter: qty, reason: "Restocked during pricing update" },
    });
    console.log(`  + Restocked variant ${variantId}`);
  }
}

async function main() {
  console.log("💰 Updating product pricing and inventory...");

  const palmOil = await db.product.findUnique({ where: { slug: "palm-oil" } });
  if (!palmOil) { console.error("Palm Oil not found"); return; }

  const coconutOil = await db.product.findUnique({ where: { slug: "coconut-oil" } });
  if (!coconutOil) { console.error("Coconut Oil not found"); return; }

  // ─── PALM OIL ───────────────────────────────────────────
  const palmVariants = [
    { sku: "RW-PO-200ML", name: "200ml", unit: "200ml bottle", costPrice: 6, retailPrice: 10, wholesalePrice: 8, minSellingPrice: 8, stock: 150 },
    { sku: "RW-PO-500ML", name: "500ml", unit: "500ml bottle", costPrice: 15, retailPrice: 25, wholesalePrice: 22, minSellingPrice: 20, stock: 120 },
    { sku: "RW-PO-1L", name: "1 Litre", unit: "1 litre bottle", costPrice: 28, retailPrice: 45, wholesalePrice: 40, minSellingPrice: 35, stock: 100 },
    { sku: "RW-PO-5L", name: "5 Litres", unit: "5 litre container", costPrice: 150, retailPrice: 230, wholesalePrice: 210, minSellingPrice: 190, stock: 50 },
  ];

  for (const v of palmVariants) {
    const variant = await db.productVariant.upsert({
      where: { sku: v.sku },
      update: { retailPrice: v.retailPrice, costPrice: v.costPrice, wholesalePrice: v.wholesalePrice, minSellingPrice: v.minSellingPrice, name: v.name, isActive: true },
      create: { productId: palmOil.id, name: v.name, sku: v.sku, unit: v.unit, costPrice: v.costPrice, retailPrice: v.retailPrice, wholesalePrice: v.wholesalePrice, minSellingPrice: v.minSellingPrice },
    });
    await ensureInventory(palmOil.id, variant.id, v.stock);
  }
  console.log("✅ Palm Oil: 200ml=₵10 | 500ml=₵25 | 1L=₵45 | 5L=₵230");

  // ─── COCONUT OIL ────────────────────────────────────────
  const coconutVariants = [
    { sku: "RW-CO-500ML", name: "500ml", unit: "500ml bottle", costPrice: 25, retailPrice: 40, wholesalePrice: 35, minSellingPrice: 32, stock: 100 },
    { sku: "RW-CO-1L", name: "1 Litre", unit: "1 litre bottle", costPrice: 50, retailPrice: 80, wholesalePrice: 70, minSellingPrice: 65, stock: 80 },
    { sku: "RW-CO-5L", name: "5 Litres", unit: "5 litre container", costPrice: 260, retailPrice: 400, wholesalePrice: 360, minSellingPrice: 330, stock: 40 },
  ];

  for (const v of coconutVariants) {
    const variant = await db.productVariant.upsert({
      where: { sku: v.sku },
      update: { retailPrice: v.retailPrice, costPrice: v.costPrice, wholesalePrice: v.wholesalePrice, minSellingPrice: v.minSellingPrice, name: v.name, isActive: true },
      create: { productId: coconutOil.id, name: v.name, sku: v.sku, unit: v.unit, costPrice: v.costPrice, retailPrice: v.retailPrice, wholesalePrice: v.wholesalePrice, minSellingPrice: v.minSellingPrice },
    });
    await ensureInventory(coconutOil.id, variant.id, v.stock);
  }
  console.log("✅ Coconut Oil: 500ml=₵40 | 1L=₵80 | 5L=₵400");

  // ─── EGGS — ensure in stock too ─────────────────────────
  const eggs = await db.product.findUnique({ where: { slug: "eggs" } });
  if (eggs) {
    const eggVariants = await db.productVariant.findMany({ where: { productId: eggs.id } });
    for (const v of eggVariants) {
      await ensureInventory(eggs.id, v.id, 100);
    }
    console.log("✅ Eggs: inventory ensured");
  }

  console.log("🎉 Pricing & inventory update complete!");
  await db.$disconnect();
}

main().catch((e) => { console.error("❌ Failed:", e.message); process.exit(1); });
