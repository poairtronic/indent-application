import { performance } from 'perf_hooks';
import fs from 'fs';

const BASE_URL = 'http://localhost:3001/api';

function stats(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: sum / sorted.length,
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p75: sorted[Math.floor(sorted.length * 0.75)],
    p90: sorted[Math.floor(sorted.length * 0.9)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
  };
}

async function run() {
  console.log('=== MEASURING PHASE 1 AFTER PERFORMANCE ===');

  // 1. Login Latency
  const loginTimes = [];
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
    loginTimes.push(t1 - t0);
    if (data.data?.accessToken) token = data.data.accessToken;
  }
  const loginStats = stats(loginTimes);
  console.log(`Login P50: ${loginStats.p50.toFixed(2)} ms | P95: ${loginStats.p95.toFixed(2)} ms | Avg: ${loginStats.avg.toFixed(2)} ms [MEASURED]`);

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // 2. Indent Listing
  const indentTimes = [];
  let indentPayloadSize = 0;
  for (let i = 0; i < 5; i++) {
    const t0 = performance.now();
    const res = await fetch(`${BASE_URL}/business-transactions?page=1&limit=10`, { headers });
    const text = await res.text();
    const t1 = performance.now();
    indentTimes.push(t1 - t0);
    indentPayloadSize = text.length;
  }
  const indentStats = stats(indentTimes);
  console.log(`Indent List P50: ${indentStats.p50.toFixed(2)} ms | P95: ${indentStats.p95.toFixed(2)} ms | Avg: ${indentStats.avg.toFixed(2)} ms | Size: ${indentPayloadSize} B [MEASURED]`);

  // 3. Security & Validation Verification
  console.log('\nVerifying Authentication & Security Invariants:');
  
  // Test invalid password
  const badLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@indent.com', password: 'WrongPassword!' }),
  });
  console.log(`- Invalid Password check: status ${badLoginRes.status} (Expected 401) [MEASURED]`);

  // Test active sessions
  const sessionsRes = await fetch(`${BASE_URL}/auth/sessions`, { headers });
  const sessionsData = await sessionsRes.json();
  console.log(`- Active Sessions check: count ${sessionsData.data?.length ?? 0} [MEASURED]`);

  // Test login history
  const historyRes = await fetch(`${BASE_URL}/auth/login-history`, { headers });
  const historyData = await historyRes.json();
  console.log(`- Login History check: recent log count ${historyData.data?.length ?? 0} [MEASURED]`);

  const output = {
    loginStats,
    indentStats,
    indentPayloadSize,
    badLoginStatus: badLoginRes.status,
    activeSessionsCount: sessionsData.data?.length ?? 0,
    loginHistoryCount: historyData.data?.length ?? 0,
  };

  fs.writeFileSync('scratch/phase1_after_results.json', JSON.stringify(output, null, 2));
  console.log('\nSaved scratch/phase1_after_results.json');
}

run().catch(console.error);
