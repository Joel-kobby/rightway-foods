import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus, TrendingUp, Clock, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SalesDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const allowed = ["SUPER_ADMIN", "ADMIN", "SALESPERSON", "BRANCH_MANAGER"];
  if (!allowed.includes(session.user.role)) redirect("/unauthorized");

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [todaySales, recentSales, pendingPayments] = await Promise.all([
    db.sale.aggregate({
      where: { salespersonId: session.user.id, saleDate: { gte: todayStart }, status: "COMPLETED" },
      _sum: { total: true },
      _count: { id: true },
    }),
    db.sale.findMany({
      where: { salespersonId: session.user.id },
      orderBy: { saleDate: "desc" },
      take: 10,
      include: {
        customer: { select: { firstName: true, lastName: true, businessName: true } },
        items: { include: { product: { select: { name: true } }, variant: { select: { name: true } } } },
      },
    }),
    db.sale.count({
      where: { salespersonId: session.user.id, paymentStatus: { in: ["UNPAID", "PARTIAL"] }, status: "COMPLETED" },
    }),
  ]);

  const payBadge: Record<string, "success" | "warning" | "danger"> = {
    PAID: "success", PARTIAL: "warning", UNPAID: "danger",
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Hi, {session.user.name.split(" ")[0]} 👋</h1>
        <p className="text-sm text-gray-500">{now.toLocaleDateString("en-GH", { weekday: "long", day: "numeric", month: "long" })}</p>
      </div>

      {/* Today stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-xs text-gray-400 uppercase font-medium">Sales Today</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(Number(todaySales._sum.total ?? 0))}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-xs text-gray-400 uppercase font-medium">Transactions</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{todaySales._count.id}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-xs text-gray-400 uppercase font-medium">Pending Pay</p>
          <p className={`text-xl font-bold mt-1 ${pendingPayments > 0 ? "text-amber-600" : "text-gray-900"}`}>{pendingPayments}</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/sales/record" className="flex items-center justify-center gap-2 bg-[hsl(142,71%,25%)] text-white py-4 rounded-xl font-bold text-sm hover:opacity-90 transition active:scale-95">
          <Plus size={20} /> RECORD SALE
        </Link>
        <Link href="/sales/history" className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-4 rounded-xl font-semibold text-sm hover:bg-gray-50 transition">
          <TrendingUp size={18} /> MY SALES
        </Link>
      </div>

      {pendingPayments > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <AlertCircle size={18} className="text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-800 font-medium">You have {pendingPayments} sale{pendingPayments > 1 ? "s" : ""} with pending payment.</p>
        </div>
      )}

      {/* Recent sales */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Clock size={16} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-800">Recent Sales</h2>
        </div>
        {recentSales.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-10">No sales yet. Record your first sale above.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentSales.map((sale) => {
              const name = sale.customer
                ? (sale.customer.businessName ?? `${sale.customer.firstName} ${sale.customer.lastName ?? ""}`.trim())
                : "Walk-in";
              const products = sale.items.map(i => `${i.product.name} ${i.variant.name}`).join(", ");
              return (
                <div key={sale.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{name}</p>
                    <p className="text-xs text-gray-400 truncate">{products}</p>
                    <p className="text-xs text-gray-300 mt-0.5">{formatDateTime(sale.saleDate)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-3 flex-shrink-0">
                    <span className="font-bold text-gray-900">{formatCurrency(Number(sale.total))}</span>
                    <Badge variant={payBadge[sale.paymentStatus] ?? "default"}>{sale.paymentStatus}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
