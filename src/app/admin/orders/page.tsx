import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) redirect("/login");

  const orders = await db.order.findMany({
    orderBy: { placedAt: "desc" },
    take: 200,
    include: {
      customer: { select: { firstName: true, lastName: true, businessName: true } },
      items:    { select: { quantity: true, total: true } },
    },
  });

  const statusColors: Record<string, "default"|"info"|"success"|"warning"|"danger"> = {
    PENDING:"warning", CONFIRMED:"info", PAID:"success", DELIVERED:"success",
    CANCELLED:"danger", RETURNED:"danger",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500 mt-1">{orders.filter(o => o.status === "PENDING").length} pending orders</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Order #</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Customer</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 uppercase">Items</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 uppercase">Total</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Payment</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Placed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400">No orders yet. They will appear here when customers place orders online.</td></tr>
            ) : orders.map(o => {
              const name = o.customer
                ? (o.customer.businessName ?? `${o.customer.firstName} ${o.customer.lastName ?? ""}`.trim())
                : (o.guestName ?? "Guest");
              return (
                <tr key={o.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-mono text-xs text-[hsl(142,71%,25%)] font-semibold">{o.orderNumber}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{name}</td>
                  <td className="px-6 py-4 text-right text-gray-600">{o.items.length}</td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-900">{formatCurrency(o.total)}</td>
                  <td className="px-6 py-4"><Badge variant={statusColors[o.status] ?? "default"}>{o.status.replace(/_/g," ")}</Badge></td>
                  <td className="px-6 py-4"><Badge variant={o.paymentStatus === "PAID" ? "success" : "warning"}>{o.paymentStatus}</Badge></td>
                  <td className="px-6 py-4 text-gray-400 text-xs">{formatDateTime(o.placedAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
