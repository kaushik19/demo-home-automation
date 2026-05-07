import {
  Lightbulb,
  Snowflake,
  Wind,
  Tv,
  Speaker,
  Camera,
  Lock,
  Plug,
  Activity,
  Refrigerator,
  Blinds,
  Thermometer,
  LucideIcon,
} from "lucide-react";
import { Toggle } from "@/components/ui/Toggle";
import type { Device, DeviceType } from "@/types";
import { fmtPower, fmtRelative } from "@/utils/format";

const ICONS: Record<DeviceType, LucideIcon> = {
  light:      Lightbulb,
  ac:         Snowflake,
  fan:        Wind,
  tv:         Tv,
  speaker:    Speaker,
  camera:     Camera,
  lock:       Lock,
  plug:       Plug,
  sensor:     Activity,
  appliance:  Refrigerator,
  blinds:     Blinds,
  thermostat: Thermometer,
};

interface Props {
  device: Device;
  onToggle: (id: string, on: boolean) => void;
  onLevelChange?: (id: string, level: number) => void;
}

export function DeviceCard({ device, onToggle, onLevelChange }: Props) {
  const Icon = ICONS[device.type] ?? Activity;
  const showLevel = device.level !== undefined && (device.type === "light" || device.type === "ac" || device.type === "fan" || device.type === "tv" || device.type === "speaker" || device.type === "blinds");
  const offline = device.status === "offline";

  return (
    <div
      className={`group relative p-4 rounded-2xl shadow-card transition-all border-2
        ${device.on ? "bg-gradient-to-br from-brand-500 to-brand-700 text-white border-brand-500" : "bg-surface border-transparent hover:border-brand-100"}
        ${offline ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={`w-10 h-10 grid place-items-center rounded-xl
          ${device.on ? "bg-white/15" : "bg-brand-50"}`}>
          <Icon className={`w-5 h-5 ${device.on ? "text-white" : "text-brand-500"}`} />
        </div>
        <Toggle
          checked={device.on}
          disabled={offline}
          onChange={(next) => onToggle(device.id, next)}
        />
      </div>

      <div className="mt-3">
        <p className={`font-semibold ${device.on ? "text-white" : "text-ink-900"} truncate`}>
          {device.name}
        </p>
        <p className={`text-xs mt-0.5 ${device.on ? "text-brand-100" : "text-ink-500"}`}>
          {offline ? "Offline" : device.on ? `${fmtPower(device.powerW)} • on` : "Off"}
        </p>
      </div>

      {showLevel && device.on && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-brand-100">
            <span>{device.type === "ac" ? "Set point" : "Level"}</span>
            <span className="font-mono font-semibold">
              {device.level}{device.levelUnit ?? "%"}
            </span>
          </div>
          <input
            type="range"
            min={device.type === "ac" ? 16 : 0}
            max={device.type === "ac" ? 30 : 100}
            value={device.level}
            onChange={(e) => onLevelChange?.(device.id, Number(e.target.value))}
            className="w-full mt-1.5 accent-white"
          />
        </div>
      )}

      {device.battery !== undefined && (
        <div className="mt-2 text-xs">
          <span className={`chip ${device.on ? "bg-white/15 text-white" : "bg-surface-muted text-ink-700"}`}>
            Battery {device.battery}%
          </span>
        </div>
      )}

      <p className={`text-[10px] mt-2 ${device.on ? "text-brand-100" : "text-ink-300"}`}>
        Updated {fmtRelative(device.lastSeen)}
      </p>

      {device.status === "warning" && (
        <span className="absolute top-3 right-12 chip bg-accent-amber/15 text-accent-amber">!</span>
      )}
    </div>
  );
}
