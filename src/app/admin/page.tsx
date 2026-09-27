import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { StatCard } from "@/components/admin/StatCard";
import { AttentionPanel } from "@/components/admin/AttentionPanel";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp, DollarSign, ShoppingBag, AlertTriangle,
  CreditCard, Package, BarChart2, Users,
} from "lucide-react";

export const dynamic = "force-dynamic"; // always fetch fresh data

export default async function AdminDashboard() {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) redirect("/login");

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Parallel data fetch
  const [
    todaySales,
    monthSales,
    todayExpenses,
    monthExpenses,
    pendingOrders,
    inventoryItems,
    outOfStockCount,
    unpaidSales,
    recentSales,
    totalCustomers,
  ] = await Promise.all([
    db.sale.aggregate({
      where: { saleDate: { gte: todayStart }, status: "COMPLETED" },
      _sum: { total: true, grossProfit: true },
      _count: { id: true },
    }),
    db.sale.aggregate({
      where: { saleDate: { gte: monthStart }, status: "COMPLETED" },
      _sum: { total: true, grossProfit: true, costTotal: true },
      _count: { id: true },
    }),
    db.expense.aggregate({
      where: { expenseDate: { gte: todayStart } },
      _sum: { amount: true },
    }),
    db.expense.aggregate({
      where: { expenseDate: { gte: monthStart } },
      _sum: { amount: true },
    }),
    db.order.count({ where: { status: "PENDING" } }),
    db.inventory.findMany({
      include: {
        variant: { select: { name: true, sku: true } },
        product: { select: { name: true, reorderLevel: true, isActive: true } },
      },
    }),
    db.inventory.count({ where: { quantity: { lte: 0 } } }),
    db.sale.aggregate({
      where: { paymentStatus: { in: ["UNPAID", "PARTIAL"] }, status: "COMPLETED" },
      _sum: { total: true },
      _count: { id: true },
    }),
    db.sale.findMany({
      take: 8,
      orderBy: { saleDate: "desc" },
      include: {
        customer: { select: { firstName: true, lastName: true, businessName: true } },
        salesperson: { select: { name: true } },
      },
    }),
    db.customer.count({ where: { isActive: true } }),
  ]);

  // Derived values
  const todayRevenue = Number(todaySales._sum.total ?? 0);
  const todayProfit = Number(todaySales._sum.grossProfit ?? 0);
  const todayExpAmt = Number(todayExpenses._sum.amount ?? 0);
  const monthRevenue = Number(monthSales._sum.total ?? 0);
  const monthProfit = Number(monthSales._sum.grossProfit ?? 0);
  const monthExpAmt = Number(monthExpenses._sum.amount ?? 0);
  const grossMargin = monthRevenue > 0 ? ((monthProfit / monthRevenue) * 100).toFixed(1) : "0.0";
  const outstandingAmt = Number(unpaidSales._sum.total ?? 0);

  const lowStockItems = inventoryItems.filter(
    (inv) => inv.quantity > 0 && inv.quantity <= inv.product.reorderLevel && inv.product.isActive
  );

  // Build attention items
  const attentionItems: { type: "critical" | "important" | "positive" | "info"; message: string }[] = [];

  if (outOfStockCount > 0)
    attentionItems.push({ type: "critical", message: `${outOfStockCount} product variant${outOfStockCount > 1 ? "s are" : " is"} out of stock.` });

  if (outstandingAmt > 0)
    attentionItems.push({ type: "important", message: `${formatCurrency(outstandingAmt)} outstanding across ${unpaidSales._count.id} unpaid sale${unpaidSales._count.id > 1 ? "s" : ""}.` });

  if (pendingOrders > 0)
    attentionItems.push({ type: "important", message: `${pendingOrders} online order${pendingOrders > 1 ? "s" : ""} waiting for confirmation.` });

  if (lowStockItems.length > 0)
    attentionItems.push({ type: "important", message: `${lowStockItems.length} product variant${lowStockItems.length > 1 ? "s are" : " is"} running low on stock.` });

  if (attentionItems.length === 0 && todayRevenue > 0)
    attentionItems.push({ type: "positive", message: `Great day so far — ${formatCurrency(todayRevenue)} in revenue from ${todaySales._count.id} transaction${todaySales._count.id !== 1 ? "s" : ""}.` });

  const paymentStatusStyles: Record<string, "success" | "warning" | "danger" | "info"> = {
    PAID: "success",
    PARTIAL: "warning",
    UNPAID: "danger",
    REFUNDED: "info",
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Command Centre</h1>
        <p className="text-sm text-gray-500 mt-1">
          {now.toLocaleDateString("en-GH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* TODAY stats */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Today</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Revenue"
            value={formatCurrency(todayRevenue)}
            sub={`${todaySales._count.id} transaction${todaySales._count.id !== 1 ? "s" : ""}`}
            icon={DollarSign}
            iconBg="bg-green-50"
            iconColor="text-green-600"
          />
          <StatCard
            title="Gross Profit"
            value={formatCurrency(todayProfit)}
            sub={todayRevenue > 0 ? `${((todayProfit / todayRevenue) * 100).toFixed(1)}% margin` : "No sales yet"}
            icon={TrendingUp}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatCard
            title="Expenses"
            value={formatCurrency(todayExpAmt)}
            icon={ShoppingBag}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
          />
          <StatCard
            title="Outstanding"
            value={formatCurrency(outstandingAmt)}
            sub={`${unpaidSales._count.id} unpaid sale${unpaidSales._count.id !== 1 ? "s" : ""}`}
            icon={AlertTriangle}
            iconBg="bg-red-50"
            iconColor="text-red-500"
          />
        </div>
      </section>

      {/* THIS MONTH stats */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">This Month</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Monthly Revenue"
            value={formatCurrency(monthRevenue)}
            sub={`${monthSales._count.id} transactions`}
            icon={BarChart2}
            iconBg="bg-green-50"
            iconColor="text-green-600"
          />
          <StatCard
            title="Gross Profit"
            value={formatCurrency(monthProfit)}
            sub={`${grossMargin}% gross margin`}
            icon={TrendingUp}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatCard
            title="Expenses"
            value={formatCurrency(monthExpAmt)}
            icon={CreditCard}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
          />
          <StatCard
            title="Customers"
            value={totalCustomers.toString()}
            sub="active customers"
            icon={Users}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
          />
        </div>
      </section>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* What needs attention */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">What Needs Your Attention?</h2>
          <AttentionPanel items={attentionItems} />
        </div>

        {/* Inventory snapshot */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">Inventory</h2>
            <Package size={18} className="text-gray-400" />
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Low stock alerts</span>
              <span className={`font-semibold ${lowStockItems.length > 0 ? "text-amber-600" : "text-green-600"}`}>
                {lowStockItems.length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Out of stock</span>
              <span className={`font-semibold ${outOfStockCount > 0 ? "text-red-600" : "text-green-600"}`}>
                {outOfStockCount}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Pending orders</span>
              <span className={`font-semibold ${pendingOrders > 0 ? "text-amber-600" : "text-gray-700"}`}>
                {pendingOrders}
              </span>
            </div>
          </div>
          {lowStockItems.length > 0 && (
            <div className="border-t border-gray-100 pt-3 space-y-2">
              <p className="text-xs text-gray-400 uppercase font-medium">Low Stock</p>
              {lowStockItems.slice(0, 4).map((inv) => (
                <div key={inv.variantId} className="flex items-center justify-between text-xs">
                  <span className="text-gray-700 truncate">{inv.product.name} — {inv.variant.name}</span>
                  <span className="text-amber-600 font-semibold ml-2 flex-shrink-0">{inv.quantity} left</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent sales table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">Recent Sales</h2>
          <a href="/admin/sales" className="text-xs text-[hsl(142,71%,25%)] hover:underline font-medium">
            View all →
          </a>
        </div>
        {recentSales.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-400 text-sm">
            No sales recorded yet. Sales will appear here once recorded.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Sale #</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Customer</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Salesperson</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Total</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Profit</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Payment</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentSales.map((sale) => {
                  const customerName = sale.customer
                    ? (sale.customer.businessName ?? `${sale.customer.firstName} ${sale.customer.lastName ?? ""}`.trim())
                    : "Walk-in";
                  return (
                    <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-gray-600">{sale.saleNumber}</td>
                      <td className="px-6 py-4 text-gray-800 font-medium">{customerName}</td>
                      <td className="px-6 py-4 text-gray-600">{sale.salesperson.name}</td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">{formatCurrency(Number(sale.total))}</td>
                      <td className="px-6 py-4 text-right text-green-600 font-medium">{formatCurrency(Number(sale.grossProfit))}</td>
                      <td className="px-6 py-4">
                        <Badge variant={paymentStatusStyles[sale.paymentStatus] ?? "default"}>
                          {sale.paymentStatus}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs">{formatDateTime(sale.saleDate)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
