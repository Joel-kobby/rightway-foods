import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminSalesPage() {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) redirect("/login");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [sales, monthStats] = await Promise.all([
    db.sale.findMany({
      orderBy: { saleDate: "desc" },
      take: 200,
      include: {
        customer:    { select: { firstName: true, lastName: true, businessName: true } },
        salesperson: { select: { name: true } },
        items:       { select: { quantity: true, total: true, grossProfit: true } },
      },
    }),
    db.sale.aggregate({
      where: { saleDate: { gte: monthStart }, status: "COMPLETED" },
      _sum:  { total: true, grossProfit: true },
      _count: { id: true },
    }),
  ]);

  const payBadge: Record<string, "success"|"warning"|"danger"> = {
    PAID:"success", PARTIAL:"warning", UNPAID:"danger",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
          <p className="text-sm text-gray-500 mt-1">This month: {formatCurrency(Number(monthStats._sum.total ?? 0))} across {monthStats._count.id} transactions</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Sale #</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Customer</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Salesperson</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 uppercase">Total</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 uppercase">Profit</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Payment</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sales.map(sale => {
              const name = sale.customer
                ? (sale.customer.businessName ?? `${sale.customer.firstName} ${sale.customer.lastName ?? ""}`.trim())
                : "Walk-in";
              return (
                <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">{sale.saleNumber}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{name}</td>
                  <td className="px-6 py-4 text-gray-600">{sale.salesperson.name}</td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-900">{formatCurrency(Number(sale.total))}</td>
                  <td className="px-6 py-4 text-right text-green-600 font-medium">{formatCurrency(Number(sale.grossProfit))}</td>
                  <td className="px-6 py-4"><Badge variant={payBadge[sale.paymentStatus] ?? "default"}>{sale.paymentStatus}</Badge></td>
                  <td className="px-6 py-4 text-gray-400 text-xs">{formatDateTime(sale.saleDate)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
