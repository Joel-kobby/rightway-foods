import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";

export async function GET() {
  // Server-side auth check — never trust client
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Run all queries in parallel
  const [
    todaySales,
    monthSales,
    todayExpenses,
    monthExpenses,
    pendingOrders,
    lowStockVariants,
    outOfStockVariants,
    unpaidSalesTotal,
    recentSales,
    topProducts,
  ] = await Promise.all([
    // Today's sales total & count
    db.sale.aggregate({
      where: { saleDate: { gte: todayStart }, status: "COMPLETED" },
      _sum: { total: true, grossProfit: true },
      _count: { id: true },
    }),

    // This month's sales
    db.sale.aggregate({
      where: { saleDate: { gte: monthStart }, status: "COMPLETED" },
      _sum: { total: true, grossProfit: true, costTotal: true },
      _count: { id: true },
    }),

    // Today's expenses
    db.expense.aggregate({
      where: { expenseDate: { gte: todayStart } },
      _sum: { amount: true },
    }),

    // This month's expenses
    db.expense.aggregate({
      where: { expenseDate: { gte: monthStart } },
      _sum: { amount: true },
    }),

    // Pending orders
    db.order.count({ where: { status: "PENDING" } }),

    // Low stock (below reorder level but not zero)
    db.inventory.findMany({
      where: { quantity: { gt: 0 } },
      include: {
        variant: { select: { name: true, sku: true } },
        product: { select: { name: true, reorderLevel: true } },
      },
    }),

    // Out of stock
    db.inventory.count({ where: { quantity: { lte: 0 } } }),

    // Outstanding payments (unpaid sales)
    db.sale.aggregate({
      where: { paymentStatus: { in: ["UNPAID", "PARTIAL"] }, status: "COMPLETED" },
      _sum: { total: true },
      _count: { id: true },
    }),

    // 5 most recent sales
    db.sale.findMany({
      take: 5,
      orderBy: { saleDate: "desc" },
      include: {
        customer: { select: { firstName: true, lastName: true, businessName: true } },
        salesperson: { select: { name: true } },
      },
    }),

    // Top 5 products by revenue this month
    db.saleItem.groupBy({
      by: ["productId"],
      where: { sale: { saleDate: { gte: monthStart }, status: "COMPLETED" } },
      _sum: { total: true, quantity: true, grossProfit: true },
      orderBy: { _sum: { total: "desc" } },
      take: 5,
    }),
  ]);

  // Calculate low stock items
  const lowStock = lowStockVariants.filter(
    (inv) => inv.quantity > 0 && inv.quantity <= inv.product.reorderLevel
  );

  // Get product names for top products
  const topProductIds = topProducts.map((p) => p.productId);
  const topProductDetails = await db.product.findMany({
    where: { id: { in: topProductIds } },
    select: { id: true, name: true },
  });

  const topProductsWithNames = topProducts.map((p) => ({
    ...p,
    productName: topProductDetails.find((d) => d.id === p.productId)?.name ?? "Unknown",
  }));

  // Gross margin this month
  const monthRevenue = Number(monthSales._sum.total ?? 0);
  const monthProfit = Number(monthSales._sum.grossProfit ?? 0);
  const grossMarginPct = monthRevenue > 0 ? ((monthProfit / monthRevenue) * 100).toFixed(1) : "0.0";

  return NextResponse.json({
    today: {
      revenue: Number(todaySales._sum.total ?? 0),
      grossProfit: Number(todaySales._sum.grossProfit ?? 0),
      expenses: Number(todayExpenses._sum.amount ?? 0),
      transactions: todaySales._count.id,
    },
    month: {
      revenue: monthRevenue,
      grossProfit: monthProfit,
      expenses: Number(monthExpenses._sum.amount ?? 0),
      transactions: monthSales._count.id,
      grossMarginPct,
    },
    outstanding: {
      amount: Number(unpaidSalesTotal._sum.total ?? 0),
      count: unpaidSalesTotal._count.id,
    },
    orders: { pending: pendingOrders },
    inventory: {
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStockVariants,
      lowStockItems: lowStock.slice(0, 5).map((inv) => ({
        productName: inv.product.name,
        variantName: inv.variant.name,
        sku: inv.variant.sku,
        quantity: inv.quantity,
        reorderLevel: inv.product.reorderLevel,
      })),
    },
    recentSales: recentSales.map((s) => ({
      id: s.id,
      saleNumber: s.saleNumber,
      customerName: s.customer
        ? (s.customer.businessName ?? `${s.customer.firstName} ${s.customer.lastName ?? ""}`.trim())
        : "Walk-in",
      salesperson: s.salesperson.name,
      total: Number(s.total),
      grossProfit: Number(s.grossProfit),
      paymentStatus: s.paymentStatus,
      saleDate: s.saleDate,
    })),
    topProducts: topProductsWithNames.map((p) => ({
      productName: p.productName,
      revenue: Number(p._sum.total ?? 0),
      quantity: Number(p._sum.quantity ?? 0),
      grossProfit: Number(p._sum.grossProfit ?? 0),
    })),
  });
}
