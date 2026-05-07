// In-memory mock implementation of HomeApi.
// Generates realistic series, simulates network latency, and emits
// realtime events on a timer so the UI feels live.

import type { HomeApi, EnergyRange } from "@/services/HomeApi";
import type {
  ActivityEvent,
  AlertItem,
  Automation,
  DashboardSummary,
  Device,
  DeviceUtilisation,
  EnergyBreakdown,
  EnergySample,
  EnergySummary,
  EnergyTip,
  Household,
  NewDeviceInput,
  RealtimeEvent,
  RealtimeListener,
  Room,
  RoomUtilisation,
  Scene,
  UtilisationHeatmap,
} from "@/types";
import {
  automations as seedAutomations,
  devices as seedDevices,
  household as seedHousehold,
  rooms as seedRooms,
  scenes as seedScenes,
} from "./seed";

const TARIFF = 8.4; // INR / kWh

// Tiny helpers ----------------------------------------------------
const delay = (ms = 180 + Math.random() * 220) =>
  new Promise<void>((r) => setTimeout(r, ms));
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const uid = () => Math.random().toString(36).slice(2, 10);

export class MockHomeApi implements HomeApi {
  private household: Household = clone(seedHousehold);
  private rooms: Room[] = clone(seedRooms);
  private devices: Device[] = clone(seedDevices);
  private scenes: Scene[] = clone(seedScenes);
  private automations: Automation[] = clone(seedAutomations);

  private alerts: AlertItem[] = [
    {
      id: uid(),
      severity: "warning",
      title: "Garage light unresponsive",
      detail: "No response from Garage Light for the past 12 minutes. Check power.",
      createdAt: new Date(Date.now() - 12 * 60e3).toISOString(),
      deviceId: "d_ga_light",
      acknowledged: false,
    },
    {
      id: uid(),
      severity: "info",
      title: "Eco AC saved 1.4 kWh today",
      detail: "Eco AC automation kept consumption 14% below baseline.",
      createdAt: new Date(Date.now() - 2 * 3600e3).toISOString(),
      acknowledged: false,
    },
    {
      id: uid(),
      severity: "critical",
      title: "Front Camera lost connection",
      detail: "Porch Light is offline. Camera reconnected after 38s. Investigate Wi-Fi.",
      createdAt: new Date(Date.now() - 45 * 60e3).toISOString(),
      deviceId: "d_od_light",
      acknowledged: false,
    },
  ];

  private activity: ActivityEvent[] = [
    { id: uid(), at: new Date(Date.now() - 2 * 60e3).toISOString(),  text: "Living AC set to 24°C",          icon: "Snowflake" },
    { id: uid(), at: new Date(Date.now() - 9 * 60e3).toISOString(),  text: "Sunset Lights automation ran",   icon: "Sunrise"   },
    { id: uid(), at: new Date(Date.now() - 18 * 60e3).toISOString(), text: "Front Door unlocked by Aryan",   icon: "Unlock"    },
    { id: uid(), at: new Date(Date.now() - 26 * 60e3).toISOString(), text: "Soundbar volume changed to 40%", icon: "Volume2"   },
    { id: uid(), at: new Date(Date.now() - 38 * 60e3).toISOString(), text: "Bedroom Fan turned off",         icon: "Wind"      },
    { id: uid(), at: new Date(Date.now() - 55 * 60e3).toISOString(), text: "Movie Night scene activated",    icon: "Film"      },
  ];

  private energyTips: EnergyTip[] = [
    { id: "t_ac",   title: "Raise AC by 1°C",         detail: "Setting Living AC to 25°C cuts consumption ~6%.", estimatedSavingPerMonth: 320, difficulty: "easy",   applied: false },
    { id: "t_geyser", title: "Schedule geyser",       detail: "Run geyser only 6:30–7:30 AM on weekdays.",       estimatedSavingPerMonth: 420, difficulty: "easy",   applied: false },
    { id: "t_lights", title: "Auto-off lights",       detail: "Turn off lights when no motion for 5 minutes.",   estimatedSavingPerMonth: 180, difficulty: "easy",   applied: true  },
    { id: "t_tv",   title: "TV standby kill",         detail: "Cut Smart TV standby with the Kettle plug schedule.", estimatedSavingPerMonth: 110, difficulty: "medium", applied: false },
    { id: "t_solar", title: "Shift loads to solar",   detail: "Run dishwasher and washing machine 11 AM – 3 PM.", estimatedSavingPerMonth: 540, difficulty: "medium", applied: false },
    { id: "t_fridge", title: "Fridge temperature",    detail: "Move fridge from 2°C to 4°C — saves ~8% on it.",  estimatedSavingPerMonth: 90,  difficulty: "easy",   applied: false },
  ];

  // ---------------- Realtime simulation ----------------
  private listeners = new Set<RealtimeListener>();
  private tickHandle: ReturnType<typeof setInterval> | null = null;
  private liveSeries: EnergySample[] = this.generateInitialLiveSeries();

  subscribe = (listener: RealtimeListener) => {
    this.listeners.add(listener);
    this.ensureTicker();
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0 && this.tickHandle) {
        clearInterval(this.tickHandle);
        this.tickHandle = null;
      }
    };
  };

  private emit(e: RealtimeEvent) {
    this.listeners.forEach((l) => l(e));
  }

  private ensureTicker() {
    if (this.tickHandle) return;
    this.tickHandle = setInterval(() => {
      // 1) jitter device power for online + on devices
      const candidates = this.devices.filter((d) => d.on && d.status === "online");
      if (candidates.length) {
        const d = candidates[Math.floor(Math.random() * candidates.length)];
        const jitter = (Math.random() - 0.5) * 0.08;
        d.powerW = Math.max(0, +(d.powerW * (1 + jitter)).toFixed(1));
        d.lastSeen = new Date().toISOString();
        this.emit({ type: "device.update", device: clone(d) });
      }

      // 2) emit an energy tick
      const sample = this.appendLiveSample();
      this.emit({
        type: "energy.tick",
        sample,
        currentPowerW: this.currentPowerW(),
      });

      // 3) occasional activity event
      if (Math.random() < 0.18) {
        const lines = [
          "Motion detected in Living Room",
          "Bathroom light auto-off",
          "Kids Fan speed changed to 2",
          "Eco AC raised temperature to 26°C",
          "Garage camera detected motion",
        ];
        const ev: ActivityEvent = {
          id: uid(),
          at: new Date().toISOString(),
          text: lines[Math.floor(Math.random() * lines.length)],
        };
        this.activity.unshift(ev);
        this.activity = this.activity.slice(0, 50);
        this.emit({ type: "activity.new", event: ev });
      }
    }, 3000);
  }

  // ---------------- Helpers ----------------
  private currentPowerW(): number {
    return this.devices.reduce((s, d) => s + (d.on ? d.powerW : 0), 0);
  }

  private generateInitialLiveSeries(): EnergySample[] {
    // Last 60 minutes, 1-minute buckets
    const out: EnergySample[] = [];
    const now = Date.now();
    for (let i = 59; i >= 0; i--) {
      const t = new Date(now - i * 60e3).toISOString();
      const kwh = +(0.04 + Math.random() * 0.08).toFixed(3);
      out.push({ t, kwh, cost: +(kwh * TARIFF).toFixed(2) });
    }
    return out;
  }

  private appendLiveSample(): EnergySample {
    const kwh = +((this.currentPowerW() / 1000) * (3 / 3600)).toFixed(4);
    const sample: EnergySample = {
      t: new Date().toISOString(),
      kwh,
      cost: +(kwh * TARIFF).toFixed(2),
    };
    this.liveSeries.push(sample);
    if (this.liveSeries.length > 240) this.liveSeries.shift();
    return sample;
  }

  // ---------------- HomeApi implementation ----------------

  async getHousehold() { await delay(); return clone(this.household); }

  async getDashboardSummary(): Promise<DashboardSummary> {
    await delay();
    const online = this.devices.filter((d) => d.status === "online").length;
    const active = this.devices.filter((d) => d.on).length;
    const todayKwh = this.computeTodayKwh();
    return {
      devicesTotal: this.devices.length,
      devicesOnline: online,
      devicesActive: active,
      roomsTotal: this.rooms.length,
      currentPowerW: this.currentPowerW(),
      todayKwh,
      monthCost: +(todayKwh * 22 * TARIFF).toFixed(0),
      currency: "INR",
      outdoorTempC: 30.4,
      indoorTempC: 24.5,
      weather: "Partly cloudy",
      unreadAlerts: this.alerts.filter((a) => !a.acknowledged).length,
    };
  }

  async getRecentActivity(limit = 20) { await delay(); return clone(this.activity.slice(0, limit)); }
  async getAlerts() { await delay(); return clone(this.alerts); }
  async acknowledgeAlert(id: string) {
    await delay();
    const a = this.alerts.find((x) => x.id === id);
    if (a) a.acknowledged = true;
  }

  async getRooms() {
    await delay();
    // refresh active counts
    for (const r of this.rooms) {
      const inRoom = this.devices.filter((d) => d.roomId === r.id);
      r.deviceCount = inRoom.length;
      r.activeCount = inRoom.filter((d) => d.on).length;
    }
    return clone(this.rooms);
  }

  async getDevices(filter?: { roomId?: string }) {
    await delay();
    let list = this.devices;
    if (filter?.roomId) list = list.filter((d) => d.roomId === filter.roomId);
    return clone(list);
  }

  async getDevice(id: string) {
    await delay();
    const d = this.devices.find((x) => x.id === id);
    if (!d) throw new Error(`Device ${id} not found`);
    return clone(d);
  }

  async toggleDevice(id: string, on: boolean) {
    await delay(120);
    const d = this.devices.find((x) => x.id === id);
    if (!d) throw new Error(`Device ${id} not found`);
    d.on = on;
    if (!on) d.powerW = 0;
    else d.powerW = this.defaultPowerForType(d);
    d.lastSeen = new Date().toISOString();
    const ev: ActivityEvent = {
      id: uid(),
      at: d.lastSeen,
      text: `${d.name} turned ${on ? "on" : "off"}`,
    };
    this.activity.unshift(ev);
    this.emit({ type: "device.update", device: clone(d) });
    this.emit({ type: "activity.new", event: ev });
    return clone(d);
  }

  async setDeviceLevel(id: string, level: number) {
    await delay(120);
    const d = this.devices.find((x) => x.id === id);
    if (!d) throw new Error(`Device ${id} not found`);
    d.level = Math.max(0, Math.min(100, level));
    d.lastSeen = new Date().toISOString();
    if (d.on && d.type === "light") d.powerW = +(0.3 + (d.level / 100) * 30).toFixed(1);
    this.emit({ type: "device.update", device: clone(d) });
    return clone(d);
  }

  async addDevice(input: NewDeviceInput): Promise<Device> {
    // Simulate the back-and-forth of a real pairing flow.
    await delay(420);
    const room = this.rooms.find((r) => r.id === input.roomId);
    if (!room) throw new Error(`Room ${input.roomId} not found`);
    const id = `d_${input.type}_${uid()}`;
    const newDevice: Device = {
      id,
      name: input.name.trim() || `New ${input.type}`,
      type: input.type,
      roomId: input.roomId,
      status: "online",
      on: false,
      powerW: 0,
      level: input.level,
      levelUnit: input.levelUnit ?? defaultLevelUnit(input.type),
      firmware: "1.0.0",
      lastSeen: new Date().toISOString(),
    };
    this.devices.push(newDevice);
    // Refresh room device counts so subsequent getRooms reflects the new total.
    room.deviceCount += 1;
    const ev: ActivityEvent = {
      id: uid(),
      at: newDevice.lastSeen,
      text: `${newDevice.name} added to ${room.name}`,
      icon: "Plus",
    };
    this.activity.unshift(ev);
    this.emit({ type: "device.update", device: clone(newDevice) });
    this.emit({ type: "activity.new", event: ev });
    return clone(newDevice);
  }

  async getScenes() { await delay(); return clone(this.scenes); }
  async activateScene(id: string) {
    await delay(150);
    const s = this.scenes.find((x) => x.id === id);
    if (!s) throw new Error(`Scene ${id} not found`);
    this.scenes.forEach((x) => (x.active = x.id === id));
    const ev: ActivityEvent = { id: uid(), at: new Date().toISOString(), text: `${s.name} scene activated`, icon: s.icon };
    this.activity.unshift(ev);
    this.emit({ type: "activity.new", event: ev });
    return clone(s);
  }

  async getAutomations() { await delay(); return clone(this.automations); }
  async setAutomationEnabled(id: string, enabled: boolean) {
    await delay();
    const a = this.automations.find((x) => x.id === id);
    if (!a) throw new Error(`Automation ${id} not found`);
    a.enabled = enabled;
    return clone(a);
  }

  async getEnergySummary(): Promise<EnergySummary> {
    await delay();
    const todayKwh = this.computeTodayKwh();
    const monthKwh = +(todayKwh * 22 + 14).toFixed(1);
    return {
      todayKwh,
      todayCost: +(todayKwh * TARIFF).toFixed(0),
      yesterdayKwh: +(todayKwh * 1.08).toFixed(1),
      monthKwh,
      monthCost: +(monthKwh * TARIFF).toFixed(0),
      monthBudgetKwh: 320,
      monthDeltaPct: -7.2,
      co2Kg: +(monthKwh * 0.82).toFixed(1),
      savedKwh: 23.4,
      savedCost: +(23.4 * TARIFF).toFixed(0),
      currency: "INR",
      tariffPerKwh: TARIFF,
    };
  }

  async getEnergySeries(range: EnergyRange): Promise<EnergySample[]> {
    await delay();
    if (range === "today") {
      const samples: EnergySample[] = [];
      const now = new Date();
      for (let h = 0; h <= now.getHours(); h++) {
        const t = new Date(now);
        t.setHours(h, 0, 0, 0);
        const base = 0.6 + 0.6 * Math.sin((h - 7) / 24 * Math.PI * 2) + Math.random() * 0.3;
        const kwh = +Math.max(0.2, base).toFixed(2);
        samples.push({ t: t.toISOString(), kwh, cost: +(kwh * TARIFF).toFixed(1) });
      }
      return samples;
    }
    if (range === "week") {
      const out: EnergySample[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
        const kwh = +(11 + Math.random() * 7).toFixed(1);
        out.push({ t: d.toISOString(), kwh, cost: +(kwh * TARIFF).toFixed(0) });
      }
      return out;
    }
    if (range === "month") {
      const out: EnergySample[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
        const kwh = +(10 + Math.random() * 9).toFixed(1);
        out.push({ t: d.toISOString(), kwh, cost: +(kwh * TARIFF).toFixed(0) });
      }
      return out;
    }
    // year
    const out: EnergySample[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i); d.setDate(1); d.setHours(0, 0, 0, 0);
      const kwh = +(280 + Math.random() * 120).toFixed(0);
      out.push({ t: d.toISOString(), kwh, cost: +(kwh * TARIFF).toFixed(0) });
    }
    return out;
  }

  async getEnergyBreakdown(): Promise<EnergyBreakdown[]> {
    await delay();
    const data = [
      { category: "Cooling",     kwh: 132, color: "#14587F" },
      { category: "Lighting",    kwh: 38,  color: "#1FA971" },
      { category: "Appliances",  kwh: 64,  color: "#F5A623" },
      { category: "Entertainment", kwh: 22, color: "#7C5CFA" },
      { category: "Standby",     kwh: 14,  color: "#9AA6AD" },
    ];
    const total = data.reduce((s, x) => s + x.kwh, 0);
    return data.map((d) => ({ ...d, pct: +((d.kwh / total) * 100).toFixed(1) }));
  }

  async getEnergyTips() { await delay(); return clone(this.energyTips); }
  async applyEnergyTip(id: string) {
    await delay();
    const t = this.energyTips.find((x) => x.id === id);
    if (!t) throw new Error(`Tip ${id} not found`);
    t.applied = !t.applied;
    return clone(t);
  }

  async getDeviceUtilisation(): Promise<DeviceUtilisation[]> {
    await delay();
    return this.devices.map((d) => {
      const roomName = this.rooms.find((r) => r.id === d.roomId)?.name ?? "—";
      const baseline = d.type === "ac" ? 6 : d.type === "fan" ? 8 : d.type === "light" ? 5 : d.type === "tv" ? 4 : d.type === "appliance" ? 2 : 0.5;
      const hoursToday = +Math.max(0, baseline + (Math.random() - 0.4) * 4).toFixed(1);
      const hoursWeek = +(hoursToday * (5 + Math.random() * 1.5)).toFixed(1);
      const utilisationPct = +((hoursWeek / (24 * 7)) * 100).toFixed(1);
      const watts = d.type === "ac" ? 1200 : d.type === "appliance" ? 800 : d.type === "tv" ? 110 : d.type === "fan" ? 65 : 24;
      const kwhWeek = +((watts * hoursWeek) / 1000).toFixed(1);
      return { deviceId: d.id, deviceName: d.name, type: d.type, roomName, hoursToday, hoursWeek, utilisationPct, kwhWeek };
    });
  }

  async getRoomUtilisation(): Promise<RoomUtilisation[]> {
    await delay();
    return this.rooms.map((r) => ({
      roomId: r.id,
      roomName: r.name,
      occupancyPct: +(20 + Math.random() * 70).toFixed(0),
      activeDevicePct: r.deviceCount === 0 ? 0 : +((r.activeCount / r.deviceCount) * 100).toFixed(0),
      kwhWeek: +(8 + Math.random() * 24).toFixed(1),
    }));
  }

  async getUtilisationHeatmap(): Promise<UtilisationHeatmap> {
    await delay();
    const grid: UtilisationHeatmap = [];
    for (let day = 0; day < 7; day++) {
      const row: number[] = [];
      for (let hour = 0; hour < 24; hour++) {
        // morning + evening peaks, with weekday/weekend variation
        const morning = Math.exp(-Math.pow(hour - 7.5, 2) / 8);
        const evening = Math.exp(-Math.pow(hour - 20, 2) / 10);
        const mid = day === 5 || day === 6 ? Math.exp(-Math.pow(hour - 13, 2) / 18) * 0.6 : 0.1;
        const v = morning + evening + mid + Math.random() * 0.15;
        row.push(+Math.min(1, v / 2).toFixed(2));
      }
      grid.push(row);
    }
    return grid;
  }

  // ---------------- Internal helpers ----------------
  private computeTodayKwh(): number {
    // approximate: integrate current power × hours-elapsed-today with a fudge factor
    const now = new Date();
    const hours = now.getHours() + now.getMinutes() / 60;
    const avgKw = (this.currentPowerW() * 0.78) / 1000;
    return +Math.max(2, avgKw * hours + 1.4).toFixed(1);
  }

  private defaultPowerForType(d: Device): number {
    switch (d.type) {
      case "ac":         return 1200 + Math.random() * 200;
      case "tv":         return 110 + Math.random() * 30;
      case "speaker":    return 18 + Math.random() * 6;
      case "fan":        return 60 + Math.random() * 20;
      case "appliance":  return 140 + Math.random() * 60;
      case "plug":       return 800 + Math.random() * 800;
      case "camera":     return 6 + Math.random() * 3;
      case "light":      return +(0.3 + ((d.level ?? 100) / 100) * 28).toFixed(1);
      case "lock":
      case "sensor":     return 0.4;
      case "blinds":     return 0;
      case "thermostat": return 4;
      default:           return 0;
    }
  }
}

function defaultLevelUnit(type: NewDeviceInput["type"]): string | undefined {
  switch (type) {
    case "light":
    case "tv":
    case "speaker":
    case "blinds":
      return "%";
    case "ac":
    case "thermostat":
      return "°C";
    case "fan":
      return "spd";
    default:
      return undefined;
  }
}
