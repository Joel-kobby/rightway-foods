import Link from "next/link";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RightWay Foods — Quality Ghanaian Food Products",
  description: "Pure palm oil, coconut oil, and fresh eggs delivered to your door. Premium Ghanaian food products rooted in culture.",
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await db.product.findMany({
    where: { isActive: true },
    include: {
      variants: {
        where: { isActive: true },
        orderBy: { retailPrice: "asc" },
        take: 1,
        include: { inventory: { select: { quantity: true } } },
      },
      category: { select: { name: true } },
    },
    take: 6,
    orderBy: { name: "asc" },
  });

  return (
    <>
      {/* Hero */}
      <section className="bg-[hsl(142,71%,18%)] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-[hsl(43,89%,45%)]" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 lg:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 text-sm text-white/80 mb-6">
              🌴 Rooted in Ghanaian Food Culture
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6">
              Pure. Natural.<br />
              <span className="text-[hsl(43,89%,55%)]">Delivered.</span>
            </h1>
            <p className="text-white/70 text-lg mb-8 max-w-lg">
              Premium palm oil, coconut oil, and fresh eggs — quality food products trusted by homes and businesses across Ghana.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/products" className="bg-[hsl(43,89%,45%)] text-white font-bold px-8 py-4 rounded-xl text-base hover:opacity-90 transition">
                Shop Now
              </Link>
              <Link href="/contact" className="bg-white/10 text-white font-semibold px-8 py-4 rounded-xl text-base hover:bg-white/20 transition">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-[hsl(43,89%,45%)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="grid grid-cols-3 gap-4 text-center text-white text-sm font-semibold">
            <div>🚚 Nationwide Delivery</div>
            <div>✅ 100% Natural Products</div>
            <div>📞 Trusted by Businesses</div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Our Products</h2>
            <p className="text-gray-500 mt-1">Pure, natural, Ghanaian.</p>
          </div>
          <Link href="/products" className="text-sm text-[hsl(142,71%,25%)] font-semibold hover:underline">
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => {
            const variant = product.variants[0];
            const inStock = (variant?.inventory?.quantity != null) && Number(variant.inventory.quantity) > 0;

            // Default product images by slug
            const defaultImages: Record<string, string> = {
              "palm-oil": "https://i.ibb.co/CsnN81Mb/Whats-App-Image-2026-09-29-at-05-02-34.jpg",
              "coconut-oil": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80",
              "eggs": "https://images.unsplash.com/photo-1498654077810-12c21d4d6dc3?w=600&q=80",
            };
            const imageUrl = product.imageUrl || defaultImages[product.slug] || null;
            return (
              <Link key={product.id} href={`/products/${product.slug}`} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden">
                {/* Product image placeholder */}
                <div className="aspect-square bg-gradient-to-br from-[hsl(45,30%,96%)] to-[hsl(142,30%,92%)] flex items-center justify-center overflow-hidden">
                  {imageUrl ? (
                    <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-6xl">
                      {product.name.toLowerCase().includes("egg") ? "🥚" : product.name.toLowerCase().includes("coconut") ? "🥥" : "🌴"}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{product.category.name}</p>
                  <h3 className="font-bold text-gray-900 text-lg mt-1 group-hover:text-[hsl(142,71%,25%)] transition">{product.name}</h3>
                  {product.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>}
                  <div className="flex items-center justify-between mt-4">
                    <div>
                      {variant ? (
                        <p className="font-bold text-gray-900">From {formatCurrency(Number(variant.retailPrice))}</p>
                      ) : (
                        <p className="text-gray-400 text-sm">Price on request</p>
                      )}
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${inStock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {inStock ? "In Stock" : "Out of Stock"}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Why RightWay */}
      <section className="bg-[hsl(45,30%,96%)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Why Choose RightWay Foods?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: "🌿", title: "100% Natural", desc: "No additives, no preservatives. Just pure, natural Ghanaian food products." },
              { icon: "🚚", title: "Fast Delivery", desc: "Nationwide delivery across Ghana. We bring quality food to your door." },
              { icon: "💼", title: "Wholesale Available", desc: "Special pricing for shops, restaurants, and bulk buyers. Call us today." },
            ].map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6 text-center shadow-sm">
                <div className="text-4xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to order?</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">Browse our full range of products and get them delivered to your home or business.</p>
        <Link href="/products" className="inline-block bg-[hsl(142,71%,25%)] text-white font-bold px-10 py-4 rounded-xl text-base hover:opacity-90 transition">
          Shop Now
        </Link>
      </section>
    </>
  );
}
