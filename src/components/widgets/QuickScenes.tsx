import * as Lucide from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useApi } from "@/hooks/useApi";
import { api } from "@/services";
import type { Scene } from "@/types";

export function QuickScenes({ limit }: { limit?: number }) {
  const { data, loading, setData } = useApi<Scene[]>(() => api.getScenes(), []);

  const activate = async (id: string) => {
    const updated = await api.activateScene(id);
    setData((prev) => prev?.map((s) => ({ ...s, active: s.id === updated.id })));
  };

  const list = limit && data ? data.slice(0, limit) : data;

  return (
    <Card title="Quick Scenes" subtitle="One tap to set the mood">
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {list?.map((s) => {
            const Icon = ((Lucide as unknown as Record<string, LucideIcon>)[s.icon]
              ?? Lucide.Sparkles) as LucideIcon;
            return (
              <button
                key={s.id}
                onClick={() => activate(s.id)}
                className={`group relative p-4 rounded-2xl text-left transition-all border-2
                  ${s.active
                    ? "bg-brand-500 text-white border-brand-500 shadow-pop"
                    : "bg-surface-muted border-transparent hover:border-brand-100 hover:bg-brand-50"}`}
              >
                <div className={`w-9 h-9 grid place-items-center rounded-lg
                  ${s.active ? "bg-white/15" : "bg-white"}`}
                >
                  <Icon className={`w-5 h-5 ${s.active ? "text-white" : "text-brand-500"}`} />
                </div>
                <p className={`mt-3 text-sm font-semibold ${s.active ? "text-white" : "text-ink-900"}`}>
                  {s.name}
                </p>
                <p className={`text-xs mt-0.5 ${s.active ? "text-brand-100" : "text-ink-500"}`}>
                  {s.deviceCount} devices
                </p>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}
