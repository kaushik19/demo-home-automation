// =============================================================
// HomeApi — the ONE interface every page/hook talks to.
//
// There are two implementations:
//   - mock/MockHomeApi.ts   (in-memory, simulated realtime)
//   - http/HttpHomeApi.ts   (real REST + WebSocket)
//
// The active implementation is chosen in services/index.ts based
// on VITE_USE_MOCK.  Components NEVER import either implementation
// directly — they import from "@/services" and get the right one.
// =============================================================

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
  RealtimeListener,
  Room,
  RoomUtilisation,
  Scene,
  UtilisationHeatmap,
} from "@/types";

export type EnergyRange = "today" | "week" | "month" | "year";

export interface HomeApi {
  // ---- household ----
  getHousehold(): Promise<Household>;

  // ---- dashboard ----
  getDashboardSummary(): Promise<DashboardSummary>;
  getRecentActivity(limit?: number): Promise<ActivityEvent[]>;
  getAlerts(): Promise<AlertItem[]>;
  acknowledgeAlert(id: string): Promise<void>;

  // ---- smart home ----
  getRooms(): Promise<Room[]>;
  getDevices(filter?: { roomId?: string }): Promise<Device[]>;
  getDevice(id: string): Promise<Device>;
  toggleDevice(id: string, on: boolean): Promise<Device>;
  setDeviceLevel(id: string, level: number): Promise<Device>;
  addDevice(input: NewDeviceInput): Promise<Device>;
  getScenes(): Promise<Scene[]>;
  activateScene(id: string): Promise<Scene>;
  getAutomations(): Promise<Automation[]>;
  setAutomationEnabled(id: string, enabled: boolean): Promise<Automation>;

  // ---- energy ----
  getEnergySummary(): Promise<EnergySummary>;
  getEnergySeries(range: EnergyRange): Promise<EnergySample[]>;
  getEnergyBreakdown(): Promise<EnergyBreakdown[]>;
  getEnergyTips(): Promise<EnergyTip[]>;
  applyEnergyTip(id: string): Promise<EnergyTip>;

  // ---- utilisation ----
  getDeviceUtilisation(): Promise<DeviceUtilisation[]>;
  getRoomUtilisation(): Promise<RoomUtilisation[]>;
  getUtilisationHeatmap(): Promise<UtilisationHeatmap>;

  // ---- realtime ----
  subscribe(listener: RealtimeListener): () => void;
}
