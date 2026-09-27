"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Category { id: string; name: string; }
interface Supplier { id: string; name: string; }

export function EditProductForm({ product, categories, suppliers }: {
  product: { id: string; name: string; description: string | null; categoryId: string; unit: string; supplierId: string | null; reorderLevel: number; isActive: boolean };
  categories: Category[];
  suppliers: Supplier[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [name, setName]               = useState(product.name);
  const [description, setDescription] = useState(product.description ?? "");
  const [categoryId, setCategoryId]   = useState(product.categoryId);
  const [unit, setUnit]               = useState(product.unit);
  const [supplierId, setSupplierId]   = useState(product.supplierId ?? "");
  const [reorderLevel, setReorderLevel] = useState(product.reorderLevel.toString());

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(142,71%,25%)] focus:border-transparent";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess(false); setLoading(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, categoryId, unit, supplierId: supplierId || null, reorderLevel: parseInt(reorderLevel) }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed to save."); return; }
      setSuccess(true);
      router.refresh();
    } catch { setError("Something went wrong. Changes were not saved."); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
      <h2 className="text-base font-semibold text-gray-800">Product Details</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
          <input value={unit} onChange={(e) => setUnit(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
          <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className={inputCls}>
            <option value="">— None —</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
          <input type="number" min="0" value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} className={inputCls} />
        </div>
      </div>
      {error   && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">{error}</p>}
      {success && <p className="text-sm text-green-600 bg-green-50 border border-green-100 rounded-lg px-4 py-2">Changes saved successfully.</p>}
      <button type="submit" disabled={loading} className="bg-[hsl(142,71%,25%)] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition disabled:opacity-50">
        {loading ? "Saving…" : "Save Changes"}
      </button>
    </form>
  );
}
