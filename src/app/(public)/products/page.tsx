import Link from "next/link";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop — RightWay Foods",
  description: "Buy palm oil, coconut oil, and fresh eggs online. Delivery across Ghana.",
};

export const dynamic = "force-dynamic";

export default async function ProductsPage({ searchParams }: { searchParams: { category?: string } }) {
  const where: Record<string, unknown> = { isActive: true };
  if (searchParams.category) where.category = { slug: searchParams.category };

  const [products, categories] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        variants: {
          where: { isActive: true },
          orderBy: { retailPrice: "asc" },
          include: { inventory: { select: { quantity: true } } },
        },
        category: { select: { name: true, slug: true } },
      },
      orderBy: { name: "asc" },
    }),
    db.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Our Products</h1>
      <p className="text-gray-500 mb-8">Pure Ghanaian food products, delivered nationwide.</p>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Link href="/products" className={`px-4 py-2 rounded-full text-sm font-medium transition ${!searchParams.category ? "bg-[hsl(142,71%,25%)] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          All Products
        </Link>
        {categories.map(c => (
          <Link key={c.id} href={`/products?category=${c.slug}`} className={`px-4 py-2 rounded-full text-sm font-medium transition ${searchParams.category === c.slug ? "bg-[hsl(142,71%,25%)] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {c.name}
          </Link>
        ))}
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => {
          const cheapest = product.variants[0];
          const inStock = product.variants.some(v => Number(v.inventory?.quantity ?? 0) > 0);
          return (
            <Link key={product.id} href={`/products/${product.slug}`} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden">
              <div className="aspect-square bg-gradient-to-br from-[hsl(45,30%,96%)] to-[hsl(142,30%,92%)] flex items-center justify-center overflow-hidden">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-6xl">
                    {product.name.toLowerCase().includes("egg") ? "🥚" : product.name.toLowerCase().includes("coconut") ? "🥥" : "🌴"}
                  </span>
                )}
              </div>
              <div className="p-5">
                <p className="text-xs text-[hsl(142,71%,25%)] font-semibold uppercase tracking-wide">{product.category.name}</p>
                <h2 className="font-bold text-gray-900 text-lg mt-1 group-hover:text-[hsl(142,71%,25%)] transition">{product.name}</h2>
                {product.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>}
                <div className="flex items-center justify-between mt-4">
                  <p className="font-bold text-gray-900">
                    {cheapest ? `From ${formatCurrency(Number(cheapest.retailPrice))}` : "Price on request"}
                  </p>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${inStock ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {inStock ? "In Stock" : "Out of Stock"}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      {products.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p>No products found in this category.</p>
          <Link href="/products" className="text-[hsl(142,71%,25%)] mt-2 inline-block hover:underline">View all products</Link>
        </div>
      )}
    </div>
  );
}
