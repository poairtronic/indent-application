# Spacing Report — IMCMS Enterprise ERP

## Baseline
- Spacing uses the Tailwind default scale (0.5 → 96). Content surfaces use `p-4`/`p-6`; page gutters use the
  layout container; table cells use `px-6 py-3` (headers) / `px-6 py-3.5` (rows).

## Changes applied

### Page containers
- CRUD page header cards: `p-6` with `bg-surface-card border border-border-default rounded-xl shadow-sm`
  (previously `rounded-lg p-6` without border).
- Table wrapper: `bg-surface-card border border-border-default rounded-xl shadow-sm` + `overflow-hidden`.

### Dashboard layout
- `DashboardLayout` main area: `p-6 lg:p-8` for a more comfortable reading gutter on large screens.
- KPI grid and quick-action grid: `gap-5` (consistent rhythm between cards).

### Tables
- Standardized vertical rhythm: header `px-6 py-3`, rows `px-6 py-3.5`. Row content spacing remains consistent
  across all four CRUD modules.
- Row hover surface `bg-background-secondary/70` gives a subtle grouping cue without extra padding.

### Cards
- `BaseCard` / `GlassCard`: `p-5`.
- `MetricCard`: icon container `rounded-xl`, `ring-1`, trend values aligned right.
- `QuickActionCard`: `rounded-xl p-5`, icon `rounded-xl ring-1`.

### Modal / Drawer
- Modal body keeps `p-6`; footer separated with `border-t` on a `bg-background-secondary/60` strip,
  `rounded-b-xl` to match the panel radius.
- Drawer header uses `tracking-tight` title; body inherits card spacing.

### Detail rows
- `py-2.5` with `sm:w-36` label column, `gap-4` between label and value, `border-b border-border-default last:border-0`.

## Guidelines
- Prefer `p-6` for page-level cards, `p-5` for nested/summary cards.
- Use `gap-5` for dashboard grids; `gap-3` for tight filter rows; `gap-1` for inline icon button groups.
- Always pair `rounded-xl` with `border-border-default` on raised surfaces.
