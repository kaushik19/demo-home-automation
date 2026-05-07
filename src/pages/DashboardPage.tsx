import {
  LayoutDashboard,
  Cpu,
  Zap,
  IndianRupee,
  Thermometer,
  Wifi,
  Power,
  Cloud,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { LivePowerCard } from "@/components/widgets/LivePowerCard";
import { ActivityFeed } from "@/components/widgets/ActivityFeed";
import { AlertsList } from "@/components/widgets/AlertsList";
import { QuickScenes } from "@/components/widgets/QuickScenes";
import { LiveClock } from "@/components/widgets/LiveClock";
import { useApi } from "@/hooks/useApi";
import { api } from "@/services";
import { fmtCurrency, fmtKwh, fmtNumber } from "@/utils/format";

export function DashboardPage() {
  const summary = useApi(() => api.getDashboardSummary(), []);
  const rooms = useApi(() => api.getRooms(), []);
  const household = useApi(() => api.getHousehold(), []);

  const s = summary.data;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={LayoutDashboard}
        title="Dashboard"
        subtitle="Your home at a glance"
      />

      {/* Live wall clock */}
      <LiveClock address={household.data?.address} />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summary.loading || !s ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)
        ) : (
          <>
            <StatCard
              label="Devices online"
              value={`${s.devicesOnline} / ${s.devicesTotal}`}
              hint={`${s.devicesActive} active right now`}
              icon={Cpu}
            />
            <StatCard
              label="Today's energy"
              value={fmtKwh(s.todayKwh)}
              hint={`Across ${s.roomsTotal} rooms`}
              icon={Zap}
              iconBg="bg-accent-amber/15"
              iconColor="text-accent-amber"
            />
            <StatCard
              label="This month"
              value={fmtCurrency(s.monthCost, s.currency)}
              delta={{ value: "-7.2%", positive: true }}
              icon={IndianRupee}
              iconBg="bg-accent-green/15"
              iconColor="text-accent-green"
            />
            <StatCard
              label="Indoor temperature"
              value={`${fmtNumber(s.indoorTempC, 1)}°C`}
              hint={`Outdoor ${fmtNumber(s.outdoorTempC, 1)}°C • ${s.weather}`}
              icon={Thermometer}
              iconBg="bg-brand-50"
              iconColor="text-brand-500"
            />
          </>
        )}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LivePowerCard />
            <Card title="Rooms" subtitle="Climate at a glance" className="min-h-[200px]">
              {rooms.loading || !rooms.data ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10" />)}
                </div>
              ) : (
                <ul className="divide-y divide-surface-sunken">
                  {rooms.data.slice(0, 5).map((r) => (
                    <li key={r.id} className="flex items-center justify-between py-2.5">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink-900 truncate">{r.name}</p>
                        <p className="text-xs text-ink-500">
                          {r.activeCount}/{r.deviceCount} active
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="inline-flex items-center gap-1 text-xs text-ink-500">
                          <Cloud className="w-3.5 h-3.5" /> {r.humidity}%
                        </span>
                        <span className="text-base font-bold text-brand-500">
                          {fmtNumber(r.temperature, 1)}°
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <QuickScenes limit={6} />
        </div>

        <div className="space-y-6">
          <AlertsList />
          <ActivityFeed />
        </div>
      </div>

      {/* Footer KPI band */}
      <Card title="System health" subtitle="Connectivity, power and savings">
        {!s ? (
          <Skeleton className="h-16" />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Mini icon={Wifi}  label="Online"  value={`${Math.round((s.devicesOnline / s.devicesTotal) * 100)}%`} fg="text-accent-green" />
            <Mini icon={Power} label="Active devices"  value={`${s.devicesActive}`} fg="text-brand-500" />
            <Mini icon={Zap}   label="Live draw" value={`${fmtNumber(s.currentPowerW, 0)} W`} fg="text-accent-amber" />
            <Mini icon={IndianRupee} label="Spent today" value={fmtCurrency(Math.round(s.todayKwh * 8.4), s.currency)} fg="text-accent-violet" />
          </div>
        )}
      </Card>
    </div>
  );
}

function Mini({
  icon: Icon, label, value, fg,
}: { icon: typeof Wifi; label: string; value: string; fg: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-muted">
      <Icon className={`w-5 h-5 ${fg}`} />
      <div>
        <p className="text-xs text-ink-500">{label}</p>
        <p className="text-base font-bold text-ink-900">{value}</p>
      </div>
    </div>
  );
}
