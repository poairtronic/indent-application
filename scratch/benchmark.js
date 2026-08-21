import { performance } from 'perf_hooks';
import fs from 'fs';

const BASE_URL = 'http://localhost:3001/api';

function stats(durations, sizes = []) {
  if (durations.length === 0) return {};
  const sum = durations.reduce((a, b) => a + b, 0);
  const avg = sum / durations.length;
  const sorted = [...durations].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p75 = sorted[Math.floor(sorted.length * 0.75)];
  const p90 = sorted[Math.floor(sorted.length * 0.9)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];
  const avgSize = sizes.length ? (sizes.reduce((a, b) => a + b, 0) / sizes.length) : 0;

  return { count: durations.length, min, max, avg, p50, p75, p90, p95, p99, avgSize };
}

async function run() {
  console.log('====================================================');
  console.log('MERC REAL RUNTIME BENCHMARK & PERFORMANCE AUDIT');
  console.log('====================================================\n');

  // 1. Auth Login Measurement
  console.log('1. Measuring Login Performance...');
  const loginDurations = [];
  let token = '';

  for (let i = 0; i < 5; i++) {
    const t0 = performance.now();
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@indent.com', password: 'Password123!' }),
    });
    const data = await res.json();
    const t1 = performance.now();
    loginDurations.push(t1 - t0);
    if (data.data?.accessToken) token = data.data.accessToken;
  }
  const loginStats = stats(loginDurations);
  console.log(`   Cold Login: ${loginDurations[0].toFixed(2)} ms [MEASURED]`);
  console.log(`   Warm Login (P50): ${loginStats.p50.toFixed(2)} ms | P95: ${loginStats.p95.toFixed(2)} ms [MEASURED]`);

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // 2. Dashboard Parallel Waterfall Investigation
  console.log('\n2. Measuring Dashboard Waterfall (8 parallel API calls)...');
  const dashboardEndpoints = [
    { name: 'Analytics Summary', path: '/analytics/summary' },
    { name: 'Workflow Analytics', path: '/analytics/workflow' },
    { name: 'Department Analytics', path: '/analytics/departments' },
    { name: 'Cost Analytics', path: '/analytics/costs' },
    { name: 'Product Analytics', path: '/analytics/products?limit=50' },
    { name: 'Notifications List', path: '/notifications?page=1&limit=5' },
    { name: 'Unread Notification Count', path: '/notifications/unread-count' },
    { name: 'Audit Logs', path: '/audit-logs?page=1&limit=5&sortBy=createdAt&sortOrder=desc' },
  ];

  // Cold Dashboard
  const coldStart = performance.now();
  const coldResults = await Promise.all(
    dashboardEndpoints.map(async (ep) => {
      const t0 = performance.now();
      const res = await fetch(`${BASE_URL}${ep.path}`, { headers: authHeaders });
      const text = await res.text();
      const t1 = performance.now();
      return { name: ep.name, path: ep.path, duration: t1 - t0, status: res.status, size: text.length };
    })
  );
  const coldEnd = performance.now();
  const coldTotalWaterfall = coldEnd - coldStart;

  console.log(`   Cold Dashboard Total Waterfall: ${coldTotalWaterfall.toFixed(2)} ms [MEASURED]`);
  coldResults.forEach((r) => {
    console.log(`     - [${r.status}] ${r.name.padEnd(26)} : ${r.duration.toFixed(2)} ms (${r.size} bytes)`);
  });

  // Warm Dashboard (5 runs)
  const warmRuns = [];
  const epStats = {};
  dashboardEndpoints.forEach(ep => epStats[ep.path] = { durations: [], sizes: [] });

  for (let i = 0; i < 5; i++) {
    const t0 = performance.now();
    await Promise.all(
      dashboardEndpoints.map(async (ep) => {
        const ep0 = performance.now();
        const res = await fetch(`${BASE_URL}${ep.path}`, { headers: authHeaders });
        const text = await res.text();
        const ep1 = performance.now();
        epStats[ep.path].durations.push(ep1 - ep0);
        epStats[ep.path].sizes.push(text.length);
      })
    );
    const t1 = performance.now();
    warmRuns.push(t1 - t0);
  }
  const warmDashStats = stats(warmRuns);
  console.log(`   Warm Dashboard Total Waterfall (P50): ${warmDashStats.p50.toFixed(2)} ms | P95: ${warmDashStats.p95.toFixed(2)} ms [MEASURED]`);

  // 3. Complete Endpoint Latency Inventory (5 iterations each)
  console.log('\n3. Measuring API Endpoint Inventory (5 iterations per route)...');
  const allEndpoints = [
    { method: 'GET', path: '/analytics/summary' },
    { method: 'GET', path: '/analytics/workflow' },
    { method: 'GET', path: '/analytics/departments' },
    { method: 'GET', path: '/analytics/costs' },
    { method: 'GET', path: '/analytics/products?limit=50' },
    { method: 'GET', path: '/analytics/vendors?limit=50' },
    { method: 'GET', path: '/analytics/kpis' },
    { method: 'GET', path: '/analytics/insights' },
    { method: 'GET', path: '/indents?page=1&limit=10' },
    { method: 'GET', path: '/cost-sheets?page=1&limit=10' },
    { method: 'GET', path: '/workflow/indents' },
    { method: 'GET', path: '/workflow/stages' },
    { method: 'GET', path: '/production/queue' },
    { method: 'GET', path: '/production/receipts' },
    { method: 'GET', path: '/materials?page=1&limit=10' },
    { method: 'GET', path: '/products?page=1&limit=10' },
    { method: 'GET', path: '/manufacturing-processes?page=1&limit=10' },
    { method: 'GET', path: '/units?page=1&limit=10' },
    { method: 'GET', path: '/vendors?page=1&limit=10' },
    { method: 'GET', path: '/reports?page=1&limit=10' },
    { method: 'GET', path: '/reports/statistics' },
    { method: 'GET', path: '/notifications?page=1&limit=20' },
    { method: 'GET', path: '/notifications/unread-count' },
    { method: 'GET', path: '/users?page=1&limit=10' },
    { method: 'GET', path: '/roles' },
    { method: 'GET', path: '/permissions' },
    { method: 'GET', path: '/departments' },
    { method: 'GET', path: '/audit-logs?page=1&limit=20' },
    { method: 'GET', path: '/auth/sessions' },
    { method: 'GET', path: '/auth/login-history' },
    { method: 'GET', path: '/observability/metrics' },
  ];

  const fullApiResults = [];
  for (const ep of allEndpoints) {
    const durations = [];
    const sizes = [];
    let status = 0;

    for (let i = 0; i < 4; i++) {
      const t0 = performance.now();
      const res = await fetch(`${BASE_URL}${ep.path}`, {
        method: ep.method,
        headers: authHeaders,
      });
      const text = await res.text();
      const t1 = performance.now();
      status = res.status;
      durations.push(t1 - t0);
      sizes.push(text.length);
    }
    const st = stats(durations, sizes);
    fullApiResults.push({
      method: ep.method,
      path: ep.path,
      status,
      ...st,
    });
    console.log(`   ${ep.method.padEnd(4)} ${ep.path.padEnd(42)} [${status}] -> P50: ${st.p50.toFixed(2).padStart(6)} ms | P95: ${st.p95.toFixed(2).padStart(6)} ms | Size: ${Math.round(st.avgSize)} B [MEASURED]`);
  }

  // 4. Concurrency Test
  console.log('\n4. Running Concurrency Stress Benchmark (1, 5, 10, 25 concurrent users)...');
  const concurrencyLevels = [1, 5, 10, 25];
  const concurrencyResults = [];

  for (const c of concurrencyLevels) {
    const totalRequests = c * 4;
    const durations = [];
    let errors = 0;
    const startT = performance.now();

    for (let i = 0; i < totalRequests; i += c) {
      const batch = Array.from({ length: Math.min(c, totalRequests - i) }, async () => {
        const t0 = performance.now();
        try {
          const res = await fetch(`${BASE_URL}/analytics/summary`, { headers: authHeaders });
          if (!res.ok) errors++;
        } catch {
          errors++;
        }
        const t1 = performance.now();
        durations.push(t1 - t0);
      });
      await Promise.all(batch);
    }
    const endT = performance.now();
    const rps = totalRequests / ((endT - startT) / 1000);
    const st = stats(durations);
    concurrencyResults.push({ concurrency: c, totalRequests, rps, errors, ...st });
    console.log(`   Concurrency ${String(c).padStart(2)}: RPS = ${rps.toFixed(1).padStart(5)} req/s | P50: ${st.p50.toFixed(2).padStart(6)} ms | P95: ${st.p95.toFixed(2).padStart(6)} ms [MEASURED]`);
  }

  // 5. Live Observability Metrics
  console.log('\n5. Fetching Live Metrics...');
  const obsRes = await fetch(`${BASE_URL}/observability/metrics`, { headers: authHeaders });
  const obsData = await obsRes.json();

  const outputData = {
    timestamp: new Date().toISOString(),
    loginStats,
    coldDashboard: { total: coldTotalWaterfall, endpoints: coldResults },
    warmDashboard: { total: warmDashStats, endpointStats: epStats },
    fullApiResults,
    concurrencyResults,
    observability: obsData.data,
  };

  fs.writeFileSync('scratch/benchmark_results.json', JSON.stringify(outputData, null, 2));
  console.log('\nBenchmark completed! Saved to scratch/benchmark_results.json\n');
}

run().catch(console.error);
