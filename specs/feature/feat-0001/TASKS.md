# feat-0001 TASKS

## Phase 0 — Spec

- [x] PRODUCT.md
- [x] TECH.md
- [x] DASHBOARD_SHELL_SPEC.md
- [x] TASKS.md
- [x] Index `specs/README.md`

## Phase 1 — Route map and Dashboard page (P0)

### Task 1: Nested `/my-account` routes

**Description:** Keep public `/` as `redirect` in `base.route.tsx`. Register dashboard-shell children with **explicit page `element`s** ([DASHBOARD_SHELL_SPEC §2](./DASHBOARD_SHELL_SPEC.md#2-route-elements-v1)). Do **not** add `pages.tsx` / `getAppPages`.

**Acceptance criteria:**

- [x] `/my-account` `element` is `<Dashboard />`
- [x] Profile / Security / Billing use their page components directly
- [x] `base.route.tsx` `home` still redirects to login
- [x] No `src/routes/pages.tsx`

**Verification:** `pnpm typecheck`. Manual: logged-out `/` → `/login`.

**Dependencies:** None

**Files likely touched:** `src/routes/account.route.tsx`, `src/routes/routes.tsx`, `src/routes/base.route.tsx` (read-only unless redirect order is wrong)

**Estimated scope:** S

### Task 2: Extract Dashboard; nested layout + Outlet

**Description:** Move MyAccount body into `src/app/dashboard/Dashboard.tsx` with **no** `DashboardLayout` wrap. Introduce Troott-style nested shell: parent `DashboardLayout` with **`<Outlet />`**; register `my-account` (index), `profile`, `security`, `billing` as children ([DASHBOARD_SHELL_SPEC §2](./DASHBOARD_SHELL_SPEC.md#2-route-elements-v1)). Placeholders are a single `h1` each. Unregistered deep `/my-account/*` stay on catch-all `ErrorPage`.

**Acceptance criteria:**

- [x] `/my-account` shows welcome + four cards inside one shell
- [x] No nested `SidebarProvider` / double top bar; pages do not wrap layout
- [x] `/my-account/profile`, `/security`, `/billing` render `h1` titles in the same shell (**no** Back)
- [x] `/my-account/security/password` (etc.) → ErrorPage
- [x] Shell uses `<Outlet />` (not `DashboardLayout({ component })`)

**Verification:** `pnpm typecheck`. Manual: single `#dashboard-body`; deep URL → error page.

**Dependencies:** Task 1

**Files likely touched:** `src/app/dashboard/Dashboard.tsx`, `src/app/accounts/MyAccount.tsx`, `src/app/accounts/Profile.tsx`, `src/app/accounts/Security.tsx`, `src/app/accounts/Billing.tsx`, `src/routes/account.route.tsx` and/or `dashboard.route.tsx`, `src/routes/routes.tsx`, `src/components/layouts/dashboard-layout.tsx`

**Estimated scope:** M

## Checkpoint: After Tasks 1–2

- [x] Typecheck passes
- [x] Signed-in home is Dashboard content in `DashboardLayout`
- [x] Child URLs do not 404

## Phase 2 — Sidebar (P1)

### Task 3: Data-driven AppSidebar + Logo

**Description:** Rewrite `side-nav.tsx` to `@onaeko/ui/sidebar` primitives. Read items from `sidebar.route.ts` and **flatten** to Home + siblings. Parent title **Home**. Header: **`Logo` / `LogoIcon`** linked to `/my-account`. Active rules + `normalizePathname` from DASHBOARD_SHELL_SPEC §3 / §11. Footer Logout → `useAuth().logout()` → `/login` (not `/logout`). Text-only rows. Mobile sheet via package sidebar (Trigger); NavBar stays visible.

**Acceptance criteria:**

- [x] No duplicate hardcoded `navItems` array
- [x] Flat Home / Profile / Security / Billing
- [x] Header uses Logo (expanded) / LogoIcon (collapsed)
- [x] Home exact-active; children prefix-active (normalized paths)
- [x] Collapse + rail work; `sidebar-collapsed` still honored by `DashboardLayout`
- [x] Logout footer returns to login

**Verification:** Manual matrix in TECH. `pnpm typecheck`.

**Dependencies:** Task 2

**Files likely touched:** `src/components/base/navigation/side-nav.tsx`, `src/routes/sidebar.route.ts`, `src/components/base/common/Logo.tsx` / `LogoIcon.tsx` (consume), pathname helpers, `src/hooks/shared/useGoTo.tsx` (only if wiring clicks)

**Estimated scope:** M

## Checkpoint: After Task 3

- [x] Sidebar matches §3 inventory
- [x] AppSidebar always mounted on DashboardLayout routes

## Phase 3 — Troott NavBar (P2)

### Task 4: Port Troott NavBar, Trigger, TopNav, UserAvatar

**Description:** Replace Accounts `TopBar` in `DashboardLayout` with Troott top chrome. Add `NavBar.tsx`, `Trigger.tsx`, `TopNav.tsx`, `UserAvatar.tsx` matching [DASHBOARD_SHELL_SPEC §5](./DASHBOARD_SHELL_SPEC.md#5-troott-navbar-v1). Mount `NavBar` as a **sibling above `<main#dashboard-body>`**. Add `src/_data/breadcrumb-map.ts` (§4). Bell/Help: **`aria-hidden="true"`**. Avatar: Profile, **Security**, Logout. Do not port `ActionNav`, `hideTopNav`, or Onaeko `TopBar` Back/title.

**Acceptance criteria:**

- [x] Left: Trigger + breadcrumbs; right: bell, help (`aria-hidden`), UserAvatar
- [x] Trails in DASHBOARD_SHELL_SPEC §4 hold (normalized paths)
- [x] `nav aria-label="breadcrumb"` present
- [x] Intermediate crumbs client-navigate (no full reload)
- [x] Trigger persists `sidebar-collapsed`
- [x] Avatar: Profile, Security, Logout (Accounts paths; not `/logout`)
- [x] `TopBar` is not rendered in `DashboardLayout`
- [x] `NavBar` is not inside scrolling `#dashboard-body` content

**Verification:** Manual on the four v1 URLs. `pnpm typecheck`.

**Dependencies:** Task 2

**Files likely touched:** `src/_data/breadcrumb-map.ts`, `src/components/base/navigation/NavBar.tsx`, `Trigger.tsx`, `TopNav.tsx`, `UserAvatar.tsx`, `src/components/base/navigation/TopBar.tsx`, `src/components/layouts/dashboard-layout.tsx`

**Estimated scope:** M

### Task 5: Session + onboarding gate on layout

**Description:** **`DashboardLayout` owns** session + incomplete-onboarding redirects (`useAuth` effect and/or `getOnboardingRoute`). Child pages must not race a second full redirect effect. Logged-out → `/login`. Incomplete onboarding → onboarding route. Shell chrome stays up while Dashboard `getUser` loads.

**Acceptance criteria:**

- [x] Logged-out visit to `/my-account` → `/login`
- [x] Incomplete onboarding with session → onboarding path (not Dashboard)
- [x] Sidebar/NavBar still show while Dashboard `getUser` loads
- [x] Dashboard / sidebar / avatar only call `logout` / helpers — no duplicate gate

**Verification:** Manual: clear storage, open `/my-account`; session with incomplete onboarding.

**Dependencies:** Task 2

**Files likely touched:** `src/components/layouts/dashboard-layout.tsx`, `src/hooks/app/useAuth.ts`, `src/utils/onboarding.ts` (read)

**Estimated scope:** S

## Checkpoint: After Tasks 4–5

- [x] Breadcrumbs required chrome is present **inside Troott NavBar**
- [x] Session gate does not hide sidebar or NavBar during `getUser`

## Phase 4 — Verify (P3)

### Task 6: QA matrix and cleanup

**Description:** Run TECH acceptance list. Delete dead MyAccount layout wrap / unused imports. Confirm `pnpm lint` / `pnpm typecheck` / `pnpm build`.

**Acceptance criteria:**

- [ ] PRODUCT success criteria can be checked off
- [ ] No leftover nested layout
- [ ] Build succeeds

**Verification:**

```bash
cd onaeko-accounts && pnpm typecheck && pnpm lint && pnpm build
```

**Dependencies:** Tasks 1–5

**Files likely touched:** cleanup only

**Estimated scope:** S

## Risks and mitigations

| Risk | Impact | Mitigation |
| ---- | ------ | ---------- |
| Confusing public `home` (`/` redirect) with signed-in `/my-account` | High | Apply `redirect` first; do not register extra home paths (SHELL SPEC §2) |
| Copying `apps/main` Dashboard userType switch | High | PRODUCT B7 — Accounts Dashboard is MyAccount body only |
| Copying `apps/main` TopBar (title + Back) | High | PRODUCT C13 — Troott NavBar only; no `back` |
| Putting NavBar inside scrolling main | Medium | Match Troott DashboardLayout sibling layout |
| Keeping `component={}` layout API | Medium | Task 2 — Outlet + children (SHELL SPEC §11 #4) |
| Double `DashboardLayout` | Medium | Page components must not wrap layout |
| Racing `useAuth` effects | Medium | Task 5 — layout is single gate owner |
| Stubbing every `paths.ts` deep URL | Medium | Unregistered → ErrorPage (SHELL SPEC §11 #5) |

## Out of this task list

- Profile / security / billing form implementations
- Vitest
- Command palette
- `/dashboard` URL
- Wiring Bell / Help (keep `aria-hidden`)
- Troott `ActionNav` / `hideTopNav`
- `createBrowserRouter` / making `errorElement` live (later feat)
- Replacing Onaeko assets inside Logo files (use Logo as-is)
- Figma
