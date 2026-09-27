"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Category { id: string; name: string; }

export function RecordExpenseForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");
  const [categoryId, setCat]      = useState(categories[0]?.id ?? "");
  const [amount, setAmount]       = useState("");
  const [description, setDesc]    = useState("");
  const [method, setMethod]       = useState("CASH");
  const [reference, setReference] = useState("");

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(142,71%,25%)]";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId, amount: parseFloat(amount), description, paymentMethod: method, reference: reference || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed."); return; }
      setSuccess(`Expense ${data.expenseRef} recorded.`);
      setTimeout(() => router.push("/cashier"), 1200);
    } catch { setError("Something went wrong. The expense was not saved. Please try again."); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
        <select required value={categoryId} onChange={e => setCat(e.target.value)} className={inputCls}>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₵) *</label>
        <input required type="number" step="0.01" min="0.01" value={amount} onChange={e => setAmount(e.target.value)} className={inputCls} placeholder="0.00" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
        <input required value={description} onChange={e => setDesc(e.target.value)} className={inputCls} placeholder="What was this for?" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
        <select value={method} onChange={e => setMethod(e.target.value)} className={inputCls}>
          <option value="CASH">Cash</option>
          <option value="MOBILE_MONEY">Mobile Money</option>
          <option value="BANK_TRANSFER">Bank Transfer</option>
        </select>
      </div>
      {method !== "CASH" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
          <input value={reference} onChange={e => setReference(e.target.value)} className={inputCls} placeholder="Transaction reference" />
        </div>
      )}
      {error   && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">{error}</p>}
      {success && <p className="text-sm text-green-600 bg-green-50 border border-green-100 rounded-lg px-4 py-2">{success}</p>}
      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={loading} className="flex-1 bg-[hsl(142,71%,25%)] text-white py-3 rounded-lg text-sm font-bold hover:opacity-90 disabled:opacity-50">
          {loading ? "Saving…" : "Record Expense"}
        </button>
        <a href="/cashier" className="px-5 py-3 text-sm text-gray-500 hover:text-gray-700 font-medium">Cancel</a>
      </div>
    </form>
  );
}
