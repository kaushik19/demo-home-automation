# Deployment guide

Babcom Home Automation is a static, single-page React app produced by Vite.
Anything that can serve `dist/` over HTTPS will host it for free.

This guide walks through:

1. [Pushing to a new GitHub repo](#1--push-to-a-new-github-repo)
2. [Deploying free via the four major static hosts](#2--free-deployment-options)
3. [Going live against a real backend](#3--going-live-against-a-real-backend)
4. [Custom domains, environment variables and rollbacks](#4--custom-domains-environment-variables-and-rollbacks)
5. [Pre-deploy security checklist](#5--pre-deploy-security-checklist)

---

## 1 · Push to a new GitHub repo

> Run these from the project root: `E:\babcom\home_automation`

```powershell
# 1. Initialise git (first time only) and verify the working tree is clean
git init -b main
git status

# 2. Make sure no secrets sneak in
# .gitignore already excludes .env, .env.local, *.pem, *.key, etc.
# Quick sanity check:
git ls-files --others --exclude-standard | Select-String -Pattern "(\.env|\.pem|\.key|\.crt)$"
# If that prints anything, STOP and remove those files first.

# 3. Stage and commit
git add .
git commit -m "chore: initial Babcom Home Automation dashboard"

# 4. Create the empty repo on GitHub (UI: github.com/new) — choose:
#    • Repository name:  babcom-home-automation
#    • Visibility:       public OR private (your call)
#    • DO NOT add a README, .gitignore, or licence (we already have them)

# 5. Wire the local repo to GitHub and push
git remote add origin https://github.com/<your-username>/babcom-home-automation.git
git branch -M main
git push -u origin main
```

> Prefer SSH? Use `git@github.com:<your-username>/babcom-home-automation.git` instead.

> Prefer the GitHub CLI? `gh repo create babcom-home-automation --public --source=. --remote=origin --push` does steps 4 and 5 in one go.

The repo ships with two GitHub Actions:

- `.github/workflows/ci.yml` — runs `npm audit --omit=dev` and `npm run build` on every push and PR.
- `.github/workflows/deploy-gh-pages.yml` — builds and publishes to GitHub Pages on every push to `main`.

Both run automatically once the repo is on GitHub.

---

## 2 · Free deployment options

| Platform                | Best for                                | Free tier                              | Difficulty |
| ----------------------- | --------------------------------------- | -------------------------------------- | ---------- |
| **Vercel**              | Fastest Vite-native experience          | 100 GB bandwidth/month, unlimited sites| ★★☆☆☆ |
| **Netlify**             | Equally smooth, great DX                | 100 GB bandwidth/month, unlimited sites| ★★☆☆☆ |
| **Cloudflare Pages**    | Cheapest egress, fastest CDN            | Unlimited bandwidth, 500 builds/month  | ★★☆☆☆ |
| **GitHub Pages**        | Zero new accounts, lives next to source | 100 GB/month soft cap                  | ★★★☆☆ |

Pick **Vercel** if you want the smoothest path. Pick **Cloudflare Pages** if you expect serious traffic.
You can use multiple — they’re independent.

### 2.1 Vercel (recommended for fastest setup)

The repo already includes [`vercel.json`](../vercel.json) with SPA rewrites and security headers.

**Option A — UI (90 seconds):**

1. Sign in at [vercel.com](https://vercel.com) with GitHub.
2. Click **Add New… → Project** and import `babcom-home-automation`.
3. Framework preset auto-detects as **Vite**. Leave the defaults.
4. Click **Deploy**. You’ll get a URL like `babcom-home-automation.vercel.app`.

**Option B — CLI:**

```bash
npm i -g vercel
vercel login
vercel              # first run links the local repo to a Vercel project
vercel --prod       # promote to production
```

Every push to `main` re-deploys automatically once the project is linked.

### 2.2 Netlify

The repo includes [`netlify.toml`](../netlify.toml) and `public/_redirects`.

**Option A — UI:**

1. Sign in at [netlify.com](https://netlify.com) with GitHub.
2. **Add new site → Import an existing project → GitHub** → pick the repo.
3. Build command (auto-detected): `npm run build` · Publish directory: `dist`.
4. **Deploy site**. You’ll get `<random>.netlify.app`.

**Option B — CLI:**

```bash
npm i -g netlify-cli
netlify login
netlify init        # picks up netlify.toml
netlify deploy --prod
```

### 2.3 Cloudflare Pages

The `public/_headers` and `public/_redirects` files already configure SPA fallback and CSP.

1. Sign in at [pages.cloudflare.com](https://pages.cloudflare.com).
2. **Create a project → Connect to Git → GitHub** → pick the repo.
3. Build command: `npm run build` · Build output directory: `dist` · Node version: `20`.
4. **Save and Deploy**. You’ll get `<project>.pages.dev`.

### 2.4 GitHub Pages (zero external accounts)

The included `.github/workflows/deploy-gh-pages.yml` does everything for you.

**One-time setup on GitHub:**

1. Push the repo (see §1).
2. **Settings → Pages → Build and deployment → Source:** select **GitHub Actions**.
3. Push any commit to `main`. The workflow runs and publishes to `https://<your-username>.github.io/babcom-home-automation/`.

How it works:

- The workflow sets `VITE_BASE=/babcom-home-automation/` so all asset URLs are correct under the sub-path.
- It copies `dist/index.html` to `dist/404.html` so deep links like `/energy` work (Pages serves 404.html which then lets React Router take over client-side).

---

## 3 · Going live against a real backend

Out of the box the app runs in **mock mode** — every chart, KPI, device toggle, scene activation and the live-power graph is in-memory.

To switch to a real backend, set the four env vars at deploy time:

| Variable             | Example                                        | Notes |
| -------------------- | ---------------------------------------------- | ----- |
| `VITE_USE_MOCK`      | `false`                                        | Flips the switch in `src/services/index.ts`. |
| `VITE_API_BASE_URL`  | `https://iot-api.example.com/v1`               | Used by `src/services/http/HttpHomeApi.ts`. |
| `VITE_WS_URL`        | `wss://iot-api.example.com/v1/realtime`        | WebSocket endpoint emitting `RealtimeEvent` frames. |
| `VITE_API_TOKEN`     | `eyJhbGciOi…`                                  | Optional Bearer token. Leave blank to use cookie/CORS auth. |

These are **build-time** vars (Vite inlines them at build time, not runtime).
Anywhere you set them, redeploy after changing.

### Where to set them

| Platform        | Where                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------- |
| Vercel          | Project → Settings → **Environment Variables** (Production / Preview / Development)            |
| Netlify         | Site → Settings → **Environment variables**                                                    |
| Cloudflare Pages| Project → Settings → **Environment variables (production)**                                    |
| GitHub Pages    | Repo → Settings → **Secrets and variables → Actions → Variables** + reference in workflow      |

### Endpoint contract

Your backend must implement the routes documented in [`docs/ARCHITECTURE.md §3`](./ARCHITECTURE.md#3--backend-contract) — the same shapes are codified in `src/types/index.ts`, which is the single source of truth.

---

## 4 · Custom domains, environment variables and rollbacks

### Custom domain (HTTPS, free everywhere)

| Platform        | Steps                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------- |
| Vercel          | Project → Settings → **Domains** → add `home.babcom.in` → follow the DNS instructions.          |
| Netlify         | Site → **Domain management** → **Add custom domain**.                                          |
| Cloudflare Pages| Project → **Custom domains** → **Set up a custom domain**.                                     |
| GitHub Pages    | Repo → Settings → **Pages → Custom domain**, then add a `CNAME` DNS record at your registrar.   |

All four issue Let’s Encrypt TLS certificates automatically.

### Rollback

| Platform        | How                                                            |
| --------------- | -------------------------------------------------------------- |
| Vercel          | Deployments tab → **Promote to Production** on any prior build  |
| Netlify         | Deploys tab → **Publish deploy** on any prior build             |
| Cloudflare Pages| Deployments tab → **Rollback** on any prior build               |
| GitHub Pages    | `git revert <bad-sha> && git push` — workflow re-runs           |

---

## 5 · Pre-deploy security checklist

> Run through this list before the first public deploy.

```bash
# 1. Production-only audit must report 0 vulnerabilities
npm audit --omit=dev --audit-level=high
# Expected: "found 0 vulnerabilities"

# 2. Full audit including dev deps
npm audit
# Expected: "found 0 vulnerabilities" (or only low-severity dev-only findings you've reviewed)

# 3. Confirm no secrets in tracked files
git ls-files | Select-String -Pattern "\\.env(\\.|$)|\\.pem$|\\.key$|\\.crt$|secrets?\\.json$"
# Expected: only ".env.example" should match (or nothing).

# 4. Type-check + build must succeed
npm run build
# Expected: "✓ built in …" with no errors.

# 5. Sanity check the produced bundle for accidental secret leaks
Select-String -Path "dist\\assets\\*.js" -Pattern "(?i)(api[_-]?key|secret|password|bearer|aws[_-]?(access|secret))" -SimpleMatch:$false
# Expected: no matches.
```

The repo also enforces three of these in CI on every push:

- `npm audit --omit=dev --audit-level=high` (CI fails on new high/critical CVEs).
- `npm ci` (reproducible install from `package-lock.json`).
- `npm run build` (type-check + production build).

For the deeper threat model and security headers we ship by default, see [`docs/SECURITY.md`](./SECURITY.md).
