"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";

export function ReconcileForm({ expectedCash }: {
  expectedCash: number;
}) {
  const router = useRouter();
  const [actual, setActual] = useState("");
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const actualNum = parseFloat(actual) || 0;
  const difference = actualNum - expectedCash;
  const result = difference === 0 ? "EXACT" : difference > 0 ? "EXCESS" : "SHORTAGE";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!actual) { setError("Enter the actual cash amount."); return; }
    if (result !== "EXACT" && !explanation) {
      setError("An explanation is required for any discrepancy.");
      return;
    }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/cashier/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedCash, actualCash: actualNum, explanation: explanation || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to submit."); return; }
      setSuccess("Reconciliation submitted successfully.");
      setTimeout(() => router.push("/cashier"), 1500);
    } catch { setError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  }

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(142,71%,25%)]";

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
      <h2 className="font-semibold text-gray-800">Count & Submit</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Actual Cash on Hand (₵) *</label>
        <input
          required type="number" step="0.01" min="0"
          value={actual} onChange={e => setActual(e.target.value)}
          className={inputCls} placeholder="0.00"
        />
      </div>

      {actual && (
        <div className={`rounded-xl p-4 text-sm font-semibold ${result === "EXACT" ? "bg-green-50 text-green-700 border border-green-200" :
            result === "SHORTAGE" ? "bg-red-50 text-red-700 border border-red-200" :
              "bg-amber-50 text-amber-700 border border-amber-200"
          }`}>
          {result === "EXACT" && "✓ Cash balanced exactly."}
          {result === "SHORTAGE" && `⚠ Shortage of ${formatCurrency(Math.abs(difference))}`}
          {result === "EXCESS" && `ℹ Excess of ${formatCurrency(difference)}`}
        </div>
      )}

      {actual && result !== "EXACT" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Explanation *</label>
          <textarea
            required value={explanation} onChange={e => setExplanation(e.target.value)}
            rows={3} className={inputCls}
            placeholder="Explain the discrepancy…"
          />
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">{error}</p>}
      {success && <p className="text-sm text-green-600 bg-green-50 border border-green-100 rounded-lg px-4 py-2">{success}</p>}

      <button type="submit" disabled={loading || !actual} className="w-full bg-[hsl(142,71%,25%)] text-white py-3 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50">
        {loading ? "Submitting…" : "Submit Reconciliation"}
      </button>
    </form>
  );
}
