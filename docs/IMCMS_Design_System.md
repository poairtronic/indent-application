# IMCMS Enterprise Design Language System

This document specifies the official design language, style tokens, reusable UI component interfaces, and design specifications for the **Enterprise Manufacturing Indent & Costing Management System (IMCMS)**.

---

## 1. Design Tokens System

We use CSS Custom Properties mapped under the `:root` level to control the look and feel of light, dark, and system themes. Colors, shadows, borders, and margins are controlled by tokens; **hardcoded HEX/RGB values inside React components are prohibited**.

### 1.1 Brand & Semantic Colors

| Semantic Key | CSS Property Reference | Light Mode Value | Dark Mode Value |
| :--- | :--- | :--- | :--- |
| **Primary (Brand)** | `--primary` | `#4f46e5` (Indigo-600) | `#6366f1` (Indigo-500) |
| **Success** | `--success` | `#10b981` (Emerald-500) | `#34d399` (Emerald-400) |
| **Warning** | `--warning` | `#f59e0b` (Amber-500) | `#fbbf24` (Amber-400) |
| **Danger** | `--danger` | `#ef4444` (Red-500) | `#f87171` (Red-400) |
| **Main Background** | `--bg-main` | `#f8fafc` (Slate-50) | `#0f172a` (Slate-900) |
| **Card Surface** | `--bg-card` | `#ffffff` | `#1e293b` (Slate-800) |
| **Primary Text** | `--text-main` | `#0f172a` (Slate-900) | `#f8fafc` (Slate-50) |
| **Muted Text** | `--text-muted` | `#64748b` (Slate-500) | `#94a3b8` (Slate-400) |
| **Default Border** | `--border-color` | `#e2e8f0` (Slate-200) | `#334155` (Slate-700) |

### 1.2 Layout & Spacing Scales

| Token Name | Value | Purpose |
| :--- | :--- | :--- |
| `--space-xs` | `0.25rem` (4px) | Compact alignments, tight labels |
| `--space-sm` | `0.5rem` (8px) | Button paddings, label margins |
| `--space-md` | `1rem` (16px) | Card internal padding, form gaps |
| `--space-lg` | `1.5rem` (24px) | Page canvas headers padding |
| `--space-xl` | `2rem` (32px) | Auth container block spacing |

### 1.3 Radius & Elevation (Borders & Shadows)

- **Radius Scale:**
  - Compact elements (badges, chips): `--radius-sm` = `4px`
  - Base inputs and buttons: `--radius-md` = `8px`
  - Cards, panels, modals: `--radius-lg` = `12px`
- **Elevation Shadows:**
  - Soft overlay panels: `--shadow-sm` = `0 1px 3px rgba(0,0,0,0.1)`
  - Cards / Tables: `--shadow-md` = `0 4px 6px -1px rgba(0,0,0,0.1)`
  - Modals / Drawers: `--shadow-lg` = `0 20px 25px -5px rgba(0,0,0,0.3)`

---

## 2. Typography Rules

We use **Inter** as the primary font family to optimize legibility on high-density data tables.

* **Body Text:** `14px` (`0.875rem`), Regular (`400`) / Medium (`500`)
* **Page Titles:** `24px` (`1.5rem`), Semi-bold (`600`) / Bold (`700`)
* **Metric Numbers:** `36px` (`2.25rem`), Bold (`800`)
* **Monospace Data:** Code fonts for serials, UUIDs, and money formats: `font-mono`.

---

## 3. Micro Animations Specification

Animations must remain professional, subtle, and fast. Longer transitions are restricted to preserve GPU rendering performance.

* **Standard Transitions:** `--transition` = `all 0.15s cubic-bezier(0.4, 0, 0.2, 1)`
* **Hover Card Lift:** Elements lift upwards slightly on focus: `transform: translateY(-2px)`
* **Fade Actions:** Drawer and backdrop overlays fade in over `0.2s`.

---

## 4. Reusable Component Guidelines

All future components must support:
1. **Accessibility (WCAG AA Compliance):** 
   - Strict labels (`aria-label`, `aria-hidden`).
   - Focus indicators (`focus:ring-2 focus:ring-primary`).
2. **Theme Sensitivity:** Automatic class shifts on dark mode (classes prepended with `dark:`).
3. **Responsive Grid Scaling:** Clean flex wrappers adjusting layout grids based on device screen sizes.
