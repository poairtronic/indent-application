# Component Consistency Report — IMCMS Enterprise ERP

## Problem
Three styling conventions coexisted (token-based, raw `gray`/`slate` + `dark:` variants, legacy undefined
auth classes). This produced inconsistent radii, borders, shadows, and hover behavior between pages.

## Unification targets
All interactive and presentational surfaces now resolve to the same primitives:

| Primitive | Canonical classes |
|---|---|
| Raised surface | `bg-surface-card border border-border-default rounded-xl shadow-sm` |
| Input | `inputClasses` → `rounded-lg border-border-default bg-background-primary` + `focus:ring-2 ring-accent-primary/25` |
| Button (variants) | `bg-accent-primary`, `bg-background-secondary`, `bg-status-error`, ghost; `rounded-lg`, `focus-visible:ring-2 ring-offset`, `active:scale-[0.99]` |
| Badge / StatusChip | alpha-toned token backgrounds (`bg-status-success/12 text-status-success`, etc.) |
| Table header | `bg-background-secondary text-text-muted font-semibold uppercase tracking-wide` |
| Table row hover | `hover:bg-background-secondary/70 transition-colors` |
| Modal panel | `bg-surface-card rounded-xl shadow-2xl animate-scale-in` |
| Skeleton | `bg-surface-elevated border border-border-default/40` |
| Detail row | `py-2.5` + `sm:w-36` label + `border-border-default` dividers |

## Cross-page fixes applied
- **Users / Processes / Units / Vendors**: identical header card, search input (icon `text-text-muted`),
  table container, thead, and tbody classes.
- **Detail modals (8 total)**: unified `DetailRow` component pattern; avatar initials now `bg-accent-primary/10
  text-accent-primary ring-1 ring-border-default` instead of `bg-blue-100 dark:bg-blue-900/40`.
- **Badge**: rewritten tone map covers all statuses (blue, green, yellow, red, gray, accent) with consistent
  alpha backgrounds and matching foregrounds.
- **StatusChip**: invalid `bg-gray-150` replaced with the standard neutral surface.

## Remaining inconsistencies (documented)
- `CommandPalette.tsx` and `SettingsLayout` still use raw palette classes — recommended next pass.
- Legacy auth pages use `.auth-*` classes (now token-styled via `global.css`) rather than the new UI kit.
