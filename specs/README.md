# Accounts specs (`onaeko-accounts`)

Product and technical specifications for **Onaeko Accounts** (`accounts.onaeko.com`).

Spec layout matches Troott web specs (`PRODUCT` + `TECH` + optional `TASKS` + a normative contract when the inventory must be exact).

## Feature specs

| ID | Topic | PRODUCT | TECH | TASKS |
| -- | ----- | ------- | ---- | ----- |
| feat-0001 | Dashboard home (`home` → `<Dashboard />`), sidebar, Troott top nav, breadcrumbs | [PRODUCT](./feature/feat-0001/PRODUCT.md) | [TECH](./feature/feat-0001/TECH.md) | [TASKS](./feature/feat-0001/TASKS.md) |

**Normative shell contract:** [feat-0001 DASHBOARD_SHELL_SPEC](./feature/feat-0001/DASHBOARD_SHELL_SPEC.md) — route-name → page map, sidebar inventory, Troott `NavBar` chrome, breadcrumb trail.

## Rules

1. Every significant or high-risk change gets a folder under `specs/feature/feat-NNNN/`.
2. Write **PRODUCT** first (what / why / for whom). **TECH** is how we implement and verify it in this repo. **TASKS** is the ordered implementation list.
3. Link PRODUCT ↔ TECH ↔ TASKS with relative paths.
4. Keep specs accurate after ship; mark completed success criteria with `[x]`.
5. Do not invent product surfaces that belong to other Onaeko apps (`apps/main` talent / business / admin dashboards, Troott studio sermons). Cite source files instead.

## Source context (do not copy blindly)

| Source | Role |
| ------ | ---- |
| `onaeko-accounts` | Implementation target |
| `/Users/pro/Documents/madebydamola/learn/onaeko` | Routing pattern (explicit route `element`s, not a page switch), `DashboardLayout`, shadcn sidebar |
| `/Users/pro/Documents/madebydamola/learn/troott/apps/web` | Portal shell: always-mounted sidebar; **top chrome is Troott `NavBar`** (`Trigger` + `TopNav` breadcrumbs + bell/help + `UserAvatar`) |
