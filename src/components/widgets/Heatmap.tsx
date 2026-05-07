import type { UtilisationHeatmap } from "@/types";

interface Props {
  grid: UtilisationHeatmap;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function colorFor(v: number): string {
  // gradient from #EAF2F6 (cold) → #14587F (hot)
  const cold = [234, 242, 246];
  const hot  = [20,  88, 127];
  const r = Math.round(cold[0] + (hot[0] - cold[0]) * v);
  const g = Math.round(cold[1] + (hot[1] - cold[1]) * v);
  const b = Math.round(cold[2] + (hot[2] - cold[2]) * v);
  return `rgb(${r}, ${g}, ${b})`;
}

export function Heatmap({ grid }: Props) {
  return (
    <div className="overflow-x-auto">
      <div className="inline-grid gap-[3px]" style={{ gridTemplateColumns: "44px repeat(24, 1fr)" }}>
        <div />
        {HOURS.map((h) => (
          <div key={h} className="text-[10px] text-ink-500 text-center">
            {h % 3 === 0 ? `${h}` : ""}
          </div>
        ))}
        {grid.map((row, di) => (
          <Row key={di} day={DAYS[di]} row={row} />
        ))}
      </div>
      <div className="flex items-center gap-3 mt-3 text-xs text-ink-500">
        <span>Less</span>
        <div className="flex">
          {[0.05, 0.2, 0.4, 0.6, 0.8, 1].map((v) => (
            <span key={v} className="w-4 h-3 first:rounded-l last:rounded-r" style={{ background: colorFor(v) }} />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}

function Row({ day, row }: { day: string; row: number[] }) {
  return (
    <>
      <div className="text-xs font-semibold text-ink-700 pr-2 self-center">{day}</div>
      {row.map((v, i) => (
        <div
          key={i}
          className="h-5 rounded-sm"
          style={{ background: colorFor(v) }}
          title={`${day} ${i}:00 — ${(v * 100).toFixed(0)}% utilisation`}
        />
      ))}
    </>
  );
}
