import { Zap, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toggle } from "@/components/ui/Toggle";
import { useApi } from "@/hooks/useApi";
import { api } from "@/services";
import { fmtRelative } from "@/utils/format";
import type { Automation } from "@/types";

export function AutomationsList() {
  const { data, loading, setData } = useApi<Automation[]>(() => api.getAutomations(), []);

  const toggle = async (id: string, enabled: boolean) => {
    setData((prev) => prev?.map((a) => (a.id === id ? { ...a, enabled } : a)));
    try {
      await api.setAutomationEnabled(id, enabled);
    } catch {
      setData((prev) => prev?.map((a) => (a.id === id ? { ...a, enabled: !enabled } : a)));
    }
  };

  return (
    <Card title="Automations" subtitle="Rules running silently in the background">
      {loading || !data ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : (
        <ul className="space-y-3">
          {data.map((a) => (
            <li key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-muted">
              <div className={`w-9 h-9 grid place-items-center rounded-lg shrink-0
                ${a.enabled ? "bg-brand-500 text-white" : "bg-white text-ink-500"}`}>
                <Zap className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-ink-900 truncate">{a.name}</p>
                  <Toggle checked={a.enabled} onChange={(v) => toggle(a.id, v)} size="sm" />
                </div>
                <p className="text-xs text-ink-500 mt-0.5">{a.description}</p>
                <div className="mt-1.5 flex items-center gap-3 text-[11px] text-ink-500">
                  <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {a.trigger}</span>
                  {a.lastRun && <span>last run {fmtRelative(a.lastRun)}</span>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
