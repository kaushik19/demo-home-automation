import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface Props {
  label: string;
  value: ReactNode;
  delta?: { value: string; positive?: boolean; neutral?: boolean };
  icon?: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  hint?: string;
  highlight?: boolean;
}

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  iconBg = "bg-brand-50",
  iconColor = "text-brand-500",
  hint,
  highlight,
}: Props) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl shadow-card p-5 transition-all
        ${highlight ? "bg-gradient-to-br from-brand-500 to-brand-700 text-white" : "bg-surface"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-xs font-semibold uppercase tracking-wider ${highlight ? "text-brand-100" : "text-ink-500"}`}>
            {label}
          </p>
          <div className={`mt-2 text-3xl font-bold ${highlight ? "text-white" : "text-ink-900"}`}>
            {value}
          </div>
          {hint && (
            <p className={`mt-1 text-xs ${highlight ? "text-brand-100" : "text-ink-500"}`}>{hint}</p>
          )}
        </div>
        {Icon && (
          <div className={`shrink-0 grid place-items-center w-11 h-11 rounded-xl ${highlight ? "bg-white/15" : iconBg}`}>
            <Icon className={`w-5 h-5 ${highlight ? "text-white" : iconColor}`} />
          </div>
        )}
      </div>
      {delta && (
        <div className="mt-3 inline-flex items-center gap-1.5">
          <span
            className={`chip ${
              delta.neutral
                ? "bg-ink-300/20 text-ink-700"
                : delta.positive
                  ? "bg-accent-green/15 text-accent-green"
                  : "bg-accent-red/15 text-accent-red"
            }`}
          >
            {delta.value}
          </span>
          <span className={`text-xs ${highlight ? "text-brand-100" : "text-ink-500"}`}>vs last period</span>
        </div>
      )}
    </div>
  );
}
