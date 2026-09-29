import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminDeliveryPage() {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) redirect("/login");

  const [deliveries, zones] = await Promise.all([
    db.delivery.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        zone: { select: { name: true, fee: true } },
      },
    }),
    db.deliveryZone.findMany({ orderBy: { fee: "asc" } }),
  ]);

  // Get associated orders
  const orderIds = deliveries.map(d => d.orderId);
  const orders = await db.order.findMany({
    where: { id: { in: orderIds } },
    select: {
      id: true, orderNumber: true, guestName: true,
      guestPhone: true, guestCity: true, guestRegion: true, total: true,
    },
  });
  const orderMap = Object.fromEntries(orders.map(o => [o.id, o]));

  const statusColors: Record<string, "default" | "info" | "warning" | "success" | "danger"> = {
    PENDING: "warning", ASSIGNED: "info", DISPATCHED: "info",
    OUT_FOR_DELIVERY: "info", DELIVERED: "success", FAILED: "danger", RETURNED: "danger",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Delivery</h1>
        <p className="text-sm text-gray-500 mt-1">
          {deliveries.filter(d => d.status === "PENDING").length} pending · {deliveries.filter(d => d.status === "OUT_FOR_DELIVERY").length} out for delivery
        </p>
      </div>

      {/* Delivery zones summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {zones.map(z => (
          <div key={z.id} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-700 truncate">{z.name}</p>
            <p className="text-base font-bold text-gray-900 mt-1">{formatCurrency(Number(z.fee))}</p>
            <p className="text-xs text-gray-400">{z.estimatedDays} day{z.estimatedDays > 1 ? "s" : ""}</p>
          </div>
        ))}
      </div>

      {/* Deliveries table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Order #</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Customer</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Location</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 uppercase">Total</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Zone</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {deliveries.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400">No deliveries yet.</td></tr>
            ) : deliveries.map(d => {
              const order = orderMap[d.orderId];
              return (
                <tr key={d.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-mono text-xs text-[hsl(142,71%,25%)] font-semibold">{order?.orderNumber ?? "—"}</td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{order?.guestName ?? "—"}</p>
                    <p className="text-xs text-gray-400">{order?.guestPhone ?? ""}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{[order?.guestCity, order?.guestRegion].filter(Boolean).join(", ") || "—"}</td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-900">{order ? formatCurrency(Number(order.total)) : "—"}</td>
                  <td className="px-6 py-4 text-gray-600">{d.zone?.name ?? "—"}</td>
                  <td className="px-6 py-4"><Badge variant={statusColors[d.status] ?? "default"}>{d.status.replace(/_/g, " ")}</Badge></td>
                  <td className="px-6 py-4 text-gray-400 text-xs">{formatDateTime(d.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
