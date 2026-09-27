"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

interface Category { id: string; name: string; }
interface Supplier { id: string; name: string; }

interface VariantRow {
  name: string; unit: string; costPrice: string;
  retailPrice: string; wholesalePrice: string; minSellingPrice: string;
}

const emptyVariant = (): VariantRow => ({
  name: "", unit: "", costPrice: "", retailPrice: "", wholesalePrice: "", minSellingPrice: "",
});

export function NewProductForm({ categories, suppliers }: { categories: Category[]; suppliers: Supplier[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName]               = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId]   = useState(categories[0]?.id ?? "");
  const [unit, setUnit]               = useState("");
  const [supplierId, setSupplierId]   = useState("");
  const [reorderLevel, setReorderLevel] = useState("10");
  const [variants, setVariants]       = useState<VariantRow[]>([emptyVariant()]);

  function updateVariant(idx: number, field: keyof VariantRow, value: string) {
    setVariants((prev) => prev.map((v, i) => i === idx ? { ...v, [field]: value } : v));
  }

  function addVariant() { setVariants((prev) => [...prev, emptyVariant()]); }
  function removeVariant(idx: number) { setVariants((prev) => prev.filter((_, i) => i !== idx)); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = {
      name, description, categoryId, unit,
      supplierId: supplierId || null,
      reorderLevel: parseInt(reorderLevel) || 10,
      variants: variants.map((v) => ({
        name: v.name,
        unit: v.unit || unit,
        costPrice:       parseFloat(v.costPrice),
        retailPrice:     parseFloat(v.retailPrice),
        wholesalePrice:  v.wholesalePrice ? parseFloat(v.wholesalePrice) : null,
        minSellingPrice: parseFloat(v.minSellingPrice),
      })),
    };

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to create product.");
        return;
      }

      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("Something went wrong. The product was not saved. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(142,71%,25%)] focus:border-transparent";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic info */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-800">Product Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="e.g. Palm Oil" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputCls} placeholder="Brief product description..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
            <input required value={unit} onChange={(e) => setUnit(e.target.value)} className={inputCls} placeholder="e.g. litre, kg, crate" />
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
      </div>

      {/* Variants */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">Variants & Pricing</h2>
          <button type="button" onClick={addVariant} className="flex items-center gap-1.5 text-xs text-[hsl(142,71%,25%)] hover:underline font-medium">
            <Plus size={14} /> Add Variant
          </button>
        </div>
        <div className="space-y-4">
          {variants.map((v, idx) => (
            <div key={idx} className="border border-gray-100 rounded-xl p-4 relative">
              {variants.length > 1 && (
                <button type="button" onClick={() => removeVariant(idx)} className="absolute top-3 right-3 text-gray-300 hover:text-red-500 transition">
                  <Trash2 size={15} />
                </button>
              )}
              <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Variant {idx + 1}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                  <input required value={v.name} onChange={(e) => updateVariant(idx, "name", e.target.value)} className={inputCls} placeholder="e.g. 1 Litre" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
                  <input value={v.unit} onChange={(e) => updateVariant(idx, "unit", e.target.value)} className={inputCls} placeholder={unit || "e.g. bottle"} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Cost Price (₵) *</label>
                  <input required type="number" step="0.01" min="0" value={v.costPrice} onChange={(e) => updateVariant(idx, "costPrice", e.target.value)} className={inputCls} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Retail Price (₵) *</label>
                  <input required type="number" step="0.01" min="0" value={v.retailPrice} onChange={(e) => updateVariant(idx, "retailPrice", e.target.value)} className={inputCls} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Wholesale Price (₵)</label>
                  <input type="number" step="0.01" min="0" value={v.wholesalePrice} onChange={(e) => updateVariant(idx, "wholesalePrice", e.target.value)} className={inputCls} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Min Selling Price (₵) *</label>
                  <input required type="number" step="0.01" min="0" value={v.minSellingPrice} onChange={(e) => updateVariant(idx, "minSellingPrice", e.target.value)} className={inputCls} placeholder="0.00" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{error}</div>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="bg-[hsl(142,71%,25%)] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition disabled:opacity-50">
          {loading ? "Saving…" : "Create Product"}
        </button>
        <a href="/admin/products" className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">Cancel</a>
      </div>
    </form>
  );
}
