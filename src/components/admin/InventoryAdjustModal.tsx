"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";

export function InventoryAdjustModal({ inventoryId, variantName, currentQty }: {
  inventoryId: string; variantName: string; currentQty: number;
}) {
  const router = useRouter();
  const [open, setOpen]     = useState(false);
  const [type, setType]     = useState("ADJUSTMENT_IN");
  const [qty,  setQty]      = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventoryId, type, quantity: parseFloat(qty), reason }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed."); return; }
      setOpen(false); setQty(""); setReason("");
      router.refresh();
    } catch { setError("Something went wrong."); }
    finally { setLoading(false); }
  }

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(142,71%,25%)]";

  return (
    <>
      <button onClick={() => setOpen(true)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition" title="Adjust stock">
        <SlidersHorizontal size={15} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-base font-bold text-gray-900 mb-1">Adjust Stock</h3>
            <p className="text-sm text-gray-500 mb-4">{variantName} · Current: {currentQty}</p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Movement Type</label>
                <select value={type} onChange={e => setType(e.target.value)} className={inputCls}>
                  <option value="PURCHASE">Purchase / Stock Received</option>
                  <option value="ADJUSTMENT_IN">Manual Adjustment (+)</option>
                  <option value="ADJUSTMENT_OUT">Manual Adjustment (−)</option>
                  <option value="DAMAGED">Damaged / Write-off</option>
                  <option value="RETURN_IN">Customer Return</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Quantity *</label>
                <input required type="number" step="0.001" min="0.001" value={qty} onChange={e => setQty(e.target.value)} className={inputCls} placeholder="0" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Reason *</label>
                <input required value={reason} onChange={e => setReason(e.target.value)} className={inputCls} placeholder="e.g. Received from supplier, Damaged goods…" />
              </div>
              {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading} className="flex-1 bg-[hsl(142,71%,25%)] text-white py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                  {loading ? "Saving…" : "Save"}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
