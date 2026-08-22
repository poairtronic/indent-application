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

  const mRes = await fetch(`${BASE_URL}/materials?limit=1`, { headers: authHeaders });
  const mData = await mRes.json();
  const materialId = mData.data.items[0].id;

  const uRes = await fetch(`${BASE_URL}/units?limit=1`, { headers: authHeaders });
  const uData = await uRes.json();
  const unitId = uData.data.items[0].id;

  const prRes = await fetch(`${BASE_URL}/manufacturing-processes?limit=1`, { headers: authHeaders });
  const prData = await prRes.json();
  const processId = prData.data.items[0].id;

  const ITERATIONS = 5;
  const metrics = {
    createDraft: [],
    submitDesign: [],
    storesVerify: [],
    issueSingleItem: [],
    issueSecondItem: [],
  };

  console.log(`\nBenchmarking Item-Level Issue Workflow (${ITERATIONS} iterations)...`);
  for (let i = 0; i < ITERATIONS; i++) {
    console.log(`\n--- Iteration ${i + 1} ---`);

    // Create draft with 2 items
    const createPayload = {
      indent: {
        productId,
        productName: pData.data.items[0].productName,
        departmentId: deptId,
        departmentName: dData.data.items[0].departmentName,
        priority: 'MEDIUM',
        requiredDate: new Date(Date.now() + 86400000).toISOString(),
        purpose: 'Benchmark Item-Level Issue',
        items: [
          { materialId, materialName: mData.data.items[0].materialName + ' A', quantity: 10, unitId },
          { materialId, materialName: mData.data.items[0].materialName + ' B', quantity: 5, unitId },
        ],
      },
      costSheet: {
        predictedTotal: 1000,
        costItems: [
          { materialId, predictedRate: 100, predictedQuantity: 10, predictedAmount: 1000 },
        ],
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

    // Get items
    const getRes = await fetch(`${BASE_URL}/business-transactions/${indentId}`, { headers: authHeaders });
    const getData = await getRes.json();
    const tx = getData.data;
    const items = tx.items;
    const firstItemId = items[0].id;
    const secondItemId = items[1].id;

    // Issue first item (partial - not all issued)
    t0 = performance.now();
    await fetch(`${BASE_URL}/business-transactions/${indentId}/items/${firstItemId}/issue`, {
      method: 'POST', headers: authHeaders,
    });
    metrics.issueSingleItem.push(performance.now() - t0);

    // Issue second item (triggers full completion)
    t0 = performance.now();
    await fetch(`${BASE_URL}/business-transactions/${indentId}/items/${secondItemId}/issue`, {
      method: 'POST', headers: authHeaders,
    });
    metrics.issueSecondItem.push(performance.now() - t0);
  }

  console.log('\n--- ITEM-LEVEL ISSUE RESULTS ---');
  for (const [key, arr] of Object.entries(metrics)) {
    const s = stats(arr);
    console.log(`${key.padEnd(20)} P50: ${s.p50.toFixed(2).padStart(7)} ms | P95: ${s.p95.toFixed(2).padStart(7)} ms | Avg: ${s.avg.toFixed(2).padStart(7)} ms`);
  }
}

run().catch(console.error);
