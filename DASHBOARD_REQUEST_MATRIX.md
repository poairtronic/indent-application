# DASHBOARD REQUEST MATRIX (CURRENT LIVE BASELINE)
**Date:** 2026-08-21T11:06:11.773Z  
**Total Parallel Requests on Mount:** 8  
**Cold Total Waterfall Duration:** 5133.87 ms [MEASURED]  
**Warm Total Waterfall Duration (P50):** 1933.03 ms [MEASURED]  

| Request | Purpose | Relative Start | Relative End | Duration (Cold) | Warm P50 | Warm P95 | Payload Size | Frontend Consumer |
|---|---|---|---|---|---|---|---|---|
| `/analytics/summary` | Analytics Summary | 0.0 ms | 2942.7 ms | 2942.69 ms | 618.83 ms | 717.19 ms | 522 B | KPICards |
| `/analytics/workflow` | Workflow Analytics | 0.8 ms | 4205.9 ms | 4205.06 ms | 618.55 ms | 717.23 ms | 746 B | WorkflowTimeline |
| `/analytics/departments` | Department Analytics | 1.7 ms | 3558.6 ms | 3556.93 ms | 643.10 ms | 744.44 ms | 1578 B | DepartmentWorkload |
| `/analytics/costs` | Cost Analytics | 3.0 ms | 2827.7 ms | 2824.71 ms | 647.38 ms | 742.08 ms | 432 B | CostBreakdown |
| `/analytics/products?limit=50` | Product Analytics | 4.5 ms | 3141.1 ms | 3136.64 ms | 650.76 ms | 747.26 ms | 3579 B | ProductOverview |
| `/notifications?page=1&limit=5` | Notifications List | 5.3 ms | 4867.3 ms | 4862.05 ms | 1931.97 ms | 3316.28 ms | 2875 B | RecentNotifications |
| `/notifications/unread-count` | Unread Notification Count | 5.9 ms | 3321.9 ms | 3315.95 ms | 835.73 ms | 1017.43 ms | 138 B | NotificationBadge |
| `/audit-logs?page=1&limit=5&sortBy=createdAt&sortOrder=desc` | Audit Logs | 6.5 ms | 5133.9 ms | 5127.37 ms | 1931.73 ms | 3070.68 ms | 2593 B | AuditLogPreview |
