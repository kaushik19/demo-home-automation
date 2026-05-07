# Babcom Home Automation

A demoable, production-ready React + TypeScript dashboard for a Smart Home / IoT platform. Mocked end-to-end today — flip one env flag and it goes live tomorrow.

> **Status:** demo-ready. Build is green, dependency audit is clean (0 vulnerabilities), and four free hosting paths are pre-configured.

---

## Features

- **Four pages, fully wired:** Dashboard, Energy Saving, Utilisation, Smart Home.
- **Live everything (mock or real):** power-draw chart, device states, activity feed, alerts — all stream over a `RealtimeEvent` channel that the mock and HTTP adapters share.
- **Global search palette** (Cmd/Ctrl + K) — devices, rooms, scenes, automations, alerts, pages and quick actions, with inline toggles and scene activation.
- **Add Device wizard** — Auto-discover / QR / Manual flows with simulated discovery and pairing, persists into the active adapter.
- **Live wall clock** on the Dashboard, honouring the user’s timezone, locale and 12 h/24 h preference.
- **Help & Support modal** — searchable Babcom FAQ, contact channels, ticket form, and a live bot chat with keyword routing and a simulated human-agent queue.
- **Full Settings panel** — profile, household & members, notifications, energy & tariff, privacy, appearance, language & region, voice assistants, security, about. Persists to `localStorage` and is reflected app-wide instantly.

A 90-second walkthrough is in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Quick start

> Prerequisite: Node.js 20 (the repo ships `.nvmrc` and `.node-version`).

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. The “Mock mode” chip in the topbar tells you the app is running on in-memory data.

| Command            | What it does                                          |
| ------------------ | ----------------------------------------------------- |
| `npm run dev`      | Vite dev server with HMR                              |
| `npm run build`    | `tsc --noEmit` + production bundle into `dist/`       |
| `npm run preview`  | Serve the built bundle locally                        |
| `npm run lint`     | ESLint over `.ts` and `.tsx`                          |

---

## Going live (real backend)

Copy `.env.example` to `.env` and flip the switch:

```env
VITE_USE_MOCK=false
VITE_API_BASE_URL=https://your-iot-api.example.com/v1
VITE_WS_URL=wss://your-iot-api.example.com/v1/realtime
VITE_API_TOKEN=eyJhbGciOi...
```

That’s it. Components don’t change. The full HTTP + WebSocket contract is documented in [`docs/ARCHITECTURE.md §3`](docs/ARCHITECTURE.md#3--backend-contract); payload shapes are codified in [`src/types/index.ts`](src/types/index.ts) — the single source of truth for both sides.

---

## Deploy free

Pre-configured for four free static hosts (each tested with the SPA fallback + security headers):

- **Vercel** — drop-in via [`vercel.json`](vercel.json)
- **Netlify** — drop-in via [`netlify.toml`](netlify.toml)
- **Cloudflare Pages** — via [`public/_headers`](public/_headers) and [`public/_redirects`](public/_redirects)
- **GitHub Pages** — automated via [`.github/workflows/deploy-gh-pages.yml`](.github/workflows/deploy-gh-pages.yml)

Step-by-step instructions, custom domains, env variables, rollbacks and a pre-deploy security checklist are in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

---

## Documentation

| Document                                          | What it covers                                              |
| ------------------------------------------------- | ----------------------------------------------------------- |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)        | Pushing to a new GitHub repo + deploying to Vercel/Netlify/Cloudflare/GitHub Pages |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)    | High-level layout, the `HomeApi` seam, backend contract     |
| [`docs/TODO.md`](docs/TODO.md)                    | Roadmap, P0/P1/P2 priorities, known limitations             |
| [`docs/SECURITY.md`](docs/SECURITY.md)            | Threat model, security headers, audit and reporting policy  |

---

## Project layout

```text
src/
├── main.tsx, App.tsx, index.css     bootstrap, router, global styles
├── components/
│   ├── layout/                      Sidebar, Topbar, Layout, PageHeader
│   ├── ui/                          Modal, Toast, Card, StatCard, Toggle, Skeleton
│   ├── widgets/                     LivePowerCard, ActivityFeed, AlertsList,
│   │                                QuickScenes, DeviceCard, AutomationsList, Heatmap,
│   │                                LiveClock, CommandPalette, AddDeviceWizard,
│   │                                HelpSupportPanel, SettingsPanel
│   └── AppShell.tsx                 Modal stack + toast tray provider
├── pages/                           Dashboard, EnergySaving, Utilisation, SmartHome
├── hooks/                           useApi, useRealtime, useAppShell, useSettings, useToast
├── services/                        HomeApi.ts + index.ts + mock/ + http/
├── types/                           Domain model (single source of truth)
└── utils/                           Formatters
```

---

## Theme & branding

- **Brand colour:** `brand-500 = #14587F` (heading colour, primary CTAs, brand surfaces). Shades 50–900 pre-generated in [`tailwind.config.js`](tailwind.config.js).
- **Font:** Montserrat (300/400/500/600/700/800), served from Google Fonts.
- **Logo drop-in:** replace [`public/babcom-logo-black.svg`](public/babcom-logo-black.svg) with your asset (SVG preferred). For a PNG, drop `public/babcom-logo-black.png` and update the two `<img src>` lines in `Sidebar.tsx` and `Topbar.tsx`.

---

## Security

- `npm audit --omit=dev`: **0 vulnerabilities**.
- `npm audit` (full graph): **0 vulnerabilities**.
- No `dangerouslySetInnerHTML`, no `eval`, no `Function()`, no hard-coded secrets.
- CI runs `npm audit --omit=dev --audit-level=high` on every push and PR.
- All deploy configs ship with HSTS, `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` and one-year immutable caching for hashed assets.

Full details: [`docs/SECURITY.md`](docs/SECURITY.md).

---

## License

This codebase is internal-use; add a `LICENSE` file before open-sourcing. A permissive default is the MIT license.
