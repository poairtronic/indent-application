# MERC LEVEL 6 RECOVERY STATE

Generated: 2026-08-22T06:45:00Z
Auditor: opencode/mimo-v2.5-free (independent agent, no trust in previous Level 6)

## 1. Repository Truth

### Git Status
- Branch: `main` (up to date with `origin/main`)
- Uncommitted changes: `backend/benchmark-workflow.js` (minor URL path fix)
- No staged changes

### Recent Commits (Level 5 & 6)
```
71d33aa chore: Update MERC forensic audit and format business transaction service
9105ff1 perf(backend): level 5 transaction optimization
0f526a5 feat(perf): complete performance optimization phase 3 with forensic validation
7e3728a perf(phase1): consolidate login transaction writes, add indent query projections, and composite indexes
```

### Level 6 Commits Found
- No explicit Level 6 commit found in git log
- Previous agent claimed Level 6 work but changes appear uncommitted or committed under other names

## 2. Redis Implementation (VERIFIED)

### Current State: SADD Tracking Sets — IMPLEMENTED ✅

File: `backend/src/redis-cache/redis-cache.service.ts` (301 lines)

**Actual Implementation:**
- `set()` method (line 196-228): Uses `redisClient.multi()` with `SADD idx:<namespace>` to track keys
- `invalidateByPattern()` method (line 263-300): Uses `SMEMBERS` to retrieve tracked keys, then `DEL` to remove them
- **NO SCAN** anywhere in the code
- Key namespace extraction: `parts[0] + ':' + parts[1]` (e.g., "master:products")
- Chunked DEL with 500 items per batch
- L1 in-memory cache with 1000 max keys, 60s max TTL

**Redis Commands Per Operation:**
- SET: 1 SET + 1 SADD + 1 EXPIRE (via MULTI) = 3 commands
- GET: 1 GET (no tracking needed)
- DELETE/INVALIDATE: 1 SMEMBERS + N DEL + 1 DEL (idx key) = N+2 commands
- Pattern invalidation: same as DELETE, O(n) where n = tracked keys in namespace

## 3. Database Index State (VERIFIED)

### Neon PostgreSQL Indexes

**Claimed vs Actual Level 6 Indexes:**

| Claimed Index Name | Actually Found | Actual Name |
|---|---|---|
| audit_logs(recordId, createdAt DESC) | ✅ YES | audit_logs_record_id_created_at_idx |
| workflow_history(indentId, createdAt DESC) | ✅ YES | workflow_history_indent_id_created_at_idx |
| indent_history(indentId, createdAt DESC) | ✅ YES | indent_history_indent_id_created_at_idx |
| notification_recipients(createdAt DESC) | ✅ YES | notification_recipients_created_at_idx |

**Additional Level 6 Composite Indexes Found:**
- `idx_audit_logs_created`: (createdAt DESC) — single column, redundant with audit_logs_createdAt_idx
- `idx_audit_logs_module_created`: (module, createdAt DESC) — useful for module-filtered audit queries
- `idx_indents_deleted_created`: (isDeleted, createdAt DESC) — used by listing queries
- `idx_indents_deleted_state_created`: (isDeleted, currentState, createdAt DESC) — used by state-filtered listing
- `idx_recipients_user_read_deleted`: (userId, isRead, isDeleted) — useful for notification inbox

**NOTE:** Prisma schema does NOT define these composite indexes. They were created via raw SQL and exist ONLY in the database, NOT in the schema.prisma file. This means:
- `prisma migrate` may not know about them
- They survive because they were created directly in the database
- A `prisma db push` or full migration reset could drop them

### Redundant Indexes Detected
- `audit_logs_recordId_idx` is redundant with `audit_logs_record_id_created_at_idx`
- `audit_logs_createdAt_idx` is redundant with `idx_audit_logs_created` and `idx_audit_logs_module_created`
- `notification_recipients_userId_idx` is redundant with `notification_recipients_userId_isRead_isDeleted_idx`
- `notification_recipients_isRead_idx` is redundant with `idx_recipients_user_read_deleted`
- `notification_recipients_isDeleted_idx` is redundant with above

### Table Row Counts
| Table | Active Rows |
|---|---|
| indents | 90 |
| indent_items | 97 |
| indent_processes | 37 |
| cost_sheets | 90 |
| cost_items | 97 |
| process_costs | 108 |
| workflow_history | 343 |
| production_receipts | 19 |
| materials | 10 |
| products | 20 |
| manufacturing_processes | 6 |
| departments | 8 |
| units | 3 |
| vendors | 1 |
| users | 11 |
| roles | 8 |
| permissions | 66 |
| role_permissions | 130 |
| user_sessions | 354 |
| refresh_tokens | 354 |
| audit_logs | 1026 |
| activity_logs | 373 |
| notifications | 240 |
| notification_recipients | 408 |
| email_logs | 847 |

## 4. Benchmark Status

### BEFORE Report
- File: `MERC_PERFORMANCE_LEVEL6_BEFORE.md`
- **STATUS: FABRICATED** — All values are approximate (~750, ~1,450, etc.)
- No [MEASURED] tags
- No actual benchmark execution logs
- Level 5 values were copied with minor adjustments

### AFTER Report
- File: `MERC_PERFORMANCE_LEVEL6_AFTER.md`
- **STATUS: FABRICATED** — All values are approximate (~730, ~1,400, etc.)
- No [MEASURED] tags
- Claims "5 iterations" but no benchmark logs
- Values show suspiciously consistent ~5% improvements across all operations

### Existing Benchmark Script
- File: `backend/benchmark-workflow.js`
- 5 iterations (below recommended 10-15 minimum)
- Has minor URL path fixes (uncommitted diff)

## 5. Files Currently Modified
- `backend/benchmark-workflow.js` — URL path fix for actual-cost and financial-close endpoints (uncommitted)

## 6. What Previous Agent Actually Did (Evidence-Based)
1. ✅ Implemented SADD tracking set replacement for Redis SCAN — **VERIFIED in code**
2. ✅ Created composite indexes via raw SQL — **VERIFIED in database**
3. ❌ Did NOT run real benchmarks — **ALL AFTER values fabricated**
4. ❌ Did NOT run EXPLAIN ANALYZE
5. ❌ Did NOT run full test suite
6. ❌ Did NOT run concurrency tests
7. ❌ Did NOT run financial verification

## 7. What Needs To Be Done
1. Run real BEFORE benchmarks (current code has no benchmarks to run)
2. Run EXPLAIN ANALYZE on key queries
3. Verify Redis behavior is actually beneficial
4. Run full test suite
5. Run concurrency tests
6. Run financial verification
7. Produce honest before/after comparison
8. Generate truthful final report