# feat-0001: Accounts dashboard home, sidebar, and breadcrumbs

## Summary

Signed-in users on **Onaeko Accounts** land on a **Dashboard** page inside a stable authenticated shell: collapsible **left sidebar** + **Troott `NavBar`** (collapse trigger, breadcrumbs, bell, help, user avatar). Route names `home` and `dashboard` (and the existing `my-account` alias) render `<Dashboard />`.

This is the accounts product home — not Troott studio home, and not the Onaeko `apps/main` talent / business / admin product dashboards.

## Problem

| Today | Gap |
| ----- | --- |
| [`base.route.tsx`](../../../src/routes/base.route.tsx) `name: 'home'` at `/` **redirects to login** | Correct for visitors with no session. There is no authenticated `home` → `<Dashboard />` mapping. |
| Post-login destination is [`RouteURL.myAccount`](../../../src/routes/paths.ts) (`/my-account`) via [`getOnboardingRoute`](../../../src/utils/onboarding.ts) and [`useAuth`](../../../src/hooks/app/useAuth.ts) | Page is [`MyAccount.tsx`](../../../src/app/accounts/MyAccount.tsx), which **embeds** `DashboardLayout`. Onaeko `apps/main` wraps layout at the **route** layer and maps `case 'home'` / `case 'dashboard'` to `<Dashboard />`. |
| [`side-nav.tsx`](../../../src/components/base/navigation/side-nav.tsx) is a hardcoded `<aside>` (`hidden md:flex`) | Ignores [`sidebar.route.ts`](../../../src/routes/sidebar.route.ts), `@onaeko/ui/sidebar` primitives, collapse, mobile sheet, footer logout. `DashboardLayout` already mounts `SidebarProvider`. |
| [`TopBar.tsx`](../../../src/components/base/navigation/TopBar.tsx) is a page title only | **Wrong chrome.** Troott `apps/web` uses `NavBar` (`Trigger` + `TopNav` + bell/help + `UserAvatar`), mounted as a **sibling above `<main>`**, not a title bar inside main. |
| Sidebar lists Profile / Security / Billing | Those paths exist in `paths.ts` and `sidebar.route.ts`, but **no route elements** — links 404. |

Without a written contract, implementing “home → Dashboard and the sidebar” can pull in the wrong Dashboard (talent/admin switch from `apps/main`) or skip breadcrumbs.

## Consumer

Authenticated Accounts users after onboarding is **completed** (`getOnboardingRoute` returns `RouteURL.myAccount` when `status === 'completed'`).

| `UserType` ([`enums.util.ts`](../../../src/utils/enums.util.ts)) | Dashboard home (v1) |
| --- | --- |
| `user`, `talent`, `business`, `admin`, `super` | **Same** Accounts Dashboard (welcome + account cards). No per-role product dashboard. |

Onboarding routes stay on [`OnboardingLayout`](../../../src/components/layouts/onboarding-layout.tsx). Public auth routes stay on [`AuthLayout`](../../../src/components/layouts/auth-layout.tsx). **No sidebar** on those layouts.

## User stories

| ID | As a | I want | So that |
| -- | ---- | ------ | ------- |
| UC-DH01 | Signed-in user | `/my-account` to render Dashboard inside the shell | I see home, not a layout-less page |
| UC-DH02 | Signed-in user | A left sidebar with Home, Profile, Security, Billing | I can move without using in-page cards only |
| UC-DH03 | Signed-in user | Troott-style top nav with breadcrumbs | I know where I am and can go up a level without a Back button |
| UC-DH04 | Signed-in user | Collapse the sidebar from the Troott trigger and have it remembered | Chrome stays out of the way |
| UC-DH05 | Visitor with no session | `/` still sends me to login | Public root does not expose the shell |
| UC-DH06 | Engineer | `/my-account` uses `<Dashboard />` as the route `element` | No name → page switch |
| UC-DH07 | Signed-in user | Avatar menu with Profile and Logout in the top nav | I can reach account actions the same way as Troott portal |

## Behavior

### A. Public root vs authenticated home

1. Unauthenticated `GET /` (`name: 'home'` in `base.route.tsx`) **redirects to** `RouteURL.login`. Do not render Dashboard.

2. Authenticated `GET /` or `GET /login` **redirects to** `RouteURL.myAccount` (existing [`useAuth`](../../../src/hooks/app/useAuth.ts) effect). Do not introduce a second signed-in URL such as `/dashboard`.

3. Canonical signed-in home **path** is `/my-account` (`RouteURL.myAccount`). Login after completed onboarding already uses this ([`login-form.tsx`](../../../src/components/base/auth/login-form.tsx) → `getOnboardingRoute`).

4. Signed-in home is **one route**: `name: 'my-account'`, path `/my-account`, `element: <Dashboard />`. Do **not** add a `pages.tsx` / `getAppPages` switch, and do **not** register `home` or `dashboard` as extra authenticated paths.

### B. Dashboard page

5. **Dashboard** is the signed-in Accounts home. v1 content is the current My Account body: welcome heading, short description, cards for Profile / Security / Billing / Session (sign out). Source: [`MyAccount.tsx`](../../../src/app/accounts/MyAccount.tsx).

6. Dashboard is **page content only**. It must **not** wrap itself in `DashboardLayout`. The authenticated shell is Troott-style: **`DashboardLayout` + `<Outlet />`**; Dashboard / Profile / Security / Billing are child route elements only.

7. **Do not** port Onaeko `apps/main` `src/app/dashboard/dashboard.tsx` userType switch (`Admin` / `BusinessDashboard` / `TalentDashboard` / `GuestDashboard` / `UserDashboard`). Those screens are a different app.

8. **Do not** port Troott studio `apps/web/src/app/dashboard/Dashboard.tsx` (sermon upload empty state).

9. User display name and email come from `OnaekoAPI.user.getUser()` with storage fallback (existing MyAccount behavior). Loading copy: `Loading…` until that fetch settles.

10. Sign out on the Session card calls `useAuth().logout()` (existing). Sidebar footer Logout and `UserAvatar` Logout use the same function (Behaviors 15 and 28).

### C. Shell and layout

11. Every authenticated Accounts route in this spec is wrapped by [`DashboardLayout`](../../../src/components/layouts/dashboard-layout.tsx).

12. **Always mount `AppSidebar`** inside `DashboardLayout` (Troott `specs/web/feature/feat-0034` rule, applied here). No route unmounts the portal sidebar.

13. **Top chrome is Troott `NavBar`, not Onaeko `TopBar`.** Source of truth:

    | Piece | Troott file (`apps/web/src/components/…`) | Role |
    | ----- | ----------------------------------------- | ---- |
    | Shell mount | `layouts/DashboardLayout.tsx` | `{!hideTopNav ? <NavBar /> : null}` as **sibling above `<main>`**, not inside scrolling main |
    | Bar | `shared/navigation/NavBar.tsx` | Left: `Trigger` + `TopNav`. Right: bell, help, `UserAvatar` |
    | Collapse | `shared/navigation/Trigger.tsx` | `SidebarTrigger`; persist `sidebar-collapsed` = `String(!open)` |
    | Breadcrumbs | `shared/navigation/TopNav.tsx` + `breadcrumb-map` | Path-split labels; last crumb is current page |
    | Avatar menu | `shared/navigation/UserAvatar.tsx` | Dropdown: Profile, Settings-equivalent, Logout |
    | Unused | `shared/navigation/ActionNav.tsx` | Empty stub — **do not port** |

    Onaeko `apps/main` `TopBar.tsx` (title + ChevronsLeft + optional Back) is **out of scope**. Do not merge it with Troott `NavBar`.

14. Accounts **v1 always shows `NavBar`** on `DashboardLayout` routes. Do not port Troott `hideTopNav` / full-bleed canvas (sermon library, profile, settings). Accounts has no equivalent waiver.

15. `NavBar` regions (normative inventory: [DASHBOARD_SHELL_SPEC §5](./DASHBOARD_SHELL_SPEC.md#5-troott-navbar-v1)):

    | Side | Control | v1 behavior |
    | ---- | ------- | ----------- |
    | Left | `Trigger` | Toggles sidebar; writes `sidebar-collapsed` |
    | Left | `TopNav` | Breadcrumbs (section E) |
    | Right | Bell icon | **Present, `aria-hidden="true"`, non-navigable** (not in tab order) |
    | Right | Help icon | **Present, `aria-hidden="true"`, non-navigable** (not in tab order) |
    | Right | `UserAvatar` | Menu: Profile → `/my-account/profile`; **Security** → `/my-account/security`; Logout → `useAuth().logout()`. Do **not** add Troott `/settings` or `/profile`. |

16. **No page title** in the top bar. Troott `NavBar` does not render `pageTitle`. Breadcrumbs are the only location chrome. Do not keep Accounts `TopBar` heading beside `TopNav`.

17. **No Back button** in the top bar or layout. Troott `NavBar` has none; intermediate breadcrumbs replace Onaeko `showBack`. Do **not** pass or honor a `back` prop for chrome.

18. Main content scrolls independently of the sidebar **and** of `NavBar` (`NavBar` stays put; `<main>` overflows). Collapse preference: `Trigger` keeps `sidebar-collapsed` in sync with `useSidebar().open` (Troott `Trigger.tsx`). `DashboardLayout` still reads that key for `SidebarProvider defaultOpen`.

19. Public auth and onboarding layouts **never** show this sidebar or this `NavBar`.

### D. Sidebar

20. Sidebar appears only inside `DashboardLayout`.

21. Sidebar is **collapsible** (`collapsible="icon"` on `@onaeko/ui/sidebar`). Collapsed items expose a tooltip (shadcn Sidebar default).

22. **Header:** **`Logo`** (expanded) / **`LogoIcon`** (collapsed rail) from `src/components/base/common/Logo.tsx` and `LogoIcon.tsx`. Wrapped in a link to `/my-account`. Do not use plain “Onaeko Accounts” text as the mark.

23. **Main group** (v1 — single group, all signed-in users):

    | Title | Path | Route name |
    | ----- | ---- | ---------- |
    | Home | `/my-account` | `home` / `my-account` / `dashboard` |
    | Profile | `/my-account/profile` | `profile` |
    | Security | `/my-account/security` | `security` |
    | Billing | `/my-account/billing` | `billing` |

    Inventory is **declared** in [`sidebar.route.ts`](../../../src/routes/sidebar.route.ts). `AppSidebar` must **read that file**, flatten parent + `subroutes` into Home + sibling rows (parent UI title **Home**), and must **not** keep a second hardcoded `navItems` array. Rows are **text-only** (no Lucide icons in v1).

24. Active item: after pathname normalize (strip trailing `/`), exact match for Home (`pathname === /my-account`). Prefix match for children (`pathname.startsWith(child.path)`). Home must **not** stay active on child paths. Unregistered deep URLs are ErrorPage in v1 (SHELL SPEC §2).

25. Empty groups are omitted.

26. v1 does **not** filter Main items by `UserType`. All authenticated Accounts roles see the same four items.

27. **Out of sidebar v1:** Learn, Pathfinder (`learn.route.tsx` / `pathfinder.route.tsx` are empty), Onaeko `apps/main` Talent / Workspace / Product / Help / Admin trees, Troott Get Started / Sermons / Analytics / Bin, command palette (Troott feat-0028).

28. **Footer:** Logout for every role that sees this shell. Calls `useAuth().logout()` → `/login` — never `href="#"`, never `RouteURL.logout`. Same logout as `UserAvatar` (Behavior 15).

29. Primary nav items are not placeholder `#` links.

30. Keyboard: sidebar links are focusable in order; collapse trigger (`Trigger` in `NavBar`) is reachable.

### E. Breadcrumbs (required — live inside Troott `TopNav`)

31. Breadcrumbs render **only** as Troott `TopNav` inside `NavBar`. They are not a second header in `<main>`.

32. Algorithm — copy Troott `apps/web/src/components/shared/navigation/TopNav.tsx`:

    1. Split `location.pathname` on `/`, drop empty segments.
    2. Build progressive paths: `/my-account`, `/my-account/profile`, …
    3. Label from Accounts `BreadcrumbMap[path]`, else the raw segment. **Do not copy** Troott map keys (`/sermons`, `/get-started`, …).
    4. Last crumb is `BreadcrumbPage` (`aria-current="page"`). Earlier crumbs are links.
    5. Separator between items (design-system `BreadcrumbSeparator`).

33. SPA adaptation (Troott uses `<BreadcrumbLink href={path}>`, which reloads): Accounts must use `@onaeko/ui/breadcrumb` `BreadcrumbLink` with `asChild` + React Router `Link`. Structure stays Troott; navigation stays client-side. Normalize pathname before building crumbs ([DASHBOARD_SHELL_SPEC §11](./DASHBOARD_SHELL_SPEC.md#11-resolved-gap-decisions-118) #10).

34. Landmark: `nav` with `aria-label="breadcrumb"` (already on `@onaeko/ui/breadcrumb` `Breadcrumb`).

35. Normative labels: [DASHBOARD_SHELL_SPEC §4](./DASHBOARD_SHELL_SPEC.md#4-breadcrumb-map-v1).

36. `/my-account` is a **single** crumb: **Home**. Do not invent a parent “Dashboard” crumb above it.

### F. Child pages (so sidebar and breadcrumbs are real)

37. Profile, Security, and Billing must be **registered routes** in v1 so sidebar, breadcrumbs, and avatar Profile item do not 404.

38. v1 page bodies are **single `h1` placeholders** whose text equals the last breadcrumb label. Full profile / password / billing forms are **out of scope**.

39. Child routes do **not** get a TopBar Back control. Navigation up is the Home (and intermediate) breadcrumb.

39a. Unregistered deep paths under `/my-account` (e.g. `/my-account/security/password`) → catch-all **`ErrorPage`**. Do not register stubs for them in this feat.

### G. Session

40. **`DashboardLayout` owns the session gate** (call `useAuth` once there, or extract its redirect effect). Missing token/user id → login. Child pages must not mount a second competing redirect effect; they may call `logout()` / read helpers only.

40a. Incomplete onboarding (session present, status not `completed`) → redirect with **`getOnboardingRoute`** from the same layout gate. Do not show Dashboard.

41. Sidebar and **NavBar** (including breadcrumbs) stay mounted while the Dashboard user fetch is in flight (Troott feat-0036 shell-first). Only the **main** region may show `Loading…`. NavBar stays visible when the mobile sidebar sheet is open.

### H. Must not regress

42. Unauthenticated `/` → login.

43. Completed onboarding → `/my-account`.

44. Incomplete onboarding still uses `getOnboardingRoute` (not Dashboard).

45. Collapse persistence key `sidebar-collapsed` (written by Troott-style `Trigger`).

46. `DashboardLayout` stays inside `<Router>` (`App.tsx`).

47. `NavBar` remains visible on Profile / Security / Billing (no Troott `hideTopNav`).

## Non-goals

- Onaeko `apps/main` role-switched product dashboards (admin console, talent home, business home, hackathons, inbox).
- Onaeko `apps/main` `TopBar.tsx` (page title, ChevronsLeft, Back).
- Troott studio URLs (`/studio/{code}`), sermon upload, Get Started hub, sidebar search palette, `ActionNav`, `hideTopNav` full-bleed.
- Wiring Bell / Help to real notification or help routes (icons only, like Troott today).
- Auth forms, OTP, OAuth (existing auth pages).
- Completing Profile / Security / Billing product forms.
- Learn / Pathfinder nav (`learn.route.tsx` / `pathfinder.route.tsx` empty).
- Adding a public `/dashboard` path.
- Figma file (none provided). Baseline: current MyAccount cards + Troott `NavBar` composition + `@onaeko/ui` tokens (do not require Troott `bg-neutral-900`).

## Figma

Figma: none provided.

## Resolved product decisions

| Topic | Decision | Why |
| ----- | -------- | --- |
| Signed-in home URL | Keep `/my-account` | `useAuth`, `getOnboardingRoute`, `login-form` already land here |
| `home` / `dashboard` names | **Do not register** as authenticated routes | Public `home` is `/` → login only |
| Dashboard body | Current MyAccount UI | This app is Accounts, not `apps/main` |
| Sidebar data | `sidebar.route.ts` only; **flatten** to Home + siblings | Avoid nested “My account” group in v1 |
| Home label in sidebar | **Home** | Path stays `/my-account` |
| Sidebar header mark | **`Logo` / `LogoIcon`** | Decided — use existing common Logo components (assets may still say Onaeko until rebrand) |
| Sidebar row icons | **Text-only** in v1 | Reduce scope; brand mark is Logo only |
| **Top chrome** | **Troott `NavBar`** (`Trigger` + `TopNav` + bell/help + `UserAvatar`) | User requirement: top bar from `troott/apps/web` |
| Breadcrumbs | Troott `TopNav` algorithm inside that `NavBar` | Troott composition; Accounts `BreadcrumbMap` keys |
| Page title / Back | **None** | Troott `NavBar` has neither |
| `hideTopNav` | **Do not port** | Accounts v1 always shows `NavBar` |
| Layout mount | **`DashboardLayout` + `<Outlet />`** | Troott shell; no `component` prop long-term |
| Deep unregistered URLs | **`ErrorPage`** | Do not stub password/2fa/etc. in v1 |
| `errorElement` / data router | **Out of scope** this feat | `AppErrorBoundary` remains; upgrade later |
| Bell / Help a11y | **`aria-hidden="true"`** | Decorative only |
| Avatar menu | Profile, **Security**, Logout | Security = Troott Settings stand-in |
| Logout path | `useAuth().logout()` → `/login` | Ignore `RouteURL.logout` in v1 |
| Pathname normalize | Strip trailing `/` | Active + breadcrumbs |
| Session / onboarding gate | Layout owns `useAuth` + incomplete → `getOnboardingRoute` | Single owner; shell-first |
| Mobile | Sheet below `md`; rail `collapsible="icon"` desktop; NavBar stays up | `@onaeko/ui` sidebar defaults |
| Main landmark | **`main#dashboard-body`** | a11y / QA |
| Visual tokens | `@onaeko/ui` | Copy Troott **structure**, not `bg-neutral-900` |
| Avatar photo | User from `getUser` / storage; fallback initials | Do not copy Troott `shadcn.png` |
| Roles | Same Main nav for all Accounts `UserType`s | Identity app |
| Child pages | Single-`h1` stubs | Sidebar/breadcrumbs/avatar must not 404 |
| Vitest | **Do not add** in this feat | typecheck + build + manual matrix |

## Success criteria

- [ ] `/my-account` renders `<Dashboard />` as the route `element` (no `pages.tsx`).
- [ ] Signed-in `/my-account` shows Dashboard inside `DashboardLayout` with sidebar + **Troott `NavBar`** and **`<Outlet />`**.
- [ ] Sidebar header uses **Logo / LogoIcon** linked to `/my-account`.
- [ ] `NavBar` composition matches [DASHBOARD_SHELL_SPEC §5](./DASHBOARD_SHELL_SPEC.md#5-troott-navbar-v1) (Trigger, TopNav, bell, help, UserAvatar).
- [ ] `NavBar` is a sibling **above** `<main#dashboard-body>`, not inside the scrolling content column.
- [ ] Unauthenticated `/` still redirects to login.
- [ ] Sidebar items match [DASHBOARD_SHELL_SPEC §3](./DASHBOARD_SHELL_SPEC.md#3-sidebar-inventory-v1); flat Home list from `sidebar.route.ts`.
- [ ] Profile / Security / Billing routes render in the same shell (`h1` placeholder OK).
- [ ] Unregistered deep `/my-account/*` → ErrorPage.
- [ ] Breadcrumbs match [DASHBOARD_SHELL_SPEC §4](./DASHBOARD_SHELL_SPEC.md#4-breadcrumb-map-v1).
- [ ] `AppSidebar` is never unmounted on DashboardLayout routes.
- [ ] Logout from sidebar footer, avatar menu, and Dashboard Session card all return to login (not `/logout`).
- [ ] Accounts `TopBar` page-title chrome is gone from `DashboardLayout`.
- [ ] Gap table [DASHBOARD_SHELL_SPEC §11](./DASHBOARD_SHELL_SPEC.md#11-resolved-gap-decisions-118) satisfied.
- [ ] `pnpm typecheck` and `pnpm build` in `onaeko-accounts` pass.

## Open questions

None for feat-0001 v1 — see Resolved product decisions and [DASHBOARD_SHELL_SPEC §11](./DASHBOARD_SHELL_SPEC.md#11-resolved-gap-decisions-118).

## Related

- [TECH.md](./TECH.md)
- [TASKS.md](./TASKS.md)
- [DASHBOARD_SHELL_SPEC.md](./DASHBOARD_SHELL_SPEC.md)
- Troott `apps/web/src/components/shared/navigation/NavBar.tsx`
- Troott `apps/web/src/components/shared/navigation/TopNav.tsx`
- Troott `apps/web/src/components/shared/navigation/Trigger.tsx`
- Troott `apps/web/src/components/shared/navigation/UserAvatar.tsx`
- Troott `apps/web/src/components/layouts/DashboardLayout.tsx`
- Troott `specs/web/feature/feat-0002` — portal sidebar + top navigation bar
- Troott `specs/web/feature/feat-0034` — always mount sidebar
- Troott `specs/web/feature/feat-0036` — shell-first loading
- Onaeko `apps/main/src/routes/AppRoutes.tsx` (`case 'home'` / `case 'dashboard'`)
