"use client";

import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";

export function AddToCartButton({ variantId, variantName, price, productName }: {
  variantId: string; variantName: string; price: number; productName: string;
}) {
  const [added, setAdded] = useState(false);

  function handleAdd() {
    // Cart stored in localStorage for now — Phase 11 will add full cart/checkout
    try {
      const cart = JSON.parse(localStorage.getItem("rw_cart") ?? "[]");
      const existing = cart.find((i: { variantId: string }) => i.variantId === variantId);
      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({ variantId, productName, variantName, price, quantity: 1 });
      }
      localStorage.setItem("rw_cart", JSON.stringify(cart));
    } catch {}
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <button
      onClick={handleAdd}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
        added ? "bg-green-100 text-green-700" : "bg-[hsl(142,71%,25%)] text-white hover:opacity-90"
      }`}
    >
      {added ? <><Check size={15} /> Added</> : <><ShoppingCart size={15} /> Add</>}
    </button>
  );
}
