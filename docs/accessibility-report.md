# Accessibility Report — IMCMS Enterprise ERP

## Focus ring
- Global `:focus-visible` outline (`2px solid var(--primary)`, offset) in `@layer base` — consistent keyboard
  affordance across buttons, links, inputs, selects, textareas.
- Element-specific offsets tuned (`button/a/input/select/textarea` get `1px` offset to avoid clipping).
- Sidebar nav items, header icon buttons (theme toggle, notifications, profile, quick actions, search),
  table action buttons all carry `focus-visible` ring styles.

## ARIA & semantics
- **Modal**: rewritten with `useId`; `aria-labelledby` wired to the title element; dialog semantics preserved.
- **Drawer**: `role`/aria improvements; header title `tracking-tight` h2.
- **Notifications button**: `aria-label` + `aria-expanded`.
- **Table action buttons**: `aria-label` per row (e.g. `View ${name}`, `Edit ${name}`, `Delete ${name}`) —
  they are icon-only, so labels are mandatory.
- **Table**: sticky header with `z-10 bg-background-secondary` on both `<tr>` and per-`<th>` (required for
  correct paint under sticky positioning).

## Color & contrast
- Status colors are now semantic tokens (`text-status-success`, `text-status-error`, `text-status-warning`)
  so light-mode text is never low-contrast red-on-red or green-on-green.
- Alpha-toned badges keep foreground text on the same hue family with sufficient contrast against `bg-surface-card`.
- `placeholder:text-text-disabled` across all inputs.

## Motion
- Global `prefers-reduced-motion` support (see Animation Report).

## Residual
- No automated a11y test runner (axe) is wired into CI; recommend adding `vitest-axe` / `@axe-core/react` in a
  follow-up. No keyboard-trapping issues introduced; focus stays with existing browser behaviors.
