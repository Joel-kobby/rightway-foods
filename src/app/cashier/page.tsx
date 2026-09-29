import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { CreditCard, Receipt, DollarSign } from "lucide-react";
import { RecordPaymentForm } from "@/components/cashier/RecordPaymentForm";

export const dynamic = "force-dynamic";

export default async function CashierDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const allowed = ["SUPER_ADMIN", "ADMIN", "CASHIER", "BRANCH_MANAGER"];
  if (!allowed.includes(session.user.role)) redirect("/unauthorized");

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [unpaidSales, todayPayments, todayExpenses] = await Promise.all([
    db.sale.findMany({
      where: { paymentStatus: { in: ["UNPAID", "PARTIAL"] }, status: "COMPLETED" },
      orderBy: { saleDate: "desc" },
      take: 50,
      include: {
        customer: { select: { firstName: true, lastName: true, businessName: true } },
        salesperson: { select: { name: true } },
        payments: { select: { amount: true } },
      },
    }),
    db.payment.aggregate({
      where: { paidAt: { gte: todayStart }, status: "CONFIRMED" },
      _sum: { amount: true }, _count: { id: true },
    }),
    db.expense.aggregate({
      where: { expenseDate: { gte: todayStart } },
      _sum: { amount: true },
    }),
  ]);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Cashier — {session.user.name.split(" ")[0]}</h1>
        <p className="text-sm text-gray-500">{now.toLocaleDateString("en-GH", { weekday: "long", day: "numeric", month: "long" })}</p>
      </div>

      {/* Today stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <DollarSign size={16} className="text-green-500 mx-auto mb-1" />
          <p className="text-xs text-gray-400 uppercase font-medium">Collected Today</p>
          <p className="text-lg font-bold text-gray-900 mt-0.5">{formatCurrency(Number(todayPayments._sum.amount ?? 0))}</p>
          <p className="text-xs text-gray-400">{todayPayments._count.id} payments</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <Receipt size={16} className="text-amber-500 mx-auto mb-1" />
          <p className="text-xs text-gray-400 uppercase font-medium">Expenses</p>
          <p className="text-lg font-bold text-gray-900 mt-0.5">{formatCurrency(Number(todayExpenses._sum.amount ?? 0))}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <CreditCard size={16} className="text-red-500 mx-auto mb-1" />
          <p className="text-xs text-gray-400 uppercase font-medium">Pending</p>
          <p className={`text-lg font-bold mt-0.5 ${unpaidSales.length > 0 ? "text-red-600" : "text-gray-900"}`}>{unpaidSales.length}</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/cashier/expenses/new" className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-4 rounded-xl font-semibold text-sm hover:bg-gray-50 transition">
          <Receipt size={18} /> RECORD EXPENSE
        </Link>
        <Link href="/cashier/reconcile" className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-4 rounded-xl font-semibold text-sm hover:bg-gray-50 transition">
          <DollarSign size={18} /> RECONCILE
        </Link>
      </div>

      {/* Pending payment sales */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">Pending Payments</h2>
        </div>
        {unpaidSales.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">All sales have been paid. ✓</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {unpaidSales.map(sale => {
              const name = sale.customer
                ? (sale.customer.businessName ?? `${sale.customer.firstName} ${sale.customer.lastName ?? ""}`.trim())
                : "Walk-in";
              const paid = sale.payments.reduce((s, p) => s + Number(p.amount), 0);
              const owing = Number(sale.total) - paid;
              return (
                <div key={sale.id} className="px-5 py-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{name}</p>
                      <p className="text-xs text-gray-400">{sale.salesperson.name} · {formatDateTime(sale.saleDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(Number(sale.total))}</p>
                      {paid > 0 && <p className="text-xs text-amber-600">Paid: {formatCurrency(paid)}</p>}
                      <p className="text-xs text-red-600 font-semibold">Owing: {formatCurrency(owing)}</p>
                    </div>
                  </div>
                  <RecordPaymentForm saleId={sale.id} saleNumber={sale.saleNumber} owing={owing} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
