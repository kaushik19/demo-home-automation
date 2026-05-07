import { useEffect, useMemo, useState } from "react";
import * as Lucide from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Home, Layers, Power } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { DeviceCard } from "@/components/widgets/DeviceCard";
import { AutomationsList } from "@/components/widgets/AutomationsList";
import { QuickScenes } from "@/components/widgets/QuickScenes";
import { useApi } from "@/hooks/useApi";
import { api } from "@/services";
import { useRealtime } from "@/hooks/useRealtime";
import type { Device } from "@/types";

const ALL = "__all__";

export function SmartHomePage() {
  const rooms   = useApi(() => api.getRooms(), []);
  const devices = useApi(() => api.getDevices(), []);
  const [activeRoom, setActiveRoom] = useState<string>(ALL);
  const [localDevices, setLocalDevices] = useState<Device[] | null>(null);

  useEffect(() => { if (devices.data) setLocalDevices(devices.data); }, [devices.data]);

  useRealtime((evt) => {
    if (evt.type === "device.update") {
      setLocalDevices((prev) => prev?.map((d) => (d.id === evt.device.id ? evt.device : d)) ?? null);
    }
  });

  const filtered = useMemo(() => {
    const list = localDevices ?? [];
    if (activeRoom === ALL) return list;
    return list.filter((d) => d.roomId === activeRoom);
  }, [localDevices, activeRoom]);

  const onToggle = async (id: string, on: boolean) => {
    setLocalDevices((prev) => prev?.map((d) => (d.id === id ? { ...d, on } : d)) ?? null);
    try {
      const updated = await api.toggleDevice(id, on);
      setLocalDevices((prev) => prev?.map((d) => (d.id === updated.id ? updated : d)) ?? null);
    } catch {
      setLocalDevices((prev) => prev?.map((d) => (d.id === id ? { ...d, on: !on } : d)) ?? null);
    }
  };

  const onLevel = async (id: string, level: number) => {
    setLocalDevices((prev) => prev?.map((d) => (d.id === id ? { ...d, level } : d)) ?? null);
    try {
      const updated = await api.setDeviceLevel(id, level);
      setLocalDevices((prev) => prev?.map((d) => (d.id === updated.id ? updated : d)) ?? null);
    } catch { /* keep optimistic */ }
  };

  const onCount = (localDevices ?? []).filter((d) => d.on).length;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Home}
        title="Smart Home"
        subtitle={`${(localDevices ?? []).length} devices across ${rooms.data?.length ?? 0} rooms • ${onCount} on`}
        actions={
          <button
            onClick={async () => {
              if (!localDevices) return;
              const next = onCount === 0;
              for (const d of localDevices) {
                if (d.status !== "online") continue;
                if (d.on !== next && d.type !== "lock" && d.type !== "camera" && d.type !== "sensor") {
                  onToggle(d.id, next);
                }
              }
            }}
            className="btn-soft"
          >
            <Power className="w-4 h-4" />
            {onCount === 0 ? "Turn things on" : "All off"}
          </button>
        }
      />

      {/* Rooms tab strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <RoomChip active={activeRoom === ALL} onClick={() => setActiveRoom(ALL)} icon="Layers" label="All" sub={`${(localDevices ?? []).length} devices`} />
        {rooms.loading || !rooms.data
          ? [...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-40 shrink-0" />)
          : rooms.data.map((r) => (
              <RoomChip
                key={r.id}
                active={activeRoom === r.id}
                onClick={() => setActiveRoom(r.id)}
                icon={r.icon}
                label={r.name}
                sub={`${r.activeCount}/${r.deviceCount} on • ${r.temperature.toFixed(1)}°`}
              />
            ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card
            title={activeRoom === ALL ? "All devices" : rooms.data?.find((r) => r.id === activeRoom)?.name}
            subtitle={`${filtered.length} devices`}
          >
            {!localDevices ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-44" />)}
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-ink-500 py-8 text-center">No devices in this room.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((d) => (
                  <DeviceCard key={d.id} device={d} onToggle={onToggle} onLevelChange={onLevel} />
                ))}
              </div>
            )}
          </Card>

          <QuickScenes />
        </div>

        <div className="space-y-6">
          <AutomationsList />
        </div>
      </div>
    </div>
  );
}

function RoomChip({
  active, onClick, icon, label, sub,
}: { active: boolean; onClick: () => void; icon: string; label: string; sub: string }) {
  const Icon = ((Lucide as unknown as Record<string, LucideIcon>)[icon] ?? Layers) as LucideIcon;
  return (
    <button
      onClick={onClick}
      className={`shrink-0 flex items-center gap-3 px-3.5 py-2.5 rounded-xl border-2 transition-all
        ${active
          ? "bg-brand-500 text-white border-brand-500 shadow-sm"
          : "bg-surface border-transparent text-ink-700 hover:border-brand-100"}`}
    >
      <div className={`w-8 h-8 grid place-items-center rounded-lg
        ${active ? "bg-white/15" : "bg-brand-50 text-brand-500"}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-left">
        <p className={`text-sm font-semibold ${active ? "text-white" : "text-ink-900"}`}>{label}</p>
        <p className={`text-[11px] ${active ? "text-brand-100" : "text-ink-500"}`}>{sub}</p>
      </div>
    </button>
  );
}
