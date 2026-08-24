# 04 — Frontend User Manual & Behavior Guide

> Enterprise Manufacturing Indent & Costing Management System (MERC)

---

# PART A — USER MANUAL

---

## 1. Login

**Route:** `/login`

### What the User Sees
- Split-view layout: left side shows marketing copy ("Optimizing yield, tracking real-time cost"), right side shows glassmorphic login card
- MERC branding in top-left corner
- Theme toggle (light/dark) in top-right corner

### Form Fields
| Field | Type | Validation |
|---|---|---|
| Email | email input | Required, valid email format |
| Password | password input | Required, min 8 characters |

### Actions
1. Enter email and password
2. Click **Sign In**
3. On success: redirected to `/dashboard` (or `returnUrl` if provided)
4. On failure: error toast displayed
5. **Forgot Password?** link navigates to `/forgot-password`

### Business Rules
- 5 failed login attempts → account locked for 30 minutes → redirected to `/account-locked`
- Session timeout: 15 minutes of inactivity → auto-logout → redirected to `/session-expired`
- Multi-tab: logout on one tab syncs to all tabs via BroadcastChannel

---

## 2. Forgot Password

**Route:** `/forgot-password`

### What the User Sees
- Email input form
- Back to login link

### Form Fields
| Field | Type | Validation |
|---|---|---|
| Email | email input | Required, valid email |

### Actions
1. Enter email address
2. Click **Send Reset Link**
3. On success: message "If the email exists, a reset link has been sent"
4. Check email for reset link

### Business Rules
- Rate limited: 3 requests per 60 seconds
- Always shows success message regardless of email existence (prevents enumeration)

---

## 3. Reset Password

**Route:** `/reset-password?token=<uuid>`

### What the User Sees
- New password form (accessed via email link)

### Form Fields
| Field | Type | Validation |
|---|---|---|
| New Password | password input | Min 8 chars, must contain uppercase, lowercase, digit, special character |
| Confirm Password | password input | Must match new password |

### Actions
1. Enter new password
2. Click **Reset Password**
3. On success: redirected to login with success toast

### Business Rules
- Token expires in 1 hour
- All existing sessions and refresh tokens are revoked

---

## 4. Dashboard

**Route:** `/dashboard`

### Who Can Access
Any authenticated user.

### What the User Sees
- KPI cards: Total Transactions, Active, Completed, Archived, Pending
- Workflow stage distribution chart
- Department workload breakdown
- Recent activity feed
- Quick action buttons

### API Calls
- `GET /api/analytics/dashboard-overview` (consolidated dashboard data)

### Actions
- Click KPI cards to navigate to filtered indents
- Click department names to see department-specific indents
- Refresh button reloads dashboard data

---

## 5. Indent Management

### 5.1 Indent Dashboard

**Route:** `/indents`

**Permission Required:** `indent.view`

### What the User Sees
- List/grid toggle view
- Filter bar: Status, Department, Search
- Paginated table/grid of indents
- Each row shows: Indent Number, Product, Department, Status (workflow state), Priority, Created Date

### API Calls
- `GET /api/business-transactions?page=&limit=&state=&search=&departmentId=`

### Actions
- Click indent row → Navigate to `/indents/:id`
- Click **Create Indent** → Navigate to `/indents/create`
- Filter by status (workflow state)
- Filter by department
- Search by indent number or product name
- Change page

### Empty State
"No indents found. Create your first indent."

### Error State
"Failed to load indents" with retry button.

---

### 5.2 Create Indent

**Route:** `/indents/create`

**Permission Required:** `indent.create`

### What the User Sees
- Multi-section form for Indent Sheet + Process Cost Sheet
- Product selection (dropdown or auto-create)
- Department selection (dropdown or auto-create)
- Items table (add/remove material items)
- Process table (add/remove manufacturing processes)
- Attachment upload area

### Form Fields — Indent Section
| Field | Type | Validation | Required |
|---|---|---|---|
| Product | select/search | — | Yes |
| Department | select/search | — | Yes |
| Description | textarea | Min 10 chars | Yes |
| Priority | select | LOW, MEDIUM, HIGH, URGENT | Yes |
| Customer Name | text | — | No |
| Layout Number | text | — | No |
| Remarks | textarea | — | No |

### Form Fields — Items Table
| Field | Type | Validation | Required |
|---|---|---|---|
| Material Name | text/search | — | Yes |
| Quantity | number | Min 0 | Yes |
| Unit | select | — | Yes |
| Shape | select | ROUND, PRISMATIC | No |
| Dimensions | dynamic fields | Based on shape | No |

### Form Fields — Processes Table
| Field | Type | Validation | Required |
|---|---|---|---|
| Process Name | select/search | — | Yes |
| Sequence | number | Min 1 | Yes |
| Estimated Hours | number | Min 0 | No |
| Estimated Input Qty | number | Min 0 | No |
| Estimated Output Qty | number | Min 0 | No |
| Estimated Scrap Qty | number | Min 0 | No |

### Form Fields — Cost Sheet Section
| Field | Type | Validation | Required |
|---|---|---|---|
| Design Cost | number | Min 0 | No |
| Overhead Cost | number | Min 0 | No |
| Contingency Cost | number | Min 0 | No |
| Cost Items | table | Per-row validation | No |
| Process Costs | table | Per-row validation | No |

### Actions
1. Fill in all required fields
2. Click **Save Draft** → Creates DRAFT transaction
3. Click **Submit** → Creates and immediately submits (DRAFT → DESIGN_COMPLETED)
4. Click **Cancel** → Returns to indent list

### API Calls
- `POST /api/business-transactions` (create)
- `POST /api/business-transactions/:id/submit` (submit)

### Success Behavior
- Toast: "Business Transaction created successfully"
- Navigate to `/indents/:id`

### Error Behavior
- Validation errors shown inline on fields
- General error shown as toast

---

### 5.3 Indent Details

**Route:** `/indents/:id`

**Permission Required:** `indent.view`

### What the User Sees
- Header: Indent Number, Product, Status, Priority
- Workflow Timeline (visual progress bar showing all 11 states)
- Indent Details section (all fields)
- Items table with material details
- Process table with estimated vs actual
- Cost Sheet section (predicted vs actual costs)
- Attachments section
- Activity Feed (audit history)
- Action buttons (based on current state and user role)

### Workflow Timeline
- Visual representation of the 11-state workflow
- Completed states shown in green
- Current state highlighted
- Future states shown in gray
- Loop boundary between PRODUCTION_COMPLETED and ACCOUNTS_COST_VERIFICATION marked

### API Calls
- `GET /api/business-transactions/:id`

### Available Actions by State

| Current State | Actions Available | Who Can Act |
|---|---|---|
| DRAFT | Edit, Submit | Design Engineer (indent.edit, indent.submit) |
| DESIGN_COMPLETED | Verify Stock | Stores Executive (stores.issue) |
| STORES_PROCESSING | Issue Materials | Stores Executive (stores.issue) |
| MATERIALS_ISSUED | Receive Materials | Production Executive (production.update) |
| PRODUCTION_PROCESSING | Start, Update Progress, Complete | Production Executive (production.update) |
| PRODUCTION_COMPLETED | Start Verification | Accounts Executive (accounts.verify) |
| ACCOUNTS_COST_VERIFICATION | Enter Actual Costs | Accounts Executive (accounts.verify) |
| ACTUAL_COST_UPDATED | Financial Closure | Accounts Executive (accounts.close) |
| ACCOUNTS_FINANCIAL_CLOSURE | Archive | Admin (system.archive) |
| ARCHIVED | Complete | Admin (system.complete) |
| COMPLETED | None (terminal) | — |

---

### 5.4 Edit Indent

**Route:** `/indents/:id/edit`

**Permission Required:** `indent.edit` OR `accounts.verify` OR `costsheet.update`

### Business Rules
- Only allowed in states: DRAFT, PRODUCTION_PROCESSING, ACCOUNTS_COST_VERIFICATION
- Requires `settings.manage` permission if editing in non-draft states

---

## 6. Cost Sheet Management

### 6.1 Cost Sheet Dashboard

**Route:** `/cost-sheets`

**Permission Required:** `costsheet.view`

### What the User Sees
- List of cost sheets with indent number, predicted total, actual total, variance, status
- Filter and search options

### API Calls
- `GET /api/business-transactions?` (filtered to show cost sheet data)

---

### 6.2 Cost Sheet Details

**Route:** `/cost-sheets/:id`

**Permission Required:** `costsheet.view`

### What the User Sees
- Cost sheet header: number, status, linked indent
- Predicted vs Actual cost breakdown
- Cost items table with per-item variance
- Process costs table
- Design, overhead, contingency cost comparison
- Variance chart (predicted vs actual)
- Financial summary widget

---

## 7. Workflow Management

**Route:** `/workflow`

**Permission Required:** `workflow.view`

### What the User Sees
- Workflow overview showing all 11 states
- Count of transactions in each state
- Bottleneck identification
- Stalled transactions (>48 hours in same state)

### API Calls
- `GET /api/analytics/workflow`

---

## 8. Production

**Route:** `/production`

**Permission Required:** `production.view`

### What the User Sees
- Production queue (transactions in PRODUCTION_PROCESSING state)
- Material receipt tracking
- Production progress updates
- Completion status

---

## 9. Master Data Management

### 9.1 Materials

**Route:** `/materials`

**Permission Required:** `materials.view`

### What the User Sees
- Paginated list of materials
- Each row: Code, Name, Unit, Category, Current Stock, Status
- Create/Edit/Delete actions (role-dependent)

### Actions
- **Create Material:** Opens modal with form (materialCode, materialName, unit, category, density, stock levels)
- **Edit Material:** Opens modal with pre-filled form
- **Delete Material:** Confirmation dialog → soft delete
- **View Material:** Opens detail modal

### API Calls
- `GET /api/materials`
- `POST /api/materials`
- `PUT /api/materials/:id`
- `DELETE /api/materials/:id`

---

### 9.2 Products

**Route:** `/products`

**Permission Required:** `products.view`

### What the User Sees
- Paginated list of products
- Each row: Code, Name, Department, Drawing Number, Status
- CRUD actions

---

### 9.3 Departments

**Route:** `/departments`

**Permission Required:** `departments.view` (or any workflow permission)

### What the User Sees
- List of departments
- Each row: Code, Name, Status
- No create/edit (seeded data)

---

### 9.4 Vendors

**Route:** `/vendors`

**Permission Required:** `vendors.view`

### What the User Sees
- Paginated list of vendors
- Each row: Code, Name, Email, Phone, GST, Status
- CRUD + Restore actions

---

### 9.5 Units

**Route:** `/units`

**Permission Required:** `units.view`

### What the User Sees
- List of measurement units
- Each row: Code, Name, Description
- CRUD + Restore actions

---

### 9.6 Manufacturing Processes

**Route:** `/manufacturing-processes`

**Permission Required:** `manufacturing-processes.view`

### What the User Sees
- List of manufacturing processes
- Each row: Name, Description, Estimated Cycle Time, Status
- CRUD + Restore actions

---

## 10. Analytics

### 10.1 Analytics Summary

**Route:** `/analytics`

**Permission Required:** `analytics.view`

### What the User Sees
- Executive summary cards
- Transaction status breakdown
- Key performance indicators

---

### 10.2 Workflow Analytics

**Route:** `/analytics/workflow`

### What the User Sees
- Stage distribution chart
- Completion rate
- Average cycle time
- Bottleneck identification
- Stalled transactions

---

### 10.3 Department Analytics

**Route:** `/analytics/departments`

### What the User Sees
- Department workload comparison
- Highest workload department
- Transaction counts per department

---

### 10.4 Cost Analytics

**Route:** `/analytics/costs`

### What the User Sees
- Total planned vs actual cost
- Variance analysis
- Average variance percentage
- Date range filtering

---

### 10.5 Product Analytics

**Route:** `/analytics/products`

### What the User Sees
- Most produced products
- Highest cost products
- Lowest cost products

---

### 10.6 Vendor Analytics

**Route:** `/analytics/vendors`

### What the User Sees
- Vendor usage frequency
- Best performing vendor
- Vendor cost comparison

---

## 11. Reports

### 11.1 Reports Dashboard

**Route:** `/reports`

**Permission Required:** `reports.view`

### What the User Sees
- Report categories: Production, Cost, Master Data, Workflow
- Available reports per category
- Export options (Excel/PDF) where available

---

### 11.2 Report Detail

**Route:** `/reports/:category/:reportId`

### What the User Sees
- Report data table
- Filters and search
- Export button (Excel/PDF)

### Available Reports

| Category | Report | Export |
|---|---|---|
| Production | Daily Production Summary | Excel, PDF |
| Production | Process Yield | Not available (V1.0) |
| Production | Machine Utilization | Not available (V1.0) |
| Cost | Actual vs Predicted | Excel, PDF |
| Cost | Material Breakdown | Excel, PDF |
| Cost | Department Budget | Not available (V1.0) |
| Master Data | Vendor Performance | Excel, PDF |
| Master Data | Product Catalog | Excel, PDF |
| Workflow | Bottleneck Analysis | Excel, PDF |

---

## 12. Notifications

**Route:** `/notifications`

**Permission Required:** `notifications.view`

### What the User Sees
- Notification list with read/unread status
- Filter by type and read status
- Unread count badge in header

### Notification Filtering
Results are filtered by department-based RBAC:
- Admin sees all
- SM/GM see all event types
- Department users see only events relevant to their department

### Actions
- Click notification → Mark as read + navigate to related indent
- **Mark All Read** button → Marks all as read
- Pagination

---

## 13. User Management

**Route:** `/users`

**Permission Required:** `users.view`

### What the User Sees
- Paginated user list
- Each row: Employee Code, Name, Email, Department, Role, Status
- Create/Edit/Delete/Restore actions

### Create User Form
| Field | Required |
|---|---|
| Employee Code | Yes |
| First Name | Yes |
| Last Name | Yes |
| Email | Yes |
| Phone | No |
| Password | Yes (min 8, complexity) |
| Department | Yes |
| Role | Yes |
| Status | No (default ACTIVE) |

---

## 14. Roles & Permissions

### 14.1 Roles

**Route:** `/roles`

**Permission Required:** `roles.view`

### What the User Sees
- List of roles with permission counts and user counts
- System roles marked with badge
- Create/Edit/Delete actions (system roles cannot be deleted)

### Role Permissions Assignment
- Click role → View/edit permissions
- Permissions grouped by module
- Toggle individual permissions
- Save replaces all permissions (not additive)

---

### 14.2 Permissions

**Route:** `/permissions`

**Permission Required:** `permissions.view`

### What the User Sees
- List of all permission codes
- Filter by module
- Grouped by module

---

## 15. Settings

### 15.1 System Configuration

**Route:** `/settings`

**Permission Required:** `settings.manage`

### What the User Sees
- Application settings organized by category
- Editable key-value pairs
- SMTP configuration
- Application metadata

---

### 15.2 Profile

**Route:** `/profile`

### What the User Sees
- Current user profile information
- Avatar
- Name, email, phone
- Department and role
- Account status
- Edit profile (limited fields)

---

### 15.3 Change Password

**Route:** `/change-password`

### What the User Sees
- Current password field
- New password field with strength indicator
- Confirm new password field

---

### 15.4 Security Dashboard

**Route:** `/security`

### What the User Sees
- Account security status
- Failed login attempts
- Last login time
- Active sessions count
- Lock/unlock account button

---

### 15.5 Active Sessions

**Route:** `/sessions`

### What the User Sees
- List of active sessions
- Each row: IP, Browser, Last Active, Status
- Revoke individual session
- Logout other sessions
- Logout all sessions

---

### 15.6 Login History

**Route:** `/login-history`

### What the User Sees
- Login history log
- Each row: Email, IP, Browser, Status (SUCCESS/FAILED), Timestamp

---

## 16. Audit Logs

**Route:** `/audit-logs`

**Permission Required:** `audit.view`

### What the User Sees
- Paginated audit log entries
- Each row: Timestamp, User, Action, Module, Description
- Filter by module, action
- Search by description

---

## 17. Communication

**Route:** `/communication`

**Permission Required:** `audit.view`

### What the User Sees
- Email log entries
- Queue health status
- Test email button (admin only)
- Queue metrics (admin only)

---

## 18. Monitoring

**Route:** `/monitoring`

**Permission Required:** `settings.manage`

### What the User Sees
- System health indicators (database, queue)
- API metrics
- Redis metrics (all zeroes — Redis removed)
- Workflow transition metrics
- Authentication event metrics
- Notification metrics
- Node.js metrics
- Frontend error telemetry

---

## 19. Error Pages

| Route | Page | Description |
|---|---|---|
| `/unauthorized` | Unauthorized | 403 — No permission |
| `/account-locked` | Account Locked | Account locked after 5 failed attempts |
| `/session-expired` | Session Expired | 15-min inactivity timeout |
| `/500` | Server Error | 500 — Backend error |
| `/maintenance` | Maintenance | System under maintenance |
| `*` | Not Found | 404 — Page not found |

---

# PART B — FRONTEND DEVELOPMENT GUIDE

---

## 20. Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── main.tsx           # Entry point, error telemetry
│   │   ├── App.tsx            # Root component
│   │   ├── providers.tsx      # Provider stack
│   │   └── router.tsx         # Route definitions (519 lines)
│   │
│   ├── api/
│   │   ├── client/index.ts    # Axios singleton (135 lines)
│   │   ├── config/index.ts    # Environment config
│   │   ├── constants/index.ts # Timeouts, pagination, retry
│   │   ├── errors/index.ts    # Error class hierarchy (213 lines)
│   │   ├── interceptors/      # Auth, error, headers, logging
│   │   ├── hooks/             # React Query integration
│   │   ├── services/          # 16 domain service modules
│   │   ├── types/             # TypeScript interfaces
│   │   └── utils/             # Query builder, filters, retry
│   │
│   ├── store/                 # 8 Zustand stores
│   ├── hooks/                 # 7 custom hooks
│   ├── constants/             # 8 constant files
│   ├── config/                # Menu configuration
│   ├── types/                 # 10 domain type files
│   ├── styles/                # Design tokens + global CSS
│   ├── utils/                 # 9 utility files
│   ├── components/
│   │   ├── common/            # ProtectedRoute, ErrorBoundary, OfflineBanner
│   │   ├── layout/            # 9 layout components
│   │   └── ui/                # 40+ custom UI components
│   ├── modules/               # 16 business modules
│   ├── pages/                 # 13 page components
│   └── test/                  # Unit tests
├── e2e/                       # Playwright E2E tests
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
└── tailwind.config.js
```

---

## 21. Component Architecture

### Provider Stack (Outside → Inside)
1. `GlobalErrorBoundary` — catches render crashes
2. `QueryClientProvider` — TanStack Query
3. `BrowserRouter` — React Router
4. `OfflineBanner` — network status indicator

### Layout Hierarchy
- `AuthLayout` — Split-view login page
- `DashboardLayout` — Sidebar + Header + Breadcrumbs + Outlet
- `SettingsLayout` — Left sub-nav + content area

### Lazy Loading Pattern
Every route uses `React.lazy()`:
```tsx
const IndentDashboardPage = React.lazy(() => import('./modules/indent/IndentDashboardPage'));
```

---

## 22. State Management

### Zustand Stores

| Store | File | Persistence | Purpose |
|---|---|---|---|
| `authStore` | `store/authStore.ts` | localStorage | User, tokens, permissions |
| `themeStore` | `store/theme.store.ts` | localStorage | Light/dark/system theme |
| `settingsStore` | `store/settingsStore.ts` | localStorage | Data density, notifications, currency |
| `useIndentStore` | `store/useIndentStore.ts` | Session | View mode, filters |
| `notificationStore` | `store/notification.store.ts` | Session | Notification list |
| `securityStore` | `store/securityStore.ts` | Session | Sessions, login history |
| `sidebarStore` | `store/sidebar.store.ts` | Session | Sidebar toggle |
| `navigationStore` | `store/navigation.store.ts` | localStorage | Favorites, recent paths |

### TanStack Query Configuration
- Stale time: 5 minutes
- GC time: 10 minutes
- Retry: No retry on 4xx, bounded retry on network/server errors
- Exponential backoff: 1s → 2s → 4s → 8s max
- No refetch on window focus

---

## 23. API Layer

### Service Pattern
Each domain module follows:
```
api/services/<module>/
  ├── service.ts    # Extends BaseService, defines API calls
  ├── hooks.ts      # React Query hooks (useQuery, useMutation)
  ├── types.ts      # TypeScript interfaces
  └── index.ts      # Barrel export
```

### BaseService Methods
- `get<T>()`, `post<T>()`, `put<T>()`, `patch<T>()`, `delete<T>()`
- `getList<T>()` — handles pagination format conversion
- `create<T>()`, `update<T>()`, `remove<T>()`
- `upload<T>()`, `download()`

### Query Key Factory
```typescript
queryKeys.indents.list(filters)  // ['api', 'list', 'indents', filters]
queryKeys.indents.detail(id)     // ['api', 'detail', 'indents', id]
```

### Error Handling
- Axios interceptors catch 401 (token refresh), 403 (forbidden), network errors
- Token refresh: single-flight queue, max 3 attempts, 10s timeout
- Multi-tab optimization: checks if another tab already refreshed

---

## 24. Routing

### Route Definitions
All routes defined in `src/app/router.tsx` (519 lines).

### Route Groups
- **Public:** Login, forgot-password, reset-password, error pages
- **Protected:** All application routes (require auth + permission)
- **Settings:** Nested under SettingsLayout (left sub-nav)

### Permission-Based Access
`ProtectedRoute` component checks:
1. `isAuthenticated` from authStore
2. `hasAnyPermission()` against required permissions
3. Redirects to `/login` if unauthenticated
4. Redirects to `/unauthorized` if unauthorized

---

## 25. Forms & Validation

### Form Library
- React Hook Form for form state management
- Zod schemas for validation
- `@hookform/resolvers` for integration

### Validation Patterns
- Client-side: Zod schemas validate before submission
- Server-side: NestJS ValidationPipe validates DTOs
- Error display: Inline field errors + toast for general errors

---

## 26. Design System

### Design Tokens
Defined in `src/styles/tokens.css` (234 lines):
- CSS custom properties for colors, typography, spacing, shadows
- Light and dark mode variants
- Workflow status colors (design=purple, stores=blue, production=amber, accounts=green, completed=gray)

### Global Styles
Defined in `src/styles/global.css` (629 lines):
- Glassmorphism classes (`.glass-panel`, `.glass-surface`)
- Hover effects (`.sheen`, `.hover-lift`)
- Skeleton shimmer loading
- KPI card system
- Reduced motion support
- Data density modes (compact/comfortable)

### Tailwind Configuration
- Dark mode: `class` strategy
- Custom color tokens mapped to CSS properties
- Custom shadows, gradients, transitions
- Inter as primary font

---

## 27. Performance Optimizations

### Code Splitting
- Every route lazy-loaded via `React.lazy()`
- Layouts lazy-loaded
- Components like NotificationDrawer and CommandPalette lazy-loaded

### Data Fetching
- TanStack Query with 5min stale time
- Route-based prefetching via `usePrefetch` hook
- Hover prefetch on navigation items

### Request Optimization
- Axios request deduplication
- Query key-based cache invalidation
- Abort controller for cancelled requests

### Rendering
- React 19 concurrent features
- `Suspense` boundaries for loading states
- Skeleton loading placeholders

---

## 28. Testing

### Unit Tests (Vitest)
- Framework: Vitest with jsdom environment
- Setup: `@testing-library/jest-dom` matchers
- Test files in `src/test/` and `src/tests/`
- Coverage via Vitest

### E2E Tests (Playwright)
- Framework: Playwright
- Test files in `e2e/`
- Base URL: `http://localhost:5173`
- WebServer: Auto-starts dev server

### Test Commands
```bash
npm run test          # Watch mode
npm run test:run      # Single run
npm run lint          # ESLint
```

---

## 29. Build & Deployment

### Development
```bash
npm run dev           # Vite dev server (port 5173)
```

### Production Build
```bash
npm run build         # tsc -b && vite build
```

### Preview
```bash
npm run preview       # Preview production build
```

### Deployment
- **Platform:** Render.com (Static Site)
- **Build:** `npm install && npm run build`
- **Output:** `dist/` directory
- **SPA Rewrite:** `/* → /index.html`

---

## 30. Environment Variables

| Variable | Purpose | Default |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | `/api` |
| `VITE_SOCKET_URL` | Socket URL | `/` |
| `VITE_APP_NAME` | Application name | `Indent Application` |

---

*All frontend behaviors documented from actual component implementations, router definitions, and store logic.*
