"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, ToggleLeft, ToggleRight } from "lucide-react";

export function ProductActions({ productId, isActive }: { productId: string; isActive: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggleStatus() {
    setLoading(true);
    try {
      await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Link
        href={`/admin/products/${productId}`}
        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition"
        title="Edit"
      >
        <Pencil size={15} />
      </Link>
      <button
        onClick={toggleStatus}
        disabled={loading}
        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition"
        title={isActive ? "Deactivate" : "Activate"}
      >
        {isActive ? <ToggleRight size={15} className="text-green-600" /> : <ToggleLeft size={15} className="text-gray-400" />}
      </button>
    </div>
  );
}
