import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { ReconcileForm } from "@/components/cashier/ReconcileForm";

export const dynamic = "force-dynamic";

export default async function ReconcilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const allowed = ["SUPER_ADMIN", "ADMIN", "CASHIER", "BRANCH_MANAGER"];
  if (!allowed.includes(session.user.role)) redirect("/unauthorized");

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Expected cash = today's cash payments
  const cashPayments = await db.payment.aggregate({
    where: {
      paidAt: { gte: todayStart },
      paymentMethod: "CASH",
      status: "CONFIRMED",
    },
    _sum: { amount: true },
  });

  // Today's cash expenses
  const cashExpenses = await db.expense.aggregate({
    where: {
      expenseDate: { gte: todayStart },
      paymentMethod: "CASH",
    },
    _sum: { amount: true },
  });

  const expectedCash =
    Number(cashPayments._sum.amount ?? 0) - Number(cashExpenses._sum.amount ?? 0);

  return (
    <div className="max-w-md mx-auto space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Cash Reconciliation</h1>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Cash collected today</span>
          <span className="font-semibold text-gray-900">{formatCurrency(Number(cashPayments._sum.amount ?? 0))}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Cash expenses today</span>
          <span className="font-semibold text-amber-600">{formatCurrency(Number(cashExpenses._sum.amount ?? 0))}</span>
        </div>
        <div className="flex justify-between border-t border-gray-100 pt-2">
          <span className="font-semibold text-gray-800">Expected Cash on Hand</span>
          <span className="font-bold text-gray-900 text-base">{formatCurrency(expectedCash)}</span>
        </div>
      </div>

      <ReconcileForm expectedCash={expectedCash} />
    </div>
  );
}
