const axios = require('axios');
const fs = require('fs');
const zlib = require('zlib');

const API_URL = 'https://indent-application.onrender.com';
const EMAIL = 'admin@indent.com';
const PASSWORD = 'L68fab9dWK52XYPA1!';

function gzipSize(str) {
  return new Promise((resolve) => {
    zlib.gzip(Buffer.from(str, 'utf8'), (err, result) => {
      resolve(err ? 0 : result.length);
    });
  });
}

async function measureAll() {
  console.log("Logging in...");
  const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
    email: EMAIL, password: PASSWORD
  });
  const token = loginRes.data.data.accessToken;
  const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${token}`, 'Accept-Encoding': 'identity' }
  });
  
  const results = {};

  // 1. Transaction List
  let t = Date.now();
  const listRes = await axiosInstance.get('/api/business-transactions?limit=20&page=1');
  const listStr = JSON.stringify(listRes.data);
  results['Transaction List (20)'] = {
    time: Date.now() - t,
    uncompressedBytes: Buffer.byteLength(listStr, 'utf8'),
    gzippedBytes: await gzipSize(listStr),
    objects: listRes.data.data?.data?.length || 0
  };
  
  // 2. Transaction Detail
  const txId = listRes.data.data?.data?.[0]?.id;
  if (txId) {
    t = Date.now();
    const detailRes = await axiosInstance.get(`/api/business-transactions/${txId}`);
    const detailStr = JSON.stringify(detailRes.data);
    const detailObj = detailRes.data.data;
    results['Transaction Detail'] = {
      time: Date.now() - t,
      uncompressedBytes: Buffer.byteLength(detailStr, 'utf8'),
      gzippedBytes: await gzipSize(detailStr),
      items: detailObj?.items?.length || 0,
      workflowHistory: detailObj?.workflowHistory?.length || 0,
      costItems: detailObj?.costSheet?.costItems?.length || 0,
      processCosts: detailObj?.costSheet?.processCosts?.length || 0
    };
    fs.writeFileSync('tx_detail_after.json', detailStr);
  }
  
  // 3. Operational Summary
  t = Date.now();
  const summaryRes = await axiosInstance.get('/api/business-transactions/operational-summary');
  const summaryStr = JSON.stringify(summaryRes.data);
  results['Operational Summary'] = {
    time: Date.now() - t,
    uncompressedBytes: Buffer.byteLength(summaryStr, 'utf8'),
    gzippedBytes: await gzipSize(summaryStr)
  };
  
  // 4. Analytics workflow
  t = Date.now();
  const anaRes = await axiosInstance.get('/api/analytics/workflow?timeframe=monthly');
  const anaStr = JSON.stringify(anaRes.data);
  results['Analytics Workflow'] = {
    time: Date.now() - t,
    uncompressedBytes: Buffer.byteLength(anaStr, 'utf8'),
    gzippedBytes: await gzipSize(anaStr)
  };
  
  // 5. Product Catalog
  t = Date.now();
  const catalogRes = await axiosInstance.get('/api/reports/master-data/products');
  const catalogStr = JSON.stringify(catalogRes.data);
  results['Product Catalog'] = {
    time: Date.now() - t,
    uncompressedBytes: Buffer.byteLength(catalogStr, 'utf8'),
    gzippedBytes: await gzipSize(catalogStr),
    items: catalogRes.data.data?.data?.length || 0
  };

  // 6. Workflow Bottleneck Report  
  t = Date.now();
  const wfRes = await axiosInstance.get('/api/reports/workflow/bottleneck');
  const wfStr = JSON.stringify(wfRes.data);
  results['Workflow Bottleneck Report'] = {
    time: Date.now() - t,
    uncompressedBytes: Buffer.byteLength(wfStr, 'utf8'),
    gzippedBytes: await gzipSize(wfStr)
  };

  console.log('\n=== P8 PRODUCTION PAYLOAD MEASUREMENTS ===\n');
  for (const [name, r] of Object.entries(results)) {
    console.log(`${name}:`);
    console.log(`  Time: ${r.time}ms`);
    console.log(`  Uncompressed: ${r.uncompressedBytes} bytes`);
    console.log(`  Gzip compressed: ${r.gzippedBytes} bytes`);
    console.log(`  Compression ratio: ${(100 - r.gzippedBytes / r.uncompressedBytes * 100).toFixed(1)}%`);
    if (r.objects) console.log(`  Objects: ${r.objects}`);
    if (r.items) console.log(`  Items: ${r.items}`);
    console.log('');
  }
}

measureAll().catch(e => { console.error(e.message); if (e.response) console.error(JSON.stringify(e.response.data)); });
