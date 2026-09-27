"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";

interface Zone { id: string; name: string; fee: number; estimatedDays: number; freeDeliveryThreshold: number | null; }
interface CartItem { variantId: string; productName: string; variantName: string; price: number; quantity: number; }

export function CheckoutForm({ zones }: { zones: Zone[] }) {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  const [name,      setName]      = useState("");
  const [phone,     setPhone]     = useState("");
  const [email,     setEmail]     = useState("");
  const [address,   setAddress]   = useState("");
  const [region,    setRegion]    = useState("");
  const [city,      setCity]      = useState("");
  const [landmark,  setLandmark]  = useState("");
  const [notes,     setNotes]     = useState("");
  const [zoneId,    setZoneId]    = useState(zones[0]?.id ?? "");
  const [method,    setMethod]    = useState("CASH");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  useEffect(() => {
    setMounted(true);
    try { setCart(JSON.parse(localStorage.getItem("rw_cart") ?? "[]")); } catch {}
  }, []);

  const selectedZone = zones.find(z => z.id === zoneId);
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const freeDelivery = selectedZone?.freeDeliveryThreshold && subtotal >= selectedZone.freeDeliveryThreshold;
  const deliveryFee = freeDelivery ? 0 : (selectedZone?.fee ?? 0);
  const total = subtotal + deliveryFee;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (cart.length === 0) { setError("Your cart is empty."); return; }
    setError(""); setLoading(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: name, guestPhone: phone, guestEmail: email || null,
          guestAddress: address, guestRegion: region, guestCity: city,
          guestLandmark: landmark || null, deliveryNotes: notes || null,
          deliveryZoneId: zoneId, paymentMethod: method,
          items: cart.map(i => ({ variantId: i.variantId, quantity: i.quantity, unitPrice: i.price })),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to place order."); return; }

      localStorage.removeItem("rw_cart");
      router.push(`/order/${data.orderNumber}`);
    } catch { setError("Something went wrong. Your order was not placed. Please try again."); }
    finally { setLoading(false); }
  }

  if (!mounted) return null;

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(142,71%,25%)]";

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Contact details */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-bold text-gray-900">Contact & Delivery Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input required value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="Akosua Mensah" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input required value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} placeholder="0244 000 000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="you@email.com" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address *</label>
                <input required value={address} onChange={e => setAddress(e.target.value)} className={inputCls} placeholder="House / Street address" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Region *</label>
                <input required value={region} onChange={e => setRegion(e.target.value)} className={inputCls} placeholder="e.g. Greater Accra" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City / Town *</label>
                <input required value={city} onChange={e => setCity(e.target.value)} className={inputCls} placeholder="e.g. Accra" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Landmark</label>
                <input value={landmark} onChange={e => setLandmark(e.target.value)} className={inputCls} placeholder="Near a landmark…" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input value={notes} onChange={e => setNotes(e.target.value)} className={inputCls} placeholder="Delivery instructions…" />
              </div>
            </div>
          </div>

          {/* Delivery zone */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-3">
            <h2 className="font-bold text-gray-900">Delivery Zone</h2>
            {zones.map(z => (
              <label key={z.id} className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition ${zoneId === z.id ? "border-[hsl(142,71%,25%)] bg-[hsl(142,71%,97%)]" : "border-gray-100 hover:border-gray-200"}`}>
                <div className="flex items-center gap-3">
                  <input type="radio" name="zone" value={z.id} checked={zoneId === z.id} onChange={() => setZoneId(z.id)} className="sr-only" />
                  <div>
                    <p className="font-semibold text-gray-900">{z.name}</p>
                    <p className="text-xs text-gray-400">{z.estimatedDays} day{z.estimatedDays > 1 ? "s" : ""} estimated</p>
                    {z.freeDeliveryThreshold && <p className="text-xs text-green-600">Free delivery on orders over {formatCurrency(z.freeDeliveryThreshold)}</p>}
                  </div>
                </div>
                <p className="font-bold text-gray-900">{formatCurrency(z.fee)}</p>
              </label>
            ))}
          </div>

          {/* Payment method */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-3">
            <h2 className="font-bold text-gray-900">Payment Method</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[["CASH","Cash on Delivery"],["MOBILE_MONEY","Mobile Money"],["BANK_TRANSFER","Bank Transfer"],["CARD","Card"]].map(([val,label]) => (
                <button key={val} type="button" onClick={() => setMethod(val)}
                  className={`py-3 px-2 rounded-xl border-2 text-xs font-semibold transition ${method === val ? "border-[hsl(142,71%,25%)] bg-[hsl(142,71%,97%)] text-[hsl(142,71%,25%)]" : "border-gray-100 text-gray-600 hover:border-gray-200"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="h-fit">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 sticky top-20">
            <h2 className="font-bold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm mb-4">
              {cart.map(i => (
                <div key={i.variantId} className="flex justify-between text-gray-600">
                  <span className="truncate mr-2">{i.productName} × {i.quantity}</span>
                  <span className="flex-shrink-0">{formatCurrency(i.price * i.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3 space-y-1 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery</span>
                <span className={freeDelivery ? "text-green-600 font-medium" : ""}>{freeDelivery ? "FREE" : formatCurrency(deliveryFee)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100 text-base">
                <span>Total</span><span>{formatCurrency(total)}</span>
              </div>
            </div>
            {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
            <button type="submit" disabled={loading || cart.length === 0}
              className="w-full mt-5 bg-[hsl(142,71%,25%)] text-white font-bold py-4 rounded-xl hover:opacity-90 transition disabled:opacity-50">
              {loading ? "Placing Order…" : `Place Order — ${formatCurrency(total)}`}
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">You will receive a confirmation with your order number.</p>
          </div>
        </div>
      </div>
    </form>
  );
}
