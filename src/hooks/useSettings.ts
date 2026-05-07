// Typed settings store, persisted to localStorage and shared across the app
// via a tiny pub/sub. Components read with `useSettings()` and write with
// `useSettings().update(patch)`. Keys mirror what a real home-automation
// product would expose to the end user.

import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "auto";
export type Density = "comfortable" | "compact";
export type TempUnit = "C" | "F";
export type DistanceUnit = "metric" | "imperial";
export type TimeFormat = "12h" | "24h";

export interface HouseholdMember {
  id: string;
  name: string;
  role: "owner" | "family" | "guest";
  email: string;
  status: "active" | "invited";
  avatarColor: string;
}

export interface Settings {
  profile: {
    name: string;
    email: string;
    phone: string;
  };
  household: {
    name: string;
    address: string;
    members: HouseholdMember[];
  };
  notifications: {
    channels: { email: boolean; push: boolean; sms: boolean };
    categories: {
      security: boolean;
      energy: boolean;
      devices: boolean;
      automations: boolean;
      tipsAndOffers: boolean;
    };
    quietHours: { enabled: boolean; from: string; to: string };
  };
  energy: {
    currency: string;
    tariffPerKwh: number;
    monthlyBudgetKwh: number;
    peakStart: string;
    peakEnd: string;
    showSavingsBanner: boolean;
  };
  privacy: {
    shareUsageStats: boolean;
    voiceRecording: boolean;
    locationServices: boolean;
    cameraNotifications: boolean;
  };
  appearance: {
    theme: Theme;
    density: Density;
  };
  region: {
    language: string;
    timezone: string;
    tempUnit: TempUnit;
    distanceUnit: DistanceUnit;
    timeFormat: TimeFormat;
    weekStartsOn: 0 | 1; // Sunday/Monday
  };
  voiceAssistants: {
    alexa: boolean;
    google: boolean;
    siri: boolean;
    homekit: boolean;
  };
  security: {
    twoFactor: boolean;
    biometric: boolean;
    autoLockMinutes: number;
    panicScene: string;
  };
}

export const defaultSettings: Settings = {
  profile: {
    name: "Aryan Sharma",
    email: "aryan.sharma@example.com",
    phone: "+91 98765 43210",
  },
  household: {
    name: "Sharma Residence",
    address: "Flat 1402, Skyline Heights, Bengaluru",
    members: [
      { id: "m_1", name: "Aryan Sharma",  role: "owner",  email: "aryan@example.com",  status: "active",  avatarColor: "#14587F" },
      { id: "m_2", name: "Priya Sharma",  role: "family", email: "priya@example.com",  status: "active",  avatarColor: "#1FA971" },
      { id: "m_3", name: "Kabir Sharma",  role: "family", email: "kabir@example.com",  status: "active",  avatarColor: "#7C5CFA" },
      { id: "m_4", name: "Cleaning Help", role: "guest",  email: "guest@example.com",  status: "invited", avatarColor: "#F5A623" },
    ],
  },
  notifications: {
    channels:  { email: true,  push: true,  sms: false },
    categories:{ security: true, energy: true, devices: true, automations: true, tipsAndOffers: false },
    quietHours:{ enabled: true, from: "22:30", to: "07:00" },
  },
  energy: {
    currency: "INR",
    tariffPerKwh: 8.4,
    monthlyBudgetKwh: 320,
    peakStart: "18:00",
    peakEnd: "22:00",
    showSavingsBanner: true,
  },
  privacy: {
    shareUsageStats: true,
    voiceRecording: false,
    locationServices: true,
    cameraNotifications: true,
  },
  appearance: {
    theme: "light",
    density: "comfortable",
  },
  region: {
    language: "en-IN",
    timezone: "Asia/Kolkata",
    tempUnit: "C",
    distanceUnit: "metric",
    timeFormat: "24h",
    weekStartsOn: 1,
  },
  voiceAssistants: {
    alexa: true,
    google: false,
    siri: false,
    homekit: false,
  },
  security: {
    twoFactor: true,
    biometric: true,
    autoLockMinutes: 5,
    panicScene: "s_away",
  },
};

const STORAGE_KEY = "babcom.settings.v1";

function deepMerge<T>(base: T, patch: Partial<T> | undefined): T {
  if (!patch || typeof patch !== "object") return base;
  const out: Record<string, unknown> = { ...(base as object) };
  for (const [k, v] of Object.entries(patch as Record<string, unknown>)) {
    const cur = out[k];
    if (
      v && typeof v === "object" && !Array.isArray(v) &&
      cur && typeof cur === "object" && !Array.isArray(cur)
    ) {
      out[k] = deepMerge(cur, v as Partial<typeof cur>);
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

function loadFromStorage(): Settings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return deepMerge(defaultSettings, parsed);
  } catch {
    return defaultSettings;
  }
}

class SettingsStore {
  private value: Settings = loadFromStorage();
  private listeners = new Set<(s: Settings) => void>();

  get(): Settings { return this.value; }

  subscribe(l: (s: Settings) => void): () => void {
    this.listeners.add(l);
    l(this.value);
    return () => { this.listeners.delete(l); };
  }

  update(patch: DeepPartial<Settings>) {
    this.value = deepMerge(this.value, patch as Partial<Settings>);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.value));
    } catch { /* ignore quota errors */ }
    for (const l of this.listeners) l(this.value);
  }

  reset() {
    this.value = defaultSettings;
    try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    for (const l of this.listeners) l(this.value);
  }
}

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<infer U>
    ? Array<U>
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};

const store = new SettingsStore();

export function useSettings(): {
  settings: Settings;
  update: (patch: DeepPartial<Settings>) => void;
  reset: () => void;
} {
  const [settings, setSettings] = useState<Settings>(store.get());
  useEffect(() => store.subscribe(setSettings), []);
  return {
    settings,
    update: (patch) => store.update(patch),
    reset: () => store.reset(),
  };
}

export function getSettingsSnapshot(): Settings {
  return store.get();
}
