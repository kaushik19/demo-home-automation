# Architecture

This document explains *how* the Babcom Home Automation dashboard is put together and *why* the seams are where they are. It’s aimed at developers joining the project and at the backend team building the API.

---

## 1 · One-line summary

A static, client-side React + TypeScript SPA where every page is wired to a single typed `HomeApi` interface. Today that interface is implemented by an in-memory mock; flip one env flag and the same UI binds to a real REST + WebSocket backend.

---

## 2 · High-level layout

```text
src/
├── main.tsx, App.tsx, index.css
│       Bootstrap, router, global Tailwind styles
├── components/
│   ├── layout/               Sidebar, Topbar, Layout, PageHeader
│   ├── ui/                   Modal, Toast, Card, StatCard, Toggle, Skeleton  (primitives)
│   ├── widgets/              Feature widgets (LivePowerCard, AlertsList,
│   │                         CommandPalette, AddDeviceWizard, HelpSupportPanel,
│   │                         SettingsPanel, LiveClock, …)
│   └── AppShell.tsx          Provider that owns global modal stack + toast tray
├── pages/                    Dashboard, EnergySaving, Utilisation, SmartHome
├── hooks/                    useApi, useRealtime, useSettings, useToast, useAppShell
├── services/                 HomeApi.ts + index.ts + mock/ + http/
├── types/                    Domain model (the single source of truth)
└── utils/                    Formatters (currency, kWh, time, etc.)
```

```text
                                  ┌──────────────────────────┐
                                  │  Pages / Widgets / Hooks │
                                  └────────────┬─────────────┘
                                               │  imports `api` from "@/services"
                                               ▼
                                  ┌──────────────────────────┐
                                  │   HomeApi   (interface)  │
                                  └────────────┬─────────────┘
                              VITE_USE_MOCK    │
                          ┌────true────────────┴────────────false──────┐
                          ▼                                             ▼
                ┌─────────────────────┐                       ┌──────────────────────┐
                │   MockHomeApi       │                       │   HttpHomeApi        │
                │   in-memory + tick  │                       │   fetch + WebSocket  │
                └─────────────────────┘                       └──────────────────────┘
```

The **adapter swap is the central seam**. Components, hooks and pages do not know which adapter is live — they just call methods on the typed `HomeApi`.

---

## 3 · Backend contract

Every method on `HomeApi` (see [`src/services/HomeApi.ts`](../src/services/HomeApi.ts)) corresponds 1:1 to a backend endpoint. The HTTP adapter ([`src/services/http/HttpHomeApi.ts`](../src/services/http/HttpHomeApi.ts)) is the canonical mapping.

### REST

| Method | Path                              | Returns / Body                     |
| ------ | --------------------------------- | ---------------------------------- |
| GET    | `/household`                      | `Household`                        |
| GET    | `/dashboard/summary`              | `DashboardSummary`                 |
| GET    | `/dashboard/activity?limit=20`    | `ActivityEvent[]`                  |
| GET    | `/alerts`                         | `AlertItem[]`                      |
| POST   | `/alerts/:id/ack`                 | `204 No Content`                   |
| GET    | `/rooms`                          | `Room[]`                           |
| GET    | `/devices?roomId=…`               | `Device[]`                         |
| GET    | `/devices/:id`                    | `Device`                           |
| POST   | `/devices/:id/power`              | body: `{ on: boolean }` → `Device` |
| POST   | `/devices/:id/level`              | body: `{ level: number }` → `Device` |
| POST   | `/devices`                        | body: `NewDeviceInput` → `Device`  |
| GET    | `/scenes`                         | `Scene[]`                          |
| POST   | `/scenes/:id/activate`            | `Scene`                            |
| GET    | `/automations`                    | `Automation[]`                     |
| PATCH  | `/automations/:id`                | body: `{ enabled: boolean }` → `Automation` |
| GET    | `/energy/summary`                 | `EnergySummary`                    |
| GET    | `/energy/series?range=today\|week\|month\|year` | `EnergySample[]`         |
| GET    | `/energy/breakdown`               | `EnergyBreakdown[]`                |
| GET    | `/energy/tips`                    | `EnergyTip[]`                      |
| POST   | `/energy/tips/:id/apply`          | `EnergyTip`                        |
| GET    | `/utilisation/devices`            | `DeviceUtilisation[]`              |
| GET    | `/utilisation/rooms`              | `RoomUtilisation[]`                |
| GET    | `/utilisation/heatmap`            | `UtilisationHeatmap` (`number[7][24]`) |

All payload shapes are defined in [`src/types/index.ts`](../src/types/index.ts). Hand that file to the backend team — no other coordination needed.

### WebSocket realtime stream

The adapter opens a single connection to `VITE_WS_URL` and expects newline-free JSON frames matching the `RealtimeEvent` discriminated union:

```ts
{ type: "device.update";  device: Device }
{ type: "energy.tick";    sample: EnergySample; currentPowerW: number }
{ type: "alert.new";      alert: AlertItem }
{ type: "activity.new";   event: ActivityEvent }
```

Reconnection with exponential backoff is built in (see `HttpHomeApi.ensureSocket`).
The mock adapter emits exactly the same events on a 3-second timer so the UI behaves identically in both modes.

---

## 4 · Cross-cutting infrastructure

These are deliberately small primitives that any page can opt into.

### `AppShell` (`src/components/AppShell.tsx`)

Wraps the whole app in a Context that owns the open-state of every global modal:

- Command palette
- Add Device wizard
- Help & Support panel
- Settings panel

Plus a global keyboard listener for **Cmd/Ctrl + K** and **/** to open search. Components access it through `useAppShell()` from `@/hooks/useAppShell`:

```ts
const shell = useAppShell();
shell.openSearch();
shell.openSettings("notifications");
shell.openHelp("chat");
```

The hook lives in its own file (`src/hooks/useAppShell.ts`) so React Fast Refresh stays happy.

### `useSettings` (`src/hooks/useSettings.ts`)

Typed, namespaced store backed by `localStorage` under the key `babcom.settings.v1`. Survives reloads, deep-merges with defaults so older saved blobs forward-migrate cleanly, and broadcasts changes via a tiny pub/sub so any component subscribing to `useSettings()` rerenders instantly.

Sections: `profile`, `household`, `notifications`, `energy`, `privacy`, `appearance`, `region`, `voiceAssistants`, `security`. See the `Settings` type for the full shape.

### `useToast` + `Toast` (`src/hooks/useToast.ts`, `src/components/ui/Toast.tsx`)

Pub/sub toast queue. Anywhere in the codebase:

```ts
import { toast } from "@/hooks/useToast";
toast.success("Device added", "Living • Ceiling Light");
toast.error("Pairing failed", "Could not contact hub");
```

The `<ToastTray>` lives in `AppShell` and renders the queue.

### `Modal` (`src/components/ui/Modal.tsx`)

A11y-correct modal primitive: Esc to close, body scroll-lock, backdrop-click-close, optional initial-focus selector, sized presets (`sm | md | lg | xl | full`), and `bare`/`padded` modes for layouts that own their own chrome.

### `useApi` and `useRealtime`

The two thin hooks every page uses:

- `useApi(fn, deps)` — wraps a promise-returning call with `data / loading / error / refresh / setData`.
- `useRealtime(handler)` — subscribes to the active adapter’s realtime stream for the lifetime of the component.

---

## 5 · Theming & styling

- **Brand colour:** `brand-500 = #14587F`. Shades 50–900 generated in `tailwind.config.js`.
- **Font:** Montserrat (Google Fonts), `weight 700` for all headings.
- **Surfaces:** `surface`, `surface-muted`, `surface-sunken` (3-step neutral ramp).
- **Accents:** `accent-green`, `accent-amber`, `accent-red`, `accent-violet` for state/severity.
- **Custom utilities** (`src/index.css`):
  - `.btn`, `.btn-primary`, `.btn-soft`, `.btn-ghost` — button presets.
  - `.chip` — small pill for status badges.
  - `.input` — form-field with focus ring + custom select chevron.
  - `.nav-item` / `.nav-item.active` — sidebar/menu items.
  - Animations: `live-pulse`, `fadeIn`, `slideUp`, `typingBlink`.

---

## 6 · Build, dev and CI

| Command          | What it does                                                            |
| ---------------- | ----------------------------------------------------------------------- |
| `npm install`    | Reproducible install via `package-lock.json`.                           |
| `npm run dev`    | Vite dev server on `http://localhost:5173`, HMR enabled.                |
| `npm run build`  | `tsc --noEmit` (strict type-check) → `vite build` (production bundle). |
| `npm run preview`| Serve the built `dist/` locally for a final once-over.                  |
| `npm run lint`   | ESLint over `.ts` and `.tsx`.                                           |

Continuous integration (`.github/workflows/ci.yml`) runs `npm ci`, `npm audit --omit=dev --audit-level=high` and `npm run build` on every push and PR.

For deployment configs see [`DEPLOYMENT.md`](./DEPLOYMENT.md).
For the threat model see [`SECURITY.md`](./SECURITY.md).

---

## 7 · Choices and trade-offs

| Decision                                          | Why                                                                                 |
| ------------------------------------------------- | ------------------------------------------------------------------------------------ |
| One typed `HomeApi`, two impls                    | Lets the UI ship and demo end-to-end before any backend exists, with no UI rewrite. |
| Mock emits the *same* WS events                   | The realtime path is exercised in dev, not just stubbed.                            |
| `useSettings` in `localStorage`                   | No backend dependency for personalisation; survives offline. Server sync later.     |
| Tailwind, no UI library                           | Tiny bundle, full design control, no theme-fight.                                   |
| Recharts                                          | Best “good-enough out of the box” charting on top of D3.                            |
| React Router (history mode)                       | Standard SPA routing; deploy hosts handle the fallback (see DEPLOYMENT.md §2).      |
| No global state library (Redux/Zustand)           | Hooks + a couple of pub/sub stores cover everything we need.                        |
| Modal stack in a context, not a portal manager    | One file, easy to reason about, and exactly enough for our needs.                   |
