# Level 5 — IMCMS Production Certification Report (Final Audit)

**Auditor:** Chief Enterprise Software Auditor
**Date:** 2026-08-01
**System:** IMCMS Indent/Manufacturing ERP — React 19 / Vite 8 frontend, NestJS 11 backend, Prisma + PostgreSQL (Neon), BullMQ + Redis email pipeline.
**Method:** Full static review of the complete application (backend, frontend, database, CI, deployment, docs), combining Level 1 (architecture), Level 2 (static code), Level 3 (business logic), Level 4 (security/performance/reliability) evidence. Nothing assumed — every claim traced to source.

---

## 1. VERIFICATION SUMMARY BY AREA

### Architecture
- **Verified:** Clean NestJS modularization (Auth, Users, Roles, Permissions, Indent, Processes, Units, Vendors, BusinessTransaction, Analytics, Communication); global guards (`app.module.ts:38-50`); global ValidationPipe (`main.ts:23-29`); global interceptor + exception filter; two-loop business workflow design (manufacturing + financial loops).
- **Concerns:** BusinessTransaction service is a 2024-line monolith (`business-transaction.service.ts`); frontend has **dual HTTP clients, dual token stores, dual auth stacks** (`lib/axios.ts` vs `services/api.ts`; `authStore.ts` vs `auth.store.ts`); dead code from prior phases (see L2 report).

### Backend
- 11 modules, ~45 controllers/services; NestJS 11; JWT auth; bcrypt; Prisma; BullMQ; Nodemailer; Handlebars. `tsconfig` is **not fully strict** (`strict` flag absent; only individual flags — see L4 evidence).

### Frontend
- React 19 + Vite 8 + react-router 7 + zustand + React Query + axios + react-hook-form/zod. Build passes (CI). **No code-splitting** (34 routes eager). `dist/` exists.

### Database
- 44 Prisma models, 141 `@@index`/`@@unique` definitions (good index hygiene), Neon PostgreSQL, `database/schema.prisma` (1380 lines). **No migration files** — only `database/migrations/README.md` (schema applied via push; no versioned migrations).

### Authentication / Authorization
- Solid base: bcrypt(12), refresh-token rotation with hashed storage (`token.service.ts:31-33`), account lockout 5/30min, login history, session tracking, global JwtAuthGuard, `@Public()` scoping.
- **Broken integration:** permission codes required by controllers (`stores.issue`, `production.update`, `production.deliver`, `accounts.verify`, `accounts.close`, `system.archive`, `system.complete`, `users.read`, `users.status.update`, `users.restore`) are **never seeded** (`database/seed.ts`) → every workflow mutation + several user-management endpoints return 403 for all users including Admin (L3 §1.1). Hardcoded JWT fallback secrets (`auth.constants.ts:2-3`).

### Workflow / Business Rules
- **3 of 10 transitions structurally impossible** due to inverted department-ownership check (`workflow-state-transition.validator.ts:41-48`, L3 §1.2). Status mapping is lossy/destructive — transient states recovered by `remarks` string-matching; REJECTED/CANCELLED → DRAFT (`workflow-state.mapper.ts`). Cross-record cost mutation in `enterActualCosts` (L3 §3.1). Non-atomic stock decrement (L3 §3.2).

### Communication / Notifications / Audit
- Notification recipients resolve to wrong codes (dept `STORES` vs seed `STOR`; role `ADMIN` vs seed `Admin`) — stores/production/accounts staff never notified (L3 §1.4). Email retry bypass (L4 C.1); multi-recipient email-log PK collision (L3 §3.3); audit IP hardcoded `127.0.0.1` (L4 A.9).

### Analytics
- All six analytics endpoints load full tables into memory and aggregate in JS (L4 B.1). Status semantics partially wrong (APPROVED treated as active; PENDING_SENIOR_MANAGER = financial closure).

### Logging / Monitoring
- Nest built-in `Logger` only; no structured logging, no metrics export, no alerting. `/communication/health` gated by `settings.manage` — unusable as a probe (L4 C.2).

### SMTP / Redis / BullMQ
- BullMQ + ioredis present; DLQ exists but **no consumer**; retry mechanism broken (L4 C.1, C.4); worker Redis connection lacks error handler (L4 C.3).

### Testing
- **Backend:** 20 `*.spec.ts` unit files + 3 e2e specs in `backend/test/`. CI runs `npm test -- --runInBand`. **Known failure:** Level 2 found 1 TS compile error in `processes.service.spec.ts:220` (`isDeleted` missing on `ProcessResponseDto`) and 4 ESLint errors in `queue.processor.ts` — i.e., **current CI gate is red on main**.
- **Frontend:** no tests (CI: lint + build only).
- **Missing:** e2e for auth/workflow/email; no coverage thresholds enforced.

### Documentation
- Extensive: 47 files in `docs/` (SRS, PRD, TRD, API docs, phase reports, audits) + top-level README. **But:** `backend/README.md` is the unmodified Nest starter template; `frontend/README.md` is the Vite starter template; README claims Tailwind CSS but the app uses CSS custom properties (no Tailwind directives).

### Deployment / Docker / CI/CD
- **No Dockerfile** for backend or frontend. `docker-compose.yml` runs only PostgreSQL + pgAdmin (no app services, no healthchecks). CI (`.github/workflows/ci.yml`) runs lint/test/build on push/PR — **no deploy step, no docker, no frontend tests**. **`backend/.env` and `frontend/.env` are committed to git** (L4 A.1).

### Scalability / Maintainability / Extensibility / Versioning / Standards
- Scalability: blocked by O(n) analytics and N+1 workflow queries (L4 B.1–B.3).
- Maintainability: degraded by dead code (11 dead frontend files; dead backend methods; ~15 dead DTOs), dual frontend stacks, 2024-line service.
- Extensibility: modular Nest structure is extensible in principle; workflow definitions centralized (good) but disconnected from enforcement.
- Versioning: git history exists (phased commits); no semantic-version tags on the app.
- Standards: ESLint + Prettier configured; `tsconfig` not fully strict; codebase style inconsistent across phases.

---

## 2. SCORES

| Dimension | Score | Basis |
|---|---|---|
| Architecture | **6.0 / 10** | Clean modular Nest core; 2024-line monolith; dual frontend stacks |
| Security | **2.0 / 10** | Committed secrets, JWT fallbacks, path traversal, permissive CORS, no rate-limit/headers (L4) |
| Performance | **3.5 / 10** | Good schema indexing; O(n) analytics, N+1 stores, no caching |
| Business | **2.0 / 10** | Workflow unexecutable end-to-end (L3) |
| Code Quality | **3.8 / 10** | Type errors + lint errors on main; dead code; not fully strict (L2) |
| Testing | **2.5 / 10** | 20 unit specs exist but CI is red; no frontend tests; no coverage thresholds |
| Documentation | **6.5 / 10** | Excellent `docs/`; READMEs are generic templates; env mismatch (Tailwind claim) |
| **Overall** | **3.5 / 10** | Weighted across dimensions |

---

## 3. TECHNICAL DEBT & ISSUE LEDGER

### CRITICAL
| Issue | Severity | Affected Files | Business Impact | Fix |
|---|---|---|---|---|
| Real secrets committed to git | Critical | `backend/.env`, `frontend/.env` | Credential compromise — full system takeover | Remove from VCS, rotate all secrets, add secret scanner to CI |
| Hardcoded JWT fallback secrets | Critical | `auth/constants/auth.constants.ts:2-3` | Token forgery / account takeover | Fail-fast env validation |
| Path traversal on attachment download | Critical | `attachment-storage.service.ts:40-46`, controller `:322` | Arbitrary file read by any user | Canonicalize + prefix-check path; permission gate |
| RBAC permission deadlock | Critical | `database/seed.ts` vs `business-transaction.controller.ts`, `users.controller.ts` | Entire 2-loop workflow + user admin endpoints 403 for everyone | Align seeded permission codes with controller codes |

### HIGH
| Issue | Severity | Affected Files | Business Impact | Fix |
|---|---|---|---|---|
| Inverted department-ownership check | High | `workflow-state-transition.validator.ts:41-48` | 3 transitions impossible | Validate against target-state owner / real user dept |
| Lossy/destructive status mapping | High | `workflow-state.mapper.ts` | Rejected/cancelled → DRAFT; state from remarks text | Persist state column; non-destructive fallback |
| Cross-record cost mutation | High | `business-transaction.service.ts:961-970,995-1003` | Cost data corruption across transactions | Scope updates to `costSheetId` |
| Non-atomic stock decrement | High | `business-transaction.service.ts:566-579` | Oversell/understock | Conditional `updateMany where currentStock >= qty` |
| Mail retry bypass | High | `queue.processor.ts:24-60` | Failed emails marked completed | Rethrow; unique jobIds |
| No liveness/readiness probes | High | `communication.controller.ts:109-118` | Undetected outages | Public `/health`, `/ready` |
| Analytics full-table scans | High | `analytics/analytics.service.ts` | OOM/slow dashboards at scale | SQL aggregation |
| No rate limiting | High | backend (global) | Brute force / lockout DoS | Throttler |
| Stack traces leaked | High | `global-exception.filter.ts:38-41` | Info disclosure | Filter for clients |
| Permissive CORS | High | `main.ts:10-21` | Cross-origin token theft | Origin allowlist |

### MEDIUM
Worker Redis no error handler; DLQ no consumer; no security headers; Swagger unauthenticated; audit IP `127.0.0.1`; hardcoded localhost URLs; localStorage tokens; dual frontend auth stacks; notification dept/role mismatch; no caching; frontend no code-splitting; unbounded email-log pagination; `tsconfig` not strict; no migrations; no frontend tests; CI red on main; README templates generic; backend/frontend not containerized; compose has no healthchecks.

### LOW
Startup proceeds on DB failure; no HTTP request timeouts; `retryCount` incremented on success; env keys `REDIS_*` not in `.env.example`; no semantic versioning; README Tailwind claim inaccurate; dead `requiredPermissionCode` metadata in stage defs.

---

## 4. PRODUCTION READINESS

| Criterion | Status |
|---|---|
| Secrets managed securely | ❌ Secrets committed; fallback literals |
| AuthN/AuthZ effective end-to-end | ❌ Workflow RBAC deadlock |
| Business workflow executable | ❌ 3 transitions impossible |
| Data integrity under concurrency | ❌ Non-atomic stock; cross-record cost writes |
| Error handling / observability | ❌ Stack leaks; no metrics/alerts |
| Deployable artifact (Docker/CI deploy) | ❌ No app container, no deploy pipeline |
| Database migrations | ❌ None versioned |
| Automated tests green | ❌ CI red (TS + lint errors) |
| Load/performance verified | ❌ No load tests; O(n) analytics |
| Documentation | ⚠️ Rich `docs/`; READMEs generic |
| Reliability (retry/DLQ/probes) | ❌ Retry broken; no DLQ consumer; no probes |

---

## 5. RISK MATRIX

| Risk | P | I | Score |
|---|---|---|---|
| Credential compromise (secrets in git) | 5 | 5 | 25 |
| Token forgery (JWT fallback) | 4 | 5 | 20 |
| Arbitrary file read (path traversal) | 4 | 4 | 16 |
| Business workflow inoperable (RBAC + transitions) | 5 | 5 | 25 |
| Data corruption (cost mutation / stock) | 4 | 5 | 20 |
| Email loss (retry bypass) | 4 | 4 | 16 |
| Service outage undetected (no probes/monitoring) | 4 | 4 | 16 |
| Performance collapse at scale (O(n) analytics) | 4 | 4 | 16 |

*(Likelihood/Impact 1–5; P×I ≥ 15 = high risk requiring action before go-live.)*

---

## 6. CERTIFICATION REPORT

**Overall Score: 3.5 / 10**
**Critical Issues: 4 | High: 10 | Medium: 16 | Low: 9** (aggregated across L1–L5)

### Strengths (verified)
- Clean, modular NestJS architecture with global guards and consistent validation.
- Solid authentication foundation: bcrypt(12), refresh-token rotation with hashed DB storage, account lockout, login history, session management.
- Strong database schema hygiene: 44 models, 141 indexes/unique constraints.
- Global `ValidationPipe` (whitelist + transform + forbidNonWhitelisted).
- No SQL injection; Handlebars HTML-escaping in templates.
- Graceful shutdown implemented for Prisma, BullMQ, Redis, worker.
- Comprehensive `docs/` (SRS/PRD/TRD/API/phase reports).
- CI exists (lint + test + build) even though currently red.

### Critical Deficiencies (blocking)
1. **Secrets committed to git** (`backend/.env`, `frontend/.env`) — total compromise vector.
2. **RBAC deadlock** — the core business workflow cannot be executed by any user (permission codes never seeded).
3. **Workflow cannot complete** — 3 transitions impossible; state mapping destructive/lossy.
4. **Path traversal** — arbitrary file read via attachment download.
5. **Hardcoded JWT fallback secrets** — token forgery risk.
6. **CI red on main** — automated verification is failing (TS + lint errors).

---

## 7. FINAL VERDICT

# ❌ NOT PRODUCTION READY

The system is a **well-structured prototype** with a strong architectural foundation (modular NestJS, validated input, indexed schema, sound password/token hygiene) and unusually thorough design documentation. It is **not** certifiable for production because:

1. **Secrets are committed to version control** and JWT fallback secrets are hardcoded — credentials are already exposed.
2. **The primary business workflow is inoperable end-to-end** (RBAC permission deadlock + 3 structurally impossible transitions + lossy status mapping).
3. **Critical security vulnerabilities** (path traversal, permissive CORS, stack-trace disclosure) remain unfixed.
4. **Automated verification is failing** (CI is red) and there are no frontend tests, no load tests, no migrations, no app container, and no deploy pipeline.
5. **Reliability guarantees are broken** (email retry bypass, no probes, no DLQ consumer, no monitoring).

**Path to certification (in order):**
1. Rotate + remove committed secrets; fail-fast env validation. *(Blocks everything.)*
2. Align seeded permission codes with controller guards; fix the department-ownership validator; repair state mapping. *(Restores workflow.)*
3. Fix path traversal, CORS, stack leaks; add rate limiting + helmet. *(Hardens security.)*
4. Fix mail retry; add `/health`+`/ready`; add Redis error handler; DLQ consumer. *(Restores reliability.)*
5. Rewrite analytics with SQL aggregation; add load tests; fix CI; add frontend tests; introduce versioned migrations; add Docker images + deploy pipeline. *(Makes it shippable.)*

Re-certify after items 1–4 complete for **⚠ NEEDS IMPROVEMENT**; after item 5, re-evaluate for **🥈 ENTERPRISE SILVER CERTIFIED**.

---

*This report supersedes and consolidates: `architecture-audit-report.md` (L1, 6.1/10), `static-code-audit-report.md` (L2, 3.8/10), `business-logic-audit-report.md` (L3, 2.0/10), `security-performance-audit-report.md` (L4).*
