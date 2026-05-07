import { useState } from "react";
import {
  Leaf,
  Zap,
  IndianRupee,
  TrendingDown,
  Target,
  Sprout,
  Lightbulb,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useApi } from "@/hooks/useApi";
import { api, type EnergyRange } from "@/services";
import {
  fmtCurrency,
  fmtKwh,
  fmtNumber,
  fmtDateShort,
  fmtTime,
  fmtMonthShort,
} from "@/utils/format";

const RANGES: { id: EnergyRange; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week",  label: "Week"  },
  { id: "month", label: "Month" },
  { id: "year",  label: "Year"  },
];

export function EnergySavingPage() {
  const [range, setRange] = useState<EnergyRange>("week");
  const summary   = useApi(() => api.getEnergySummary(), []);
  const series    = useApi(() => api.getEnergySeries(range), [range]);
  const breakdown = useApi(() => api.getEnergyBreakdown(), []);
  const tips      = useApi(() => api.getEnergyTips(), []);

  const xFormatter = (t: string) =>
    range === "today" ? fmtTime(t) : range === "year" ? fmtMonthShort(t) : fmtDateShort(t);

  const s = summary.data;
  const budgetPct = s ? Math.min(100, (s.monthKwh / s.monthBudgetKwh) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Leaf}
        title="Energy Saving"
        subtitle="Track consumption, savings, and your carbon footprint"
        actions={
          <div className="hidden sm:inline-flex p-1 rounded-xl bg-surface-muted">
            {RANGES.map((r) => (
              <button
                key={r.id}
                onClick={() => setRange(r.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition
                  ${range === r.id ? "bg-brand-500 text-white shadow-sm" : "text-ink-700 hover:bg-white"}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {!s ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)
        ) : (
          <>
            <StatCard
              highlight
              label="Saved this month"
              value={fmtKwh(s.savedKwh)}
              hint={`${fmtCurrency(s.savedCost, s.currency)} kept in your pocket`}
              icon={Sprout}
            />
            <StatCard
              label="Today's usage"
              value={fmtKwh(s.todayKwh)}
              delta={{ value: `${s.todayKwh < s.yesterdayKwh ? "-" : "+"}${fmtNumber(Math.abs(((s.todayKwh - s.yesterdayKwh) / s.yesterdayKwh) * 100), 1)}%`, positive: s.todayKwh < s.yesterdayKwh }}
              icon={Zap}
              iconBg="bg-accent-amber/15"
              iconColor="text-accent-amber"
            />
            <StatCard
              label="Month so far"
              value={fmtCurrency(s.monthCost, s.currency)}
              delta={{ value: `${s.monthDeltaPct > 0 ? "+" : ""}${fmtNumber(s.monthDeltaPct, 1)}%`, positive: s.monthDeltaPct < 0 }}
              icon={IndianRupee}
              iconBg="bg-brand-50"
              iconColor="text-brand-500"
            />
            <StatCard
              label="Carbon footprint"
              value={`${fmtNumber(s.co2Kg, 1)} kg CO₂`}
              hint={`Tariff ${fmtCurrency(s.tariffPerKwh, s.currency)} / kWh`}
              icon={TrendingDown}
              iconBg="bg-accent-green/15"
              iconColor="text-accent-green"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Consumption chart */}
        <Card
          className="xl:col-span-2"
          title="Consumption"
          subtitle={`${RANGES.find((r) => r.id === range)?.label} • kWh`}
          action={
            <div className="sm:hidden inline-flex p-1 rounded-xl bg-surface-muted">
              {RANGES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRange(r.id)}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold
                    ${range === r.id ? "bg-brand-500 text-white" : "text-ink-700"}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          }
        >
          {series.loading || !series.data ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series.data} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="g-energy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"  stopColor="#14587F" stopOpacity={0.42} />
                      <stop offset="100%" stopColor="#14587F" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#EEF3F6" vertical={false} />
                  <XAxis
                    dataKey="t"
                    tickFormatter={xFormatter}
                    stroke="#9AA6AD"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <YAxis
                    stroke="#9AA6AD"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    tickFormatter={(v) => `${v}`}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #EEF3F6", fontSize: 12 }}
                    labelFormatter={(t) => xFormatter(t as string)}
                    formatter={(v: number) => [`${fmtNumber(v, 2)} kWh`, "Energy"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="kwh"
                    stroke="#14587F"
                    strokeWidth={2.5}
                    fill="url(#g-energy)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Budget + breakdown */}
        <div className="space-y-6">
          <Card title="Monthly budget" subtitle={s ? `${fmtKwh(s.monthKwh)} of ${fmtKwh(s.monthBudgetKwh)}` : "—"}>
            {!s ? (
              <Skeleton className="h-24" />
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm text-ink-500">
                  <Target className="w-4 h-4" />
                  <span>{fmtNumber(budgetPct, 0)}% used</span>
                </div>
                <div className="mt-3 h-3 rounded-full bg-surface-sunken overflow-hidden">
                  <div
                    className={`h-full rounded-full ${budgetPct > 90 ? "bg-accent-red" : budgetPct > 70 ? "bg-accent-amber" : "bg-accent-green"}`}
                    style={{ width: `${budgetPct}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-3 rounded-xl bg-surface-muted">
                    <p className="text-xs text-ink-500">Projected month</p>
                    <p className="text-lg font-bold text-ink-900">
                      {fmtKwh(s.monthKwh * (30 / new Date().getDate()))}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-muted">
                    <p className="text-xs text-ink-500">Saved by Babcom</p>
                    <p className="text-lg font-bold text-accent-green">{fmtKwh(s.savedKwh)}</p>
                  </div>
                </div>
              </>
            )}
          </Card>

          <Card title="Breakdown" subtitle="Where your energy goes">
            {breakdown.loading || !breakdown.data ? (
              <Skeleton className="h-56" />
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={breakdown.data}
                      dataKey="kwh"
                      nameKey="category"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={2}
                    >
                      {breakdown.data.map((d, i) => (
                        <Cell key={i} fill={d.color ?? "#14587F"} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number, k) => [`${fmtNumber(v, 1)} kWh`, k]} contentStyle={{ borderRadius: 12, border: "1px solid #EEF3F6", fontSize: 12 }} />
                    <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* AI Tips */}
      <Card
        title="Smart suggestions"
        subtitle="AI-curated tips based on your usage patterns"
        action={<span className="chip bg-brand-50 text-brand-500"><Lightbulb className="w-3 h-3" /> Personalised</span>}
      >
        {tips.loading || !tips.data ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tips.data.map((t) => (
              <div
                key={t.id}
                className={`relative p-4 rounded-2xl border-2 transition-all
                  ${t.applied
                    ? "border-accent-green/30 bg-accent-green/5"
                    : "border-transparent bg-surface-muted hover:border-brand-100 hover:bg-brand-50"}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 grid place-items-center rounded-lg shrink-0
                    ${t.applied ? "bg-accent-green text-white" : "bg-white text-brand-500"}`}>
                    {t.applied ? <CheckCircle2 className="w-5 h-5" /> : <Sprout className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-ink-900">{t.title}</p>
                      <span className={`chip ${
                        t.difficulty === "easy" ? "bg-accent-green/15 text-accent-green"
                          : t.difficulty === "medium" ? "bg-accent-amber/15 text-accent-amber"
                          : "bg-accent-red/15 text-accent-red"
                      }`}>{t.difficulty}</span>
                    </div>
                    <p className="text-xs text-ink-500 mt-1">{t.detail}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-sm font-bold text-brand-500">
                        ~ {fmtCurrency(t.estimatedSavingPerMonth)}/mo
                      </p>
                      <button
                        onClick={async () => {
                          await api.applyEnergyTip(t.id);
                          tips.refresh();
                        }}
                        className={t.applied ? "btn-ghost" : "btn-primary"}
                      >
                        {t.applied ? "Applied" : "Apply"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
