# feat-0001: Dashboard shell — route map, sidebar, breadcrumbs

Normative contract for Onaeko Accounts **signed-in home**, **sidebar**, **Troott `NavBar`**, and **breadcrumbs**. Extends [PRODUCT.md](./PRODUCT.md). Implementation notes: [TECH.md](./TECH.md).

This file is the inventory. If PRODUCT and this file disagree, **this file wins** for labels, paths, route `element`s, and NavBar regions.

---

## 1. Purpose

1. **Which page is home?** `/my-account` renders `<Dashboard />` as the route `element`.
2. **Where can I go?** Sidebar destinations that exist as real routes.
3. **Where am I?** Troott `NavBar` → `TopNav` breadcrumbs from the URL + a static map.
4. **Who am I / session?** Troott `UserAvatar` in the same `NavBar`.

Public `/` (`base.route.tsx` `name: 'home'` + `redirect`) is **not** Dashboard.

---

## 2. Route elements (v1)

Do **not** add `getAppPages` / `pages.tsx`. Set each page as an explicit `element` on the route, same as login/register.

| `name` | `element` | User-visible path | Layout |
| ------ | --------- | ----------------- | ------ |
| `my-account` | `<Dashboard />` | `/my-account` | `DashboardLayout` (parent) |
| `profile` | `<Profile />` | `/my-account/profile` | same |
| `security` | `<Security />` | `/my-account/security` | same |
| `billing` | `<Billing />` | `/my-account/billing` | same |

**No `back` prop / Back control** on any of these (PRODUCT C17). Up-navigation is breadcrumbs only.

**Do not register** extra paths named `home` or `dashboard`. Public `/` stays `base.route.tsx` redirect → `/login`. Do **not** add `/dashboard`.

**Not dashboard-shell rows (keep existing `element` / `redirect`):**

| `name` | Path | Notes |
| ------ | ---- | ----- |
| `home` (public row) | `/` | `base.route.tsx` redirect → `/login`. Renderer uses `route.redirect` before `element`. |
| `login`, `register`, `verify-otp`, `activate-account`, `forgot-password`, `reset-password` | auth paths | `AuthLayout` inside those pages |
| `onboarding`, `onboard-*` | `/onboarding/**` | `OnboardingLayout` |
| `error` | `*` | `ErrorPage` |

### Public `/` vs authenticated `/` (order)

1. `base.route.tsx` `home` at `/` keeps `redirect: RouteURL.login` (always a `<Navigate>` for that route row).
2. When a **session exists**, `useAuth` (owned by `DashboardLayout` / auth pages that already call it) redirects `/` and `/login` → `/my-account` after the login page mounts (existing effect). Do **not** change the public row into a conditional Dashboard render in v1.
3. Result: logged-out `/` → login; logged-in hit on `/` or `/login` → `/my-account`.

### Layout mount model (v1)

**Troott-aligned nested shell:**

- Parent authenticated shell route(s) render `<DashboardLayout />` with **`<Outlet />`** in `#dashboard-body` (not a `component={…}` prop for page bodies).
- Child routes: `my-account` (index), `profile`, `security`, `billing` as **children** under that layout.
- Page components are **outlet elements only** — they never wrap `DashboardLayout`.

If the current flat `IRoute` list makes a single parent awkward, implement an equivalent: one layout wrapper in the renderer that still uses `<Outlet />` for children, or a dedicated `dashboard.route.tsx` parent (Troott `dashboard.route.tsx` pattern). **Do not** keep long-term `DashboardLayout({ component })` as the chrome API once NavBar lands.

### Deep `/my-account/*` URLs (v1)

Registered pages only: `/my-account`, `/my-account/profile`, `/my-account/security`, `/my-account/billing`.

Paths that exist on `paths.ts` but are **not** registered in v1 (`profile/edit`, `security/password`, `2fa`, `sessions`, billing children, `delete`, …):

- **Do not** add sidebar rows or placeholder pages for them in this feat.
- Hitting them → existing catch-all `*` → `<ErrorPage />` (same as any unknown path).
- Breadcrumb map may still list labels for those keys for a **later** feat; TopNav must not invent routes.

---

## 3. Sidebar inventory (v1)

Source of truth: [`src/routes/sidebar.route.ts`](../../../src/routes/sidebar.route.ts). UI titles below override the file if they still say `My account` after this feat — **update the file** to match.

### Tree → flat Main list

`sidebar.route.ts` may keep parent `my-account` + `subroutes`. **AppSidebar renders a flat Main group:**

| Order | Title | Path | Source |
| ----- | ----- | ---- | ------ |
| 1 | Home | `/my-account` | parent row (`name: 'my-account'`); UI title **Home** |
| 2 | Profile | `/my-account/profile` | subroute |
| 3 | Security | `/my-account/security` | subroute |
| 4 | Billing | `/my-account/billing` | subroute |

Do **not** render an expandable “My account” group that nests children in a second level for v1. Parent is the Home link; children are siblings.

Legend: **Active** = how the current URL highlights the row.

| ID | Title | Path | `name` | Active |
| -- | ----- | ---- | ------ | ------ |
| `nav.home` | Home | `/my-account` | `my-account` | exact after normalize (see §11) |
| `nav.profile` | Profile | `/my-account/profile` | `profile` | prefix `/my-account/profile` |
| `nav.security` | Security | `/my-account/security` | `security` | prefix `/my-account/security` |
| `nav.billing` | Billing | `/my-account/billing` | `billing` | prefix `/my-account/billing` |

**Header:** **`Logo`** (expanded) / **`LogoIcon`** (collapsed icon rail) from [`src/components/base/common/Logo.tsx`](../../../src/components/base/common/Logo.tsx) and [`LogoIcon.tsx`](../../../src/components/base/common/LogoIcon.tsx). Link wraps the mark → `/my-account`. Do **not** use plain “Onaeko Accounts” text as the header mark.

**Footer:** `Logout` → `useAuth().logout()` → `/login`. Do **not** navigate to `RouteURL.logout` (`/logout`) in v1 — that path is unused; ignore it.

**Order:** Home, Profile, Security, Billing.

**Roles:** all of `UserType` (`user`, `talent`, `business`, `admin`, `super`). No hidden rows in v1.

**Icons:** **text-only** Main items in v1 (no Lucide required on rows). Logo/LogoIcon cover brand only.

**Not in v1 sidebar:**

| Item | Reason |
| ---- | ------ |
| Learn, Pathfinder | Empty route modules |
| Sessions, 2FA, change password, invoices, payment methods, delete account | Paths exist on `paths.ts`; no pages yet — do not show until a later feat |
| Onaeko main Talent / Workspace / Product / Help / Admin | Wrong app |
| Troott Dashboard / Sermons / Analytics / Bin / Get Started | Wrong product |
| Quick Search / ⌘K | Troott feat-0028; not Accounts v1 |
| Install / footer marketing CTA | Troott-only |

---

## 4. Breadcrumb map (v1)

File: `src/_data/breadcrumb-map.ts`.

```ts
const BreadcrumbMap: Record<string, string> = {
    '/my-account': 'Home',
    '/my-account/profile': 'Profile',
    '/my-account/profile/edit': 'Edit',
    '/my-account/security': 'Security',
    '/my-account/security/password': 'Password',
    '/my-account/security/2fa': 'Two-factor',
    '/my-account/sessions': 'Sessions',
    '/my-account/billing': 'Billing',
    '/my-account/billing/subscriptions': 'Subscriptions',
    '/my-account/billing/payment-methods': 'Payment methods',
    '/my-account/billing/invoices': 'Invoices',
    '/my-account/delete': 'Delete account',
};
```

Deep keys (`password`, `2fa`, …) are **labels only** for when those routes exist. v1 **pages** are Home / Profile / Security / Billing. Unregistered deep URLs hit `ErrorPage` (§2); if somehow rendered, unmapped segments show raw (Troott fallback `pathParts[idx]`).

Normalize pathname before split/map (strip trailing `/` except root) — same as active-state (§11).

### Trails to implement and QA

| URL | Crumbs (linked → current) |
| --- | ------------------------- |
| `/my-account` | **Home** |
| `/my-account/profile` | Home → **Profile** |
| `/my-account/security` | Home → **Security** |
| `/my-account/billing` | Home → **Billing** |

Home crumb on child pages links to `/my-account`.

**Do not include:** `/dashboard`, `/login`, `/onboarding`, Troott `/studio/...`, Onaeko `/t`, `/b`, `/admin`.

---

## 5. Troott `NavBar` (v1)

Canonical implementation: Troott `apps/web/src/components/shared/navigation/NavBar.tsx` and its children. Mount like Troott `DashboardLayout.tsx`: **`NavBar` then `<main>`**, never inside scrolling main.

Accounts `src/components/base/navigation/TopBar.tsx` is **not** this bar.

### 5.1 Regions

```text
NavBar  h-14  full width  border-b  bg-background (Accounts tokens)
├── LEFT
│   ├── Trigger          SidebarTrigger; persist sidebar-collapsed
│   └── TopNav           Breadcrumbs (§4)
└── RIGHT
    ├── BellIcon         Lucide Bell; no href in v1
    ├── HelpCircleIcon   Lucide HelpCircle; no href in v1
    └── UserAvatar       dropdown (§5.2)
```

| Control | Troott source | Accounts v1 |
| ------- | ------------- | ----------- |
| `Trigger` | `Trigger.tsx` | Same: `useSidebar` + `storage.keep('sidebar-collapsed', String(!open))` |
| `TopNav` | `TopNav.tsx` | Same algorithm; Accounts `BreadcrumbMap`; `Link asChild` |
| Bell | `NavBar.tsx` `BellIcon` | Visible, **non-focusable**, `aria-hidden="true"` |
| Help | `NavBar.tsx` `HelpCircleIcon` | Visible, **non-focusable**, `aria-hidden="true"` |
| `UserAvatar` | `UserAvatar.tsx` | §5.2 |

**Do not port:** Troott `ActionNav.tsx` (empty). Troott `hideTopNav` / `bg-neutral-900`. Onaeko `TopBar` title and Back.

### 5.2 Avatar menu (decided)

| Label | Destination |
| ----- | ----------- |
| Profile | `/my-account/profile` |
| Security | `/my-account/security` (stand-in for Troott Settings) |
| Logout | `useAuth().logout()` → `/login` (not `RouteURL.logout`) |

Trigger: avatar image from user record, else initials / icon fallback. Not Troott’s hardcoded `https://github.com/shadcn.png`.

### 5.3 Always visible

On every `DashboardLayout` route in this feat (`/my-account`, `/my-account/profile`, `/my-account/security`, `/my-account/billing`). No canvas hide. **NavBar stays mounted** when the mobile sidebar sheet is open.

---

## 6. Dashboard page contract (v1)

| Region | Behavior |
| ------ | -------- |
| Heading | `Welcome, {displayName}` or `Loading…` |
| Description | Manage Onaeko account settings and security |
| Profile card | Link to `/my-account/profile` |
| Security card | Link to `/my-account/security` |
| Billing card | Link to `/my-account/billing` |
| Session card | Signed-in `userType`; Sign out → `logout()` |

**Placeholder child pages (Profile / Security / Billing):** a single `h1` whose text equals the last breadcrumb label for that URL (`Profile`, `Security`, `Billing`). No cards, empty-state paragraphs, or forms in v1.

---

## 7. Shell loading

| Region | While `getUser` loads | While session missing | Incomplete onboarding |
| ------ | --------------------- | --------------------- | --------------------- |
| Sidebar | Visible, links enabled | Layout redirects login | Layout redirects via `getOnboardingRoute` |
| NavBar | Visible from URL / session | — | — |
| Dashboard main | `Loading…` then welcome | — | — |

No full-viewport spinner that hides the sidebar or `NavBar`.

**Incomplete onboarding:** if token + user id exist but onboarding is not `completed`, `DashboardLayout` (or a single shell gate it owns) navigates with `getOnboardingRoute(...)` — do **not** leave the user on Dashboard.

---

## 8. Accessibility

- Sidebar: collapsible icon mode has per-item tooltip / `sr-only` text (label string even if no Lucide icon).
- `Trigger` is a button (`SidebarTrigger`).
- Logout (footer and avatar) is a **button**, not a fake link.
- Breadcrumb list is an `ol` inside `nav aria-label="breadcrumb"`.
- Current page: `aria-current="page"` on `BreadcrumbPage`.
- Bell / Help: **`aria-hidden="true"`** (decorative only; not in tab order).
- Focus order: `Trigger` → breadcrumb links → `UserAvatar` → **`main#dashboard-body`**.
- **`main` landmark:** required `id="dashboard-body"` on the scrolling content element (skip-target / QA hook).

---

## 9. Acceptance criteria

1. All **§2** dashboard-shell rows use explicit page `element`s; public `/` still redirects to login.
2. All **§3** items visible and navigable for a signed-in user; header uses **Logo / LogoIcon**.
3. Admin / talent / business users see the **same** four Main items.
4. **§4** trails match on the four v1 URLs.
5. **§5** `NavBar` matches Troott regions; mounted above `<main>`; Accounts `TopBar` not used; Bell/Help `aria-hidden`.
6. Opening the sidebar, `NavBar`, or breadcrumbs never navigates by itself (only click / Enter / Link).
7. Hardcoded stub labels in `side-nav.tsx` are gone; titles come from `sidebar.route.ts` (flat Home list).
8. `Dashboard` is not wrapped in a second `DashboardLayout`.
9. Unregistered `/my-account/...` deep paths → `ErrorPage`.
10. Shell uses **Outlet** (or equivalent nested children), not page-level layout wrap.
11. Pathname normalization applied for active + breadcrumbs.
12. Single session-gate owner on layout; incomplete onboarding redirected off Dashboard.

---

## 10. Related

- [PRODUCT.md](./PRODUCT.md)
- [TECH.md](./TECH.md)
- Troott `apps/web/src/components/layouts/DashboardLayout.tsx`
- Troott `apps/web/src/components/shared/navigation/NavBar.tsx`
- Troott `apps/web/src/components/shared/navigation/Trigger.tsx`
- Troott `apps/web/src/components/shared/navigation/TopNav.tsx`
- Troott `apps/web/src/components/shared/navigation/UserAvatar.tsx`
- Troott `apps/web/src/components/shared/navigation/breadcrumb-map.tsx` (algorithm only — different keys)
- Onaeko `apps/main/src/routes/AppRoutes.tsx` (`case 'home'` / `case 'dashboard'`)

---

## 11. Resolved gap decisions (1–18)

| # | Topic | Decision |
| - | ----- | -------- |
| 1 | `back` on child layouts | **Removed.** No Back control; breadcrumbs only. |
| 2 | Public vs auth `/` | Public row always redirects to login; session then sends `/` / `/login` → `/my-account` via `useAuth` (see §2). |
| 3 | `home` / `dashboard` names | **Do not register.** Public `home` is `/` → login only. |
| 4 | Layout mount | **Troott nested shell:** `DashboardLayout` + **`<Outlet />`**; pages are children. |
| 5 | Deep `/my-account/*` | Unregistered → **`ErrorPage` (`*`)**. No stub routes in v1. |
| 6 | `errorElement` / data router | **Out of scope** for feat-0001. Keep `AppErrorBoundary`. `errorElement` on `base.route` stays inert until a later `useRoutes` / `createBrowserRouter` feat. |
| 7 | Sidebar icons | **Text-only** rows in v1. Brand = **Logo / LogoIcon**. |
| 8 | Sidebar tree | Flatten to **Home + siblings** (parent = Home link). |
| 9 | Mobile sheet | `@onaeko/ui` sidebar sheet; **Trigger** toggles; overlay + dismiss (sheet defaults); **NavBar remains visible**. |
| 10 | Trailing slash | Normalize: `pathname.replace(/\/+$/, '') \|\| '/'` before active + breadcrumb logic. |
| 11 | Incomplete onboarding | Layout/shell gate → **`getOnboardingRoute`**; do not show Dashboard. |
| 12 | `useAuth` ownership | **Layout owns** session redirect effect. Pages/sidebar/avatar call `logout` / read helpers only — avoid duplicate navigate effects. |
| 13 | Open product Qs | **Logo/LogoIcon** header; avatar **includes Security**; **no Vitest** in this feat. |
| 14 | Placeholder pages | **Single `h1`** = last crumb label only. |
| 15 | Bell / Help a11y | **`aria-hidden="true"`**, not in tab order. |
| 16 | Breakpoints | Desktop: `collapsible="icon"` rail. Below `md`: off-canvas **sheet** via Trigger (package default). No custom breakpoint inventing. |
| 17 | Main landmark | Required **`main#dashboard-body`**. |
| 18 | `RouteURL.logout` | **Ignore** in v1. Logout only via `useAuth().logout()` → `/login`. |
