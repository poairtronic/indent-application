# Phase 28E: Helmet & HTTP Security Hardening

## Goal
Implement appropriate HTTP security headers using `helmet` in the NestJS backend to protect against common web vulnerabilities (XSS, clickjacking, MIME sniffing) while ensuring local development, Swagger UI, and React/Vite frontends remain fully functional.

## Background Context
Phase 28A identified missing standard HTTP security headers (ID-004). The application currently lacks `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, and others.

## Proposed Changes

### 1. Install Dependencies
#### [MODIFY] backend/package.json
- Install `helmet` as a production dependency to provide middleware for setting security headers.

### 2. Configure Helmet in Bootstrap
#### [MODIFY] backend/src/main.ts
- Import `helmet`.
- Integrate `app.use(helmet({ ... }))` with the following tailored configuration:
  - **HSTS (Strict-Transport-Security):** Enable only in production (`process.env.NODE_ENV === 'production'`) with a `maxAge` of 1 year, to prevent breaking local HTTP development on `localhost`.
  - **CSP (Content-Security-Policy):** Since this is an API backend that hosts Swagger UI, a restrictive default CSP would break Swagger's inline scripts and styles. Configure CSP directives to allow `'unsafe-inline'` for scripts and styles specifically to keep Swagger functional, while restricting `default-src` to `'self'`.
  - **X-Frame-Options (frame protection):** Default to `DENY` to prevent clickjacking on API responses.
  - **X-Content-Type-Options:** Enabled (defaults to `nosniff`) to prevent MIME-sniffing.
  - **Referrer-Policy:** Enabled (defaults to `no-referrer`) to prevent leaking sensitive URL parameters.
  - **Permissions-Policy:** Block access to sensitive browser features (camera, microphone, geolocation) by default.

### 3. Verification Script
#### [NEW] backend/test-headers.ts
- Create a simple script to ping the local backend API endpoints (Swagger UI, standard API 401, validation error) to explicitly verify the presence of headers (`x-frame-options`, `strict-transport-security`, etc.) and ensure no sensitive framework information (e.g. `X-Powered-By`) is leaked.

## Verification Plan
### Automated Tests
- Run `npm test` to ensure middleware injection doesn't break existing controller or unit tests.
- Run `npx ts-node test-headers.ts` to assert that the HTTP responses correctly contain the injected security headers.

### Manual Verification
- Test CORS by simulating a cross-origin request from the configured `FRONTEND_URL`.
- Verify Swagger UI loads correctly without CSP console errors.
- Confirm local development remains HTTP-accessible without forced HSTS redirection.

## User Review Required
> [!IMPORTANT]
> The HSTS header will be conditionally applied based on `NODE_ENV === 'production'` to avoid permanently locking local browsers into HTTPS-only mode for `localhost`.
> The Content-Security-Policy will include `'unsafe-inline'` for scripts/styles to accommodate NestJS Swagger UI, which dynamically injects its assets.
> Please review and approve this approach.
