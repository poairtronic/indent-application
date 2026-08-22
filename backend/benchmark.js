const http = require('http');
const https = require('https');
const crypto = require('crypto');

// Generate a valid JWT token
function generateJWT() {
  const header = { alg: 'HS256', typ: 'JWT' };
  // Mock a valid admin user payload. The guards might require specific ID or roles, so let's check what a valid ID is.
  // We'll use ID 'user-1' and role 'ADMIN' which usually bypasses most things.
  // Actually, we can fetch a real user from DB or just provide a mocked one that matches JWT strategy.
  const payload = {
    sub: 'f49aae57-4c59-4635-acfd-a60dd70c5129',
    email: 'admin@indent.com',
    tenantId: 'f49aae57-4c59-4635-acfd-a60dd70c5129', // or whatever
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  };
  
  const base64UrlEncode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  
  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(payload);
  
  const signature = crypto.createHmac('sha256', 'super_secret_jwt_key_123456789')
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');
    
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

const token = generateJWT();

async function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const start = process.hrtime.bigint();
    const req = http.request({
      hostname: '127.0.0.1',
      port: 3001,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const end = process.hrtime.bigint();
        const durationMs = Number(end - start) / 1000000;
        resolve({
          statusCode: res.statusCode,
          durationMs,
          size: Buffer.byteLength(data, 'utf8')
        });
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

function calculateStats(times) {
  times.sort((a, b) => a - b);
  const sum = times.reduce((a, b) => a + b, 0);
  const avg = sum / times.length;
  const p50 = times[Math.floor(times.length * 0.50)];
  const p75 = times[Math.floor(times.length * 0.75)];
  const p90 = times[Math.floor(times.length * 0.90)];
  const p95 = times[Math.floor(times.length * 0.95)];
  const p99 = times[Math.floor(times.length * 0.99)];
  const min = times[0];
  const max = times[times.length - 1];
  
  return { avg, p50, p75, p90, p95, p99, min, max };
}

const endpoints = [
  '/api/materials',
  '/api/products',
  '/api/departments',
  '/api/units',
  '/api/manufacturing-processes',
  '/api/vendors',
  '/api/analytics/summary',
  '/api/analytics/dashboard-overview',
  '/api/notifications?page=1&limit=5'
];

async function run() {
  console.log("Waiting for server to be ready...");
  await new Promise(r => setTimeout(r, 2000));
  
  for (const endpoint of endpoints) {
    console.log(`\nBenchmarking: ${endpoint}`);
    // Warmup
    for (let i = 0; i < 5; i++) {
      try {
        await makeRequest(endpoint);
      } catch(e) {}
    }
    
    // Test
    const results = [];
    let size = 0;
    let statusCode = 0;
    for (let i = 0; i < 30; i++) {
      try {
        const res = await makeRequest(endpoint);
        results.push(res.durationMs);
        size = res.size;
        statusCode = res.statusCode;
      } catch(e) {
        console.error(`Error on ${endpoint}:`, e.message);
      }
    }
    
    const stats = calculateStats(results);
    console.log(`Status: ${statusCode}, Size: ${size} bytes`);
    console.log(`P50: ${stats.p50.toFixed(2)} ms`);
    console.log(`P75: ${stats.p75.toFixed(2)} ms`);
    console.log(`P90: ${stats.p90.toFixed(2)} ms`);
    console.log(`P95: ${stats.p95.toFixed(2)} ms`);
    console.log(`P99: ${stats.p99.toFixed(2)} ms`);
    console.log(`Avg: ${stats.avg.toFixed(2)} ms`);
    console.log(`Min: ${stats.min.toFixed(2)} ms, Max: ${stats.max.toFixed(2)} ms`);
  }
}

run().catch(console.error);
