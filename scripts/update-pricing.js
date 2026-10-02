/**
 * Pricing update — plain JavaScript, no TypeScript needed
 * Runs directly with node on Render
 */
const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

async function main() {
  console.log("💰 Updating product pricing...");

  const palmOil = await db.product.findUnique({ where: { slug: "palm-oil" } });
  if (!palmOil) { console.error("Palm Oil not found"); return; }

  const coconutOil = await db.product.findUnique({ where: { slug: "coconut-oil" } });
  if (!coconutOil) { console.error("Coconut Oil not found"); return; }

  // Palm Oil variants
  const palmVariants = [
    { sku: "RW-PO-200ML", name: "200ml",    unit: "200ml bottle",     costPrice: 6,   retailPrice: 10,  wholesalePrice: 8,   minSellingPrice: 8   },
    { sku: "RW-PO-500ML", name: "500ml",    unit: "500ml bottle",     costPrice: 15,  retailPrice: 25,  wholesalePrice: 22,  minSellingPrice: 20  },
    { sku: "RW-PO-1L",    name: "1 Litre",  unit: "1 litre bottle",   costPrice: 28,  retailPrice: 45,  wholesalePrice: 40,  minSellingPrice: 35  },
    { sku: "RW-PO-5L",    name: "5 Litres", unit: "5 litre container", costPrice: 150, retailPrice: 230, wholesalePrice: 210, minSellingPrice: 190 },
  ];

  for (const v of palmVariants) {
    await db.productVariant.upsert({
      where:  { sku: v.sku },
      update: { retailPrice: v.retailPrice, costPrice: v.costPrice, wholesalePrice: v.wholesalePrice, minSellingPrice: v.minSellingPrice, name: v.name },
      create: { productId: palmOil.id, ...v },
    });
  }
  console.log("✅ Palm Oil: 200ml=₵10 | 500ml=₵25 | 1L=₵45 | 5L=₵230");

  // Coconut Oil variants
  const coconutVariants = [
    { sku: "RW-CO-500ML", name: "500ml",    unit: "500ml bottle",      costPrice: 25,  retailPrice: 40,  wholesalePrice: 35,  minSellingPrice: 32  },
    { sku: "RW-CO-1L",    name: "1 Litre",  unit: "1 litre bottle",    costPrice: 50,  retailPrice: 80,  wholesalePrice: 70,  minSellingPrice: 65  },
    { sku: "RW-CO-5L",    name: "5 Litres", unit: "5 litre container",  costPrice: 260, retailPrice: 400, wholesalePrice: 360, minSellingPrice: 330 },
  ];

  for (const v of coconutVariants) {
    await db.productVariant.upsert({
      where:  { sku: v.sku },
      update: { retailPrice: v.retailPrice, costPrice: v.costPrice, wholesalePrice: v.wholesalePrice, minSellingPrice: v.minSellingPrice, name: v.name },
      create: { productId: coconutOil.id, ...v },
    });
  }
  console.log("✅ Coconut Oil: 500ml=₵40 | 1L=₵80 | 5L=₵400");
  console.log("🎉 Pricing update complete!");
  await db.$disconnect();
}

main().catch((e) => { console.error("❌ Failed:", e.message); process.exit(1); });
