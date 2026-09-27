"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface CartItem {
  variantId: string; productName: string; variantName: string; price: number; quantity: number;
}

export function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try { setCart(JSON.parse(localStorage.getItem("rw_cart") ?? "[]")); } catch {}
  }, []);

  function save(updated: CartItem[]) {
    setCart(updated);
    localStorage.setItem("rw_cart", JSON.stringify(updated));
  }

  function updateQty(variantId: string, delta: number) {
    const updated = cart.map(i => i.variantId === variantId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i);
    save(updated);
  }

  function remove(variantId: string) {
    save(cart.filter(i => i.variantId !== variantId));
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  if (!mounted) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Cart</h1>

      {cart.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBag size={48} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 mb-6">Your cart is empty.</p>
          <Link href="/products" className="bg-[hsl(142,71%,25%)] text-white font-semibold px-8 py-3 rounded-xl hover:opacity-90 transition">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-3">
            {cart.map(item => (
              <div key={item.variantId} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                <div className="w-14 h-14 bg-[hsl(45,30%,96%)] rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  {item.productName.toLowerCase().includes("egg") ? "🥚" : item.productName.toLowerCase().includes("coconut") ? "🥥" : "🌴"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{item.productName}</p>
                  <p className="text-sm text-gray-500">{item.variantName}</p>
                  <p className="text-sm font-semibold text-[hsl(142,71%,25%)]">{formatCurrency(item.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.variantId, -1)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center font-semibold">{item.quantity}</span>
                  <button onClick={() => updateQty(item.variantId, 1)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
                    <Plus size={14} />
                  </button>
                  <button onClick={() => remove(item.variantId)} className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 transition ml-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 h-fit">
            <h2 className="font-bold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm mb-4">
              {cart.map(i => (
                <div key={i.variantId} className="flex justify-between text-gray-600">
                  <span>{i.productName} × {i.quantity}</span>
                  <span>{formatCurrency(i.price * i.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1 mb-5">Delivery fee calculated at checkout.</p>
            <Link href="/checkout" className="block text-center bg-[hsl(142,71%,25%)] text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition">
              Proceed to Checkout
            </Link>
            <Link href="/products" className="block text-center text-sm text-gray-500 hover:text-gray-700 mt-3">
              Continue Shopping
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
