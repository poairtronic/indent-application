# MERC CACHE ARCHITECTURE MAP

## 1. Authentication / JWT Cache
- **Data:** User session and resolved permissions.
- **Owner:** `JwtStrategy`
- **Cache Layer:** Redis (L2)
- **Key:** `user:session:<userId>`
- **TTL:** 5 minutes (300s)
- **Invalidation:** Manual on role update (`roles.service.ts` line 201).
- **Security Scope:** User-level isolated.
- **Volatility:** Low

## 2. Master Data Cache
- **Data:** Materials, Products, Departments, Units, Processes, Vendors.
- **Owner:** `HttpCacheInterceptor` & Master Data Controllers
- **Cache Layer:** Redis (L2)
- **Key:** `master:<type>:<query_params>`
- **TTL:** 1 hour (3600s) / 24 hours (86400s for Departments)
- **Invalidation:** Pattern deletion (`master:<type>:*`) on Create/Update/Delete operations in respective services.
- **Security Scope:** Global (Shared Master Data).
- **Volatility:** Low

## 3. Analytics & Reports Cache
- **Data:** Dashboard Overview, KPI summaries, workflow aggregations.
- **Owner:** `AnalyticsController` & `ReportsController` via `HttpCacheInterceptor`
- **Cache Layer:** Redis (L2)
- **Key:** `analytics:<user_context>:<query_params>` or `reports:<type>:<user_context>`
- **TTL:** 60 seconds (Analytics) / 300 seconds (Reports)
- **Invalidation:** TTL expiration or manual clear.
- **Security Scope:** Contextualized by Department ID and Admin flag.
- **Volatility:** Moderate

## 4. Notifications Cache
- **Data:** Unread Notification Count
- **Owner:** `NotificationsController`
- **Cache Layer:** Redis (L2)
- **Key:** `notifications:unread-count:<userId>`
- **TTL:** 60 seconds
- **Invalidation:** TTL expiration.
- **Security Scope:** User-level isolated.
- **Volatility:** High

## 5. Frontend React Query Cache
- **Data:** SPA UI State
- **Owner:** `QueryClientProvider`
- **Cache Layer:** In-Memory (L1) browser side.
- **TTL:** 1 - 5 minutes depending on route.
- **Invalidation:** On mutation success (`invalidateQueries`).
- **Security Scope:** Single user session.
- **Volatility:** Reacts to user interaction.
