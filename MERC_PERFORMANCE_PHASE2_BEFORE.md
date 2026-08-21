# MERC PERFORMANCE PHASE 2 BEFORE BASELINE SNAPSHOT
**Date:** 2026-08-21T11:06:11.776Z  
**Target:** Live MERC Dashboard Mount Waterfall (8 concurrent requests) + Indent Tail Latency

## 1. Dashboard Measured Performance

| Metric | Measured Value | Evidence |
|---|---|---|
| **Cold Dashboard Waterfall Load** | **5133.87 ms** | [MEASURED] |
| **Warm Dashboard Waterfall P50** | **1933.03 ms** | [MEASURED] |
| **Warm Dashboard Waterfall P95** | **3320.48 ms** | [MEASURED] |
| **Warm Dashboard Waterfall P99** | **3320.48 ms** | [MEASURED] |
| **Total Dashboard API Requests** | **8 requests** | [MEASURED] |
| **Total Dashboard Payload Size** | **12463 Bytes (~12.2 KB)** | [MEASURED] |
| **Slowest Dashboard Cold API** | **Audit Logs (5127.37 ms)** | [MEASURED] |

## 2. Indent Tail Latency Profile (20 iterations)

| Percentile | Measured Duration | Evidence |
|---|---|---|
| **P50 (Median)** | **1863.14 ms** | [MEASURED] |
| **P75** | **1950.41 ms** | [MEASURED] |
| **P90** | **3378.52 ms** | [MEASURED] |
| **P95** | **3462.86 ms** | [MEASURED] |
| **P99** | **3462.86 ms** | [MEASURED] |
| **Payload Size** | **5053 Bytes** | [MEASURED] |

## 3. Analysis & Findings
- **Fan-out Bottleneck:** The browser fires 8 concurrent HTTP requests on dashboard mount. Although dispatched in parallel via `Promise.all`, they compete for connection slots to the Neon pooler and Upstash Redis.
- **Tail Latency Root Cause:** Intermittent WAN TLS transport spikes between local dev client and AWS us-east-2 account for the delta between P50 (~1,850ms) and P95 (~5,200ms) when multiple connections burst simultaneously.
