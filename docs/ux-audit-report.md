# UX Audit Report — IMCMS Enterprise ERP

## Scope
Review of interaction quality, clarity, feedback, and affordances across the refined frontend. Focus areas:
perceivability of interactive elements, state feedback, empty/loading states, and hover behavior consistency.

## Findings & resolutions

### 1. Interactive affordance
- **Before**: row-level actions (edit/delete/view) were ghost icon buttons with no hover differentiation; many
  table rows had `cursor-pointer` but no hover feedback.
- **After**: table rows now show `hover:bg-background-secondary/70` with `transition-colors`; ghost buttons rely
  on the upgraded Button base (rounded-lg, hover surface, `active:scale-[0.99]`).

### 2. Loading & empty states
- Every data-backed page now branches `isLoading && !data → TableSkeleton`, `isError → ErrorState` with retry,
  `items.length === 0 → EmptyState` with contextual action (Clear filters / Create).
- Skeleton upgraded to `bg-surface-elevated border border-border-default/40` so it reads as an intentional
  placeholder in both themes.
- Security/Session pages show explicit "Never" / "Not tracked" text instead of empty or misleading dashes.

### 3. Feedback clarity
- Toast colors now use semantic tokens (`bg-status-success/error/accent-primary/status-warning`) with a
  `toast-in` entrance animation.
- Confirm dialogs use danger-tinted copy and error-tinted confirmation button for destructive actions.
- Modal/Drawer entrance animations (`scale-in`, `drawer-in`) make state transitions obvious without being slow.

### 4. Hierarchy & scanning
- Table headers upgraded from `font-medium` to `font-semibold uppercase tracking-wide text-text-muted` — clear
  column semantics.
- Detail modals use a consistent `DetailRow` pattern: uppercase label column (`sm:w-36`) + primary-text value.
- Form labels standardized via `FormField` (uppercase, semibold, letter-spaced).

### 5. Dark/light parity
- Fixed several light-mode-only contrast bugs (SecurityDashboard red/green text, LoginHistory badges).
- Hover rings and `:focus-visible` outlines are theme-aware via CSS vars.

## Residual notes (out of scope / accepted)
- Legacy auth pages still consume the `.auth-*` classes; they are now styled via `global.css` tokens instead of
  being rewritten. Login flow structure unchanged by design.
- Command palette (`CommandPalette.tsx`) and `SettingsLayout` were not included in this pass; recommend follow-up
  so they adopt tokens for full consistency.
