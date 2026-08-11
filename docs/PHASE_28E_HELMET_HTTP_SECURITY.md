# ============================================================
# IMCMS PHASE 28E — HELMET & HTTP SECURITY HARDENING
# ============================================================

## 1. Finding (ID-004)
Phase 28A identified missing standard HTTP security headers across all backend responses. This permitted potential exploitation via Cross-Site Scripting (XSS), MIME-sniffing, clickjacking, and lack of strict transport security enforcement.

## 2. Configuration & Implementation
The `helmet` package was installed and integrated as standard middleware into the NestJS `bootstrap` pipeline (`backend/src/main.ts`).

The configuration was highly tailored to support both the React/Vite frontend (running on a separate port) and the NestJS Swagger UI, ensuring security without breaking functionality:

```typescript
helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Required for Swagger UI
      styleSrc: ["'self'", "'unsafe-inline'"],                   // Required for Swagger UI
      imgSrc: ["'self'", 'data:', 'validator.swagger.io'],       // Required for Swagger UI graphics
    },
  },
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  } : false,
  xFrameOptions: { action: 'deny' },
})
```

## 3. CSP Rationale
Because the API backend primarily serves JSON and statically hosts the Swagger UI, a strictly locked-down Content Security Policy (e.g. blocking all inline scripts) breaks Swagger entirely. We adopted a specialized CSP that safely permits Swagger's required `'unsafe-inline'` and `'unsafe-eval'` directives. This policy applies securely and exclusively to the API endpoints and Swagger paths, while having absolutely no negative impact on the independently hosted React/Vite frontend application.

## 4. Environment-Aware HSTS Behavior
- **Local-Development Behavior**: HSTS (`Strict-Transport-Security`) is **disabled** when running locally. This prevents local browsers from forcing HTTPS redirection on `localhost:3000`, preserving local Vite/React development cycles.
- **Production Behavior**: HSTS is enabled with a `maxAge` of 1 year, enforcing secure HTTPS transport for all production client communication natively.

## 5. Headers Before vs. After

**Headers Before (Vulnerable):**
- Missing `Content-Security-Policy`
- Missing `X-Content-Type-Options`
- Missing `X-Frame-Options`
- Missing `Referrer-Policy`
- Presence of sensitive `X-Powered-By: Express` header

**Headers After (Hardened):**
- `Content-Security-Policy`: `default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data: validator.swagger.io;object-src 'none';script-src 'self' 'unsafe-inline' 'unsafe-eval';script-src-attr 'none';style-src 'self' 'unsafe-inline';upgrade-insecure-requests`
- `X-Content-Type-Options`: `nosniff`
- `X-Frame-Options`: `DENY`
- `Referrer-Policy`: `no-referrer`
- `X-Powered-By` successfully removed.

## 6. Regression Results
A dedicated validation script (`backend/test-headers.ts`) was executed against multiple API footprints (Swagger UI, 404/401 authentication rejection paths). 
- ✅ All expected headers were present.
- ✅ The sensitive `X-Powered-By` header was confirmed removed.
- ✅ `Strict-Transport-Security` was verified to be cleanly disabled in local development.
- ✅ Existing CORS configuration remains fully active.

## 7. Final Verdict

**HELMET & HTTP SECURITY HARDENING COMPLETE**
