/**
 * RightWay Foods — Database Seed
 * Demo data flagged with isDemo: true — remove before going live.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding RightWay Foods database...");

  // ─── SYSTEM SETTINGS ───────────────────────────────────
  const settings = [
    { key: "company_name", value: "RightWay Foods", type: "string", group: "general", label: "Company Name" },
    { key: "company_phone", value: "+233 XX XXX XXXX", type: "string", group: "general", label: "Phone" },
    { key: "company_email", value: "derightwayfoods@gmail.com", type: "string", group: "general", label: "Email" },
    { key: "company_address", value: "Accra, Ghana", type: "string", group: "general", label: "Address" },
    { key: "currency", value: "GHS", type: "string", group: "finance", label: "Currency" },
    { key: "currency_symbol", value: "₵", type: "string", group: "finance", label: "Currency Symbol" },
    { key: "allow_neg_stock", value: "false", type: "boolean", group: "inventory", label: "Allow Negative Stock" },
    { key: "low_stock_threshold", value: "10", type: "number", group: "inventory", label: "Low Stock Alert Threshold" },
    { key: "tax_enabled", value: "false", type: "boolean", group: "finance", label: "Tax Enabled" },
    { key: "show_rankings", value: "false", type: "boolean", group: "hr", label: "Show Team Rankings to Staff" },
    { key: "askgod_enabled", value: "true", type: "boolean", group: "ai", label: "AskGod Enabled" },
  ];

  for (const s of settings) {
    await db.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }
  console.log("✅ System settings");

  // ─── USERS ─────────────────────────────────────────────
  const hash = await bcrypt.hash("RightWay@2026", 10);

  const admin = await db.user.upsert({
    where: { email: "admin@rightwayfoods.com" },
    update: {},
    create: { name: "Admin User", email: "admin@rightwayfoods.com", password: hash, role: "SUPER_ADMIN", phone: "+233200000001", isDemo: true },
  });

  const kofi = await db.user.upsert({
    where: { email: "kofi@rightwayfoods.com" },
    update: {},
    create: { name: "Kofi Mensah", email: "kofi@rightwayfoods.com", password: hash, role: "SALESPERSON", phone: "+233200000002", isDemo: true },
  });

  const ama = await db.user.upsert({
    where: { email: "ama@rightwayfoods.com" },
    update: {},
    create: { name: "Ama Owusu", email: "ama@rightwayfoods.com", password: hash, role: "SALESPERSON", phone: "+233200000003", isDemo: true },
  });

  await db.user.upsert({
    where: { email: "cashier@rightwayfoods.com" },
    update: {},
    create: { name: "Abena Appiah", email: "cashier@rightwayfoods.com", password: hash, role: "CASHIER", phone: "+233200000004", isDemo: true },
  });

  console.log("✅ Users");
  console.log("   admin@rightwayfoods.com    / RightWay@2026  (SUPER_ADMIN)");
  console.log("   kofi@rightwayfoods.com     / RightWay@2026  (SALESPERSON)");
  console.log("   ama@rightwayfoods.com      / RightWay@2026  (SALESPERSON)");
  console.log("   cashier@rightwayfoods.com  / RightWay@2026  (CASHIER)");

  // ─── SUPPLIERS ─────────────────────────────────────────
  const supplier1 = await db.supplier.upsert({
    where: { id: "demo-sup-001" },
    update: {},
    create: { id: "demo-sup-001", name: "Ghana Natural Oils Ltd", contactName: "Kwame Asante", phone: "+233201112222", isDemo: true },
  });

  const supplier2 = await db.supplier.upsert({
    where: { id: "demo-sup-002" },
    update: {},
    create: { id: "demo-sup-002", name: "Fresh Farm Eggs Ghana", contactName: "Yaw Boateng", phone: "+233203334444", isDemo: true },
  });

  console.log("✅ Suppliers");

  // ─── CATEGORIES ────────────────────────────────────────
  const oilCat = await db.category.upsert({
    where: { slug: "cooking-oils" },
    update: {},
    create: { name: "Cooking Oils", slug: "cooking-oils", description: "Premium natural cooking oils" },
  });

  const eggCat = await db.category.upsert({
    where: { slug: "eggs" },
    update: {},
    create: { name: "Eggs", slug: "eggs", description: "Fresh farm eggs" },
  });

  console.log("✅ Categories");

  // ─── PRODUCTS & VARIANTS ───────────────────────────────

  // Palm Oil
  const palmOil = await db.product.upsert({
    where: { sku: "RW-PO" },
    update: {},
    create: { sku: "RW-PO", name: "Palm Oil", slug: "palm-oil", description: "Pure, unrefined Ghanaian palm oil. Rich in nutrients and natural colour.", categoryId: oilCat.id, unit: "litre", supplierId: supplier1.id, reorderLevel: 50, isDemo: true, imageUrl: "https://i.ibb.co/CsnN81Mb/Whats-App-Image-2026-09-29-at-05-02-34.jpg" },
  });

  const po200ml = await db.productVariant.upsert({
    where: { sku: "RW-PO-200ML" },
    update: { retailPrice: 10, costPrice: 6, wholesalePrice: 8, minSellingPrice: 8 },
    create: { productId: palmOil.id, name: "200ml", sku: "RW-PO-200ML", unit: "200ml bottle", costPrice: 6, retailPrice: 10, wholesalePrice: 8, minSellingPrice: 8 },
  });

  const po500ml = await db.productVariant.upsert({
    where: { sku: "RW-PO-500ML" },
    update: { retailPrice: 25, costPrice: 15, wholesalePrice: 22, minSellingPrice: 20 },
    create: { productId: palmOil.id, name: "500ml", sku: "RW-PO-500ML", unit: "500ml bottle", costPrice: 15, retailPrice: 25, wholesalePrice: 22, minSellingPrice: 20 },
  });

  const po1L = await db.productVariant.upsert({
    where: { sku: "RW-PO-1L" },
    update: { retailPrice: 45, costPrice: 28, wholesalePrice: 40, minSellingPrice: 35 },
    create: { productId: palmOil.id, name: "1 Litre", sku: "RW-PO-1L", unit: "1 litre bottle", costPrice: 28, retailPrice: 45, wholesalePrice: 40, minSellingPrice: 35 },
  });

  const po5L = await db.productVariant.upsert({
    where: { sku: "RW-PO-5L" },
    update: { retailPrice: 230, costPrice: 150, wholesalePrice: 210, minSellingPrice: 190 },
    create: { productId: palmOil.id, name: "5 Litres", sku: "RW-PO-5L", unit: "5 litre container", costPrice: 150, retailPrice: 230, wholesalePrice: 210, minSellingPrice: 190 },
  });

  // Coconut Oil
  const coconutOil = await db.product.upsert({
    where: { sku: "RW-CO" },
    update: {},
    create: { sku: "RW-CO", name: "Coconut Oil", slug: "coconut-oil", description: "Cold-pressed virgin coconut oil. Pure, natural, and versatile.", categoryId: oilCat.id, unit: "litre", supplierId: supplier1.id, reorderLevel: 30, isDemo: true },
  });

  const co500ml = await db.productVariant.upsert({
    where: { sku: "RW-CO-500ML" },
    update: { retailPrice: 40, costPrice: 25, wholesalePrice: 35, minSellingPrice: 32 },
    create: { productId: coconutOil.id, name: "500ml", sku: "RW-CO-500ML", unit: "500ml bottle", costPrice: 25, retailPrice: 40, wholesalePrice: 35, minSellingPrice: 32 },
  });

  const co1L = await db.productVariant.upsert({
    where: { sku: "RW-CO-1L" },
    update: { retailPrice: 80, costPrice: 50, wholesalePrice: 70, minSellingPrice: 65 },
    create: { productId: coconutOil.id, name: "1 Litre", sku: "RW-CO-1L", unit: "1 litre bottle", costPrice: 50, retailPrice: 80, wholesalePrice: 70, minSellingPrice: 65 },
  });

  const co5L = await db.productVariant.upsert({
    where: { sku: "RW-CO-5L" },
    update: { retailPrice: 400, costPrice: 260, wholesalePrice: 360, minSellingPrice: 330 },
    create: { productId: coconutOil.id, name: "5 Litres", sku: "RW-CO-5L", unit: "5 litre container", costPrice: 260, retailPrice: 400, wholesalePrice: 360, minSellingPrice: 330 },
  });

  // Eggs
  const eggs = await db.product.upsert({
    where: { sku: "RW-EG" },
    update: {},
    create: { sku: "RW-EG", name: "Eggs", slug: "eggs", description: "Fresh, farm-sourced eggs. Available by crate.", categoryId: eggCat.id, unit: "crate", supplierId: supplier2.id, reorderLevel: 20, isDemo: true },
  });

  const eg30 = await db.productVariant.upsert({
    where: { sku: "RW-EG-30" },
    update: {},
    create: { productId: eggs.id, name: "1 Crate (30 eggs)", sku: "RW-EG-30", unit: "crate of 30", costPrice: 28, retailPrice: 38, wholesalePrice: 34, minSellingPrice: 32 },
  });

  console.log("✅ Products & variants");

  // ─── INVENTORY ─────────────────────────────────────────
  const stockItems = [
    { productId: palmOil.id, variantId: po1L.id, qty: 200 },
    { productId: palmOil.id, variantId: po5L.id, qty: 80 },
    { productId: coconutOil.id, variantId: co1L.id, qty: 150 },
    { productId: coconutOil.id, variantId: co5L.id, qty: 60 },
    { productId: eggs.id, variantId: eg30.id, qty: 100 },
  ];

  for (const item of stockItems) {
    const existing = await db.inventory.findUnique({ where: { variantId: item.variantId } });
    if (!existing) {
      const inv = await db.inventory.create({
        data: { productId: item.productId, variantId: item.variantId, quantity: item.qty },
      });
      await db.inventoryMovement.create({
        data: { inventoryId: inv.id, type: "OPENING_STOCK", quantity: item.qty, balanceAfter: item.qty, reason: "Initial stock — demo seed", isDemo: true },
      });
    }
  }

  console.log("✅ Inventory");

  // ─── EXPENSE CATEGORIES ────────────────────────────────
  const expCats = ["Delivery", "Transport", "Packaging", "Fuel", "Rent", "Electricity", "Water", "Marketing", "Salaries", "Maintenance", "Procurement", "Miscellaneous"];
  for (const name of expCats) {
    await db.expenseCategory.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log("✅ Expense categories");

  // ─── DELIVERY ZONES ────────────────────────────────────
  const zones = [
    { name: "Accra Metro", regions: ["Greater Accra"], fee: 15, estimatedDays: 1, minOrder: 50, freeDeliveryThreshold: 300 },
    { name: "Greater Accra (Outer)", regions: ["Greater Accra", "Tema"], fee: 25, estimatedDays: 1, minOrder: 80, freeDeliveryThreshold: 500 },
    { name: "Kumasi", regions: ["Ashanti"], fee: 40, estimatedDays: 2, minOrder: 100, freeDeliveryThreshold: 600 },
    { name: "Cape Coast", regions: ["Central"], fee: 35, estimatedDays: 2, minOrder: 80, freeDeliveryThreshold: null },
    { name: "Nationwide", regions: ["All regions"], fee: 60, estimatedDays: 3, minOrder: 150, freeDeliveryThreshold: null },
  ];

  for (const z of zones) {
    await db.deliveryZone.upsert({ where: { name: z.name }, update: {}, create: z });
  }
  console.log("✅ Delivery zones");

  // ─── DEMO CUSTOMERS ────────────────────────────────────
  await db.customer.upsert({ where: { customerId: "RWC-000001" }, update: {}, create: { customerId: "RWC-000001", firstName: "Akosua", lastName: "Darko", phone: "0244000001", customerType: "RETAIL", city: "Accra", region: "Greater Accra", assignedToId: kofi.id, isDemo: true } });
  await db.customer.upsert({ where: { customerId: "RWC-000002" }, update: {}, create: { customerId: "RWC-000002", firstName: "Maame", businessName: "Maame's Kitchen", phone: "0244000002", customerType: "SHOP", city: "Accra", region: "Greater Accra", assignedToId: kofi.id, isDemo: true } });
  await db.customer.upsert({ where: { customerId: "RWC-000003" }, update: {}, create: { customerId: "RWC-000003", firstName: "Emmanuel", lastName: "Owusu", businessName: "Owusu Restaurant", phone: "0244000003", customerType: "RESTAURANT", city: "Kumasi", region: "Ashanti", assignedToId: ama.id, isDemo: true } });
  await db.customer.upsert({ where: { customerId: "RWC-000004" }, update: {}, create: { customerId: "RWC-000004", firstName: "Grace", lastName: "Acheampong", phone: "0244000004", customerType: "WHOLESALE", city: "Tema", region: "Greater Accra", assignedToId: ama.id, isDemo: true } });

  console.log("✅ Demo customers");

  console.log("\n🎉 Seed complete!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("⚠️  All demo data is flagged isDemo: true");
  console.log("   Remove before going live.");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
