import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) redirect("/login");

  const now = new Date();
  const periods = [
    { label: "This Month",     start: new Date(now.getFullYear(), now.getMonth(), 1) },
    { label: "Last Month",     start: new Date(now.getFullYear(), now.getMonth() - 1, 1), end: new Date(now.getFullYear(), now.getMonth(), 1) },
    { label: "This Year",      start: new Date(now.getFullYear(), 0, 1) },
  ];

  const stats = await Promise.all(periods.map(async (p) => {
    const where: { saleDate: { gte: Date; lt?: Date }; status: string } = { saleDate: { gte: p.start, ...(p.end && { lt: p.end }) }, status: "COMPLETED" };
    const [sales, expenses] = await Promise.all([
      db.sale.aggregate({ where, _sum: { total: true, grossProfit: true, costTotal: true }, _count: { id: true } }),
      db.expense.aggregate({ where: { expenseDate: { gte: p.start, ...(p.end && { lt: p.end }) } }, _sum: { amount: true } }),
    ]);
    const revenue    = Number(sales._sum.total       ?? 0);
    const profit     = Number(sales._sum.grossProfit ?? 0);
    const expenses_  = Number(expenses._sum.amount   ?? 0);
    const opProfit   = profit - expenses_;
    return { label: p.label, revenue, profit, expenses: expenses_, opProfit, transactions: sales._count.id, margin: revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : "0.0" };
  }));

  // Top products this month
  const topProducts = await db.saleItem.groupBy({
    by: ["productId"],
    where: { sale: { saleDate: { gte: periods[0].start }, status: "COMPLETED" } },
    _sum: { total: true, quantity: true, grossProfit: true },
    orderBy: { _sum: { total: "desc" } },
    take: 5,
  });
  const productIds = topProducts.map(p => p.productId);
  const productNames = await db.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } });

  // Salesperson performance this month
  const spPerf = await db.sale.groupBy({
    by: ["salespersonId"],
    where: { saleDate: { gte: periods[0].start }, status: "COMPLETED" },
    _sum: { total: true, grossProfit: true },
    _count: { id: true },
    orderBy: { _sum: { total: "desc" } },
  });
  const spIds = spPerf.map(s => s.salespersonId);
  const spNames = await db.user.findMany({ where: { id: { in: spIds } }, select: { id: true, name: true } });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>

      {/* Period summaries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-500 mb-4">{s.label}</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Revenue</span><span className="font-semibold text-gray-900">{formatCurrency(s.revenue)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Gross Profit</span><span className="font-semibold text-green-600">{formatCurrency(s.profit)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Expenses</span><span className="font-semibold text-amber-600">{formatCurrency(s.expenses)}</span></div>
              <div className="flex justify-between text-sm border-t border-gray-100 pt-2"><span className="text-gray-700 font-medium">Operating Profit</span><span className={`font-bold ${s.opProfit >= 0 ? "text-green-700" : "text-red-600"}`}>{formatCurrency(s.opProfit)}</span></div>
              <div className="flex justify-between text-xs text-gray-400"><span>Gross Margin</span><span>{s.margin}%</span></div>
              <div className="flex justify-between text-xs text-gray-400"><span>Transactions</span><span>{s.transactions}</span></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top products */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Top Products — This Month</h2>
          {topProducts.length === 0 ? <p className="text-gray-400 text-sm">No sales data yet.</p> : (
            <div className="space-y-3">
              {topProducts.map((p, i) => {
                const name = productNames.find(n => n.id === p.productId)?.name ?? "Unknown";
                return (
                  <div key={p.productId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-300 w-4">{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{name}</p>
                        <p className="text-xs text-gray-400">{Number(p._sum.quantity ?? 0)} units sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(Number(p._sum.total ?? 0))}</p>
                      <p className="text-xs text-green-600">{formatCurrency(Number(p._sum.grossProfit ?? 0))} profit</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Salesperson performance */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Salesperson Performance — This Month</h2>
          {spPerf.length === 0 ? <p className="text-gray-400 text-sm">No sales data yet.</p> : (
            <div className="space-y-3">
              {spPerf.map((s, i) => {
                const name = spNames.find(n => n.id === s.salespersonId)?.name ?? "Unknown";
                return (
                  <div key={s.salespersonId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-300 w-4">{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{name}</p>
                        <p className="text-xs text-gray-400">{s._count.id} transactions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(Number(s._sum.total ?? 0))}</p>
                      <p className="text-xs text-green-600">{formatCurrency(Number(s._sum.grossProfit ?? 0))} profit</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
