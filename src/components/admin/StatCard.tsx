import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title:     string;
  value:     string;
  sub?:      string;
  icon:      LucideIcon;
  iconColor: string;
  iconBg:    string;
  trend?:    { value: string; positive: boolean };
}

export function StatCard({ title, value, sub, icon: Icon, iconColor, iconBg, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1.5 truncate">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
          {trend && (
            <p className={cn("text-xs font-medium mt-1.5", trend.positive ? "text-green-600" : "text-red-500")}>
              {trend.positive ? "▲" : "▼"} {trend.value}
            </p>
          )}
        </div>
        <div className={cn("rounded-xl p-3 flex-shrink-0 ml-4", iconBg)}>
          <Icon size={22} className={iconColor} />
        </div>
      </div>
    </div>
  );
}
