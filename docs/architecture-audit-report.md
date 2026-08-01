# IMCMS — Enterprise Architecture Audit Report

**System:** Enterprise Manufacturing Indent & Costing Management System (IMCMS)
**Audited by:** opencode (Enterprise Solution Architect role)
**Audit scope:** Architecture only — modular monolith, layering, SOLID, DI, provider/repository, shared/infrastructure/feature modules, config, API layer, event-driven design, notifications, communication, analytics, queue architecture, naming, folder organization, imports, circular deps, global/dynamic modules.
**Excluded:** Business logic correctness, syntax, unit testing.
**Date:** Aug 01, 2026

---

## 1. System Overview & Technology Stack

| Layer | Stack |
|---|---|
| Backend | NestJS 11, Prisma 6 (PostgreSQL), BullMQ + ioredis (Redis), Nodemailer, Passport-JWT, class-validator, @nestjs/swagger |
| Frontend | React 19.2.7, Vite 8.1.1, TypeScript 6.0.2, Zustand 5, TanStack React Query 5, react-router-dom 7, react-hook-form, zod 4, axios |
| Database | PostgreSQL via Prisma (`database/schema.prisma`) — User, Role, Permission, Department, Product, Material, Process, Unit, Vendor, Indent, CostSheet, AMR, WorkflowState, Notifications, AuditLog, ActivityLog, EmailLog, UserSession, RefreshToken |
| CI | `.github/workflows/ci.yml` — lint + build (frontend), lint + test + build (backend) |

### Implemented Modules (Backend)
`Prisma`, `Auth`, `Users`, `Roles`, `Permissions`, `Indent`, `Processes`, `Units`, `Vendors`, `BusinessTransaction`, `Analytics`, `Communication` (+ `Queue` submodule).

### Empty / Stub Modules (Backend — `.gitkeep` only)
`approvals`, `audit`, `costing`, `dashboard`, `departments`, `email`, `inventory`, `materials`, `notifications`, `production`, `products`, `reports`, `upload`, `workflow` — **14 planned-but-unimplemented modules**.

---

## 2. Architecture Report

### 2.1 Overall Style — Modular Monolith
The backend follows a **modular monolith** pattern with feature-based NestJS modules. This is a sound choice for a manufacturing ERP of this scale; it preserves a single deployable while enabling future extraction to microservices. The module layout is clean and readable.

### 2.2 What is Done Well
1. **Layering inside modules** — `business-transaction` is exemplary: `controllers/`, `services/`, `validators/`, `mappers/`, `definitions/`, `enums/`. Clear separation of domain state machine from persistence.
2. **Domain/Persistence boundary** — `WorkflowState` enum (domain) vs `IndentStatus` (Prisma) bridged by `WorkflowStateMapper` is a defensible DDD-style decision, despite added mapping overhead.
3. **Event-driven communication** — `CommunicationEventBus` (RxJS Subject) + `NotificationDispatcher` + declarative `NOTIFICATION_EVENT_RULES` / `AUDIT_EVENT_DEFINITIONS` is an excellent, testable, decoupled design.
4. **Queued async email** — BullMQ queue with `QueueService`/`QueueProcessor`/`MailWorker` + `NodemailerProvider` is the right pattern for non-blocking notifications.
5. **Global security posture** — `APP_GUARD` (JWT + Roles + Permissions), `TransformInterceptor`, `GlobalExceptionFilter`, `ValidationPipe` (`whitelist` + `forbidNonWhitelisted`) registered once at app root.
6. **Frontend foundation** — React Query hooks, Zustand store, route guards (`ProtectedRoute`/`Can`/`RoleGuard`), typed services. Module folder `modules/analytics` is well structured.

### 2.3 Structural Violations

#### A. Dual / Competing `indent` domain (CRITICAL)
- `backend/src/indent/` is a **stub with an in-memory fake repository** (`indent.repository.ts` uses `Math.random()` IDs and a private `any[]` array — **no Prisma, data is lost on restart**).
- The *real* indent logic lives in `business-transaction` (BusinessTransactionService). Two controllers expose competing endpoints (`/indent` vs `/business-transaction/...`).
- The `indent` module uses `any` DTOs, no validation, no guards.
- **Impact:** Duplicate domain ownership; `indent` endpoints are a data-integrity hazard if exposed to production traffic.

#### B. Two @Global modules + implicit dependencies
- `PrismaModule` (`@Global`) **and** `CommunicationModule` (`@Global`) both registered globally AND also explicitly imported in `app.module.ts`. Nest ignores the redundancy but the intent is ambiguous.
- `RolesModule` and `PermissionsModule` **do not import `PrismaModule`** — they rely on the global. Implicit dependencies are an architectural smell: the module graph no longer expresses its own requirements.
- `AuthService`, `UsersService`, and `BusinessTransactionEventService` inject `CommunicationEventBus` while **their modules never import `CommunicationModule`** — the dependency is only satisfied by globalness.

#### C. Duplicate provider instances in the queue path (MAJOR)
- `CommunicationModule` registers `NodemailerProvider` + `TemplateEngine` **and** imports `QueueModule`, which *also* registers its own `NodemailerProvider` + `TemplateEngine` (in `queue.module.ts`).
- Because these are separate modules, Nest creates **two distinct instances** of each provider (QueueModule's are not exported, so no sharing occurs). Config / connection state may diverge.

#### D. Fat services violate SRP
- `business-transaction.service.ts` (~57 KB) handles create, findAll, filters, file upload, workflow transitions, and financial closure. `analytics.service.ts` self-documents the "Fat Service pattern." Monolithic services resist testing and reuse.

#### E. Missing modules, dangling frontend integration (MAJOR)
- 14 backend modules are empty stubs, yet `frontend` already calls them:
  - `costing.service.ts` → `/costing/estimation/:indentId` (no controller exists)
  - `notification.service.ts` → `/notifications` (no controller exists)
  - `Sidebar.tsx` navigates to Cost Sheets, Workflow, Production, Inventory, Materials, Products, Reports — all unimplemented backend modules.
- The empty `email` folder duplicates the implemented `communication` module's responsibility.

#### F. Missing central configuration module
- `backend/src/config/` is an empty `.gitkeep`. Configuration is scattered: `auth/constants/auth.constants.ts` reads env with **hardcoded JWT fallback secrets** (`'super_secret_access_token_key_123456'`); `communication/config/communication.config.ts` reads its own env. No `ConfigModule` / typed config / schema validation.

#### G. CORS effectively wide-open
- `main.ts` CORS callback returns `callback(null, true)` in **both branches** — the localhost regex check is dead code. All origins are allowed with credentials.

---

## 3. Architecture Diagram Review

```
                        ┌──────────────────────────────────────────────┐
                        │               AppModule                       │
                        │  APP_GUARD x3, APP_INTERCEPTOR, APP_FILTER   │
                        └───────────────┬──────────────┬───────────────┘
                                        │              │
              ┌─────────────────────────┴──┐    ┌──────┴──────────────────┐
              │   @Global PrismaModule      │    │  @Global Communication │
              │   (implicit for all)        │    │  Module (+ QueueModule)│
              └─────────────┬───────────────┘    └──────────┬─────────────┘
                            │                               │
   ┌─────────┬───────────┬──┴───────┬──────────────┬───────┴────────┬──────────────┐
   │ Auth    │ Roles     │ Users    │ BusinessTrx  │ Analytics      │ Processes/   │
   │(own JWT)│(uses glob)│(imports  │ (core domain,│ (fat service)  │ Units/Vendors│
   │         │           │ AuthMod) │  emits bus)  │                │ (simple CRUD)│
   └─────────┴───────────┴──────────┴──────────────┴───────────────┴──────────────┘
   ┌──────────────────────────────────────────────┐
   │ Indent (STUB — in-memory repo, NO Prisma)     │ ← duplicate domain / hazard
   └──────────────────────────────────────────────┘

Frontend:
   Router → layouts/pages → hooks (React Query) → services
        ├─ apiFetch (fetch, base http://localhost:3001/api, localStorage 'token')
        └─ apiClient (axios, base http://localhost:3001, interceptors + token refresh)
   Store: useAuthStore (Zustand)  [legacy auth.store.ts pub-sub still present]
```

**Diagram issues:**
- Two parallel HTTP client stacks in the frontend (fetch + axios) with **different base URLs** (`/api` suffix vs none) and different token storage keys (`token` vs `auth_access_token`).
- The core domain (`BusinessTransaction`) and the stub (`Indent`) both claim the same aggregate root.
- Global modules create a "hidden dependency" layer not visible in the import graph.

---

## 4. Dependency Report

### 4.1 Backend
| Module | Imports | Injects (explicit) | Injects (implicit via @Global) |
|---|---|---|---|
| Auth | PassportModule, JwtModule | PrismaService | CommunicationEventBus (NOT imported) |
| Users | PrismaModule, **AuthModule** | PrismaService, CommunicationEventBus (NOT imported) | — |
| Roles | — | PrismaService | (global) |
| Permissions | — | PrismaService | (global) |
| Indent | — | IndentRepository (in-memory) | — |
| BusinessTransaction | PrismaModule | PrismaService, CommunicationEventBus (NOT imported) | — |
| Communication | PrismaModule, QueueModule | — | — |
| Queue | PrismaModule | NodemailerProvider + TemplateEngine (duplicate instances) | — |

### 4.2 Circular Dependency Risk
- **Not currently circular**, but **highly coupled**: `UsersModule → AuthModule` (feature imports another feature just for `PasswordService`). `AuthModule` should not be a dependency of a sibling feature — extract shared password/security utilities into a shared module.
- If `AuthModule` ever imports `UsersModule` (natural for user lookup on login/registration), a **hard cycle** forms immediately. This is a live landmine.

### 4.3 Frontend
- `user.service.ts`, `process.service.ts`, `vendor.service.ts` → `apiClient` (axios, no `/api`).
- `auth.service.ts`, `indent.service.ts`, `notification.service.ts`, `costing.service.ts` → `apiFetch` (fetch, `/api`).
- **Inconsistent response unwrapping:** axios services use `response.data.data`; fetch-based analytics returns `response.data` directly.

---

## 5. Technical Debt Report

| # | Debt | Severity | Location |
|---|---|---|---|
| 1 | In-memory fake IndentRepository (no persistence) | **Critical** | `backend/src/indent/indent.repository.ts` |
| 2 | Duplicate provider instances (Nodemailer, TemplateEngine) | High | `communication.module.ts` vs `queue.module.ts` |
| 3 | Two frontend HTTP clients with divergent base URLs + token keys | High | `lib/axios.ts` vs `services/api.ts` |
| 4 | Two auth stores (Zustand `authStore.ts` vs pub-sub `auth.store.ts`) | High | `frontend/src/store/` |
| 5 | Inconsistent state management patterns (Zustand vs custom pub-sub across stores) | Medium | `frontend/src/store/` |
| 6 | Duplicate type definitions (`types/user.ts` vs inline in `authStore.ts`; `types/analytics.ts` vs `modules/analytics/types/analytics.types.ts`) | Medium | frontend |
| 7 | Barrel re-export in `modules/analytics/index.ts` breaks module encapsulation | Medium | frontend |
| 8 | Fat services (SRP violation) | High | `business-transaction.service.ts`, `analytics.service.ts` |
| 9 | Missing ConfigModule; hardcoded JWT fallback secrets | High | `auth/constants/`, `config/` empty |
| 10 | Wide-open CORS (both branches return true) | High | `main.ts` |
| 11 | Implicit global dependencies (Roles/Permissions/Auth/Users/EventBus) | Medium | backend |
| 12 | `UsersModule → AuthModule` feature coupling | Medium | `users.module.ts` |
| 13 | 14 empty backend modules + dangling frontend service calls | High | backend/src/*, frontend services |
| 14 | 3 controllers share `@Controller('auth')` prefix | Low | `auth/controllers/` |
| 15 | `indent` uses `any` DTOs, no validation | Medium | `indent.controller.ts` |

---

## 6. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Production data loss via `/indent` in-memory endpoints | Medium | **Critical** | Remove stub module or back it with Prisma; gate behind guards |
| Circular dependency once Auth needs Users | High | High | Extract shared security module now |
| Duplicate mailer config divergence (SMTP settings drift) | Medium | High | Register mailer providers once in a dedicated shared module |
| Frontend/backend base-URL mismatch breaks calls in prod envs | High | High | Unify single API client + single env var |
| Refresh-token flow only wired in axios client (fetch-based services skip it) | Medium | High | Consolidate on one client with interceptor |
| Stub modules deployed accidentally | Medium | High | Delete `.gitkeep` stubs or add "not implemented" 501 handlers |

---

## 7. Architecture Score

| Category | Score (/10) |
|---|---|
| Module Organization & Naming | 6.5 |
| Layering & Separation of Concerns | 6.0 |
| Dependency Management (incl. global modules) | 5.0 |
| SOLID adherence | 6.0 |
| Provider/Repository/Service patterns | 5.5 |
| Shared/Infrastructure/Feature structure | 6.0 |
| Config & Environment handling | 4.0 |
| API layer & validation | 6.5 |
| Event-driven & async design | 8.5 |
| Frontend architecture & state | 6.0 |
| **Overall Architecture Score** | **6.1 / 10** |

**Production Readiness Score: 4.0 / 10** — blocks are architectural (in-memory repository in a live route, wide-open CORS, hardcoded secrets, dangling integrations to missing modules, dual HTTP/storage client stacks).

---

## 8. Final Verdict

**Architecture: SOUND FOUNDATION, UNFINISHED STRUCTURE.** The core design decisions — modular monolith, a domain state machine (`WorkflowState`) cleanly separated from persistence, an RxJS event bus driving a BullMQ email pipeline with declarative rules — are genuinely good and worth preserving. The `business-transaction` and `communication` modules are production-grade in shape.

However, the system is mid-migration: a stub `indent` module with an in-memory repository competes with the real domain, 14 modules exist only as empty folders while the frontend already targets their endpoints, and the frontend carries **two** HTTP clients, **two** auth stores, and inconsistent response/type conventions. Implicit `@Global` dependencies and a latent `Users ↔ Auth` cycle are time bombs for further development.

**Recommended priorities (in order):**
1. **Eliminate the stub `indent` module** (route → business-transaction, or fully back with Prisma + guards).
2. **Introduce a ConfigModule** with schema validation; remove hardcoded JWT fallbacks; fix CORS to a real allow-list.
3. **Unify frontend**: single API client, single auth store, single source of types.
4. **Deduplicate mailer providers**; make `CommunicationModule` a normal (non-global) exported module and add explicit imports everywhere.
5. **Break `Users → Auth` coupling** by extracting shared security utilities.
6. **Delete or implement** the 14 empty module stubs; align the Sidebar with reality.
