import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Plus, Package } from "lucide-react";
import { ProductActions } from "@/components/products/ProductActions";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) redirect("/login");

  const products = await db.product.findMany({
    include: {
      category: true,
      variants: {
        include: { inventory: { select: { quantity: true } } },
      },
      _count: { select: { saleItems: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">{products.length} product{products.length !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 bg-[hsl(142,71%,25%)] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition"
        >
          <Plus size={16} /> Add Product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
          <Package size={40} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No products yet.</p>
          <Link href="/admin/products/new" className="text-[hsl(142,71%,25%)] text-sm mt-2 inline-block hover:underline">
            Add your first product →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Product</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Category</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Variants</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Retail Price</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Stock</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((product) => {
                const totalStock = product.variants.reduce((sum, v) => sum + (v.inventory?.quantity ?? 0), 0);
                const lowestPrice = Math.min(...product.variants.map((v) => v.retailPrice));
                const highestPrice = Math.max(...product.variants.map((v) => v.retailPrice));
                const isLowStock = product.variants.some(
                  (v) => (v.inventory?.quantity ?? 0) <= product.reorderLevel && (v.inventory?.quantity ?? 0) > 0
                );
                const isOutOfStock = product.variants.every((v) => (v.inventory?.quantity ?? 0) <= 0);

                return (
                  <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">{product.sku}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{product.category.name}</td>
                    <td className="px-6 py-4 text-gray-600">{product.variants.length}</td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      {lowestPrice === highestPrice
                        ? formatCurrency(lowestPrice)
                        : `${formatCurrency(lowestPrice)} – ${formatCurrency(highestPrice)}`}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-semibold ${isOutOfStock ? "text-red-600" : isLowStock ? "text-amber-600" : "text-gray-900"}`}>
                        {totalStock}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {!product.isActive ? (
                        <Badge variant="danger">Inactive</Badge>
                      ) : isOutOfStock ? (
                        <Badge variant="danger">Out of Stock</Badge>
                      ) : isLowStock ? (
                        <Badge variant="warning">Low Stock</Badge>
                      ) : (
                        <Badge variant="success">Active</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ProductActions productId={product.id} isActive={product.isActive} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
