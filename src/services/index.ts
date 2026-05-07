// =============================================================
// The single import point for components and hooks.
//
//   import { api } from "@/services";
//
// Switch behind the scenes via VITE_USE_MOCK in your .env file.
// Default is mock=true so the demo always works out of the box.
// =============================================================

import { MockHomeApi } from "./mock/MockHomeApi";
import { HttpHomeApi } from "./http/HttpHomeApi";
import type { HomeApi } from "./HomeApi";

const useMock = (import.meta.env.VITE_USE_MOCK ?? "true").toLowerCase() !== "false";

export const api: HomeApi = useMock ? new MockHomeApi() : new HttpHomeApi();

export const isMockMode = useMock;
export type { HomeApi };
export type { EnergyRange } from "./HomeApi";
