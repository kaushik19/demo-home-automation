import { useMemo, useState } from "react";
import {
  BarChart3,
  Clock,
  Cpu,
  Search,
  ArrowUpDown,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Heatmap } from "@/components/widgets/Heatmap";
import { useApi } from "@/hooks/useApi";
import { api } from "@/services";
import { fmtKwh, fmtNumber, fmtPercent } from "@/utils/format";
import type { DeviceUtilisation } from "@/types";

type SortKey = "deviceName" | "hoursWeek" | "utilisationPct" | "kwhWeek";

export function UtilisationPage() {
  const devices = useApi(() => api.getDeviceUtilisation(), []);
  const rooms   = useApi(() => api.getRoomUtilisation(), []);
  const heatmap = useApi(() => api.getUtilisationHeatmap(), []);

  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("hoursWeek");
  const [asc, setAsc] = useState(false);

  const filtered = useMemo<DeviceUtilisation[]>(() => {
    const list = (devices.data ?? []).filter((d) =>
      `${d.deviceName} ${d.roomName} ${d.type}`.toLowerCase().includes(q.toLowerCase())
    );
    return list.sort((a, b) => {
      const A = a[sortKey] as string | number;
      const B = b[sortKey] as string | number;
      const cmp = typeof A === "number" ? (A as number) - (B as number) : String(A).localeCompare(String(B));
      return asc ? cmp : -cmp;
    });
  }, [devices.data, q, sortKey, asc]);

  const totals = useMemo(() => {
    const list = devices.data ?? [];
    const totalHours = list.reduce((s, x) => s + x.hoursWeek, 0);
    const avgUtil = list.length ? list.reduce((s, x) => s + x.utilisationPct, 0) / list.length : 0;
    const totalKwh = list.reduce((s, x) => s + x.kwhWeek, 0);
    const top = [...list].sort((a, b) => b.hoursWeek - a.hoursWeek)[0];
    return { totalHours, avgUtil, totalKwh, top };
  }, [devices.data]);

  const roomChart = (rooms.data ?? []).map((r) => ({
    name: r.roomName,
    Active: r.activeDevicePct,
    Occupancy: r.occupancyPct,
  }));

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setAsc((v) => !v);
    else { setSortKey(k); setAsc(false); }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BarChart3}
        title="Utilisation"
        subtitle="Where time and energy are spent across devices and rooms"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {devices.loading || !devices.data ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)
        ) : (
          <>
            <StatCard label="Total runtime" value={`${fmtNumber(totals.totalHours, 0)} h`} hint="Across all devices this week" icon={Clock} />
            <StatCard label="Average utilisation" value={fmtPercent(totals.avgUtil, 1)} hint="Of available time" icon={BarChart3} iconBg="bg-accent-amber/15" iconColor="text-accent-amber" />
            <StatCard label="Energy used" value={fmtKwh(totals.totalKwh)} hint="Combined this week" icon={Cpu} iconBg="bg-accent-green/15" iconColor="text-accent-green" />
            <StatCard
              highlight
              label="Most-used device"
              value={totals.top?.deviceName ?? "—"}
              hint={totals.top ? `${fmtNumber(totals.top.hoursWeek, 1)} h • ${totals.top.roomName}` : undefined}
              icon={Cpu}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2" title="Weekly heatmap" subtitle="Day-of-week × hour-of-day usage intensity">
          {heatmap.loading || !heatmap.data ? <Skeleton className="h-48" /> : <Heatmap grid={heatmap.data} />}
        </Card>

        <Card title="Rooms" subtitle="Active devices vs occupancy">
          {rooms.loading || !rooms.data ? (
            <Skeleton className="h-56" />
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roomChart} margin={{ top: 6, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke="#EEF3F6" vertical={false} />
                  <XAxis dataKey="name" stroke="#9AA6AD" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9AA6AD" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #EEF3F6", fontSize: 12 }} formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="Active"    fill="#14587F" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Occupancy" fill="#1FA971" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* Devices table */}
      <Card
        title="Device utilisation"
        subtitle="Sortable runtime breakdown"
        action={
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-muted w-56">
            <Search className="w-4 h-4 text-ink-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter…"
              className="bg-transparent outline-none text-sm w-full"
            />
          </div>
        }
      >
        {devices.loading || !devices.data ? (
          <Skeleton className="h-64" />
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-ink-500">
                  <Th label="Device" sortKey="deviceName" current={sortKey} asc={asc} onSort={toggleSort} />
                  <th className="px-3 py-2">Room</th>
                  <th className="px-3 py-2">Type</th>
                  <Th label="Hours / week" sortKey="hoursWeek" current={sortKey} asc={asc} onSort={toggleSort} numeric />
                  <Th label="Utilisation" sortKey="utilisationPct" current={sortKey} asc={asc} onSort={toggleSort} numeric />
                  <Th label="Energy / week" sortKey="kwhWeek" current={sortKey} asc={asc} onSort={toggleSort} numeric />
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.deviceId} className="border-t border-surface-sunken hover:bg-surface-muted/60">
                    <td className="px-3 py-2.5 font-semibold text-ink-900">{d.deviceName}</td>
                    <td className="px-3 py-2.5 text-ink-700">{d.roomName}</td>
                    <td className="px-3 py-2.5">
                      <span className="chip bg-brand-50 text-brand-500 capitalize">{d.type}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">{fmtNumber(d.hoursWeek, 1)}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-24 h-1.5 rounded-full bg-surface-sunken overflow-hidden">
                          <div className="h-full bg-brand-500" style={{ width: `${Math.min(100, d.utilisationPct)}%` }} />
                        </div>
                        <span className="font-mono w-12 text-right">{fmtPercent(d.utilisationPct, 1)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">{fmtNumber(d.kwhWeek, 1)} kWh</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-ink-500">No devices match.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function Th({
  label, sortKey, current, asc, onSort, numeric,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  asc: boolean;
  onSort: (k: SortKey) => void;
  numeric?: boolean;
}) {
  const active = current === sortKey;
  return (
    <th className={`px-3 py-2 ${numeric ? "text-right" : ""}`}>
      <button onClick={() => onSort(sortKey)} className="inline-flex items-center gap-1 hover:text-brand-500">
        <span>{label}</span>
        <ArrowUpDown className={`w-3 h-3 ${active ? "text-brand-500" : "opacity-50"} ${active && asc ? "rotate-180" : ""}`} />
      </button>
    </th>
  );
}
