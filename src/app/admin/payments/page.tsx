import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) redirect("/login");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [payments, monthStats] = await Promise.all([
    db.payment.findMany({
      orderBy: { paidAt: "desc" },
      take: 200,
      include: {
        sale:    { select: { saleNumber: true } },
        customer:{ select: { firstName: true, lastName: true, businessName: true } },
        cashier: { select: { name: true } },
      },
    }),
    db.payment.aggregate({
      where: { paidAt: { gte: monthStart }, status: "CONFIRMED" },
      _sum: { amount: true }, _count: { id: true },
    }),
  ]);

  const methodColors: Record<string, "default"|"success"|"info"|"warning"> = {
    CASH:"success", MOBILE_MONEY:"info", BANK_TRANSFER:"warning", CARD:"info",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-sm text-gray-500 mt-1">This month: {formatCurrency(Number(monthStats._sum.amount ?? 0))} across {monthStats._count.id} transactions</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Transaction ID</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Customer</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Sale #</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 uppercase">Amount</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Method</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Cashier</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {payments.map(p => {
              const name = p.customer
                ? (p.customer.businessName ?? `${p.customer.firstName} ${p.customer.lastName ?? ""}`.trim())
                : "—";
              return (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">{p.transactionId}</td>
                  <td className="px-6 py-4 text-gray-800">{name}</td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-400">{p.sale?.saleNumber ?? "—"}</td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-900">{formatCurrency(p.amount)}</td>
                  <td className="px-6 py-4"><Badge variant={methodColors[p.paymentMethod] ?? "default"}>{p.paymentMethod.replace("_"," ")}</Badge></td>
                  <td className="px-6 py-4 text-gray-600">{p.cashier?.name ?? "—"}</td>
                  <td className="px-6 py-4 text-gray-400 text-xs">{formatDateTime(p.paidAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
