import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useApi } from "@/hooks/useApi";
import { api } from "@/services";
import { fmtRelative } from "@/utils/format";
import type { AlertItem, AlertSeverity } from "@/types";

const tone: Record<AlertSeverity, { icon: typeof AlertCircle; bg: string; fg: string }> = {
  critical: { icon: AlertCircle,    bg: "bg-accent-red/10",   fg: "text-accent-red"   },
  warning:  { icon: AlertTriangle,  bg: "bg-accent-amber/15", fg: "text-accent-amber" },
  info:     { icon: Info,           bg: "bg-brand-50",        fg: "text-brand-500"    },
};

export function AlertsList() {
  const { data, loading, refresh, setData } = useApi<AlertItem[]>(() => api.getAlerts(), []);

  const ack = async (id: string) => {
    await api.acknowledgeAlert(id);
    setData((prev) => prev?.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)));
  };

  const unread = (data ?? []).filter((a) => !a.acknowledged);

  return (
    <Card
      title="Alerts"
      subtitle={unread.length === 0 ? "All clear" : `${unread.length} need attention`}
      action={
        <button onClick={refresh} className="text-xs font-semibold text-brand-500 hover:underline">
          Refresh
        </button>
      }
    >
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : unread.length === 0 ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-accent-green/10">
          <CheckCircle2 className="w-6 h-6 text-accent-green" />
          <div>
            <p className="text-sm font-semibold text-ink-900">Everything looks good</p>
            <p className="text-xs text-ink-500">No active alerts in your home.</p>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {unread.map((a) => {
            const t = tone[a.severity];
            const Icon = t.icon;
            return (
              <li key={a.id} className={`p-3 rounded-xl ${t.bg} flex items-start gap-3`}>
                <Icon className={`w-5 h-5 ${t.fg} shrink-0 mt-0.5`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-ink-900">{a.title}</p>
                    <span className="text-xs text-ink-500 shrink-0">{fmtRelative(a.createdAt)}</span>
                  </div>
                  <p className="text-xs text-ink-700 mt-0.5">{a.detail}</p>
                  <button
                    onClick={() => ack(a.id)}
                    className="mt-2 text-xs font-semibold text-brand-500 hover:underline"
                  >
                    Acknowledge
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
