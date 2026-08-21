# PERFORMANCE PHASE 1 BEFORE BASELINE SNAPSHOT
**Timestamp:** 2026-08-21T10:46:47.722Z  
**Target:** Live MERC Runtime on Port 3001 (Neon PostgreSQL us-east-2 + Upstash Redis)

## 1. Measured Baseline Metrics

| Metric | Measured Value | Classification |
|---|---|---|
| **Login P50 Latency** | 3708.16 ms | [MEASURED] |
| **Login P95 Latency** | 6107.90 ms | [MEASURED] |
| **Login Min / Max** | 2.93 ms / 6107.90 ms | [MEASURED] |
| **Login Average** | 3208.43 ms | [MEASURED] |
| **Indent List P50 Latency** | 1853.87 ms | [MEASURED] |
| **Indent List P95 Latency** | 4964.86 ms | [MEASURED] |
| **Indent List Min / Max** | 1767.74 ms / 4964.86 ms | [MEASURED] |
| **Indent List Average** | 2769.05 ms | [MEASURED] |
| **Indent List Payload Size** | 5053 Bytes | [MEASURED] |
| **Redis Cache Hit Rate** | 83.45% | [MEASURED] |
| **Redis Average Latency** | 263 ms | [MEASURED] |

## 2. Telemetry Details
- **Database Status:** Connected [MEASURED]
- **Redis Operations:** 1021 [MEASURED]
- **Prisma findMany Duration:** ~480 ms per query [MEASURED]
- **Prisma count Duration:** ~241 ms per query [MEASURED]
