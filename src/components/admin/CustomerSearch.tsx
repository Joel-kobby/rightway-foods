"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function CustomerSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    router.push(`/admin/customers?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSearch} className="flex items-center gap-2">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search customers…"
          className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(142,71%,25%)] w-56"
        />
      </div>
      <button type="submit" className="px-4 py-2 bg-[hsl(142,71%,25%)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition">
        Search
      </button>
    </form>
  );
}
