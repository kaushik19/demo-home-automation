import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, YAxis, Tooltip } from "recharts";
import { api } from "@/services";
import { useRealtime } from "@/hooks/useRealtime";
import { fmtPower } from "@/utils/format";

export function LivePowerCard() {
  const [series, setSeries] = useState<{ t: number; w: number }[]>([]);
  const [currentW, setCurrentW] = useState(0);

  useEffect(() => {
    api.getDashboardSummary().then((s) => setCurrentW(s.currentPowerW));
  }, []);

  useRealtime((evt) => {
    if (evt.type === "energy.tick") {
      setCurrentW(evt.currentPowerW);
      setSeries((prev) => {
        const next = [...prev, { t: Date.now(), w: evt.currentPowerW }];
        return next.slice(-60);
      });
    }
  });

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-card p-5 bg-gradient-to-br from-brand-500 to-brand-700 text-white">
      <div className="flex items-start justify-between">
        <div>
          <div className="inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-green live-dot" />
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-100">
              Live power draw
            </p>
          </div>
          <div className="mt-3 text-4xl font-bold">{fmtPower(currentW)}</div>
          <p className="text-sm text-brand-100 mt-1">across the entire home</p>
        </div>
        <div className="w-11 h-11 grid place-items-center rounded-xl bg-white/15">
          <Activity className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 -mx-2 -mb-2 h-24">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="lp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis hide domain={["dataMin", "dataMax"]} />
            <Tooltip
              cursor={false}
              contentStyle={{ background: "#0F1B22", border: "none", borderRadius: 8, color: "#fff", fontSize: 12 }}
              formatter={(v: number) => fmtPower(v)}
              labelFormatter={() => ""}
            />
            <Area
              dataKey="w"
              stroke="#ffffff"
              strokeWidth={2}
              fill="url(#lp)"
              isAnimationActive={false}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
