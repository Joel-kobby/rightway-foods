import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SalesHistoryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isAdmin = ["SUPER_ADMIN","ADMIN","BRANCH_MANAGER","ACCOUNTANT","AUDITOR"].includes(session.user.role);
  const where = isAdmin ? {} : { salespersonId: session.user.id };

  const sales = await db.sale.findMany({
    where,
    orderBy: { saleDate: "desc" },
    take: 100,
    include: {
      customer:    { select: { firstName: true, lastName: true, businessName: true } },
      salesperson: { select: { name: true } },
      items:       { include: { product: { select: { name: true } }, variant: { select: { name: true } } } },
    },
  });

  const payBadge: Record<string, "success"|"warning"|"danger"> = {
    PAID:"success", PARTIAL:"warning", UNPAID:"danger",
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/sales" className="text-gray-400 hover:text-gray-600"><ChevronLeft size={20} /></Link>
        <h1 className="text-xl font-bold text-gray-900">{isAdmin ? "All Sales" : "My Sales"}</h1>
      </div>
      {sales.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">No sales recorded yet.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {sales.map(sale => {
            const name = sale.customer
              ? (sale.customer.businessName ?? `${sale.customer.firstName} ${sale.customer.lastName ?? ""}`.trim())
              : "Walk-in";
            const products = sale.items.map(i => `${i.product.name} ${i.variant.name}`).join(", ");
            return (
              <div key={sale.id} className="px-5 py-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{name}</p>
                  <p className="text-xs text-gray-400 truncate">{products}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-gray-300">{formatDateTime(sale.saleDate)}</p>
                    {isAdmin && <p className="text-xs text-gray-400">by {sale.salesperson.name}</p>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="font-bold text-gray-900">{formatCurrency(Number(sale.total))}</span>
                  <Badge variant={payBadge[sale.paymentStatus] ?? "default"}>{sale.paymentStatus}</Badge>
                  <p className="text-xs font-mono text-gray-300">{sale.saleNumber}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
