import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminExpensesPage() {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) redirect("/login");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [expenses, monthTotal] = await Promise.all([
    db.expense.findMany({
      orderBy: { expenseDate: "desc" },
      take: 200,
      include: {
        category:   { select: { name: true } },
        recordedBy: { select: { name: true } },
      },
    }),
    db.expense.aggregate({
      where: { expenseDate: { gte: monthStart } },
      _sum: { amount: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
        <p className="text-sm text-gray-500 mt-1">This month: {formatCurrency(Number(monthTotal._sum.amount ?? 0))}</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Ref</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Category</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Description</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 uppercase">Amount</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Method</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Recorded By</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {expenses.map(e => (
              <tr key={e.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4 font-mono text-xs text-gray-500">{e.expenseRef}</td>
                <td className="px-6 py-4 text-gray-700">{e.category.name}</td>
                <td className="px-6 py-4 text-gray-800">{e.description}</td>
                <td className="px-6 py-4 text-right font-semibold text-gray-900">{formatCurrency(e.amount)}</td>
                <td className="px-6 py-4 text-gray-600 text-xs">{e.paymentMethod.replace("_"," ")}</td>
                <td className="px-6 py-4 text-gray-600">{e.recordedBy.name}</td>
                <td className="px-6 py-4 text-gray-400 text-xs">{formatDate(e.expenseDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
