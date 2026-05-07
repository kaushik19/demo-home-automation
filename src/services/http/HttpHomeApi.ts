// Real backend adapter.  Implements HomeApi by calling REST endpoints
// and subscribing to a WebSocket for realtime events.
//
// Endpoint paths are documented inline so the backend team has a
// concrete contract to ship against.

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
import { request } from "./httpClient";

export class HttpHomeApi implements HomeApi {
  // ---- household ----
  getHousehold = () => request<Household>("/household");

  // ---- dashboard ----
  getDashboardSummary = () => request<DashboardSummary>("/dashboard/summary");
  getRecentActivity = (limit = 20) =>
    request<ActivityEvent[]>("/dashboard/activity", { query: { limit } });
  getAlerts = () => request<AlertItem[]>("/alerts");
  acknowledgeAlert = (id: string) =>
    request<void>(`/alerts/${id}/ack`, { method: "POST" });

  // ---- smart home ----
  getRooms = () => request<Room[]>("/rooms");
  getDevices = (filter?: { roomId?: string }) =>
    request<Device[]>("/devices", { query: { roomId: filter?.roomId } });
  getDevice = (id: string) => request<Device>(`/devices/${id}`);
  toggleDevice = (id: string, on: boolean) =>
    request<Device>(`/devices/${id}/power`, { method: "POST", body: { on } });
  setDeviceLevel = (id: string, level: number) =>
    request<Device>(`/devices/${id}/level`, { method: "POST", body: { level } });
  addDevice = (input: NewDeviceInput) =>
    request<Device>("/devices", { method: "POST", body: input });
  getScenes = () => request<Scene[]>("/scenes");
  activateScene = (id: string) =>
    request<Scene>(`/scenes/${id}/activate`, { method: "POST" });
  getAutomations = () => request<Automation[]>("/automations");
  setAutomationEnabled = (id: string, enabled: boolean) =>
    request<Automation>(`/automations/${id}`, { method: "PATCH", body: { enabled } });

  // ---- energy ----
  getEnergySummary = () => request<EnergySummary>("/energy/summary");
  getEnergySeries = (range: EnergyRange) =>
    request<EnergySample[]>("/energy/series", { query: { range } });
  getEnergyBreakdown = () => request<EnergyBreakdown[]>("/energy/breakdown");
  getEnergyTips = () => request<EnergyTip[]>("/energy/tips");
  applyEnergyTip = (id: string) =>
    request<EnergyTip>(`/energy/tips/${id}/apply`, { method: "POST" });

  // ---- utilisation ----
  getDeviceUtilisation = () => request<DeviceUtilisation[]>("/utilisation/devices");
  getRoomUtilisation = () => request<RoomUtilisation[]>("/utilisation/rooms");
  getUtilisationHeatmap = () => request<UtilisationHeatmap>("/utilisation/heatmap");

  // ---- realtime via WebSocket ----
  private socket: WebSocket | null = null;
  private listeners = new Set<RealtimeListener>();

  subscribe = (listener: RealtimeListener) => {
    this.listeners.add(listener);
    this.ensureSocket();
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.socket?.close();
        this.socket = null;
      }
    };
  };

  private ensureSocket() {
    if (this.socket) return;
    const url = import.meta.env.VITE_WS_URL;
    if (!url) return;
    try {
      const ws = new WebSocket(url);
      this.socket = ws;
      ws.onmessage = (m) => {
        try {
          const evt = JSON.parse(m.data) as RealtimeEvent;
          this.listeners.forEach((l) => l(evt));
        } catch {
          /* ignore malformed frames */
        }
      };
      ws.onclose = () => {
        this.socket = null;
        // Auto-reconnect after a short delay if we still have listeners
        if (this.listeners.size > 0) setTimeout(() => this.ensureSocket(), 2000);
      };
    } catch {
      this.socket = null;
    }
  }
}
