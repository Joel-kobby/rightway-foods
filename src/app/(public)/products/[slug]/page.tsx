import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { AddToCartButton } from "@/components/public/AddToCartButton";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await db.product.findUnique({ where: { slug: params.slug } });
  if (!product) return {};
  return {
    title: `${product.name} — RightWay Foods`,
    description: product.description ?? undefined,
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await db.product.findUnique({
    where: { slug: params.slug, isActive: true },
    include: {
      category: true,
      variants: {
        where: { isActive: true },
        include: { inventory: { select: { quantity: true } } },
        orderBy: { retailPrice: "asc" },
      },
    },
  });

  if (!product) notFound();

  const emoji = product.name.toLowerCase().includes("egg") ? "🥚" : product.name.toLowerCase().includes("coconut") ? "🥥" : "🌴";

  const defaultImages: Record<string, string> = {
    "palm-oil": "https://i.ibb.co/CsnN81Mb/Whats-App-Image-2026-09-29-at-05-02-34.jpg",
    "coconut-oil": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80",
    "eggs": "https://images.unsplash.com/photo-1498654077810-12c21d4d6dc3?w=600&q=80",
  };
  const imageUrl = product.imageUrl || defaultImages[product.slug] || null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Image */}
        <div className="aspect-square bg-gradient-to-br from-[hsl(45,30%,96%)] to-[hsl(142,30%,92%)] rounded-3xl flex items-center justify-center overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt={product.name} className="w-full h-full object-cover rounded-3xl" />
          ) : (
            <span className="text-9xl">{emoji}</span>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="text-xs text-[hsl(142,71%,25%)] font-semibold uppercase tracking-wide">{product.category.name}</p>
          <h1 className="text-3xl font-bold text-gray-900 mt-2 mb-3">{product.name}</h1>
          {product.description && <p className="text-gray-600 mb-6 leading-relaxed">{product.description}</p>}

          {/* Variants */}
          <div className="space-y-3 mb-8">
            <p className="text-sm font-semibold text-gray-700">Select size / quantity:</p>
            {product.variants.map(v => {
              const inStock = Number(v.inventory?.quantity ?? 0) > 0;
              return (
                <div key={v.id} className="flex items-center justify-between border border-gray-200 rounded-xl p-4">
                  <div>
                    <p className="font-semibold text-gray-900">{v.name}</p>
                    <p className="text-xs text-gray-400">{v.unit}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(Number(v.retailPrice))}</p>
                      {v.wholesalePrice && <p className="text-xs text-gray-400">Wholesale: {formatCurrency(Number(v.wholesalePrice))}</p>}
                    </div>
                    {inStock ? (
                      <AddToCartButton variantId={v.id} variantName={v.name} price={Number(v.retailPrice)} productName={product.name} />
                    ) : (
                      <span className="text-xs text-gray-400 bg-gray-100 px-3 py-2 rounded-lg">Out of Stock</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Trust signals */}
          <div className="space-y-2 text-sm text-gray-500">
            <p>🚚 Nationwide delivery available</p>
            <p>✅ 100% natural, no additives</p>
            <p>📞 Call us for wholesale pricing</p>
          </div>
        </div>
      </div>
    </div>
  );
}
