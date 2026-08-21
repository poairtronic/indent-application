import { performance } from 'perf_hooks';
import fs from 'fs';

const BASE_URL = 'http://localhost:3001/api';

async function run() {
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@indent.com', password: 'Password123!' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.accessToken;
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const btEndpoints = [
    { method: 'GET', path: '/business-transactions?page=1&limit=10' },
    { method: 'GET', path: '/reports/categories' },
    { method: 'GET', path: '/reports/analytics' },
    { method: 'GET', path: '/master-data/dashboard' },
  ];

  const results = [];
  for (const ep of btEndpoints) {
    const durations = [];
    let size = 0;
    let status = 0;
    for (let i = 0; i < 4; i++) {
      const t0 = performance.now();
      const res = await fetch(`${BASE_URL}${ep.path}`, { method: ep.method, headers });
      const text = await res.text();
      const t1 = performance.now();
      status = res.status;
      durations.push(t1 - t0);
      size = text.length;
    }
    const p50 = durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.5)];
    const p95 = durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)];
    results.push({ path: ep.path, status, p50, p95, size });
    console.log(`${ep.method} ${ep.path.padEnd(40)} [${status}] -> P50: ${p50.toFixed(2)} ms | P95: ${p95.toFixed(2)} ms | Size: ${size} B [MEASURED]`);
  }
  fs.writeFileSync('scratch/bt_results.json', JSON.stringify(results, null, 2));
}

run().catch(console.error);
