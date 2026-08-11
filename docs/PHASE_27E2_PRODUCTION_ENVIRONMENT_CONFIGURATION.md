# IMCMS PHASE 27E.2 — PRODUCTION ENVIRONMENT CONFIGURATION

## 1. Executive Summary
The IMCMS application has successfully completed its local cloud integration testing (Phase 27E.1) with Neon PostgreSQL, Supabase Storage, and Upstash Redis. This document formally defines the production environment configuration required to securely deploy the NestJS backend and React frontend to Render.

**Final Verdict:** **PRODUCTION CONFIGURATION READY**

All security audits, build verifications, CORS rules, and environment matrices have been prepared. The backend is configured to safely bind to the dynamically provisioned Render port, and the static SPA rewrite rules are ready.

---

## 2. Current Architecture
- **Backend:** Local development server (`localhost:3000`)
- **Frontend:** Local Vite dev server (`localhost:5173`)
- **Database:** Neon PostgreSQL (Cloud - verified)
- **Object Storage:** Supabase Storage (Cloud - verified)
- **Message Queue / Cache:** Upstash Redis (Cloud - verified)
- **Secrets Management:** Local `.env` files

---

## 3. Production Architecture
- **Backend:** Render Web Service (Node 20 environment)
- **Frontend:** Render Static Site (React/Vite)
- **Database:** Neon PostgreSQL (Production schema synchronized via `npx prisma migrate deploy`)
- **Object Storage:** Supabase Storage (Private bucket `imcms-attachments`)
- **Message Queue / Cache:** Upstash Redis (TLS enabled)
- **Secrets Management:** Render Environment Variables (Secrets injected at build/runtime; no `.env` files tracked or copied)

---

## 4. Environment Variable Matrix

The environment has been audited. No secrets are stored in Git. Below is the strict mapping of variables required for production.

### Render Backend Web Service Variables
| Variable | Description | Type | Secret? | Required |
|----------|-------------|------|---------|----------|
| `PORT` | Port for NestJS to listen on (provided by Render) | Infrastructure | No | Yes |
| `FRONTEND_URL` | Allowed origin for CORS (e.g., `https://imcms-frontend.onrender.com`) | App Config | No | Yes |
| `DATABASE_URL` | Neon connection string with connection pooler | Database | **Yes** | Yes |
| `JWT_SECRET` | Production cryptographic key for access tokens | Security | **Yes** | Yes |
| `JWT_REFRESH_SECRET` | Production cryptographic key for refresh tokens | Security | **Yes** | Yes |
| `REDIS_HOST` | Upstash Redis connection host | Cache/Queue | No | Yes |
| `REDIS_PORT` | Upstash Redis connection port | Cache/Queue | No | Yes |
| `REDIS_PASSWORD` | Upstash Redis authentication password | Cache/Queue | **Yes** | Yes |
| `REDIS_TLS` | Must be `true` for Upstash | Cache/Queue | No | Yes |
| `SUPABASE_URL` | Supabase project URL | Storage | No | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend-only unrestricted Supabase key | Storage | **Yes** | Yes |
| `SUPABASE_STORAGE_BUCKET` | Value: `imcms-attachments` | Storage | No | Yes |
| `SMTP_HOST` | SMTP server for BullMQ notifications | Email | No | Yes |
| `SMTP_PORT` | SMTP port | Email | No | Yes |
| `SMTP_USER` | SMTP username | Email | No | Yes |
| `SMTP_PASS` | SMTP password | Email | **Yes** | Yes |
| `SMTP_FROM` | Sender address | Email | No | Yes |

### Render Frontend Static Site Variables
| Variable | Description | Type | Secret? | Required |
|----------|-------------|------|---------|----------|
| `VITE_API_URL` | URL of the Render Backend (`https://imcms-backend.onrender.com/api`) | App Config | No | Yes |

> [!WARNING]
> The frontend environment must **NOT** contain any Supabase credentials (`VITE_SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`). All file transfers are proxied securely through the backend.

---

## 5. Frontend Configuration
- **Host:** Render Static Site
- **Build Command:** `npm run build`
- **Publish Directory:** `dist`
- **Routing:** SPA Rewrite configured (`/*` → `/index.html`) to prevent 404s on deep links (`/dashboard`, `/reports`).

---

## 6. Backend Configuration
- **Host:** Render Web Service
- **Build Command:** `npm run build`
- **Start Command:** `npm run start:prod`
- **Node Version:** 20
- **Port Binding:** Modifed `backend/src/main.ts` to explicitly bind to `0.0.0.0` to ensure Render successfully detects the bound port dynamically.

---

## 7. Neon Configuration
- **Production URL:** Using connection pooling endpoint.
- **Migration Strategy:** The production deployment command must be:
  ```bash
  npx prisma migrate deploy
  ```
- **Constraints:** Do **NOT** run `prisma db push` or `prisma migrate reset` in production.

---

## 8. Supabase Configuration
- **Bucket:** `imcms-attachments`
- **Privacy:** Verified as **PRIVATE**. Public access is restricted.
- **Access Control:** The backend utilizes the Service Role Key to manage files, maintaining strict authorization within the NestJS API. 

---

## 9. Upstash Configuration
- **TLS:** `REDIS_TLS=true` is required for Upstash over untrusted networks.
- **BullMQ Compatibility:** BullMQ configuration is compatible with Upstash limitations (no blocking commands used inappropriately).

---

## 10. JWT Configuration
- Production requires completely new values for `JWT_SECRET` and `JWT_REFRESH_SECRET`.
- Development secrets must not be re-used to prevent offline forging of tokens.

---

## 11. SMTP Configuration
- SMTP passwords remain strictly in the backend Render environment.
- Email jobs are safely queued into BullMQ and dispatched securely.

---

## 12. CORS Configuration
The backend CORS policy specifically whitelists:
1. `process.env.FRONTEND_URL` (The Render static frontend domain)
2. `localhost` / `127.0.0.1` (For continued local development)

The `*` wildcard is strictly prohibited and unused in production.

---

## 13. Health Check
The backend has comprehensive health monitoring endpoints ready for Render:
- **Liveness Probe:** `/api/observability/health/liveness`
- **Readiness Probe:** `/api/observability/health/readiness` (reports DB/Redis health)

Render should be configured to check `/api/observability/health/liveness` to track container stability.

---

## 14. Render Backend Configuration (render.yaml snippet)
```yaml
  - type: web
    name: imcms-backend
    env: node
    nodeVersion: 20
    buildCommand: npm run build
    startCommand: npm run start:prod
    rootDir: backend
    envVars:
      - key: FRONTEND_URL
        value: https://imcms-frontend.onrender.com
      ...
```

---

## 15. Render Frontend Configuration (render.yaml snippet)
```yaml
  - type: web
    name: imcms-frontend
    env: static
    buildCommand: npm run build
    staticPublishPath: dist
    rootDir: frontend
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
    envVars:
      - key: VITE_API_URL
        value: https://imcms-backend.onrender.com/api
```

---

## 16. Git Security & Readiness
- **Tracked `.env` Files:** `git ls-files` confirms only `.env.example` files are tracked.
- **Secrets Audit:** No `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, or `REDIS_PASSWORD` exist in tracked history. (FOUND SECURELY CONFIGURED).
- **.gitignore:** Perfectly configured to ignore `node_modules`, `dist`, `build`, and all `.env*` files except examples.

---

## 17. Build Verification
Both codebases were successfully built locally to guarantee production compilation compatibility.
- **Backend:** `npm run build` (NestJS compilation) - **PASS**
- **Frontend:** `npm run build` (Vite / React / TypeScript compilation) - **PASS**

---

## 18. Deployment Checklist
- [x] Git repository clean
- [x] No secrets committed
- [x] Neon ready
- [x] Prisma migrations ready
- [x] Supabase bucket private
- [x] Supabase credentials ready
- [x] Upstash credentials ready
- [x] JWT production secrets ready
- [x] SMTP configuration ready
- [x] CORS configured
- [x] Backend build passes
- [x] Frontend build passes
- [x] Health endpoint verified
- [x] Render backend configuration ready
- [x] Render frontend configuration ready
- [x] SPA rewrite configured
- [x] Production API URL ready
- [x] Rollback plan documented

---

## 19. Rollback Strategy
- **Backend Rollback:** Use Render's native "Deploy previous commit" feature in the dashboard to revert code instantly.
- **Frontend Rollback:** Use Render's native "Deploy previous commit" feature.
- **Database Rollback:** Neon provides branch/restore capabilities. Point-in-time recovery (PITR) is native to Neon and can reverse migration errors without manual downtime scripting.

---

## 20. Database Seed Recommendation
The database has already been successfully seeded in Phase 27E.1 during the cloud verification. **DO NOT run the database seed during the production deployment.** The seed script is technically idempotent, but running it on every deployment introduces unnecessary risk and connection overhead. It should remain a manual one-time operation.

---

## 21. Final Readiness Verdict

**PRODUCTION CONFIGURATION READY**

The system is fully audited, verified, and pre-configured. We are ready to proceed with **PHASE 27E.3 — RENDER BACKEND DEPLOYMENT** pending authorization.
