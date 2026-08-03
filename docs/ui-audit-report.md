# UI Audit Report — IMCMS Enterprise ERP

## Scope
Non-destructive visual refinement of the `frontend` React application. No layouts, navigation, routing,
theming, auth flows, or business logic were changed. Success criteria: the product remains recognizably IMCMS
while feeling measurably more polished and consistent.

## Method
- Manual code inspection of `src/components/ui`, `src/components/layout`, `src/pages`, and `src/modules/*`.
- Compared every surface against the IMCMS design system (`IMCMS_Design_System.md`, `UI_UX_SPECIFICATION.md`).
- Identified three coexisting styling conventions and unified them on the existing Tailwind token system.

## Conventions found (before)
1. **Token-based** — `bg-surface-card`, `text-text-muted`, `border-border-default` (design-system compliant). Used in dashboard, layout, core UI kit.
2. **Raw palette** — hard-coded `gray-*` / `slate-*` with `dark:` variants. Used in CRUD pages (users, processes, units, vendors), analytics module, and several pages.
3. **Legacy auth classes** — `auth-card`, `form-input`, `btn-primary`, `toast-*`, etc. used by auth pages; these classes were **undefined** and rendered unstyled.

## Invalid / broken utilities found
| Location | Issue | Fix |
|---|---|---|
| `StatusChip.tsx` | `bg-gray-150` (invalid shade) | `bg-background-secondary` |
| `AnalyticsCharts.tsx` | `group-hover:r-7` (no such utility) | dedicated `.chart-point` CSS animating the SVG `r` property |
| `LoginHistoryPage.tsx` | `dark:hover:bg-gray-750` (invalid) | removed in full token rewrite |
| `global.css` `.glass-panel` | used `rgba(var(--bg-card), …)` which cannot resolve a hex var | `color-mix(in srgb, …)` |
| `SecurityDashboardPage.tsx` | `text-red-500` / `text-green-500` broke light mode | token status colors |

## Token changes introduced
- `--border-strong` (light `#cbd5e1`, dark `#334155`) — new semantic border for hover/high-contrast edges; wired as `border.strong` in `tailwind.config.js`.
- Deprecated aliases `--accent` → `var(--primary)` and `--secondary` → `var(--text-secondary)` so legacy inline styles (e.g. ProfilePage) resolve correctly.
- New `--success-hover`, `--warning-hover`, `--danger-hover` for hover states.

## Surfaces upgraded (summary)
- **Core kit**: Button, ButtonGroup, Cards, Input/Select/TextArea/DatePicker/Autocomplete + `inputClasses`, FormField, Badge, StatusChip, Skeleton, Pagination, Modal, Drawer, Toast, Avatar, Icon, ConfirmDialog, Table.
- **Layout**: Sidebar, Header, DashboardLayout (spacing `p-6 lg:p-8`), DashboardPage grids.
- **Pages**: SecurityDashboard, LoginHistory, SessionManagement (full token rewrites).
- **CRUD**: UsersPage, ProcessesPage, UnitsPage, VendorsPage plus all 8 form/detail modals migrated to tokens.

## Result
All surfaces now render from the same token palette; light/dark contrast is consistent; rounded corners
and shadows follow the design system (rounded-lg/xl, shadow-sm → shadow-md on hover); no invalid utilities remain.

## Files touched
`src/styles/global.css`, `tailwind.config.js`, `src/components/ui/*`, `src/components/layout/*`,
`src/pages/SecurityDashboardPage.tsx`, `src/pages/LoginHistoryPage.tsx`, `src/pages/SessionManagementPage.tsx`,
`src/modules/{users,processes,units,vendors}/*`.
