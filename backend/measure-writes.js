const fs = require('fs');
const { performance } = require('perf_hooks');

const BASE_URL = 'http://localhost:3001/api';

function stats(arr) {
  if (arr.length === 0) return { p50: 0, p75: 0, p90: 0, p95: 0, p99: 0, avg: 0, min: 0, max: 0 };
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
  };
}

async function run() {
  console.log('Logging in as Admin (has all permissions)...');
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

  // Pre-fetch some master data for creating indents
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

  const createIndentPayload = {
    indent: {
      productId,
      productName: pData.data.items[0].productName,
      departmentId: deptId,
      departmentName: dData.data.items[0].departmentName,
      priority: 'MEDIUM',
      requiredDate: new Date(Date.now() + 86400000).toISOString(),
      purpose: 'Benchmark Submit Write',
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

  const ITERATIONS = 10;
  const submitDurations = [];

  console.log(`\nBenchmarking Submit Indent (${ITERATIONS} iterations)...`);
  for (let i = 0; i < ITERATIONS; i++) {
    console.log(`Iteration ${i+1}: Creating draft...`);
    const createRes = await fetch(`${BASE_URL}/business-transactions`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(createIndentPayload)
    });
    const createData = await createRes.json();
    const indentId = createData.id || createData.data?.id;
    if (!indentId) console.log('Create failed:', createData);
    
    console.log(`Iteration ${i+1}: Submitting indent ${indentId}...`);
    // 2. Measure Submit Indent
    const t0 = performance.now();
    const submitRes = await fetch(`${BASE_URL}/business-transactions/${indentId}/submit`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ remarks: 'Submitting benchmark' })
    });
    const t1 = performance.now();
    const submitData = await submitRes.json();
    if (!submitRes.ok) {
      console.error('Submit Failed', submitData);
    } else {
      submitDurations.push(t1 - t0);
      console.log(`Iteration ${i+1}: Submit took ${(t1 - t0).toFixed(2)} ms`);
    }
  }

  const submitStats = stats(submitDurations);
  console.log(`Submit Indent P50: ${submitStats.p50.toFixed(2)} ms`);
  console.log(`Submit Indent P95: ${submitStats.p95.toFixed(2)} ms`);
  console.log(`Submit Indent Avg: ${submitStats.avg.toFixed(2)} ms`);

}

run().catch(console.error);
