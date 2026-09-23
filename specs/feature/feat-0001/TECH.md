# feat-0001 — Technical notes (dashboard home, sidebar, breadcrumbs)

## Context

See [`PRODUCT.md`](./PRODUCT.md) and the normative contract [`DASHBOARD_SHELL_SPEC.md`](./DASHBOARD_SHELL_SPEC.md).

**Stack (from `onaeko-accounts/package.json`):** React 19.2, React Router 7.18, Vite 7, `@onaeko/ui` ^0.3.0 (exports `./sidebar` and `./breadcrumb`).

**Commands:**

```bash
cd onaeko-accounts
pnpm typecheck
pnpm build
pnpm lint
pnpm dev
```

No unit-test script exists in this package. Do not add Vitest unless PRODUCT open question 3 is overridden.

---

## Current code

| File | Role today |
| ---- | ---------- |
| [`src/routes/base.route.tsx`](../../../src/routes/base.route.tsx) | `name: 'home'`, path `/`, `redirect: RouteURL.login` |
| [`src/routes/account.route.tsx`](../../../src/routes/account.route.tsx) | Auth pages + `my-account` → `<MyAccount />` (layout **inside** the page) |
| [`src/routes/routes.tsx`](../../../src/routes/routes.tsx) | Recurses `IRoute.element` / `redirect`. **No** `getAppPages` switch |
| [`src/routes/paths.ts`](../../../src/routes/paths.ts) | `home: '/'`, `myAccount`, `profile`, `security`, `billing`, … |
| [`src/routes/sidebar.route.ts`](../../../src/routes/sidebar.route.ts) | Declared nav: `my-account` + profile / security / billing subroutes |
| [`src/app/accounts/MyAccount.tsx`](../../../src/app/accounts/MyAccount.tsx) | Signed-in home **and** `DashboardLayout` wrapper |
| [`src/components/layouts/dashboard-layout.tsx`](../../../src/components/layouts/dashboard-layout.tsx) | `SidebarProvider` + `AppSidebar` + `TopBar` + main |
| [`src/components/base/navigation/side-nav.tsx`](../../../src/components/base/navigation/side-nav.tsx) | Hardcoded `<aside>`, hidden below `md` |
| [`src/components/base/navigation/TopBar.tsx`](../../../src/components/base/navigation/TopBar.tsx) | Title only — no collapse, no breadcrumbs |
| [`src/hooks/app/useAuth.ts`](../../../src/hooks/app/useAuth.ts) | Session redirect `/` and `/login` → `/my-account` **only if a component calls `useAuth`** |
| [`src/hooks/shared/useGoTo.tsx`](../../../src/hooks/shared/useGoTo.tsx) | Navigates using `sidebar.route.ts` |
| [`src/hooks/shared/useSidebar.tsx`](../../../src/hooks/shared/useSidebar.tsx) | Sidebar context seed from `sidebar.route.ts` |

**Reference (read, do not copy wholesale):**

| Source | What to take |
| ------ | ------------ |
| Onaeko `apps/main/src/routes/AppRoutes.tsx` | `getAppPages`: `case 'dashboard': case 'home': return <Dashboard />`; wrap authenticated pages in `DashboardLayout` |
| Onaeko `apps/main/src/app/dashboard/dashboard.tsx` | **Do not copy** the userType switch |
| Onaeko `apps/main/src/components/blocks/navigation/TopBar.tsx` | **Do not copy** — title + Back is not Troott chrome |
| Troott `apps/web/src/components/layouts/DashboardLayout.tsx` | Always mount `AppSidebar`; **`NavBar` sibling above `<main>`** |
| Troott `apps/web/src/components/shared/navigation/NavBar.tsx` | **Canonical top chrome:** Trigger + TopNav left; bell, help, UserAvatar right |
| Troott `apps/web/src/components/shared/navigation/Trigger.tsx` | `SidebarTrigger` + persist `sidebar-collapsed` |
| Troott `apps/web/src/components/shared/navigation/TopNav.tsx` | Path-split breadcrumb algorithm |
| Troott `apps/web/src/components/shared/navigation/UserAvatar.tsx` | Avatar dropdown (map destinations to Accounts paths; do not copy shadcn.png) |
| Troott `apps/web/src/components/shared/navigation/ActionNav.tsx` | Empty — **do not port** |
| Troott `apps/web/src/components/shared/navigation/breadcrumb-map.tsx` | Algorithm consumer only — **do not copy keys** |
| Troott `apps/web/src/components/shared/navigation/Sidebar.tsx` | Header / Main / Footer; data-driven items |
| `@onaeko/ui/breadcrumb` | `Breadcrumb*` primitives (`aria-label="breadcrumb"`) |
| `@onaeko/ui/sidebar` | `Sidebar`, `SidebarProvider`, `useSidebar`, `SidebarTrigger`, … |
| `@onaeko/ui/avatar` | Avatar for `UserAvatar` |
| `@onaeko/ui/dropdown-menu` | Avatar menu |

---

## Layout target

Troott `DashboardLayout` shape (Accounts tokens, not `bg-neutral-900`):

```text
DashboardLayout (authenticated Accounts routes only)
├── useAuth session + onboarding gate (single owner)
├── SidebarProvider (defaultOpen from storage `sidebar-collapsed`)
│   └── flex h-screen w-full
│       ├── AppSidebar                    ALWAYS
│       │   ├── Header  Logo / LogoIcon → /my-account
│       │   ├── Main    Home, Profile, Security, Billing (flat, text-only)
│       │   └── Footer  Logout → useAuth().logout() → /login
│       └── column flex-1 flex-col min-h-0
│           ├── NavBar                    ALWAYS (Troott; sibling of main)
│           │   ├── LEFT  Trigger + TopNav (breadcrumbs)
│           │   └── RIGHT Bell + Help (aria-hidden) + UserAvatar
│           └── main#dashboard-body       scrolls
│               └── .dashboard-content
│                   └── <Outlet />   ← Dashboard | Profile | Security | Billing
```

Do **not** put `NavBar` / `TopBar` inside scrolling `<main>`. Prefer **`<Outlet />`** over `DashboardLayout({ component })` (SHELL SPEC §2 / §11 #4).

Auth / onboarding trees are unchanged (no `DashboardLayout`).

**Pathname helper** (active + breadcrumbs):

```ts
export function normalizePathname(pathname: string): string {
    return pathname.replace(/\/+$/, '') || '/';
}
```

**Deep unregistered URLs:** leave to `base.route` `*` → `ErrorPage`. Do not register `profile/edit`, password, 2fa, etc. in this feat.

**`errorElement`:** out of scope; `AppErrorBoundary` stays. Do not block this feat on `createBrowserRouter`.

---

## Proposed structure

```text
onaeko-accounts/src/
  app/
    dashboard/Dashboard.tsx          # body from MyAccount; no layout wrap
    accounts/MyAccount.tsx           # re-export Dashboard OR delete after switch
    accounts/Profile.tsx             # v1 h1 placeholder
    accounts/Security.tsx            # v1 h1 placeholder
    accounts/Billing.tsx             # v1 h1 placeholder
  _data/
    breadcrumb-map.ts                # Record<string, string>
  components/base/common/
    Logo.tsx / LogoIcon.tsx          # sidebar header (consume)
  components/base/navigation/
    side-nav.tsx                     # rewrite: @onaeko/ui/sidebar + flat sidebar.route.ts + Logo
    NavBar.tsx                       # Troott NavBar.tsx composition
    Trigger.tsx                      # Troott Trigger.tsx
    TopNav.tsx                       # Troott TopNav.tsx + Accounts breadcrumb-map + normalize
    UserAvatar.tsx                   # Troott UserAvatar.tsx; Accounts paths
    TopBar.tsx                       # stop using in DashboardLayout (delete or unused)
  components/layouts/
    dashboard-layout.tsx             # gate + NavBar + main#dashboard-body + <Outlet />
  routes/
    account.route.tsx                # explicit page elements; nested children under layout
    routes.tsx                       # recurse children
    sidebar.route.ts                 # title Home; keep paths
```

### Route elements (no page switch)

Do **not** add [`pages.tsx`](../../../src/routes/pages.tsx) or `getAppPages`. Each dashboard-shell row sets `element` to the component, same as auth routes.

Public auth names stay as **explicit `element`** on `account.route.tsx` / onboarding routes. `base.route.tsx` `home` at `/` keeps `redirect: RouteURL.login`.

### Route renderer

Prefer Troott nested shell (SHELL SPEC §2):

```tsx
{
  path: '/my-account',
  element: <DashboardLayout />, // contains <Outlet />
  children: [
    { index: true, element: <Dashboard /> },
    { path: 'profile', element: <Profile /> },
    { path: 'security', element: <Security /> },
    { path: 'billing', element: <Billing /> },
  ],
}
```

Wire via `IRoute.children` in `account.route.tsx`, and teach `routes.tsx` to recurse children (already supports `route.children`).

**Do not** use long-term:

```tsx
<DashboardLayout component={<Dashboard />} title=… back=… />
```

No `title` / `back` chrome props. Remove `component` from the layout API when Outlet lands.

[`MyAccount.tsx`](../../../src/app/accounts/MyAccount.tsx) must stop wrapping `DashboardLayout` (double chrome).

Register shell children:

| name | path |
| ---- | ---- |
| `my-account` | `RouteURL.myAccount` (index under layout) |
| `profile` | `RouteURL.profile` |
| `security` | `RouteURL.security` |
| `billing` | `RouteURL.billing` |

Do **not** add `path: '/dashboard'`. Do **not** register deep `paths.ts` entries (edit, password, 2fa, …) in v1 — they fall through to `*`.

### `sidebar.route.ts`

Keep paths. Set parent `title` to `Home` (PRODUCT). `AppSidebar` **flattens** parent + `subroutes` into four Main links (SHELL SPEC §3).

Active-state helper (colocate next to sidebar or in `utils/`):

```ts
export function normalizePathname(pathname: string): string {
    return pathname.replace(/\/+$/, '') || '/';
}

export function isSidebarPathActive(
    pathname: string,
    itemPath: string,
    options: { exact: boolean },
): boolean {
    const p = normalizePathname(pathname);
    const item = normalizePathname(itemPath);
    if (options.exact) return p === item;
    return p === item || p.startsWith(`${item}/`);
}
```

Home uses `exact: true`. Children use `exact: false`.

### `AppSidebar`

Replace the stub `<aside>` with `@onaeko/ui/sidebar` primitives (already imported as `SidebarProvider` in `dashboard-layout.tsx`):

- `Sidebar collapsible="icon"`
- `SidebarHeader`: **`Logo`** when expanded, **`LogoIcon`** when collapsed (`useSidebar().open`); both link to `/my-account`
- `SidebarContent` / `SidebarFooter` / `SidebarRail`
- Flat items from `sidebar.route.ts` via `Link` + `useLocation` (or `useGoTo` — do not fork a third navigator)
- **Text-only** menu labels (no Lucide on rows in v1)
- Footer: `Button` / `SidebarMenuButton` → `logout()` → `/login` (ignore `RouteURL.logout`)
- Mobile: package sidebar **sheet** below `md`; Trigger in `NavBar` opens/closes; NavBar stays mounted

Do **not** import Onaeko `apps/main` `side-nav.tsx`.

### Troott `NavBar` (canonical top chrome)

Port structure from Troott files; implement under `src/components/base/navigation/`. Use `@onaeko/ui` for primitives and color tokens.

**`DashboardLayout`:** match Troott — column with `NavBar` then `<main>`, not `TopBar` inside `<main>`. Always render `NavBar` (no `hideTopNav`).

**`NavBar.tsx`** — same regions as Troott `NavBar.tsx`:

```tsx
<nav className="flex items-center justify-between … h-14 w-full … border-b bg-background">
  <div className="flex items-center">
    <Trigger />
    <TopNav />
  </div>
  <div className="flex items-center gap-2 justify-end">
    <BellIcon className="h-5 w-5" />
    <HelpCircleIcon className="h-5 w-5" />
    <UserAvatar />
  </div>
</nav>
```

Bell / Help: Lucide icons, **no navigation** in v1. Render with **`aria-hidden="true"`** (not focusable; not links).

**`Trigger.tsx`** — copy Troott behavior:

```tsx
const { open, setOpen } = useSidebar();
useEffect(() => {
  storage.keep('sidebar-collapsed', String(!open));
}, [open]);
return <SidebarTrigger onClick={() => setOpen(!open)} />;
```

Import `SidebarTrigger` / `useSidebar` from `@onaeko/ui/sidebar`.

**`TopNav.tsx`** — copy Troott loop; Accounts map; SPA links; **normalize pathname** first:

```ts
const pathname = normalizePathname(location.pathname);
const pathParts = pathname.split('/').filter(Boolean);
const paths = pathParts.map((_, idx) => '/' + pathParts.slice(0, idx + 1).join('/'));
```

```tsx
<BreadcrumbLink asChild>
  <Link to={path}>{label}</Link>
</BreadcrumbLink>
```

Map: [`src/_data/breadcrumb-map.ts`](../../../src/_data/breadcrumb-map.ts) — keys in DASHBOARD_SHELL_SPEC §4 only.

**`UserAvatar.tsx`** — Troott menu shape (`@onaeko/ui/dropdown-menu` + `@onaeko/ui/avatar`):

| Item | Troott | Accounts v1 |
| ---- | ------ | ----------- |
| Profile | `PATH_PROFILE` | `RouteURL.profile` (`/my-account/profile`) |
| Settings | `PATH_SETTINGS` | **Security** → `RouteURL.security` (decided) |
| Logout | `useAuth().logout()` | same → `/login` (not `RouteURL.logout`) |

Photo: `user.avatar` / `profilePicture` from context or `getUser`, else initials fallback. **Do not** use Troott’s `https://github.com/shadcn.png`.

Do **not** extend Accounts `TopBar.tsx` into this bar. Remove it from `DashboardLayout`.

### Session gate

**`DashboardLayout` is the single owner** of the session redirect effect (`useAuth` or extracted effect):

1. Missing token/user id → `/login`.
2. Session present but onboarding not completed → `getOnboardingRoute(...)`.
3. Child pages / sidebar / avatar use `logout()` and data helpers only — **do not** remount a second full redirect effect that races the layout.

Do not block `AppSidebar` / `NavBar` on `OnaekoAPI.user.getUser()`. Dashboard local loading stays in the main column / Outlet.
### Observability

Keep existing PostHog / Sentry identify in `DashboardLayout` (`isProd` only). No new events required in v1.

---

## Implementation phases

| Phase | Scope |
| ----- | ----- |
| **P0** | Explicit route `element`s; extract `Dashboard`; nested shell + **Outlet**; profile/security/billing `h1` stubs |
| **P1** | `AppSidebar` from `sidebar.route.ts` + **Logo/LogoIcon**; flat Home list; footer logout; collapse/sheet |
| **P2** | Troott `NavBar`; breadcrumb-map + normalize; layout session + onboarding gate; remove Accounts `TopBar` |
| **P3** | Manual QA incl. deep URL → ErrorPage; typecheck/build; remove double layout |

---

## Tests

Accounts has no test runner. Verification:

| Check | How |
| ----- | --- |
| Route `element`s | Typecheck + manual: names listed in DASHBOARD_SHELL_SPEC §2 |
| Shell on `/my-account` | Manual: sidebar + Troott NavBar (trigger, crumbs, bell, help, avatar) + Dashboard cards |
| Unauthenticated `/` | Manual: lands on login |
| Child routes | Manual: Profile/Security/Billing in shell; Home not active; NavBar still visible |
| Collapse | Manual: Trigger toggles sidebar; refresh keeps collapsed state |
| Avatar | Manual: Profile / Security / Logout |
| Logout | Manual: footer, avatar, and Session card → login |

If Vitest is added later, first units: `isSidebarPathActive`, breadcrumb path builder + map labels.

---

## Files to touch (implementation)

| File | Action |
| ---- | ------ |
| `src/routes/account.route.tsx` | Nested `/my-account` layout; **explicit** `<Dashboard />` / `<Profile />` / … `element`s |
| `src/routes/routes.tsx` | Recurse `children`; shell parent + Outlet |
| `src/routes/sidebar.route.ts` | Parent title `Home` |
| `src/app/dashboard/Dashboard.tsx` | **Add** — MyAccount body |
| `src/app/accounts/MyAccount.tsx` | Re-export or delete |
| `src/app/accounts/Profile.tsx` `Security.tsx` `Billing.tsx` | **Add** — single `h1` placeholders |
| `src/_data/breadcrumb-map.ts` | **Add** |
| `src/utils/…` (or sidebar colocated) | `normalizePathname` / `isSidebarPathActive` |
| `src/components/base/navigation/side-nav.tsx` | Rewrite; **Logo / LogoIcon** header; flat list |
| `src/components/base/common/Logo.tsx` / `LogoIcon.tsx` | **Use** in sidebar header (no rewrite required) |
| `src/components/base/navigation/NavBar.tsx` | **Add** — Troott composition |
| `src/components/base/navigation/Trigger.tsx` | **Add** — Troott Trigger |
| `src/components/base/navigation/TopNav.tsx` | **Add** — Troott TopNav + Accounts map + normalize |
| `src/components/base/navigation/UserAvatar.tsx` | **Add** — Troott menu, Accounts paths |
| `src/components/base/navigation/TopBar.tsx` | **Remove from `DashboardLayout`** (delete if unused) |
| `src/components/layouts/dashboard-layout.tsx` | Session + onboarding gate; `NavBar` above `<main>`; **`<Outlet />`**; drop `component` prop |

**Do not touch** auth form implementations, onboarding step pages, `learn.route.tsx` / `pathfinder.route.tsx` (empty), API clients — except reading `getUser` already used by MyAccount.

---

## Acceptance (engineering)

1. `pnpm typecheck` and `pnpm build` pass in `onaeko-accounts`.
2. `/my-account` uses `<Dashboard />` as `element`; no `pages.tsx`.
3. Public `home` at `/` still redirects to login when `IRoute.redirect` is set.
4. No `DashboardLayout` nested inside `Dashboard`; shell uses **`<Outlet />`**.
5. Sidebar DOM uses `@onaeko/ui/sidebar` slots; header is **Logo / LogoIcon**.
6. Grep: no second hardcoded nav array that duplicates `sidebar.route.ts` titles/paths; flat Home list.
7. Troott `NavBar` present on `/my-account` and child paths: Trigger, TopNav landmark, bell/help (`aria-hidden`), UserAvatar.
8. `NavBar` is not a descendant of scrolling `#dashboard-body` content.
9. Accounts `TopBar` is not mounted in `DashboardLayout`.
10. Unregistered deep `/my-account/*` → `ErrorPage`.
11. Pathname normalize used for active + breadcrumbs.
12. Layout owns session + incomplete-onboarding redirect; no racing duplicate `useAuth` effects on pages.
13. `isStudioSermonWorkspacePath`-style unmount guards **do not exist** here. Do not add Troott `hideTopNav`.
14. Gap table [DASHBOARD_SHELL_SPEC §11](./DASHBOARD_SHELL_SPEC.md#11-resolved-gap-decisions-118) satisfied.
## Related

- [PRODUCT.md](./PRODUCT.md)
- [TASKS.md](./TASKS.md)
- [DASHBOARD_SHELL_SPEC.md](./DASHBOARD_SHELL_SPEC.md)
