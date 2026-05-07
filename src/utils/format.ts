export function fmtCurrency(value: number, currency = "INR"): string {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(0)}`;
  }
}

export function fmtNumber(value: number, digits = 1): string {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

export function fmtKwh(value: number): string {
  return `${fmtNumber(value, value < 10 ? 2 : 1)} kWh`;
}

export function fmtPower(watts: number): string {
  if (watts >= 1000) return `${fmtNumber(watts / 1000, 2)} kW`;
  return `${Math.round(watts)} W`;
}

export function fmtPercent(value: number, digits = 0): string {
  return `${fmtNumber(value, digits)}%`;
}

export function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export function fmtRelative(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Math.round((Date.now() - t) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function fmtDayShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { weekday: "short" });
}

export function fmtDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export function fmtMonthShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { month: "short" });
}
