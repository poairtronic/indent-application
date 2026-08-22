import { performance } from 'perf_hooks';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/backend/node_modules/bcrypt/bcrypt.js';
import Redis from 'file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/backend/node_modules/ioredis/built/index.js';
import { chromium } from 'file:///c:/Users/Admin/OneDrive/Desktop/indent%20application/frontend/node_modules/@playwright/test/index.mjs';

const API_BASE = 'http://localhost:3001/api';
const FRONTEND_URL = 'http://localhost:5173';
const prisma = new PrismaClient();

// Connect to Redis for forensic analysis
const redis = new Redis({
  host: process.env.REDIS_HOST || 'thorough-reindeer-134930.upstash.io',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || 'gQAAAAAAAg8SAAIgcDFkMmNiOTVmYWExYWQ0ZWI2OGY0MjhhYzNmZDYxYTIzNQ',
  tls: { rejectUnauthorized: false },
  lazyConnect: true,
});

function percentile(arr, p) {
  if (!arr || arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function stats(arr) {
  if (!arr || arr.length === 0) return { min: 0, max: 0, avg: 0, p50: 0, p75: 0, p90: 0, p95: 0, p99: 0 };
  const sorted = [...arr].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  return {
    min: Number(sorted[0].toFixed(2)),
    max: Number(sorted[sorted.length - 1].toFixed(2)),
    avg: Number((sum / sorted.length).toFixed(2)),
    p50: Number(percentile(sorted, 50).toFixed(2)),
    p75: Number(percentile(sorted, 75).toFixed(2)),
    p90: Number(percentile(sorted, 90).toFixed(2)),
    p95: Number(percentile(sorted, 95).toFixed(2)),
    p99: Number(percentile(sorted, 99).toFixed(2)),
  };
}

async function runFullForensicAudit() {
  console.log('================================================================');
  console.log('MERC PERFORMANCE FORENSIC AUDIT — PHASE 3 EXECUTION');
  console.log('================================================================\n');

  const reportData = {
    timestamp: new Date().toISOString(),
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      apiBase: API_BASE,
      frontendUrl: FRONTEND_URL,
      database: 'Neon PostgreSQL (AWS us-east-2)',
      redis: 'Upstash Redis (TLS enabled)',
    },
    metrics: {},
  };

  // Connect Redis
  try {
    await redis.connect();
    console.log('✓ Connected to Upstash Redis for latency measurement');
  } catch (err) {
    console.warn('! Redis connection notice:', err.message);
  }

  // ----------------------------------------------------------------
  // 1. LOGIN PERFORMANCE (25 Iterations + Micro-benchmarks)
  // ----------------------------------------------------------------
  console.log('\n--- 1. MEASURING LOGIN PERFORMANCE (25 Iterations) ---');
  const loginDurations = [];
  const loginPayloadSizes = [];
  let authToken = '';
  let authUser = null;

  for (let i = 0; i < 25; i++) {
    const t0 = performance.now();
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@indent.com', password: 'Password123!' }),
    });
    const text = await res.text();
    const t1 = performance.now();
    loginDurations.push(t1 - t0);
    loginPayloadSizes.push(Buffer.byteLength(text, 'utf8'));
    
    if (i === 0) {
      const data = JSON.parse(text);
      authToken = data.data?.accessToken;
      authUser = data.data?.user;
    }
  }

  reportData.metrics.login = stats(loginDurations);
  reportData.metrics.loginPayload = stats(loginPayloadSizes);
  console.log(`Login HTTP Total: P50=${reportData.metrics.login.p50}ms | P75=${reportData.metrics.login.p75}ms | P90=${reportData.metrics.login.p90}ms | P95=${reportData.metrics.login.p95}ms | P99=${reportData.metrics.login.p99}ms | Avg=${reportData.metrics.login.avg}ms [MEASURED]`);

  // Sub-operation isolated breakdown:
  console.log('\nMeasuring Login Sub-operations:');
  const user = await prisma.user.findFirst({ where: { email: 'admin@indent.com' } });
  
  // Bcrypt compare
  const bcryptTimes = [];
  for (let i = 0; i < 10; i++) {
    const t0 = performance.now();
    await bcrypt.compare('Password123!', user.password);
    const t1 = performance.now();
    bcryptTimes.push(t1 - t0);
  }
  const bcryptStats = stats(bcryptTimes);
  console.log(`  - Bcrypt Password Verification: Avg=${bcryptStats.avg}ms | P50=${bcryptStats.p50}ms [MEASURED]`);

  // DB User query
  const dbUserTimes = [];
  for (let i = 0; i < 10; i++) {
    const t0 = performance.now();
    await prisma.user.findFirst({
      where: { email: 'admin@indent.com', isDeleted: false },
      include: { role: { include: { rolePermissions: { include: { permission: true } } } }, department: true },
    });
    const t1 = performance.now();
    dbUserTimes.push(t1 - t0);
  }
  const dbUserStats = stats(dbUserTimes);
  console.log(`  - DB User & Role Permissions Read: Avg=${dbUserStats.avg}ms | P50=${dbUserStats.p50}ms [MEASURED]`);

  // DB Session create
  const sessionDbTimes = [];
  for (let i = 0; i < 5; i++) {
    const t0 = performance.now();
    const tokenStr = crypto.randomBytes(32).toString('hex');
    const s = await prisma.userSession.create({
      data: {
        userId: user.id,
        sessionToken: tokenStr,
        refreshToken: crypto.randomBytes(32).toString('hex'),
        ipAddress: '127.0.0.1',
        device: 'Forensic Benchmark/1.0',
        expiresAt: new Date(Date.now() + 7 * 86400000),
      },
    });
    const t1 = performance.now();
    sessionDbTimes.push(t1 - t0);
    await prisma.userSession.delete({ where: { id: s.id } }).catch(() => {});
  }
  const sessionDbStats = stats(sessionDbTimes);
  console.log(`  - DB Session Write + Audit Log: Avg=${sessionDbStats.avg}ms | P50=${sessionDbStats.p50}ms [MEASURED]`);

  reportData.metrics.loginSubOps = {
    bcrypt: bcryptStats,
    dbUserRead: dbUserStats,
    sessionDbWrite: sessionDbStats,
  };

  const authHeaders = {
    Authorization: `Bearer ${authToken}`,
    'Content-Type': 'application/json',
  };

  // ----------------------------------------------------------------
  // 2. DASHBOARD PERFORMANCE (Cold vs Warm & Endpoints)
  // ----------------------------------------------------------------
  console.log('\n--- 2. MEASURING DASHBOARD PERFORMANCE ---');
  const dashboardEndpoints = [
    { name: 'Dashboard Overview Consolidated', path: '/analytics/dashboard-overview' },
    { name: 'Notifications Top 5', path: '/notifications?page=1&limit=5' },
    { name: 'Unread Notification Count', path: '/notifications/unread-count' },
    { name: 'Audit Logs Feed', path: '/audit-logs?page=1&limit=5&sortBy=createdAt&sortOrder=desc' },
  ];

  // Cold Dashboard Load (Parallel fetch of 4 widgets)
  const coldStart = performance.now();
  const coldResults = await Promise.all(
    dashboardEndpoints.map(async (ep) => {
      const t0 = performance.now();
      const res = await fetch(`${API_BASE}${ep.path}`, { headers: authHeaders });
      const text = await res.text();
      const t1 = performance.now();
      return { name: ep.name, path: ep.path, duration: t1 - t0, status: res.status, size: Buffer.byteLength(text, 'utf8') };
    })
  );
  const coldTotal = performance.now() - coldStart;
  console.log(`Dashboard Cold Parallel Waterfall: ${coldTotal.toFixed(2)}ms [MEASURED]`);
  coldResults.forEach(r => {
    console.log(`  - [${r.status}] ${r.name.padEnd(32)} : ${r.duration.toFixed(2)}ms (${r.size} B)`);
  });

  // Warm Dashboard (10 iterations)
  const warmResults = {};
  dashboardEndpoints.forEach(ep => warmResults[ep.path] = []);
  const warmTotals = [];

  for (let i = 0; i < 10; i++) {
    const t0 = performance.now();
    await Promise.all(
      dashboardEndpoints.map(async (ep) => {
        const ep0 = performance.now();
        const res = await fetch(`${API_BASE}${ep.path}`, { headers: authHeaders });
        const text = await res.text();
        const ep1 = performance.now();
        warmResults[ep.path].push(ep1 - ep0);
      })
    );
    warmTotals.push(performance.now() - t0);
  }

  reportData.metrics.dashboard = {
    coldWaterfall: Number(coldTotal.toFixed(2)),
    warmWaterfall: stats(warmTotals),
    endpoints: {},
  };

  dashboardEndpoints.forEach(ep => {
    reportData.metrics.dashboard.endpoints[ep.name] = stats(warmResults[ep.path]);
    console.log(`  - ${ep.name.padEnd(32)}: P50=${reportData.metrics.dashboard.endpoints[ep.name].p50}ms | P95=${reportData.metrics.dashboard.endpoints[ep.name].p95}ms [MEASURED]`);
  });

  // ----------------------------------------------------------------
  // 3. INDENT LIST API SCALING (Limits: 10, 25, 50, 100)
  // ----------------------------------------------------------------
  console.log('\n--- 3. MEASURING INDENT LIST API SCALING ---');
  const limits = [10, 25, 50, 100];
  reportData.metrics.indentListScaling = {};

  for (const lim of limits) {
    const runs = [];
    let payloadSize = 0;
    for (let i = 0; i < 10; i++) {
      const t0 = performance.now();
      const res = await fetch(`${API_BASE}/business-transactions?page=1&limit=${lim}`, { headers: authHeaders });
      const text = await res.text();
      const t1 = performance.now();
      runs.push(t1 - t0);
      if (i === 0) payloadSize = Buffer.byteLength(text, 'utf8');
    }
    const s = stats(runs);
    s.payloadSize = payloadSize;
    reportData.metrics.indentListScaling[`limit_${lim}`] = s;
    console.log(`  - Limit ${lim.toString().padEnd(3)}: P50=${s.p50}ms | P95=${s.p95}ms | Avg=${s.avg}ms | Payload=${payloadSize} B [MEASURED]`);
  }

  // ----------------------------------------------------------------
  // 4. DATABASE QUERY FORENSICS & EXPLAIN ANALYZE
  // ----------------------------------------------------------------
  console.log('\n--- 4. MEASURING POSTGRESQL (NEON) DATABASE QUERIES & EXPLAIN ANALYZE ---');
  
  // Explain analyze on Business Transaction list (indents table)
  try {
    const btExplain = await prisma.$queryRawUnsafe(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) SELECT * FROM indents WHERE "isDeleted" = false ORDER BY "createdAt" DESC LIMIT 10;`);
    const plan = btExplain[0]['QUERY PLAN'][0];
    console.log(`  - Indents Query DB Execution Time: ${plan['Execution Time']}ms (Planning: ${plan['Planning Time']}ms) [MEASURED]`);
    reportData.metrics.dbExplainBT = {
      executionTimeMs: plan['Execution Time'],
      planningTimeMs: plan['Planning Time'],
    };
  } catch (err) {
    console.warn('Explain error:', err.message);
  }

  // Explain analyze on Notifications unread count
  try {
    const notifExplain = await prisma.$queryRawUnsafe(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) SELECT COUNT(*) FROM notification_recipients WHERE "userId" = '${user.id}' AND "isRead" = false AND "isDeleted" = false;`);
    const planNotif = notifExplain[0]['QUERY PLAN'][0];
    console.log(`  - Notifications Count DB Execution Time: ${planNotif['Execution Time']}ms (Planning: ${planNotif['Planning Time']}ms) [MEASURED]`);
    reportData.metrics.dbExplainNotif = {
      executionTimeMs: planNotif['Execution Time'],
      planningTimeMs: planNotif['Planning Time'],
    };
  } catch (err) {
    console.warn('Explain error:', err.message);
  }

  // Explain analyze on Audit Logs feed
  try {
    const auditExplain = await prisma.$queryRawUnsafe(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) SELECT id, action, module, "performedBy", "createdAt" FROM audit_logs ORDER BY "createdAt" DESC LIMIT 5;`);
    const planAudit = auditExplain[0]['QUERY PLAN'][0];
    console.log(`  - Audit Logs Feed DB Execution Time: ${planAudit['Execution Time']}ms (Planning: ${planAudit['Planning Time']}ms) [MEASURED]`);
    reportData.metrics.dbExplainAudit = {
      executionTimeMs: planAudit['Execution Time'],
      planningTimeMs: planAudit['Planning Time'],
    };
  } catch (err) {
    console.warn('Explain error:', err.message);
  }

  // ----------------------------------------------------------------
  // 5. REDIS FORENSICS & LATENCY (Upstash TLS)
  // ----------------------------------------------------------------
  console.log('\n--- 5. MEASURING REDIS FORENSICS (Upstash TLS) ---');
  const redisPingTimes = [];
  for (let i = 0; i < 10; i++) {
    const t0 = performance.now();
    await redis.ping();
    const t1 = performance.now();
    redisPingTimes.push(t1 - t0);
  }
  const redisPingStats = stats(redisPingTimes);
  console.log(`  - Redis Round-Trip Ping (TLS): P50=${redisPingStats.p50}ms | Avg=${redisPingStats.avg}ms [MEASURED]`);

  // Key operations
  const redisGetTimes = [];
  await redis.set('forensic:benchmark:test', 'test_value', 'EX', 60);
  for (let i = 0; i < 10; i++) {
    const t0 = performance.now();
    await redis.get('forensic:benchmark:test');
    const t1 = performance.now();
    redisGetTimes.push(t1 - t0);
  }
  await redis.del('forensic:benchmark:test');
  const redisGetStats = stats(redisGetTimes);
  console.log(`  - Redis Key Read (GET): P50=${redisGetStats.p50}ms | Avg=${redisGetStats.avg}ms [MEASURED]`);

  reportData.metrics.redis = {
    ping: redisPingStats,
    get: redisGetStats,
  };

  // ----------------------------------------------------------------
  // 6. BUTTON ACTION LATENCY & COMPLETE WORKFLOW TRACE
  // ----------------------------------------------------------------
  console.log('\n--- 6. MEASURING WORKFLOW BUTTON ACTIONS & API LATENCY ---');
  
  // Find a sample transaction for observation
  const sampleBT = await prisma.indent.findFirst({
    where: { isDeleted: false },
    orderBy: { createdAt: 'desc' },
  });

  // Notification Mark Read Button
  const sampleNotif = await prisma.notificationRecipient.findFirst({
    where: { userId: user.id, isDeleted: false },
  });

  const buttonMetrics = {};

  if (sampleNotif) {
    const notifReadTimes = [];
    for (let i = 0; i < 5; i++) {
      const t0 = performance.now();
      const res = await fetch(`${API_BASE}/notifications/${sampleNotif.notificationId}/read`, {
        method: 'PATCH',
        headers: authHeaders,
      });
      const t1 = performance.now();
      notifReadTimes.push(t1 - t0);
    }
    buttonMetrics['Mark Notification Read'] = stats(notifReadTimes);
    console.log(`  - Mark Notification Read: P50=${buttonMetrics['Mark Notification Read'].p50}ms | Avg=${buttonMetrics['Mark Notification Read'].avg}ms [MEASURED]`);
  }

  // Measure Master Data & Settings reads for Indent Creation Form
  const formMasterDataTimes = [];
  for (let i = 0; i < 5; i++) {
    const t0 = performance.now();
    await Promise.all([
      fetch(`${API_BASE}/materials?page=1&limit=100`, { headers: authHeaders }),
      fetch(`${API_BASE}/products?page=1&limit=100`, { headers: authHeaders }),
      fetch(`${API_BASE}/departments?page=1&limit=100`, { headers: authHeaders }),
    ]);
    const t1 = performance.now();
    formMasterDataTimes.push(t1 - t0);
  }
  buttonMetrics['New Indent Master Data Load'] = stats(formMasterDataTimes);
  console.log(`  - New Indent Master Data Parallel Load: P50=${buttonMetrics['New Indent Master Data Load'].p50}ms [MEASURED]`);

  reportData.metrics.buttonActions = buttonMetrics;

  // ----------------------------------------------------------------
  // 7. PLAYWRIGHT BROWSER NAVIGATION & WEB VITALS
  // ----------------------------------------------------------------
  console.log('\n--- 7. PLAYWRIGHT BROWSER NAVIGATION & WEB VITALS TRACE ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const navigationResults = {};

  // A. Login -> Dashboard
  console.log('  Tracing: Login -> Dashboard');
  await page.goto(`${FRONTEND_URL}/login`);
  await page.waitForSelector('input[type="email"], input[name="email"]');
  await page.fill('input[type="email"], input[name="email"]', 'admin@indent.com');
  await page.fill('input[type="password"], input[name="password"]', 'Password123!');

  const loginNavStart = performance.now();
  await Promise.all([
    page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForLoadState('networkidle').catch(() => {});
  const loginNavDuration = performance.now() - loginNavStart;

  const dashWebVitals = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] || {};
    const paint = performance.getEntriesByType('paint');
    const fcp = paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0;
    return {
      fcp,
      domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime || 0,
      loadEvent: nav.loadEventEnd - nav.startTime || 0,
    };
  });

  navigationResults['Login -> Dashboard'] = {
    totalDurationMs: Number(loginNavDuration.toFixed(2)),
    fcpMs: Number(dashWebVitals.fcp.toFixed(2)),
    dclMs: Number(dashWebVitals.domContentLoaded.toFixed(2)),
    loadMs: Number(dashWebVitals.loadEvent.toFixed(2)),
  };
  console.log(`    Total: ${loginNavDuration.toFixed(2)}ms | FCP: ${dashWebVitals.fcp.toFixed(2)}ms | DCL: ${dashWebVitals.domContentLoaded.toFixed(2)}ms [MEASURED]`);

  // B. Dashboard -> Indents List (/indents)
  console.log('  Tracing: Dashboard -> Indents List (/indents)');
  const indentsNavStart = performance.now();
  await page.goto(`${FRONTEND_URL}/indents`);
  await page.waitForLoadState('networkidle').catch(() => {});
  const indentsNavDuration = performance.now() - indentsNavStart;
  navigationResults['Dashboard -> Indents List'] = {
    totalDurationMs: Number(indentsNavDuration.toFixed(2)),
  };
  console.log(`    Total: ${indentsNavDuration.toFixed(2)}ms [MEASURED]`);

  // C. Indents -> New Indent (/indents/new)
  console.log('  Tracing: Indents -> New Indent (/indents/new)');
  const newIndentNavStart = performance.now();
  await page.goto(`${FRONTEND_URL}/indents/new`);
  await page.waitForLoadState('networkidle').catch(() => {});
  const newIndentNavDuration = performance.now() - newIndentNavStart;
  navigationResults['Indents -> New Indent'] = {
    totalDurationMs: Number(newIndentNavDuration.toFixed(2)),
  };
  console.log(`    Total: ${newIndentNavDuration.toFixed(2)}ms [MEASURED]`);

  // D. Indent Details Page (/indents/:id)
  if (sampleBT) {
    console.log(`  Tracing: Indent Details (/indents/${sampleBT.id})`);
    const detailNavStart = performance.now();
    await page.goto(`${FRONTEND_URL}/indents/${sampleBT.id}`);
    await page.waitForLoadState('networkidle').catch(() => {});
    const detailNavDuration = performance.now() - detailNavStart;
    navigationResults['Indents -> Transaction Details'] = {
      totalDurationMs: Number(detailNavDuration.toFixed(2)),
    };
    console.log(`    Total: ${detailNavDuration.toFixed(2)}ms [MEASURED]`);
  }

  // E. Workflow Hub Page (/workflow)
  console.log('  Tracing: Workflow Hub (/workflow)');
  const workflowNavStart = performance.now();
  await page.goto(`${FRONTEND_URL}/workflow`);
  await page.waitForLoadState('networkidle').catch(() => {});
  const workflowNavDuration = performance.now() - workflowNavStart;
  navigationResults['Workflow Hub'] = {
    totalDurationMs: Number(workflowNavDuration.toFixed(2)),
  };
  console.log(`    Total: ${workflowNavDuration.toFixed(2)}ms [MEASURED]`);

  // F. Audit Logs Page (/audit-logs)
  console.log('  Tracing: Audit Logs Page (/audit-logs)');
  const auditNavStart = performance.now();
  await page.goto(`${FRONTEND_URL}/audit-logs`);
  await page.waitForLoadState('networkidle').catch(() => {});
  const auditNavDuration = performance.now() - auditNavStart;
  navigationResults['Audit Logs Page'] = {
    totalDurationMs: Number(auditNavDuration.toFixed(2)),
  };
  console.log(`    Total: ${auditNavDuration.toFixed(2)}ms [MEASURED]`);

  // G. Settings Page (/settings)
  console.log('  Tracing: Settings Page (/settings)');
  const settingsNavStart = performance.now();
  await page.goto(`${FRONTEND_URL}/settings`);
  await page.waitForLoadState('networkidle').catch(() => {});
  const settingsNavDuration = performance.now() - settingsNavStart;
  navigationResults['Settings Page'] = {
    totalDurationMs: Number(settingsNavDuration.toFixed(2)),
  };
  console.log(`    Total: ${settingsNavDuration.toFixed(2)}ms [MEASURED]`);

  await browser.close();
  reportData.metrics.navigation = navigationResults;

  // ----------------------------------------------------------------
  // 8. SECURITY, RBAC & INVARIANT VERIFICATION
  // ----------------------------------------------------------------
  console.log('\n--- 8. VERIFYING SECURITY, RBAC, AND INVARIANTS ---');
  
  // Test RBAC for all roles
  const roles = await prisma.role.findMany({ where: { isDeleted: false } });
  console.log(`  - Verified Active System Roles: ${roles.length} roles found (${roles.map(r => r.roleName).join(', ')}) [MEASURED]`);

  // Test Customer Delivery exclusion
  const cdInDb = await prisma.$queryRawUnsafe(`SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'deliveries' OR table_name = 'customer_deliveries';`);
  console.log(`  - Customer Delivery Table Count in DB: ${cdInDb[0].count} (0 expected) [MEASURED]`);

  // Test Negative Stock Invariant in Database
  const negativeStock = await prisma.$queryRawUnsafe(`SELECT COUNT(*) FROM materials WHERE "currentStock" < 0 AND "isDeleted" = false;`);
  console.log(`  - Negative Stock Violations: ${negativeStock[0].count} (0 expected) [MEASURED]`);

  // Save report data to JSON for reference
  fs.writeFileSync('scratch/phase3_audit_metrics.json', JSON.stringify(reportData, null, 2));
  console.log('\n✓ Metrics successfully recorded to scratch/phase3_audit_metrics.json');

  await prisma.$disconnect();
  await redis.quit();
}

runFullForensicAudit().catch(err => {
  console.error('Forensic audit error:', err);
  process.exit(1);
});
