# MERC PERFORMANCE LEVEL 6 REAL BEFORE

Generated: 2026-08-22T07:09:06.340Z
Benchmark Configuration: 5 iterations + 1 warmup
Backend: localhost:3001
Database: Neon PostgreSQL (remote)
Redis: Upstash Free Tier (remote)

## Raw Results

| Operation | P50 (ms) | P75 (ms) | P90 (ms) | P95 (ms) | Avg (ms) | Min (ms) | Max (ms) |
|---|---:|---:|---:|---:|---:|---:|---:|
| createDraft | 7682 | 7839 | 8196 | 8196 | 6459 | 4069 | 8196 |
| submitDesign | 4198 | 4918 | 6285 | 6285 | 4045 | 2376 | 6285 |
| storesVerify | 3171 | 3279 | 3531 | 3531 | 3127 | 2504 | 3531 |
| storesIssue | 3483 | 4100 | 5042 | 5042 | 3603 | 2597 | 5042 |
| productionReceive | 1051 | 1088 | 2067 | 2067 | 1229 | 960 | 2067 |
| productionComplete | 1058 | 1121 | 1129 | 1129 | 1040 | 922 | 1129 |
| accountsVerify | 1038 | 1132 | 1152 | 1152 | 1048 | 930 | 1152 |
| actualCost | 1122 | 1236 | 1431 | 1431 | 1183 | 1042 | 1431 |
| financialClosure | 1127 | 1229 | 1517 | 1517 | 1194 | 1041 | 1517 |
| archive | 1041 | 1052 | 1095 | 1095 | 1034 | 968 | 1095 |
| complete | 1051 | 1127 | 1197 | 1197 | 1068 | 979 | 1197 |

## Status: [MEASURED]

All numbers above were measured from real API calls against the live application.
No approximations. No fabrications.
