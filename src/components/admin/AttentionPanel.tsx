import { AlertTriangle, AlertCircle, CheckCircle2, Info } from "lucide-react";

interface AttentionItem {
  type:    "critical" | "important" | "positive" | "info";
  message: string;
}

interface AttentionPanelProps {
  items: AttentionItem[];
}

const config = {
  critical:  { icon: AlertCircle,   bg: "bg-red-50",    border: "border-red-200",   text: "text-red-700",   iconColor: "text-red-500"   },
  important: { icon: AlertTriangle, bg: "bg-amber-50",  border: "border-amber-200", text: "text-amber-800", iconColor: "text-amber-500" },
  positive:  { icon: CheckCircle2,  bg: "bg-green-50",  border: "border-green-200", text: "text-green-700", iconColor: "text-green-500" },
  info:      { icon: Info,          bg: "bg-blue-50",   border: "border-blue-200",  text: "text-blue-700",  iconColor: "text-blue-500"  },
};

export function AttentionPanel({ items }: AttentionPanelProps) {
  if (items.length === 0) {
    return (
      <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
        <CheckCircle2 size={20} className="text-green-500 flex-shrink-0" />
        <p className="text-sm text-green-700 font-medium">Everything looks good. No issues need your attention right now.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const { icon: Icon, bg, border, text, iconColor } = config[item.type];
        return (
          <div key={i} className={`flex items-start gap-3 p-3.5 rounded-xl border ${bg} ${border}`}>
            <Icon size={17} className={`${iconColor} flex-shrink-0 mt-0.5`} />
            <p className={`text-sm font-medium ${text}`}>{item.message}</p>
          </div>
        );
      })}
    </div>
  );
}
