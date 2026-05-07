# Roadmap & known limitations

The dashboard is demo-ready and end-to-end functional today. This file lists the work needed to take it from “great demo” to “production” and the limitations to be aware of meanwhile.

Items are tagged: **[P0]** must-have for v1, **[P1]** important for v1.x, **[P2]** nice-to-have.

---

## 1 · Backend & APIs

- [ ] **[P0]** Stand up the REST endpoints listed in [`docs/ARCHITECTURE.md §3`](./ARCHITECTURE.md#3--backend-contract). Shapes are codified in `src/types/index.ts`.
- [ ] **[P0]** Stand up the WebSocket endpoint emitting `RealtimeEvent` frames.
- [ ] **[P0]** Auth: wire OAuth/JWT through `src/services/http/httpClient.ts` (token refresh, 401 retry, sign-out on revoke).
- [ ] **[P1]** Multi-tenant household scoping (`X-Household-Id` header or sub-path).
- [ ] **[P1]** Rate-limiting and idempotency keys on POST endpoints (`/devices`, `/scenes/:id/activate`).
- [ ] **[P2]** Versioned API (`/v1`, `/v2`); deprecate via response header.

## 2 · Onboarding flows

- [ ] **[P0]** Real device discovery: BLE pairing on the hub side, mDNS/SSDP on Wi-Fi.
- [ ] **[P0]** QR codes that actually scan (use the camera; today the wizard simulates).
- [ ] **[P1]** Hub onboarding (the “first 5 minutes”): hub setup, Wi-Fi credentials, household creation, member invitation.
- [ ] **[P2]** Bulk import (CSV / Matter Bridge).

## 3 · Authentication, accounts & permissions

- [ ] **[P0]** Sign-in / sign-up screens. The current avatar is decorative.
- [ ] **[P0]** Role-based access control: `owner | family | guest`. The data model exists; UI gating does not.
- [ ] **[P1]** 2FA enrolment flow (TOTP / WebAuthn). Settings → Security shows the toggle but the enrolment journey is missing.
- [ ] **[P1]** Active-session management (currently mocked text in Settings → Security).
- [ ] **[P2]** SSO (Google / Apple / Microsoft).

## 4 · Notifications

- [ ] **[P0]** Push channel: register service worker + Web Push, store subscription server-side.
- [ ] **[P0]** Email channel: transactional templates (lock, geyser-left-on, budget breach).
- [ ] **[P1]** SMS channel via your local provider.
- [ ] **[P1]** Quiet hours actually applied at the server (today it’s a stored preference).

## 5 · Energy

- [ ] **[P1]** Real-time meter integration (Wi-Fi smart meter or Modbus-over-IP gateway).
- [ ] **[P1]** TOU / slab tariff calculator (the `peakStart/peakEnd` fields exist but don’t modulate cost yet).
- [ ] **[P1]** Solar / battery dashboard (export, self-consumption, SoC).
- [ ] **[P2]** Anomaly detection (“geyser left on”, “fridge consuming 40 % more than baseline”). Seed data already models the “Eco AC saved 1.4 kWh” concept.

## 6 · Automations & scenes

- [ ] **[P0]** Scene editor (today scenes are read-only, activated only).
- [ ] **[P0]** Automation editor: trigger types (time, sunrise/sunset, motion, geofence, sensor threshold), action chains, day-of-week filters.
- [ ] **[P1]** Scene preview / dry-run.
- [ ] **[P2]** Conflict detection (two automations targeting the same device).

## 7 · Mobile

- [ ] **[P0]** PWA: web manifest, service worker, install prompt.
- [ ] **[P1]** Native shells (Capacitor or React Native) for biometric unlock and reliable push.

## 8 · Voice assistants

- [ ] **[P1]** Real OAuth flows for Alexa / Google. Today the Settings toggles are local only.
- [ ] **[P1]** Skill / Action manifest (intents, slot types, samples).
- [ ] **[P2]** Apple HomeKit bridge (Matter is the modern path).

## 9 · Help & Support

- [ ] **[P0]** Real ticketing backend (today it generates a ticket ID locally and shows a toast). Recommend Freshdesk / Zendesk / Crisp / a tiny custom one.
- [ ] **[P1]** Live agent handoff (the bot already simulates the queue). Hook into Intercom, Crisp or your in-house support tool.
- [ ] **[P1]** Replace the keyword-routed bot with a real LLM (RAG over the FAQ + device telemetry would be a strong fit).
- [ ] **[P2]** Localised FAQ (Hindi, Tamil, Arabic — Settings → Region already exposes the languages).

## 10 · Internationalisation

- [ ] **[P1]** Plug in `react-intl` or `i18next` and externalise strings. The Settings panel already lets the user pick a language.
- [ ] **[P1]** RTL layout for `ar-AE`.

## 11 · Accessibility

- [ ] **[P0]** Audit with axe / Lighthouse: aim for 100 on accessibility. Modal focus-trap is basic — strengthen it (focus cycle, return focus on close).
- [ ] **[P1]** Reduced-motion respects (`prefers-reduced-motion`).
- [ ] **[P1]** Higher-contrast mode toggle (Settings → Appearance is the right home).

## 12 · Performance

- [ ] **[P1]** Code-split the four pages and the modals (`React.lazy`); the production bundle is currently ~1.5 MB / 343 KB gzip in one chunk.
- [ ] **[P1]** Pre-compute Tailwind safelist; consider migrating to Tailwind v4 once stable APIs settle.
- [ ] **[P2]** Image asset pipeline (Babcom logo PNG falls back to SVG today; add a real raster pipeline once we have product photos).

## 13 · Testing

- [ ] **[P0]** Vitest + React Testing Library: unit tests for `useSettings`, the toast store, the command-palette ranker, and `MockHomeApi`.
- [ ] **[P0]** Playwright: smoke E2E covering the four pages, the search palette, the Add Device flow, the bot chat.
- [ ] **[P1]** Visual regression with Percy or Chromatic on a Storybook of the primitives.

## 14 · Observability

- [ ] **[P1]** Front-end error reporting (Sentry / Rollbar) — the `httpClient` already throws typed errors.
- [ ] **[P1]** Anonymised analytics behind the existing `privacy.shareUsageStats` toggle.
- [ ] **[P2]** Real-user-monitoring of the live-power chart loop (we already use `requestAnimationFrame`-friendly timings).

## 15 · Branding

- [ ] **[P0]** Drop the official Babcom logo into `public/babcom-logo-black.svg` (PNG path documented in [`README.md`](../README.md)).
- [ ] **[P1]** Favicon set (16/32/180/512) plus PWA icons.

---

## Known limitations of the current build

- All data is in-memory by default (`VITE_USE_MOCK=true`). State resets on a hard reload — *except* user-preferences in Settings, which persist via `localStorage`.
- Dark mode is selectable but currently renders as the light theme. Token plumbing is in place; full dark theme is on the roadmap.
- The bot in Help & Support uses keyword routing — friendly and useful, but not a real LLM.
- `Sign out` is a UI-only action: there is no auth state to clear.
- The “Active sessions” block in Settings → Security is illustrative.

> All of the above are deliberate scope cuts, not bugs. Each has its own line item above.
