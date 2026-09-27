import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { InventoryAdjustModal } from "@/components/admin/InventoryAdjustModal";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) redirect("/login");

  const inventory = await db.inventory.findMany({
    include: {
      product: { select: { id: true, name: true, reorderLevel: true, unit: true, isActive: true } },
      variant: { select: { id: true, name: true, sku: true, costPrice: true, retailPrice: true } },
    },
    orderBy: { product: { name: "asc" } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <p className="text-sm text-gray-500 mt-1">{inventory.length} variants tracked</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Product / Variant</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">SKU</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 uppercase">In Stock</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 uppercase">Reorder At</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 uppercase">Stock Value</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Status</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 uppercase">Adjust</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {inventory.map((inv) => {
              const isOut  = inv.quantity <= 0;
              const isLow  = !isOut && inv.quantity <= inv.product.reorderLevel;
              const value  = inv.quantity * inv.variant.costPrice;
              return (
                <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">{inv.product.name}</p>
                    <p className="text-xs text-gray-400">{inv.variant.name}</p>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">{inv.variant.sku}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-bold text-lg ${isOut ? "text-red-600" : isLow ? "text-amber-600" : "text-gray-900"}`}>
                      {inv.quantity}
                    </span>
                    <span className="text-xs text-gray-400 ml-1">{inv.product.unit}</span>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-500">{inv.product.reorderLevel}</td>
                  <td className="px-6 py-4 text-right font-medium text-gray-700">
                    {(value).toLocaleString("en-GH", { style: "currency", currency: "GHS" })}
                  </td>
                  <td className="px-6 py-4">
                    {!inv.product.isActive ? (
                      <Badge variant="default">Inactive</Badge>
                    ) : isOut ? (
                      <Badge variant="danger">Out of Stock</Badge>
                    ) : isLow ? (
                      <Badge variant="warning">Low Stock</Badge>
                    ) : (
                      <Badge variant="success">In Stock</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <InventoryAdjustModal inventoryId={inv.id} variantName={`${inv.product.name} — ${inv.variant.name}`} currentQty={inv.quantity} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
