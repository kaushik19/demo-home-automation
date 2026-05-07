import { useEffect, useState } from "react";
import * as Lucide from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/services";
import { useRealtime } from "@/hooks/useRealtime";
import { fmtRelative } from "@/utils/format";
import type { ActivityEvent } from "@/types";

export function ActivityFeed() {
  const [events, setEvents] = useState<ActivityEvent[] | null>(null);

  useEffect(() => {
    api.getRecentActivity(15).then(setEvents);
  }, []);

  useRealtime((evt) => {
    if (evt.type === "activity.new") {
      setEvents((prev) => [evt.event, ...(prev ?? [])].slice(0, 15));
    }
  });

  return (
    <Card title="Recent Activity" subtitle="Live updates from your home">
      {!events ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="text-sm text-ink-500">No activity yet.</p>
      ) : (
        <ul className="space-y-3">
          {events.map((e) => {
            const Icon = ((Lucide as unknown as Record<string, LucideIcon>)[e.icon ?? "Activity"]
              ?? Lucide.Activity) as LucideIcon;
            return (
              <li key={e.id} className="flex items-start gap-3">
                <div className="w-8 h-8 grid place-items-center rounded-lg bg-brand-50 text-brand-500 shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink-900 leading-snug">{e.text}</p>
                  <p className="text-xs text-ink-500 mt-0.5">{fmtRelative(e.at)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
