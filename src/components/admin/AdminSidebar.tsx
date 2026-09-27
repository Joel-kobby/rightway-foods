"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, ShoppingCart, Package, Users, CreditCard,
  BarChart2, Settings, LogOut, TrendingUp, Truck, Receipt,
  ChevronRight, Warehouse,
} from "lucide-react";
import { signOut } from "next-auth/react";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Sales", href: "/admin/sales", icon: TrendingUp },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Inventory", href: "/admin/inventory", icon: Warehouse },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Expenses", href: "/admin/expenses", icon: Receipt },
  { label: "Delivery", href: "/admin/delivery", icon: Truck },
  { label: "Reports", href: "/admin/reports", icon: BarChart2 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[hsl(142,71%,18%)] text-white flex flex-col min-h-screen">
      {/* Brand */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[hsl(43,89%,45%)] rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-sm">R</span>
          </div>
          <div>
            <p className="font-bold text-sm leading-none">RightWay Foods</p>
            <p className="text-xs text-white/50 mt-0.5">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}
            >
              <Icon size={17} />
              <span>{label}</span>
              {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-[hsl(43,89%,45%)] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-white/50">Admin</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-white/50 hover:text-white transition"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
