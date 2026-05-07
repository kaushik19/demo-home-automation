import { useEffect, useState } from "react";
import { Clock, MapPin } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";

interface Props {
  /** Optional address shown beside the timezone */
  address?: string;
}

/**
 * Live "wall clock" card for the dashboard.
 *
 * - Updates every second.
 * - Honours the user's timezone, locale and 12h/24h preference from Settings.
 * - Compact, brand-coloured, looks great on light or dark surfaces.
 */
export function LiveClock({ address }: Props) {
  const { settings } = useSettings();
  const { timezone, language, timeFormat } = settings.region;
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  const timeStr = now.toLocaleTimeString(language, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: timeFormat === "12h",
    timeZone: timezone,
  });
  const [hms, ampm] = (() => {
    const m = timeStr.match(/^(.*?)(?:\s)?([AP]M)?$/i);
    return m ? [m[1].trim(), m[2] ?? ""] : [timeStr, ""];
  })();

  const dateStr = now.toLocaleDateString(language, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: timezone,
  });

  const tzLabel = (() => {
    try {
      const parts = new Intl.DateTimeFormat(language, {
        timeZone: timezone,
        timeZoneName: "short",
      }).formatToParts(now);
      return parts.find((p) => p.type === "timeZoneName")?.value ?? timezone;
    } catch {
      return timezone;
    }
  })();

  return (
    <div className="rounded-2xl shadow-card p-5 bg-surface flex items-center gap-5">
      <div className="w-14 h-14 grid place-items-center rounded-2xl bg-brand-50 text-brand-500 shrink-0">
        <Clock className="w-7 h-7" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl sm:text-4xl font-bold text-brand-500 tabular-nums tracking-tight">
            {hms}
          </span>
          {ampm && (
            <span className="text-base font-semibold text-ink-500">{ampm}</span>
          )}
          <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-accent-green">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green live-dot" />
            Live
          </span>
        </div>
        <p className="text-sm text-ink-700 mt-0.5 truncate">{dateStr}</p>
        <p className="text-xs text-ink-500 mt-0.5 inline-flex items-center gap-1.5 truncate">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          {address ? `${address} • ` : ""}{timezone.replace(/_/g, " ")} ({tzLabel})
        </p>
      </div>
    </div>
  );
}
