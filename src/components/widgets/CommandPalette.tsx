// Global search palette — opens with Cmd/Ctrl+K, "/" or topbar click.
// Searches devices, rooms, scenes, automations, alerts and pages,
// and offers inline actions (toggle device, activate scene, etc.).

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  Cpu,
  Home,
  Layers,
  Wand2,
  AlertTriangle,
  CornerDownLeft,
  ArrowDown,
  ArrowUp,
  Plus,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { api } from "@/services";
import type { AlertItem, Automation, Device, Room, Scene } from "@/types";
import { Toggle } from "@/components/ui/Toggle";
import { fmtPower } from "@/utils/format";
import { toast } from "@/hooks/useToast";
import { useAppShell } from "@/hooks/useAppShell";

const RECENT_KEY = "babcom.search.recent.v1";
const MAX_RECENT = 6;

type ResultGroup = "device" | "room" | "scene" | "automation" | "alert" | "page" | "action";

interface BaseResult {
  id: string;
  group: ResultGroup;
  label: string;
  hint?: string;
  icon: ReactNode;
  onActivate: () => void;
  /** Inline secondary action rendered to the right (toggle, etc.). */
  rightSlot?: ReactNode;
  /** Search keywords for ranking */
  keywords: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

interface Datasets {
  devices: Device[];
  rooms: Room[];
  scenes: Scene[];
  automations: Automation[];
  alerts: AlertItem[];
}

const emptyData: Datasets = { devices: [], rooms: [], scenes: [], automations: [], alerts: [] };

export function CommandPalette({ open, onClose }: Props) {
  const navigate = useNavigate();
  const shell = useAppShell();

  const [query, setQuery] = useState("");
  const [data, setData] = useState<Datasets>(emptyData);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [recent, setRecent] = useState<string[]>(() => loadRecent());
  const inputRef = useRef<HTMLInputElement>(null);

  // Reload data each time we open. Keeps results fresh after device toggles.
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIdx(0);
    setLoading(true);
    Promise.all([
      api.getDevices(),
      api.getRooms(),
      api.getScenes(),
      api.getAutomations(),
      api.getAlerts(),
    ])
      .then(([devices, rooms, scenes, automations, alerts]) => {
        setData({ devices, rooms, scenes, automations, alerts });
      })
      .finally(() => setLoading(false));
  }, [open]);

  // Optimistic inline updates: when a device is toggled inside the palette,
  // mutate local state so the row reflects the new state without re-querying.
  const patchDevice = (next: Device) => {
    setData((prev) => ({ ...prev, devices: prev.devices.map((d) => (d.id === next.id ? next : d)) }));
  };
  const patchAutomation = (next: Automation) => {
    setData((prev) => ({ ...prev, automations: prev.automations.map((a) => (a.id === next.id ? next : a)) }));
  };

  const results = useMemo<ResultGroup[] extends never ? never : BaseResult[]>(() => {
    return buildResults(data, navigate, shell, patchDevice, patchAutomation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, navigate]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // No query yet: surface recent + suggestions
      const top: BaseResult[] = [];
      // Suggestions
      const pages = results.filter((r) => r.group === "page" || r.group === "action");
      top.push(...pages);
      return top;
    }
    return results
      .map((r) => ({ r, score: scoreMatch(q, r.keywords) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 60)
      .map((x) => x.r);
  }, [results, query]);

  // Group for display
  const grouped = useMemo(() => groupResults(filtered), [filtered]);

  useEffect(() => { setActiveIdx(0); }, [query, open]);

  useEffect(() => {
    if (!open) return;
    const i = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(i);
  }, [open]);

  const flat = filtered;
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, Math.max(0, flat.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = flat[activeIdx];
      if (target) {
        rememberRecent(query, setRecent);
        target.onActivate();
      }
    }
  };

  return (
    <Modal open={open} onClose={onClose} bare padded={false} size="lg">
      <div className="flex flex-col max-h-[70vh]">
        <div className="flex items-center gap-3 px-4 sm:px-5 py-3 border-b border-surface-sunken">
          <Search className="w-5 h-5 text-ink-500 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search devices, rooms, scenes, automations, alerts…"
            className="bg-transparent outline-none text-sm flex-1 placeholder:text-ink-500"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="w-7 h-7 grid place-items-center rounded-lg text-ink-500 hover:bg-surface-muted"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            data-modal-close
            className="hidden sm:inline-flex items-center gap-1 text-[11px] text-ink-500 px-2 py-1 rounded-md bg-surface-muted hover:bg-surface-sunken"
            aria-label="Close search"
          >
            Esc
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {!query && recent.length > 0 && (
            <Section title="Recent searches">
              <div className="flex flex-wrap gap-2 px-4 sm:px-5 pb-2">
                {recent.map((r) => (
                  <button
                    key={r}
                    onClick={() => setQuery(r)}
                    className="text-xs px-2.5 py-1.5 rounded-full bg-surface-muted text-ink-700 hover:bg-brand-50 hover:text-brand-600"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </Section>
          )}

          {loading ? (
            <div className="p-6 text-sm text-ink-500">Loading…</div>
          ) : flat.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-semibold text-ink-900">No matches</p>
              <p className="text-xs text-ink-500 mt-1">
                Try a device name, room, scene or “add device”.
              </p>
            </div>
          ) : (
            <ul role="listbox" className="pb-3">
              {grouped.map(({ group, items, label }) => (
                <li key={group}>
                  <div className="px-4 sm:px-5 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                    {label}
                  </div>
                  <ul>
                    {items.map((r) => {
                      const flatIdx = flat.indexOf(r);
                      const active = flatIdx === activeIdx;
                      return (
                        <li
                          key={r.id}
                          role="option"
                          aria-selected={active}
                          onMouseEnter={() => setActiveIdx(flatIdx)}
                          onClick={() => {
                            rememberRecent(query, setRecent);
                            r.onActivate();
                          }}
                          className={`group cursor-pointer mx-2 sm:mx-3 px-2 sm:px-3 py-2 rounded-xl flex items-center gap-3 transition-colors
                            ${active ? "bg-brand-50" : "hover:bg-surface-muted"}`}
                        >
                          <div className="w-8 h-8 grid place-items-center rounded-lg bg-surface-muted text-brand-500 shrink-0">
                            {r.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-ink-900 truncate">{r.label}</p>
                            {r.hint && <p className="text-xs text-ink-500 truncate">{r.hint}</p>}
                          </div>
                          <div className="shrink-0 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            {r.rightSlot}
                            <CornerDownLeft className={`w-4 h-4 ${active ? "text-brand-500" : "text-ink-300"}`} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="border-t border-surface-sunken px-4 sm:px-5 py-2.5 text-[11px] text-ink-500 flex items-center gap-4 flex-wrap">
          <Kbd>
            <ArrowUp className="w-3 h-3" /><ArrowDown className="w-3 h-3" />
          </Kbd>
          <span>navigate</span>
          <Kbd><CornerDownLeft className="w-3 h-3" /></Kbd>
          <span>select</span>
          <span className="ml-auto">
            Tip: press <span className="font-semibold text-ink-700">⌘ K</span> / <span className="font-semibold text-ink-700">/</span> any time
          </span>
        </footer>
      </div>
    </Modal>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-surface-muted text-ink-700 font-mono">
      {children}
    </span>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="pt-2">
      <div className="px-4 sm:px-5 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
        {title}
      </div>
      {children}
    </div>
  );
}

// ---------------- ranking & grouping ----------------

function scoreMatch(q: string, keywords: string): number {
  const k = keywords.toLowerCase();
  if (k.includes(q)) {
    // Exact substring matches in keywords -> high score; full-word boost
    let score = 80;
    if (k.startsWith(q)) score += 25;
    if (new RegExp(`\\b${escapeReg(q)}`).test(k)) score += 15;
    return score;
  }
  // Per-token "all tokens present" fallback
  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.every((t) => k.includes(t))) return 35;
  return 0;
}

function escapeReg(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function groupResults(items: BaseResult[]) {
  const order: ResultGroup[] = ["action", "page", "device", "scene", "automation", "room", "alert"];
  const labels: Record<ResultGroup, string> = {
    action:     "Quick actions",
    page:       "Pages",
    device:     "Devices",
    scene:      "Scenes",
    automation: "Automations",
    room:       "Rooms",
    alert:      "Alerts",
  };
  const buckets = new Map<ResultGroup, BaseResult[]>();
  for (const r of items) {
    const arr = buckets.get(r.group) ?? [];
    arr.push(r);
    buckets.set(r.group, arr);
  }
  return order
    .filter((g) => buckets.has(g))
    .map((g) => ({ group: g, label: labels[g], items: buckets.get(g)! }));
}

// ---------------- result builders ----------------

function buildResults(
  data: Datasets,
  navigate: ReturnType<typeof useNavigate>,
  shell: ReturnType<typeof useAppShell>,
  patchDevice: (d: Device) => void,
  patchAutomation: (a: Automation) => void,
): BaseResult[] {
  const out: BaseResult[] = [];

  // Quick actions
  out.push({
    id: "act_add",
    group: "action",
    label: "Add a new device",
    hint: "Open the pairing wizard",
    icon: <Plus className="w-4 h-4" />,
    keywords: "add device pair new install onboard",
    onActivate: () => { shell.closeSearch(); shell.openAddDevice(); },
  });
  out.push({
    id: "act_settings",
    group: "action",
    label: "Open Settings",
    hint: "Profile, household, notifications, energy…",
    icon: <span className="text-xs font-bold">⚙</span>,
    keywords: "settings preferences config configure profile theme tariff",
    onActivate: () => { shell.closeSearch(); shell.openSettings(); },
  });
  out.push({
    id: "act_help",
    group: "action",
    label: "Help & Support",
    hint: "FAQ, contact Babcom, live chat",
    icon: <span className="text-xs font-bold">?</span>,
    keywords: "help support contact chat faq question issue troubleshoot babcom",
    onActivate: () => { shell.closeSearch(); shell.openHelp(); },
  });

  // Pages
  const pages: Array<{ to: string; label: string; kw: string }> = [
    { to: "/",            label: "Dashboard",     kw: "dashboard home overview kpi summary" },
    { to: "/energy",      label: "Energy Saving", kw: "energy bill cost kwh tariff savings tips" },
    { to: "/utilisation", label: "Utilisation",   kw: "utilisation usage hours heatmap analytics" },
    { to: "/smart-home",  label: "Smart Home",    kw: "smart home devices rooms control" },
  ];
  for (const p of pages) {
    out.push({
      id: `page_${p.to}`,
      group: "page",
      label: p.label,
      hint: `Go to ${p.label}`,
      icon: <Home className="w-4 h-4" />,
      keywords: `${p.label} ${p.kw}`,
      onActivate: () => { shell.closeSearch(); navigate(p.to); },
    });
  }

  const roomById = new Map(data.rooms.map((r) => [r.id, r]));

  // Devices
  for (const d of data.devices) {
    const room = roomById.get(d.roomId);
    out.push({
      id: `dev_${d.id}`,
      group: "device",
      label: d.name,
      hint: `${room?.name ?? "—"} • ${d.type}${d.on ? ` • ${fmtPower(d.powerW)}` : " • off"}${d.status === "offline" ? " • offline" : ""}`,
      icon: <Cpu className="w-4 h-4" />,
      keywords: `${d.name} ${d.type} ${room?.name ?? ""} device ${d.on ? "on" : "off"} ${d.status}`,
      rightSlot: (
        <Toggle
          size="sm"
          checked={d.on}
          disabled={d.status === "offline"}
          onChange={async (next) => {
            const optimistic: Device = { ...d, on: next, powerW: next ? d.powerW || 5 : 0 };
            patchDevice(optimistic);
            try {
              const updated = await api.toggleDevice(d.id, next);
              patchDevice(updated);
              toast.success(`${updated.name} ${next ? "turned on" : "turned off"}`);
            } catch {
              patchDevice(d);
              toast.error("Could not change device state");
            }
          }}
        />
      ),
      onActivate: () => {
        shell.closeSearch();
        navigate("/smart-home");
      },
    });
  }

  // Rooms
  for (const r of data.rooms) {
    out.push({
      id: `room_${r.id}`,
      group: "room",
      label: r.name,
      hint: `${r.activeCount}/${r.deviceCount} devices on • ${r.temperature.toFixed(1)}° • ${r.humidity}%`,
      icon: <Layers className="w-4 h-4" />,
      keywords: `${r.name} room ${r.icon}`,
      onActivate: () => { shell.closeSearch(); navigate("/smart-home"); },
    });
  }

  // Scenes
  for (const s of data.scenes) {
    out.push({
      id: `scene_${s.id}`,
      group: "scene",
      label: s.name,
      hint: s.description,
      icon: <Wand2 className="w-4 h-4" />,
      keywords: `${s.name} scene ${s.description}`,
      rightSlot: (
        <button
          onClick={async () => {
            await api.activateScene(s.id);
            toast.success(`${s.name} activated`);
          }}
          className="text-xs font-semibold px-2 py-1 rounded-md bg-brand-500 text-white hover:bg-brand-600"
        >
          Activate
        </button>
      ),
      onActivate: async () => {
        await api.activateScene(s.id);
        toast.success(`${s.name} activated`);
      },
    });
  }

  // Automations
  for (const a of data.automations) {
    out.push({
      id: `auto_${a.id}`,
      group: "automation",
      label: a.name,
      hint: `${a.trigger} • ${a.enabled ? "enabled" : "disabled"}`,
      icon: <Wand2 className="w-4 h-4" />,
      keywords: `${a.name} automation ${a.description} ${a.trigger}`,
      rightSlot: (
        <Toggle
          size="sm"
          checked={a.enabled}
          onChange={async (next) => {
            patchAutomation({ ...a, enabled: next });
            try {
              const updated = await api.setAutomationEnabled(a.id, next);
              patchAutomation(updated);
              toast.success(`${updated.name} ${next ? "enabled" : "disabled"}`);
            } catch {
              patchAutomation(a);
              toast.error("Could not update automation");
            }
          }}
        />
      ),
      onActivate: () => { shell.closeSearch(); navigate("/smart-home"); },
    });
  }

  // Alerts
  for (const a of data.alerts) {
    out.push({
      id: `alert_${a.id}`,
      group: "alert",
      label: a.title,
      hint: `${a.severity.toUpperCase()} • ${a.acknowledged ? "acknowledged" : "open"}`,
      icon: <AlertTriangle className="w-4 h-4" />,
      keywords: `${a.title} ${a.detail} alert ${a.severity}`,
      onActivate: () => { shell.closeSearch(); navigate("/"); },
    });
  }

  return out;
}

// ---------------- recent searches ----------------

function loadRecent(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? arr.filter((s): s is string => typeof s === "string").slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function rememberRecent(q: string, setRecent: (s: string[]) => void) {
  const trimmed = q.trim();
  if (!trimmed) return;
  try {
    const existing = loadRecent().filter((x) => x.toLowerCase() !== trimmed.toLowerCase());
    const next = [trimmed, ...existing].slice(0, MAX_RECENT);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    setRecent(next);
  } catch {
    /* ignore */
  }
}
