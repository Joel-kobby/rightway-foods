import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="bg-[hsl(142,71%,18%)] text-white mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-[hsl(43,89%,45%)] rounded-xl flex items-center justify-center">
                <span className="text-white font-black text-base">R</span>
              </div>
              <span className="font-bold text-lg">RightWay Foods</span>
            </div>
            <p className="text-white/60 text-sm max-w-xs">
              Quality Ghanaian food products rooted in culture. Pure, natural, and delivered with care.
            </p>
            <div className="mt-4 space-y-1 text-sm text-white/60">
              <p>📞 +233 XX XXX XXXX</p>
              <p>✉ derightwayfoods@gmail.com</p>
              <p>📍 Accra, Ghana</p>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-3">Shop</h3>
            <ul className="space-y-2 text-white/60 text-sm">
              <li><Link href="/products" className="hover:text-white transition">All Products</Link></li>
              <li><Link href="/products?category=cooking-oils" className="hover:text-white transition">Cooking Oils</Link></li>
              <li><Link href="/products?category=eggs" className="hover:text-white transition">Eggs</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-3">Company</h3>
            <ul className="space-y-2 text-white/60 text-sm">
              <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
              <li><Link href="/delivery-policy" className="hover:text-white transition">Delivery Policy</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 mt-10 pt-6 text-center text-xs text-white/40">
          © {new Date().getFullYear()} RightWay Foods. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
