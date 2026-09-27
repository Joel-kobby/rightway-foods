import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { isAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { EditProductForm } from "@/components/products/EditProductForm";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) redirect("/login");

  const [product, categories, suppliers] = await Promise.all([
    db.product.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        supplier: true,
        variants: {
          include: {
            inventory: { select: { quantity: true } },
            priceHistory: { orderBy: { effectiveFrom: "desc" }, take: 3 },
          },
        },
      },
    }),
    db.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    db.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  if (!product) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/products" className="text-gray-400 hover:text-gray-600 transition">
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          <p className="text-xs text-gray-400 font-mono mt-0.5">{product.sku}</p>
        </div>
        <Badge variant={product.isActive ? "success" : "danger"} className="ml-2">
          {product.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      <EditProductForm product={product} categories={categories} suppliers={suppliers} />

      {/* Variants & pricing */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Variants & Pricing</h2>
          <p className="text-xs text-gray-400 mt-0.5">Price changes are recorded in history. Historical sales are never recalculated.</p>
        </div>
        <div className="divide-y divide-gray-50">
          {product.variants.map((v) => (
            <div key={v.id} className="px-6 py-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-semibold text-gray-900">{v.name}</span>
                  <span className="text-xs text-gray-400 font-mono ml-2">{v.sku}</span>
                </div>
                <Badge variant={v.isActive ? "success" : "danger"} className="text-xs">
                  {v.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div><p className="text-xs text-gray-400">Cost Price</p><p className="font-semibold text-gray-900">{formatCurrency(v.costPrice)}</p></div>
                <div><p className="text-xs text-gray-400">Retail Price</p><p className="font-semibold text-gray-900">{formatCurrency(v.retailPrice)}</p></div>
                <div><p className="text-xs text-gray-400">Wholesale</p><p className="font-semibold text-gray-900">{v.wholesalePrice ? formatCurrency(v.wholesalePrice) : "—"}</p></div>
                <div><p className="text-xs text-gray-400">Min Selling</p><p className="font-semibold text-gray-900">{formatCurrency(v.minSellingPrice)}</p></div>
              </div>
              <div className="mt-2 flex gap-4 text-sm">
                <span className="text-gray-500">Stock: <strong className={v.inventory?.quantity === 0 ? "text-red-600" : "text-gray-900"}>{v.inventory?.quantity ?? 0}</strong></span>
                <span className="text-gray-500">Margin: <strong className="text-green-600">
                  {v.retailPrice > 0 ? (((v.retailPrice - v.costPrice) / v.retailPrice) * 100).toFixed(1) : 0}%
                </strong></span>
              </div>
              {v.priceHistory.length > 0 && (
                <div className="mt-2 text-xs text-gray-400">
                  Last price change: {formatDateTime(v.priceHistory[0].effectiveFrom)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
