const { performance } = require('perf_hooks');

const BASE_URL = 'http://localhost:3001/api';

function stats(arr) {
  if (arr.length === 0) return { p50: 0, p95: 0, p99: 0, avg: 0, min: 0, max: 0 };
  const sorted = [...arr].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  return {
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
    avg: sum / sorted.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}

async function run() {
  console.log('Level 7C Baseline Benchmark');
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
  const pRes = await fetch(`${BASE_URL}/products?limit=1`, { headers: authHeaders });
  const pData = await pRes.json();
  const productId = pData.data.items[0].id;

  const dRes = await fetch(`${BASE_URL}/departments?limit=1`, { headers: authHeaders });
  const dData = await dRes.json();
  const deptId = dData.data.items[0].id;

  const mRes = await fetch(`${BASE_URL}/materials?limit=5`, { headers: authHeaders });
  const mData = await mRes.json();
  const materials = mData.data.items;

  const uRes = await fetch(`${BASE_URL}/units?limit=1`, { headers: authHeaders });
  const uData = await uRes.json();
  const unitId = uData.data.items[0].id;

  const prRes = await fetch(`${BASE_URL}/manufacturing-processes?limit=1`, { headers: authHeaders });
  const prData = await prRes.json();
  const processId = prData.data.items[0].id;

  const ITERATIONS = 10;
  const metrics = {
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
  };

  console.log(`\nRunning ${ITERATIONS} iterations...`);
  for (let i = 0; i < ITERATIONS; i++) {
    console.log(`\n--- Iteration ${i + 1} ---`);

    // Create draft with 3 items
    const createPayload = {
      indent: {
        productId,
        productName: pData.data.items[0].productName,
        departmentId: deptId,
        departmentName: dData.data.items[0].departmentName,
        priority: 'MEDIUM',
        requiredDate: new Date(Date.now() + 86400000).toISOString(),
        purpose: 'Level 7C Benchmark',
        items: materials.slice(0, 3).map((m, idx) => ({
          materialId: m.id,
          materialName: m.materialName,
          quantity: 10 + idx * 5,
          unitId,
        })),
      },
      costSheet: {
        predictedTotal: 1000,
        costItems: materials.slice(0, 3).map((m) => ({
          materialId: m.id,
          predictedRate: 100,
          predictedQuantity: 10,
          predictedAmount: 1000,
        })),
        processCosts: [
          { processId, predictedCost: 500, estimatedHours: 5 },
        ],
      },
    };

    let t0 = performance.now();
    const createRes = await fetch(`${BASE_URL}/business-transactions`, {
      method: 'POST', headers: authHeaders, body: JSON.stringify(createPayload),
    });
    metrics.createDraft.push(performance.now() - t0);
    const createData = await createRes.json();
    const indentId = createData.data?.id || createData.id;

    // Submit
    t0 = performance.now();
    await fetch(`${BASE_URL}/business-transactions/${indentId}/submit`, {
      method: 'POST', headers: authHeaders, body: JSON.stringify({ remarks: 'Bench' }),
    });
    metrics.submitDesign.push(performance.now() - t0);

    // Stores Verify
    t0 = performance.now();
    await fetch(`${BASE_URL}/business-transactions/${indentId}/stores/verify`, {
      method: 'POST', headers: authHeaders, body: JSON.stringify({ remarks: 'Bench' }),
    });
    metrics.storesVerify.push(performance.now() - t0);

    // Stores Issue (bulk)
    t0 = performance.now();
    await fetch(`${BASE_URL}/business-transactions/${indentId}/stores/issue`, {
      method: 'POST', headers: authHeaders, body: JSON.stringify({ remarks: 'Bench' }),
    });
    metrics.storesIssue.push(performance.now() - t0);

    // Production Receive
    t0 = performance.now();
    await fetch(`${BASE_URL}/business-transactions/${indentId}/production/receive`, {
      method: 'POST', headers: authHeaders, body: JSON.stringify({ remarks: 'Bench' }),
    });
    metrics.productionReceive.push(performance.now() - t0);

    // Production Complete
    t0 = performance.now();
    await fetch(`${BASE_URL}/business-transactions/${indentId}/production/complete`, {
      method: 'POST', headers: authHeaders, body: JSON.stringify({ remarks: 'Bench' }),
    });
    metrics.productionComplete.push(performance.now() - t0);

    // Accounts Verify
    t0 = performance.now();
    await fetch(`${BASE_URL}/business-transactions/${indentId}/accounts/verify`, {
      method: 'POST', headers: authHeaders, body: JSON.stringify({ remarks: 'Bench' }),
    });
    metrics.accountsVerify.push(performance.now() - t0);

    // Get cost sheet details
    const getRes = await fetch(`${BASE_URL}/business-transactions/${indentId}`, { headers: authHeaders });
    const getData = await getRes.json();
    const tx = getData.data;
    const costItemIds = tx.costSheet.costItems.map((ci) => ci.id);
    const procCostId = tx.costSheet.processCosts[0].id;

    // Actual Cost
    t0 = performance.now();
    await fetch(`${BASE_URL}/business-transactions/${indentId}/accounts/actual-cost`, {
      method: 'POST', headers: authHeaders, body: JSON.stringify({
        costItems: costItemIds.map((id) => ({ costItemId: id, actualRate: 100, actualQuantity: 10, actualAmount: 1000 })),
        processCosts: [{ processCostId: procCostId, actualCost: 500, actualHours: 5 }],
      }),
    });
    metrics.actualCost.push(performance.now() - t0);

    // Financial Closure
    t0 = performance.now();
    await fetch(`${BASE_URL}/business-transactions/${indentId}/accounts/financial-close`, {
      method: 'POST', headers: authHeaders, body: JSON.stringify({ closureNotes: 'Bench' }),
    });
    metrics.financialClosure.push(performance.now() - t0);

    // Archive
    t0 = performance.now();
    await fetch(`${BASE_URL}/business-transactions/${indentId}/archive`, {
      method: 'POST', headers: authHeaders, body: JSON.stringify({ remarks: 'Bench' }),
    });
    metrics.archive.push(performance.now() - t0);
  }

  console.log('\n=== LEVEL 7C BASELINE RESULTS ===');
  for (const [key, arr] of Object.entries(metrics)) {
    const s = stats(arr);
    console.log(`${key.padEnd(20)} P50: ${s.p50.toFixed(2).padStart(8)} ms | P95: ${s.p95.toFixed(2).padStart(8)} ms | P99: ${s.p99.toFixed(2).padStart(8)} ms | Avg: ${s.avg.toFixed(2).padStart(8)} ms`);
  }
}

run().catch(console.error);
