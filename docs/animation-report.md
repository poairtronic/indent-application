# Animation Report — IMCMS Enterprise ERP

## Baseline
All motion uses cubic-bezier easing for a premium enterprise feel. Default transition token:
`all 0.15s cubic-bezier(0.4, 0, 0.2, 1)`. A global `prefers-reduced-motion` block collapses all
animations/transitions to near-zero duration.

## Keyframes added (`global.css`)
| Keyframe | Use |
|---|---|
| `slide-in` (translateY 8px + fade) | generic content entrance |
| `fade-in` | overlays, backdrops |
| `scale-in` (0.96 → 1) | modals |
| `drawer-in` (translateX 100% → 0) | side drawers |
| `toast-in` (translateY 10px + fade) | toasts |

Exposed as `.animate-slide-in`, `.animate-fade-in`, `.animate-scale-in`, `.animate-drawer-in`, `.animate-toast-in`.

## Applied to components
- **Modal**: `animate-scale-in` panel + `animate-fade-in` backdrop with `backdrop-blur-sm`.
- **Drawer**: `animate-drawer-in` panel + `animate-fade-in` backdrop.
- **Toast**: `animate-toast-in`.
- **Button**: `active:scale-[0.99]` press feedback.
- **Cards**: `hover:shadow-md` + border color transitions; `QuickActionCard` adds `hover:-translate-y-0.5`.
- **Table rows**: `transition-colors` on hover.
- **Chart points** (`AnalyticsCharts`): new `.chart-point` rule transitions the SVG `r` property (5px → 7px)
  and brightens on hover. Replaces the invalid `group-hover:r-7` utility.

## Duration/curve guidance
- Entrance animations: 0.15–0.28s, `cubic-bezier(0.16, 1, 0.3, 1)` (decelerate).
- Hover/press micro-interactions: 0.15s `cubic-bezier(0.4, 0, 0.2, 1)`.
- Bar/progress growth: 0.5–0.7s ease-out.

## Reduced motion
Global `@media (prefers-reduced-motion: reduce)` sets all `animation-duration` and `transition-duration`
to `0.01ms`, disables iteration, and forces `scroll-behavior: auto`.
