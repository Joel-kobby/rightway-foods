"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Variant {
  id: string; name: string; sku: string; retailPrice: number;
  wholesalePrice: number | null; minSellingPrice: number; costPrice: number;
  inventory: { quantity: number } | null;
}
interface Product {
  id: string; name: string; unit: string;
  variants: Variant[];
  category: { name: string };
}
interface Customer {
  id: string; firstName: string; lastName: string | null;
  businessName: string | null; phone: string; customerId: string;
}
interface LineItem {
  productId: string; variantId: string;
  quantity: number; unitPrice: number; discount: number;
}

export function RecordSaleForm({ products, customers }: {
  products: Product[]; customers: Customer[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerQ, setCustomerQ] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"UNPAID" | "PAID">("UNPAID");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { productId: "", variantId: "", quantity: 1, unitPrice: 0, discount: 0 },
  ]);

  const filteredCustomers = useMemo(() =>
    customers.filter(c =>
      customerQ === "" ||
      `${c.firstName} ${c.lastName ?? ""} ${c.businessName ?? ""} ${c.phone} ${c.customerId}`.toLowerCase().includes(customerQ.toLowerCase())
    ).slice(0, 8),
    [customers, customerQ]);

  function getVariant(productId: string, variantId: string) {
    return products.find(p => p.id === productId)?.variants.find(v => v.id === variantId);
  }

  function updateItem(idx: number, field: keyof LineItem, value: string | number) {
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [field]: value };
      if (field === "variantId") {
        const v = getVariant(item.productId, value as string);
        if (v) updated.unitPrice = v.retailPrice;
      }
      if (field === "productId") {
        updated.variantId = "";
        updated.unitPrice = 0;
      }
      return updated;
    }));
  }

  const subtotal = items.reduce((sum, i) => sum + (i.unitPrice * i.quantity - i.discount), 0);
  const canSubmit = items.every(i => i.productId && i.variantId && i.quantity > 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!canSubmit) { setError("Please complete all line items."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: customerId || null, items, paymentStatus, paymentMethod: paymentStatus === "PAID" ? paymentMethod : null, notes }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to record sale."); return; }
      setSuccess(`Sale ${data.saleNumber} recorded successfully.`);
      setTimeout(() => router.push("/sales"), 1500);
    } catch { setError("Something went wrong. The sale was not recorded. Please try again."); }
    finally { setLoading(false); }
  }

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(142,71%,25%)]";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Customer */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Customer (optional)</h2>
        <input
          value={customerQ}
          onChange={e => { setCustomerQ(e.target.value); setCustomerId(""); }}
          placeholder="Search by name, phone, ID…"
          className={inputCls}
        />
        {customerQ && !customerId && filteredCustomers.length > 0 && (
          <div className="border border-gray-100 rounded-lg overflow-hidden">
            {filteredCustomers.map(c => (
              <button key={c.id} type="button" onClick={() => { setCustomerId(c.id); setCustomerQ(c.businessName ?? `${c.firstName} ${c.lastName ?? ""}`.trim()); }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0">
                <span className="font-medium">{c.businessName ?? `${c.firstName} ${c.lastName ?? ""}`.trim()}</span>
                <span className="text-gray-400 text-xs ml-2">{c.phone}</span>
              </button>
            ))}
          </div>
        )}
        {customerId && <p className="text-xs text-green-600 font-medium">✓ Customer selected</p>}
      </div>

      {/* Line items */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Items</h2>
        {items.map((item, idx) => {
          const productVariants = products.find(p => p.id === item.productId)?.variants ?? [];
          const variant = getVariant(item.productId, item.variantId);
          const stock = variant?.inventory?.quantity ?? null;
          return (
            <div key={idx} className="border border-gray-100 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400">Item {idx + 1}</span>
                {items.length > 1 && (
                  <button type="button" onClick={() => setItems(p => p.filter((_, i) => i !== idx))} className="text-gray-300 hover:text-red-500 transition">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <select value={item.productId} onChange={e => updateItem(idx, "productId", e.target.value)} className={inputCls}>
                <option value="">Select product…</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {item.productId && (
                <select value={item.variantId} onChange={e => updateItem(idx, "variantId", e.target.value)} className={inputCls}>
                  <option value="">Select variant…</option>
                  {productVariants.map(v => (
                    <option key={v.id} value={v.id}>{v.name} — {formatCurrency(v.retailPrice)} (Stock: {v.inventory?.quantity ?? 0})</option>
                  ))}
                </select>
              )}
              {item.variantId && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Qty *</label>
                    <input type="number" min="1" max={stock ?? undefined} value={item.quantity}
                      onChange={e => updateItem(idx, "quantity", parseInt(e.target.value) || 1)} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Unit Price (₵)</label>
                    <input type="number" step="0.01" min="0" value={item.unitPrice}
                      onChange={e => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Discount (₵)</label>
                    <input type="number" step="0.01" min="0" value={item.discount}
                      onChange={e => updateItem(idx, "discount", parseFloat(e.target.value) || 0)} className={inputCls} />
                  </div>
                </div>
              )}
              {stock !== null && stock <= 5 && (
                <p className="text-xs text-amber-600">⚠ Only {stock} in stock</p>
              )}
            </div>
          );
        })}
        <button type="button" onClick={() => setItems(p => [...p, { productId: "", variantId: "", quantity: 1, unitPrice: 0, discount: 0 }])}
          className="flex items-center gap-1.5 text-sm text-[hsl(142,71%,25%)] hover:underline font-medium">
          <Plus size={15} /> Add Item
        </button>
      </div>

      {/* Payment */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Payment</h2>
        <div className="grid grid-cols-2 gap-3">
          {(["UNPAID", "PAID"] as const).map(s => (
            <button key={s} type="button" onClick={() => setPaymentStatus(s)}
              className={`py-3 rounded-xl text-sm font-semibold border-2 transition ${paymentStatus === s ? "border-[hsl(142,71%,25%)] bg-[hsl(142,71%,25%)] text-white" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
              {s === "PAID" ? "✓ Paid Now" : "Pay Later"}
            </button>
          ))}
        </div>
        {paymentStatus === "PAID" && (
          <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className={inputCls}>
            <option value="CASH">Cash</option>
            <option value="MOBILE_MONEY">Mobile Money</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CARD">Card</option>
          </select>
        )}
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)…" rows={2} className={inputCls} />
      </div>

      {/* Total */}
      <div className="bg-[hsl(142,71%,25%)] text-white rounded-xl p-4 flex items-center justify-between">
        <span className="font-semibold">Total</span>
        <span className="text-2xl font-bold">{formatCurrency(subtotal)}</span>
      </div>

      {error && <div role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</div>}
      {success && <div className="text-sm text-green-600 bg-green-50 border border-green-100 rounded-xl px-4 py-3 font-medium">{success}</div>}

      <button type="submit" disabled={loading || !canSubmit}
        className="w-full bg-[hsl(142,71%,25%)] text-white py-4 rounded-xl text-base font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? "Recording…" : "RECORD SALE"}
      </button>
      <a href="/sales" className="block text-center text-sm text-gray-400 hover:text-gray-600 py-2">Cancel</a>
    </form>
  );
}
