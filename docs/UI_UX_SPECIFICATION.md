# UI/UX REFACTORING & DESIGN SYSTEM SPECIFICATION
## IMCMS UI/UX Modernization Specification (Post Phase 8C)

**Project:** Enterprise Manufacturing Indent & Costing Management System (IMCMS)  
**Document Type:** Frontend Presentation-Layer Refactoring & Design System Specification  
**Version:** 1.0  
**Status:** Approved  
**Constraint:** Presentation-Layer Refactor Only (Backend Architecture & APIs Immutable)  

---

# 1. Executive Direction & Strict Boundaries

> [!IMPORTANT]
> The backend architecture, REST API contracts, database schema, NestJS services, JWT authentication, RBAC authorization, and business workflow state machine (completed through Phase 8C) are **IMMUTABLE**.  
> The AI MUST NOT rewrite backend code, alter database tables, rename modules, modify Prisma schemas, or change API endpoints. This refactoring is strictly a **frontend presentation-layer update**.

### Strict AI Rules & Constraints

The AI MUST NOT:
- Redesign backend architecture.
- Create new backend APIs unless explicitly requested and approved.
- Change database tables or Prisma models.
- Rename NestJS or React modules.
- Modify workflow state machines or approval rules.
- Change RBAC, guards, or JWT authentication.
- Modify backend DTOs or validation logic.
- Rewrite business logic.
- Remove existing application functionality.

The AI MUST ONLY improve:
- User Interface (UI)
- User Experience (UX)
- Design System & Theme Tokens
- Component Library
- Layout Spacing & Typography
- Responsiveness & Micro-animations
- Accessibility (WCAG 2.1 AA)

---

# 2. Design System & Theme Tokens

All colors, typography, spacing, shadows, and border-radii MUST be imported from centralized theme tokens (`src/theme/`). Hardcoded hex colors in components are strictly prohibited.

### 2.1 Refined Enterprise Dark Color Palette

| Token Name | Hex Code | Usage |
| --- | --- | --- |
| **Primary Background** | `#0F172A` | Main page background |
| **Secondary Background** | `#111827` | Sidebar / Secondary background |
| **Surface Card** | `#1E293B` | Main card / Content container background |
| **Elevated Surface** | `#243244` | Modals, Drawers, Dropdowns, Hovered cards |
| **Border Color** | `#334155` | Dividers, Card borders, Input outlines |
| **Primary Accent** | `#3B82F6` | Primary action buttons, Active navigation, Links |
| **Primary Accent (Hover)** | `#2563EB` | Button hover state |
| **Primary Accent (Pressed)**| `#1D4ED8` | Active click state |
| **Success Status** | `#22C55E` | Approved / Validated / Success badges |
| **Warning Status** | `#F59E0B` | Pending / SLA Warning badges |
| **Error Status** | `#EF4444` | Rejected / Critical Alert badges |
| **Text Primary** | `#F8FAFC` | Main headings, Primary text |
| **Text Secondary** | `#CBD5E1` | Subtitles, Table data, Body text |
| **Text Muted** | `#94A3B8` | Input placeholders, Disabled text |
| **Text Disabled** | `#64748B` | Inactive elements, Disabled buttons |

---

# 3. Component Architecture (`src/components/`)

Create and maintain a standardized, modular enterprise component library:

```
src/
├── theme/
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   ├── radius.ts
│   ├── shadow.ts
│   └── animation.ts
└── components/
    ├── Button.tsx
    ├── Input.tsx
    ├── Card.tsx
    ├── Table.tsx
    ├── Badge.tsx
    ├── Avatar.tsx
    ├── Modal.tsx
    ├── Drawer.tsx
    ├── Dropdown.tsx
    ├── Tabs.tsx
    ├── StatCard.tsx
    ├── ChartCard.tsx
    ├── SearchBar.tsx
    ├── FilterPanel.tsx
    ├── PageHeader.tsx
    ├── EmptyState.tsx
    ├── LoadingSkeleton.tsx
    ├── Timeline.tsx
    └── Stepper.tsx
```

---

# 4. Detailed Component Refactoring Guidelines

### 4.1 Sidebar & Header Navigation
- **Sidebar:** Clean, collapsible panel with rounded active state pills, subtle hover animations, custom scrollbars, and a polished user profile footer card. Keep existing navigation links intact.
- **Top Header:** Modern breadcrumbs, global search bar with keyboard shortcut indicator (`Ctrl + K`), dynamic unread notification popover badge, user profile menu, and status indicators.

### 4.2 Dashboard & Analytics Cards
- **Stat Cards:** Generous padding (`p-6`), rounded corners (`rounded-xl`), soft elevated shadows, trend indicators (+% / -%), and consistent accent icon containers.
- **Charts:** Maintain existing React Query / Axios data hooks. Redesign container cards, titles, legends, tooltips, loading skeletons, and empty state fallbacks.

### 4.3 Enterprise Tables & Data Grids
- **Header:** Sticky header with subtle background blur and distinct border.
- **Interactive Controls:** Built-in column sorting indicators, search filter inputs, pagination controls, and column resizing support.
- **Feedback:** Clean skeleton loaders during data fetch and styled empty state placeholders when no records match.

### 4.4 Form Controls & Modals
- **Form Controls:** Standardized input, select, textarea, checkbox, switch, radio, date picker, and file uploader styles with floating/clear labels, helper text, and distinct focus ring (`ring-2 ring-blue-500`).
- **Reusable Modal:** Single, highly accessible modal component featuring backdrop blur (`backdrop-blur-md`), keyboard traps (`Esc` to close), focus locking, and smooth entrance/exit micro-animations.

---

# 5. Accessibility & Performance Requirements

- **Accessibility:** Full keyboard navigation (`Tab`, `Esc`, Arrow keys), ARIA labels (`aria-expanded`, `aria-modal`), visible focus indicators, and high contrast compliant with WCAG 2.1 AA.
- **Performance:** Component memoization (`React.memo`, `useMemo`), code splitting (`React.lazy`), and virtualized list rendering where applicable. No horizontal page overflow across Desktop, Laptop, Tablet, or Mobile screens.
