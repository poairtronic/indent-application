const fs = require('fs');
const { performance } = require('perf_hooks');

const BASE_URL = 'http://localhost:3001/api';

function stats(arr) {
  if (arr.length === 0) return { p50: 0, p75: 0, p90: 0, p95: 0, p99: 0, avg: 0, min: 0, max: 0, count: 0 };
  const sorted = [...arr].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  return {
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p75: sorted[Math.floor(sorted.length * 0.75)],
    p90: sorted[Math.floor(sorted.length * 0.90)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
    avg: sum / sorted.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    count: sorted.length,
  };
}

async function runSingleIteration(authHeaders, createIndentPayload, iteration) {
  const metrics = {};

  // 1. Create Draft
  let t0 = performance.now();
  const createRes = await fetch(`${BASE_URL}/business-transactions`, {
    method: 'POST', headers: authHeaders, body: JSON.stringify(createIndentPayload)
  });
  const createData = await createRes.json();
  const indentId = createData.id || createData.data?.id;
  metrics.createDraft = performance.now() - t0;

  if (!indentId) {
    console.error(`  [Iteration ${iteration}] Create Draft failed:`, createData);
    return null;
  }

  // 2. Submit Design
  t0 = performance.now();
  await fetch(`${BASE_URL}/business-transactions/${indentId}/submit`, {
    method: 'POST', headers: authHeaders, body: JSON.stringify({ remarks: 'Bench' })
  });
  metrics.submitDesign = performance.now() - t0;

  // 3. Stores Verify
  t0 = performance.now();
  await fetch(`${BASE_URL}/business-transactions/${indentId}/stores/verify`, {
    method: 'POST', headers: authHeaders, body: JSON.stringify({ remarks: 'Bench' })
  });
  metrics.storesVerify = performance.now() - t0;

  // 4. Stores Issue
  t0 = performance.now();
  await fetch(`${BASE_URL}/business-transactions/${indentId}/stores/issue`, {
    method: 'POST', headers: authHeaders, body: JSON.stringify({ remarks: 'Bench' })
  });
  metrics.storesIssue = performance.now() - t0;

  // 5. Production Receive
  t0 = performance.now();
  await fetch(`${BASE_URL}/business-transactions/${indentId}/production/receive`, {
    method: 'POST', headers: authHeaders, body: JSON.stringify({ remarks: 'Bench' })
  });
  metrics.productionReceive = performance.now() - t0;

  // 6. Production Complete
  t0 = performance.now();
  await fetch(`${BASE_URL}/business-transactions/${indentId}/production/complete`, {
    method: 'POST', headers: authHeaders, body: JSON.stringify({ statusNotes: 'Bench' })
  });
  metrics.productionComplete = performance.now() - t0;

  // 7. Accounts Verify
  t0 = performance.now();
  await fetch(`${BASE_URL}/business-transactions/${indentId}/accounts/verify`, {
    method: 'POST', headers: authHeaders, body: JSON.stringify({ remarks: 'Bench' })
  });
  metrics.accountsVerify = performance.now() - t0;

  // Fetch tx details to get costItem and processCost IDs
  const getRes = await fetch(`${BASE_URL}/business-transactions/${indentId}`, { headers: authHeaders });
  const getData = await getRes.json();
  const tx = getData.data;
  const costItemId = tx.costSheet.costItems[0].id;
  const procCostId = tx.costSheet.processCosts[0].id;

  // 8. Actual Cost
  t0 = performance.now();
  await fetch(`${BASE_URL}/business-transactions/${indentId}/accounts/actual-cost`, {
    method: 'POST', headers: authHeaders, body: JSON.stringify({
      costItems: [{ costItemId, actualRate: 100, actualQuantity: 10, actualAmount: 1000 }],
      processCosts: [{ processCostId: procCostId, actualCost: 500, actualHours: 5 }]
    })
  });
  metrics.actualCost = performance.now() - t0;

  // 9. Financial Closure
  t0 = performance.now();
  await fetch(`${BASE_URL}/business-transactions/${indentId}/accounts/financial-close`, {
    method: 'POST', headers: authHeaders, body: JSON.stringify({ remarks: 'Bench' })
  });
  metrics.financialClosure = performance.now() - t0;

  // 10. Archive
  t0 = performance.now();
  await fetch(`${BASE_URL}/business-transactions/${indentId}/archive`, {
    method: 'POST', headers: authHeaders, body: JSON.stringify({ remarks: 'Bench' })
  });
  metrics.archive = performance.now() - t0;

  // 11. Complete
  t0 = performance.now();
  await fetch(`${BASE_URL}/business-transactions/${indentId}/complete`, {
    method: 'POST', headers: authHeaders, body: JSON.stringify({ remarks: 'Bench' })
  });
  metrics.complete = performance.now() - t0;

  return metrics;
}

async function run() {
  const ITERATIONS = 5;
  const WARMUP = 1;

  console.log('=== MERC LEVEL 6 REAL BENCHMARK ===');
  console.log(`Date: ${new Date().toISOString()}`);
  console.log(`Iterations: ${ITERATIONS} (+ ${WARMUP} warmup)\n`);

  console.log('Logging in as Admin...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@indent.com', password: 'Password123!' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.data.accessToken;
  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Pre-fetch master data
  const [pRes, dRes, mRes, uRes, prRes] = await Promise.all([
    fetch(`${BASE_URL}/products?limit=1`, { headers: authHeaders }),
    fetch(`${BASE_URL}/departments?limit=1`, { headers: authHeaders }),
    fetch(`${BASE_URL}/materials?limit=1`, { headers: authHeaders }),
    fetch(`${BASE_URL}/units?limit=1`, { headers: authHeaders }),
    fetch(`${BASE_URL}/manufacturing-processes?limit=1`, { headers: authHeaders }),
  ]);
  const pData = await pRes.json();
  const dData = await dRes.json();
  const mData = await mRes.json();
  const uData = await uRes.json();
  const prData = await prRes.json();

  const productId = pData.data.items[0].id;
  const deptId = dData.data.items[0].id;
  const materialId = mData.data.items[0].id;
  const unitId = uData.data.items[0].id;
  const processId = prData.data.items[0].id;

  const createIndentPayload = {
    indent: {
      productId,
      productName: pData.data.items[0].productName,
      departmentId: deptId,
      departmentName: dData.data.items[0].departmentName,
      priority: 'MEDIUM',
      requiredDate: new Date(Date.now() + 86400000).toISOString(),
      purpose: 'Level 6 Real Benchmark',
      items: [
        {
          materialId,
          materialName: mData.data.items[0].materialName,
          quantity: 10,
          unitId,
        }
      ]
    },
    costSheet: {
      predictedTotal: 1000,
      costItems: [
        {
          materialId,
          predictedRate: 100,
          predictedQuantity: 10,
          predictedAmount: 1000,
        }
      ],
      processCosts: [
        {
          processId,
          predictedCost: 500,
          estimatedHours: 5,
        }
      ]
    }
  };

  const allMetrics = {
    createDraft: [],
    submitDesign: [],
    storesVerify: [],
    storesIssue: [],
    productionReceive: [],
    productionComplete: [],
    accountsVerify: [],
    actualCost: [],
    financialClosure: [],
    archive: [],
    complete: [],
  };

  // Warmup iterations
  console.log(`\nRunning ${WARMUP} warmup iterations...`);
  for (let i = 0; i < WARMUP; i++) {
    const result = await runSingleIteration(authHeaders, createIndentPayload, `warmup-${i+1}`);
    if (result) {
      console.log(`  Warmup ${i+1}: Create=${result.createDraft.toFixed(0)}ms, Submit=${result.submitDesign.toFixed(0)}ms`);
    }
  }

  // Real benchmark iterations
  console.log(`\nRunning ${ITERATIONS} benchmark iterations...`);
  let failures = 0;
  for (let i = 0; i < ITERATIONS; i++) {
    const t0 = performance.now();
    const result = await runSingleIteration(authHeaders, createIndentPayload, i+1);
    const total = performance.now() - t0;

    if (result) {
      for (const key of Object.keys(allMetrics)) {
        if (result[key] !== undefined) {
          allMetrics[key].push(result[key]);
        }
      }
      console.log(`  [${i+1}/${ITERATIONS}] Total: ${total.toFixed(0)}ms | Create: ${result.createDraft.toFixed(0)}ms | Submit: ${result.submitDesign.toFixed(0)}ms | Stores: ${result.storesIssue.toFixed(0)}ms | ActualCost: ${result.actualCost.toFixed(0)}ms`);
    } else {
      failures++;
      console.log(`  [${i+1}/${ITERATIONS}] FAILED`);
    }
  }

  console.log(`\n--- RESULTS (${ITERATIONS - failures} successful iterations) ---`);
  console.log(`Failures: ${failures}`);
  console.log('');
  console.log('Operation'.padEnd(22) + 'P50 (ms)'.padStart(10) + 'P75 (ms)'.padStart(10) + 'P90 (ms)'.padStart(10) + 'P95 (ms)'.padStart(10) + 'Avg (ms)'.padStart(10) + 'Min (ms)'.padStart(10) + 'Max (ms)'.padStart(10));
  console.log('-'.repeat(92));

  const results = {};
  for (const [key, arr] of Object.entries(allMetrics)) {
    const s = stats(arr);
    results[key] = s;
    console.log(
      key.padEnd(22) +
      s.p50.toFixed(0).padStart(10) +
      s.p75.toFixed(0).padStart(10) +
      s.p90.toFixed(0).padStart(10) +
      s.p95.toFixed(0).padStart(10) +
      s.avg.toFixed(0).padStart(10) +
      s.min.toFixed(0).padStart(10) +
      s.max.toFixed(0).padStart(10)
    );
  }

  // Write results to file
  const reportDate = new Date().toISOString().split('T')[0];
  const report = `# MERC PERFORMANCE LEVEL 6 REAL BEFORE

Generated: ${new Date().toISOString()}
Benchmark Configuration: ${ITERATIONS} iterations + ${WARMUP} warmup
Backend: localhost:3001
Database: Neon PostgreSQL (remote)
Redis: Upstash Free Tier (remote)

## Raw Results

| Operation | P50 (ms) | P75 (ms) | P90 (ms) | P95 (ms) | Avg (ms) | Min (ms) | Max (ms) |
|---|---:|---:|---:|---:|---:|---:|---:|
${Object.entries(results).map(([key, s]) => `| ${key} | ${s.p50.toFixed(0)} | ${s.p75.toFixed(0)} | ${s.p90.toFixed(0)} | ${s.p95.toFixed(0)} | ${s.avg.toFixed(0)} | ${s.min.toFixed(0)} | ${s.max.toFixed(0)} |`).join('\n')}

## Status: [MEASURED]

All numbers above were measured from real API calls against the live application.
No approximations. No fabrications.
`;

  fs.writeFileSync('MERC_PERFORMANCE_LEVEL6_REAL_BEFORE.md', report);
  console.log('\nResults written to MERC_PERFORMANCE_LEVEL6_REAL_BEFORE.md');
}

run().catch(console.error);