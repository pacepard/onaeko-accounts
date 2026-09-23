# Onaeko Accounts

Academy pack: see `.academy/` (prompt-plan, idea, specs). Auth lives here; Learn/Website/Admin do not add login screens.

Vite + React + TypeScript app for **accounts.onaeko.com** — authentication, onboarding, and account settings for Onaeko products.

Local default: [http://localhost:5401](http://localhost:5401)

## Stack

- [Vite](https://vite.dev/guide/) 7
- React 19
- TypeScript
- React Router 7
- [`@onaeko/ui`](https://www.npmjs.com/package/@onaeko/ui) (npm `^0.3.0`)
- react-hook-form + zod + `@hookform/resolvers`
- axios

## Prerequisites

- Node `20.x`
- pnpm `9.15.4` (see `packageManager` in `package.json`)
- Onaeko API running locally (default in `.env`: `http://localhost:5015/api/v1`)

## Setup

```bash
cd onaeko-accounts
pnpm install
cp .env.example .env.local   # optional; edit URLs as needed
pnpm dev
```

Open **http://localhost:5401**.

### Environment

| Variable | Purpose | Example |
| --- | --- | --- |
| `VITE_APP_API_URL` | Backend API base URL | `http://localhost:5015/api/v1` |
| `VITE_APP_URL` | This app’s public origin (callbacks) | `http://localhost:5401` |
| `VITE_ENVIRONMENT` | Runtime env label | `local` / `development` / `staging` / `production` |
| `VITE_APP_ENVIRONMENT` | Analytics flag (`prod` turns PostHog/Sentry on) | `dev` locally |
| `VITE_LEARN_URL` | Learn origin for continue allowlist | `http://localhost:5402` |
| `VITE_WEBSITE_URL` | Website origin for continue allowlist | `http://localhost:3020` |
| `VITE_USE_MOCKS` | Local mock rail only. Leave unset for real API. | never on staging/prod |

## Deploy on Vercel

1. Import the `onaeko-accounts` GitHub repo as a new Vercel project (root = repo root).
2. Framework Preset: **Vite** (or leave auto — `vercel.json` sets `framework`, `buildCommand`, `outputDirectory`).
3. Add env vars from `.env.example` (Production / Preview as needed). Values are baked in at **build** time.
4. Deploy. Client routes (`/login`, `/account/*`, …) rewrite to `/index.html` via `vercel.json`.

Coolify/Docker can be added later; this repo is Vercel-first for now.

## Scripts

| Script | Description |
| --- | --- |
| `pnpm dev` | Dev server on **port 5401** (`--strictPort`) |
| `pnpm build` | Production Vite build (`dist/`) |
| `pnpm preview` | Preview production build on **port 5401** |
| `pnpm typecheck` | `tsc -b` only (legacy util types may still fail) |
| `pnpm lint` | Oxlint |
| `pnpm format` / `pnpm format:check` | Prettier |

Ports are set in both `package.json` scripts and `vite.config.ts` so Learn (default `5173`) and Accounts (`5401`) can run side by side.

## Project layout

```text
src/
  app/           # Route pages (auth screens, Error)
  api/           # Axios client + ApiPath + Auth/User/Account APIs
  components/    # Layouts + base UI (auth forms, loaders)
  context/       # App / user React context
  dtos/          # Request/response types
  hooks/         # App and shared hooks
  routes/        # RouteURL (pages) + route tables
  services/      # storage, cookies, idempotent helpers
  utils/         # helpers, enums, onboarding routing
```

## Routing vs API paths

Keep these separate:

| Kind | File | Example | Used by |
| --- | --- | --- | --- |
| Browser routes | `src/routes/paths.ts` → `RouteURL` | `/login`, `/account/profile` | `<Route>`, `navigate()`, `<Link>` |
| Backend paths | `src/api/paths.ts` → `ApiPath` | `/auth/login`, `/users/update-password` | `OnaekoAPI` / axios |
| Absolute callbacks | `RouteURL.regCallback` / `subCallback` | `${VITE_APP_URL}/verify` | OAuth / billing returns |

```ts
navigate(RouteURL.login);
await OnaekoAPI.auth.loginUser({ email, password }); // → ApiPath.login
```

API client: `src/api/base/config.ts` → `OnaekoAPI`.

### Auth pages (mounted)

| Page | Path |
| --- | --- |
| Login | `/login` |
| Register | `/register` |
| Activate account | `/activate-account` |
| Verify OTP | `/verify-otp` |
| Forgot password | `/forgot-password` |
| Reset password | `/reset-password` |

Defined on `RouteURL` but not all mounted yet: `/continue`, `/oauth/*`, onboarding (`/welcome`, …), and full `/account/*` settings tree. See `src/app/auth/README.md` and `src/routes/account.route.tsx`.

## Conventions

- Path alias: `@/*` → `src/*`
- Theme: `initTheme('system')` from `@onaeko/ui` in `App.tsx`
- Import UI from package entries (`@onaeko/ui`, `@onaeko/ui/button`, …), not `@onaeko/ui/components/...`
- Prefer `@/services/storage` and `@/utils/enums.util` over a missing `@onaeko/sdk` package
- Auth forms live under `src/components/base/auth`; pages under `src/app/auth` only compose layout + form

## Related apps

| App | Typical local URL |
| --- | --- |
| Accounts (this repo) | http://localhost:5401 |
| Learn | http://localhost:5173 (Vite default) |
| API | http://localhost:5015 |
