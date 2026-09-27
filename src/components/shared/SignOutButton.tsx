"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition"
      title="Sign out"
    >
      <LogOut size={15} />
      <span className="hidden sm:inline">Sign out</span>
    </button>
  );
}
