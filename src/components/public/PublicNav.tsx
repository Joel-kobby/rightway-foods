"use client";

import Link from "next/link";
import { useState } from "react";
import { ShoppingCart, Menu, X } from "lucide-react";

export function PublicNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/home" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-[hsl(142,71%,25%)] rounded-xl flex items-center justify-center">
            <span className="text-white font-black text-base">R</span>
          </div>
          <span className="font-bold text-gray-900 text-lg hidden sm:block">RightWay Foods</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <Link href="/home" className="hover:text-[hsl(142,71%,25%)] transition">Home</Link>
          <Link href="/products" className="hover:text-[hsl(142,71%,25%)] transition">Shop</Link>
          <Link href="/about" className="hover:text-[hsl(142,71%,25%)] transition">About</Link>
          <Link href="/contact" className="hover:text-[hsl(142,71%,25%)] transition">Contact</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/cart" className="relative p-2 text-gray-600 hover:text-[hsl(142,71%,25%)] transition">
            <ShoppingCart size={22} />
          </Link>
          <Link href="/login" className="hidden sm:block text-sm font-semibold bg-[hsl(142,71%,25%)] text-white px-4 py-2 rounded-lg hover:opacity-90 transition">
            Staff Login
          </Link>
          <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-gray-600">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
          {[["Home","/home"],["Shop","/products"],["About","/about"],["Contact","/contact"]].map(([l,h]) => (
            <Link key={h} href={h} onClick={() => setOpen(false)} className="block py-2 text-sm font-medium text-gray-700 hover:text-[hsl(142,71%,25%)]">{l}</Link>
          ))}
          <Link href="/login" className="block text-center text-sm font-semibold bg-[hsl(142,71%,25%)] text-white px-4 py-2.5 rounded-lg mt-2">Staff Login</Link>
        </div>
      )}
    </header>
  );
}
