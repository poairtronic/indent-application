# Typography Report — IMCMS Enterprise ERP

## Baseline
- Font stack: `Inter, system-ui, -apple-system, sans-serif` via `--font-sans` (already configured in `global.css`).
- Base: `-webkit-font-smoothing: antialiased`, `font-feature-settings: 'cv02','cv03','cv04','cv11'` applied in `@layer base`.
- Scale follows the design system: page titles `text-2xl`, cards/headers `text-base/2xl`, body `text-sm`, labels `text-xs`.

## Changes applied

### Page titles
- CRUD page titles (Users, Processes, Units, Vendors) unified to `text-2xl font-bold text-text-primary tracking-tight`
  with a `text-text-muted` subtitle. Previously raw `text-gray-900 dark:text-white`.

### Table headers
- Unified to `text-xs font-semibold uppercase tracking-wide text-text-muted` across Users, Processes, Units, Vendors
  and all rewritten pages. Previously `text-xs font-medium` (visual inconsistency between pages).

### Detail modal rows
- Consistent pattern: label `text-xs font-semibold uppercase tracking-wide text-text-muted`, value
  `text-sm text-text-primary break-words`. Previously `text-gray-500 dark:text-gray-400` labels.

### Form labels (`FormField`)
- `text-xs font-semibold uppercase tracking-wide text-text-secondary`, `mb-1.5`. Matches the `.form-label` style
  used by legacy auth pages.

### Numeric / data emphasis
- Metric values in cards use the card's existing strong text; trend deltas use `text-status-success` /
  `text-status-error` tokens instead of raw `text-green-500` / `text-red-500`.

## Guidelines
- Never use `text-gray-*` / `text-slate-*` for text; use `text-text-primary/secondary/muted/disabled`.
- Preserve `tracking-tight` on page titles and `tracking-wide` on uppercase labels — this is the IMCMS hierarchy.
- Keep body copy at `text-sm`; use `font-medium`/`font-semibold` rather than new sizes for emphasis.
