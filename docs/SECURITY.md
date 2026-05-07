# Security

This document explains the threat model, the audited state of dependencies, the secure-by-default deploy configuration, and how to report a vulnerability.

---

## 1 · Current security posture

| Check                                                      | Status            |
| ---------------------------------------------------------- | ----------------- |
| `npm audit --omit=dev` (production deps)                   | **0 vulnerabilities** |
| `npm audit` (full graph, including dev tools)              | **0 vulnerabilities** |
| Hard-coded secrets, API keys or tokens in source           | **None**          |
| `eval`, `new Function`, `document.write`, `innerHTML =`    | **Not used**      |
| `dangerouslySetInnerHTML`                                  | **Not used**      |
| User-supplied HTML rendered as markup                      | **Never** — React escapes everything by default |
| Reproducible installs                                      | `package-lock.json` committed; CI uses `npm ci` |
| CI security gate                                           | `.github/workflows/ci.yml` runs `npm audit --omit=dev --audit-level=high` |

Re-run the audit any time:

```bash
npm audit --omit=dev --audit-level=high
npm audit
```

---

## 2 · Hardened defaults shipped with the deploy configs

Each platform config in this repo sets the same security headers on every response:

| Header                          | Value                                                            | Why                                          |
| ------------------------------- | ---------------------------------------------------------------- | -------------------------------------------- |
| `Strict-Transport-Security`     | `max-age=63072000; includeSubDomains; preload`                  | Forces HTTPS for two years, including subdomains. |
| `X-Content-Type-Options`        | `nosniff`                                                        | Prevents MIME confusion attacks.             |
| `X-Frame-Options`               | `DENY`                                                           | Defends against clickjacking.                |
| `Referrer-Policy`               | `strict-origin-when-cross-origin`                                | Doesn’t leak full URLs cross-origin.         |
| `Permissions-Policy`            | `camera=(), microphone=(), geolocation=()`                       | Disables sensitive APIs by default.          |
| `Cache-Control` (`/assets/*`)   | `public, max-age=31536000, immutable`                            | One-year cache on hashed bundles.            |

Set in:

- [`vercel.json`](../vercel.json)
- [`netlify.toml`](../netlify.toml)
- [`public/_headers`](../public/_headers)

> **Adding a Content Security Policy (CSP):** the app today has no inline scripts, but the index page does load Google Fonts. A starter CSP that fits is:
>
> ```http
> Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https: wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
> ```
>
> Add it to your platform header config once you’ve confirmed it doesn’t break the live backend connection (`connect-src` may need narrowing to your API domain).

---

## 3 · Threat model

### What we defend against

- **Cross-site scripting (XSS).** React escapes all rendered values by default; the codebase uses no `dangerouslySetInnerHTML`. Settings, search input, and chat messages are all rendered as text, not HTML.
- **Clickjacking.** `X-Frame-Options: DENY`.
- **MIME confusion.** `X-Content-Type-Options: nosniff`.
- **Mixed content / TLS downgrade.** `Strict-Transport-Security` (and host-level HTTPS).
- **Dependency CVEs.** Production audit gate in CI.
- **Secret leakage.** `.gitignore` excludes `.env*`, `*.pem`, `*.key`, `*.crt`. CI installs from `package-lock.json` only.

### What is out of scope (today)

- **Authentication and session management.** The dashboard ships with no auth. Add sign-in / OAuth before exposing it to the public internet with a real backend. See [`docs/TODO.md §3`](./TODO.md#3--authentication-accounts--permissions).
- **Server-side authorisation.** All user-level access control is the backend’s responsibility — UI-only checks are not security.
- **Anti-CSRF.** Once auth is added, prefer cookie-less Bearer tokens *or* same-site cookies + a `X-CSRF-Token` header.
- **DDoS / WAF.** Provided by Vercel / Netlify / Cloudflare at the edge for free; deeper protection is platform-paid.

---

## 4 · Environment variables and secrets

The dashboard is fully static and runs in the browser — there is **no “server-side secret”** in this codebase.

`VITE_*` env vars are inlined into the bundle at build time, so:

- ✅ Safe to expose: `VITE_API_BASE_URL`, `VITE_WS_URL`, `VITE_USE_MOCK`. These are public configuration.
- ⚠️ Don’t put real secrets in `VITE_API_TOKEN` if the build artefact is publicly hosted. A signed-in user must obtain their own token from the auth flow; that token then lives in memory or `httpOnly` cookies, *not* in the bundle.

If your backend ever needs a server-only secret (e.g., to mint short-lived tokens), put a thin proxy in front (Cloudflare Workers, Vercel Functions, etc.) and never embed the secret in `VITE_*`.

---

## 5 · Privacy

The product surfaces this user-facing too (Settings → Privacy):

- Anonymised usage statistics — opt-in / opt-out.
- Cloud voice transcription — **off by default**. Voice stays on-device unless explicitly enabled.
- Location services — used for geofencing automations only.
- Camera notifications — opt-out.

For your jurisdiction’s data-protection rules, also publish:

- A privacy policy URL (linked from Settings → About).
- A data-export and account-deletion path.
- A subprocessor list (cloud, push, email, SMS providers).

---

## 6 · Reporting a vulnerability

If you find a security issue, please **do not** open a public issue. Instead:

- Email **security@babcom.in** with steps to reproduce.
- We aim to acknowledge within 24 hours and to provide a timeline within 72 hours.
- We disclose responsibly and credit researchers in release notes if requested.

---

## 7 · Maintenance checklist

- [ ] Run `npm audit` weekly (CI does it on every push).
- [ ] Renew TLS certificates — automatic on all four supported hosts.
- [ ] Review the Permissions-Policy after every new feature that needs a sensitive API.
- [ ] Bump major framework versions on a quarterly cadence; smoke test with `npm run build` and the Playwright suite (once it lands — see [`docs/TODO.md §13`](./TODO.md#13--testing)).
- [ ] Re-run the secret scan before every public release:

  ```bash
  git ls-files | Select-String -Pattern "\\.env(\\.|$)|\\.pem$|\\.key$|\\.crt$"
  Select-String -Path "dist\\assets\\*.js" -Pattern "(?i)(api[_-]?key|secret|password|bearer)"
  ```
