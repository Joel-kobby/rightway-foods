"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";

export function RecordPaymentForm({ saleId, saleNumber, owing }: {
  saleId: string; saleNumber: string; owing: number;
}) {
  const router = useRouter();
  const [expanded, setExpanded]   = useState(false);
  const [amount, setAmount]       = useState(owing.toString());
  const [method, setMethod]       = useState("CASH");
  const [reference, setReference] = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saleId, amount: parseFloat(amount), paymentMethod: method, reference: reference || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to record payment."); return; }
      setSuccess(true);
      setTimeout(() => router.refresh(), 800);
    } catch { setError("Something went wrong. Payment was not recorded. Please try again."); }
    finally { setLoading(false); }
  }

  if (success) return <p className="text-xs text-green-600 font-semibold">✓ Payment recorded</p>;

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(142,71%,25%)]";

  return !expanded ? (
    <button onClick={() => setExpanded(true)} className="w-full text-sm font-semibold bg-[hsl(142,71%,25%)] text-white py-2.5 rounded-xl hover:opacity-90 transition">
      Record Payment — {formatCurrency(owing)}
    </button>
  ) : (
    <form onSubmit={handleSubmit} className="space-y-2 bg-gray-50 rounded-xl p-4">
      <p className="text-xs font-semibold text-gray-500 uppercase">{saleNumber}</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Amount (₵) *</label>
          <input required type="number" step="0.01" min="0.01" value={amount} onChange={e => setAmount(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Method *</label>
          <select value={method} onChange={e => setMethod(e.target.value)} className={inputCls}>
            <option value="CASH">Cash</option>
            <option value="MOBILE_MONEY">Mobile Money</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CARD">Card</option>
          </select>
        </div>
      </div>
      {method !== "CASH" && (
        <input value={reference} onChange={e => setReference(e.target.value)} placeholder="Reference / transaction number" className={inputCls} />
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="flex-1 bg-[hsl(142,71%,25%)] text-white py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50">
          {loading ? "Saving…" : "Confirm Payment"}
        </button>
        <button type="button" onClick={() => setExpanded(false)} className="px-4 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
      </div>
    </form>
  );
}
