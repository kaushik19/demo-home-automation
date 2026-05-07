// =============================================================
// Domain types — single source of truth for the entire platform.
// The real backend MUST conform to these shapes; the mock adapter
// already does.  Adjust here and both sides stay in sync.
// =============================================================

export type DeviceType =
  | "light"
  | "thermostat"
  | "ac"
  | "fan"
  | "tv"
  | "speaker"
  | "camera"
  | "lock"
  | "plug"
  | "sensor"
  | "appliance"
  | "blinds";

export type DeviceStatus = "online" | "offline" | "warning";

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  roomId: string;
  status: DeviceStatus;
  /** Whether the device is powered on / active */
  on: boolean;
  /** Current power draw in watts */
  powerW: number;
  /** Optional value: brightness 0-100, temperature C, volume 0-100, etc. */
  level?: number;
  /** Optional unit string for level: "%", "°C", etc. */
  levelUnit?: string;
  /** Battery level 0-100 (sensors / locks) */
  battery?: number;
  /** Firmware version */
  firmware?: string;
  lastSeen: string; // ISO timestamp
}

export interface Room {
  id: string;
  name: string;
  /** Lucide icon name for quick rendering */
  icon: string;
  /** Current ambient temperature in °C */
  temperature: number;
  humidity: number;
  /** Number of devices in this room (denormalised for fast UI) */
  deviceCount: number;
  /** How many of those are on */
  activeCount: number;
}

export interface Scene {
  id: string;
  name: string;
  icon: string;
  description: string;
  /** Number of devices touched when activated */
  deviceCount: number;
  active: boolean;
}

export interface Automation {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: string; // human readable
  lastRun?: string;
}

// ------------------ Energy ------------------

export interface EnergySample {
  /** ISO timestamp */
  t: string;
  /** kWh consumed in this bucket */
  kwh: number;
  /** Cost in local currency */
  cost: number;
}

export interface EnergyBreakdown {
  category: string;
  kwh: number;
  pct: number;
  color?: string;
}

export interface EnergySummary {
  /** Today so far */
  todayKwh: number;
  todayCost: number;
  yesterdayKwh: number;
  monthKwh: number;
  monthCost: number;
  monthBudgetKwh: number;
  /** % change vs same period last month */
  monthDeltaPct: number;
  /** kg CO2 this month */
  co2Kg: number;
  /** Estimated savings achieved this month from automations */
  savedKwh: number;
  savedCost: number;
  currency: string;
  tariffPerKwh: number;
}

export interface EnergyTip {
  id: string;
  title: string;
  detail: string;
  estimatedSavingPerMonth: number;
  difficulty: "easy" | "medium" | "hard";
  applied: boolean;
}

// ------------------ Utilisation ------------------

export interface DeviceUtilisation {
  deviceId: string;
  deviceName: string;
  type: DeviceType;
  roomName: string;
  /** Hours used today */
  hoursToday: number;
  /** Hours used this week */
  hoursWeek: number;
  /** % of week the device was on */
  utilisationPct: number;
  /** kWh consumed this week */
  kwhWeek: number;
}

export interface RoomUtilisation {
  roomId: string;
  roomName: string;
  occupancyPct: number;
  activeDevicePct: number;
  kwhWeek: number;
}

/** 7 days x 24 hours grid of usage intensity 0-1 */
export type UtilisationHeatmap = number[][];

// ------------------ Dashboard / alerts / realtime ------------------

export type AlertSeverity = "info" | "warning" | "critical";

export interface AlertItem {
  id: string;
  severity: AlertSeverity;
  title: string;
  detail: string;
  createdAt: string;
  deviceId?: string;
  acknowledged: boolean;
}

export interface ActivityEvent {
  id: string;
  at: string;
  text: string;
  icon?: string;
}

export interface DashboardSummary {
  devicesTotal: number;
  devicesOnline: number;
  devicesActive: number;
  roomsTotal: number;
  currentPowerW: number;
  todayKwh: number;
  monthCost: number;
  currency: string;
  outdoorTempC: number;
  indoorTempC: number;
  weather: string; // e.g. "Partly cloudy"
  unreadAlerts: number;
}

// ------------------ Device onboarding ------------------

export interface NewDeviceInput {
  name: string;
  type: DeviceType;
  roomId: string;
  /** Optional initial level (brightness, set point, etc.) */
  level?: number;
  levelUnit?: string;
  /** Optional manufacturer / model captured during pairing */
  manufacturer?: string;
  model?: string;
}

// ------------------ Realtime event envelope ------------------

export type RealtimeEvent =
  | { type: "device.update"; device: Device }
  | { type: "energy.tick"; sample: EnergySample; currentPowerW: number }
  | { type: "alert.new"; alert: AlertItem }
  | { type: "activity.new"; event: ActivityEvent };

export type RealtimeListener = (e: RealtimeEvent) => void;

// ------------------ User / household ------------------

export interface Household {
  id: string;
  name: string;
  ownerName: string;
  address: string;
  timezone: string;
  currency: string;
}
