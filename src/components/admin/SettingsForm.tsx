"use client";

import { useState } from "react";

interface Setting { id: string; key: string; value: string; label: string | null; group: string; type: string; }

export function SettingsForm({ settings }: { settings: Setting[] }) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(settings.map(s => [s.key, s.value]))
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const groups = Array.from(new Set(settings.map(s => s.group)));

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setSuccess(false); setError("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: values }),
      });
      if (!res.ok) { setError("Failed to save settings."); return; }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch { setError("Something went wrong."); }
    finally { setLoading(false); }
  }

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(142,71%,25%)]";

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {groups.map(group => (
        <div key={group} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">{group}</h2>
          <div className="space-y-4">
            {settings.filter(s => s.group === group).map(s => (
              <div key={s.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{s.label ?? s.key}</label>
                {s.type === "boolean" ? (
                  <select value={values[s.key]} onChange={e => setValues(prev => ({ ...prev, [s.key]: e.target.value }))} className={inputCls}>
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>
                  </select>
                ) : (
                  <input value={values[s.key] ?? ""} onChange={e => setValues(prev => ({ ...prev, [s.key]: e.target.value }))} className={inputCls} />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">{error}</p>}
      {success && <p className="text-sm text-green-600 bg-green-50 border border-green-100 rounded-lg px-4 py-2">Settings saved.</p>}
      <button type="submit" disabled={loading} className="bg-[hsl(142,71%,25%)] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50">
        {loading ? "Saving…" : "Save Settings"}
      </button>
    </form>
  );
}
