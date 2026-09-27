import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { CustomerSearch } from "@/components/admin/CustomerSearch";

export const dynamic = "force-dynamic";

const typeColors: Record<string, "default" | "info" | "success" | "warning"> = {
  RETAIL: "default", WHOLESALE: "info", SHOP: "success",
  RESTAURANT: "warning", RESELLER: "info", CORPORATE: "success",
};

export default async function AdminCustomersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const customers = await db.customer.findMany({
    include: {
      assignedTo: { select: { name: true } },
      _count: { select: { sales: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">{customers.length} customers</p>
        </div>
        <CustomerSearch />
      </div>

      {customers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
          <Users size={40} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No customers yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Customer</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Phone</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Type</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Location</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Purchases</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Outstanding</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Assigned To</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">
                      {c.businessName ?? `${c.firstName} ${c.lastName ?? ""}`.trim()}
                    </p>
                    <p className="text-xs text-gray-400 font-mono">{c.customerId}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{c.phone}</td>
                  <td className="px-6 py-4">
                    <Badge variant={typeColors[c.customerType] ?? "default"}>{c.customerType}</Badge>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{[c.city, c.region].filter(Boolean).join(", ") || "—"}</td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">{formatCurrency(c.totalPurchases)}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={c.outstandingBalance > 0 ? "text-red-600 font-semibold" : "text-gray-400"}>
                      {c.outstandingBalance > 0 ? formatCurrency(c.outstandingBalance) : "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{c.assignedTo?.name ?? "—"}</td>
                  <td className="px-6 py-4 text-gray-400 text-xs">{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
