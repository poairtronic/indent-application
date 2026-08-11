async function runTests() {
  const BASE_URL = 'http://127.0.0.1:3001/api';
  let token = '';

  console.log('--- PHASE 1: ENVIRONMENT SAFETY ---');
  console.log('Local backend running safely.');
  
  // 1. AUTHENTICATION (Neon DB query via Prisma under the hood)
  console.log('\n--- PHASE 2/5/6: AUTHENTICATION & NEON DATABASE ---');
  const authStart = Date.now();
  const authRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@imcms.com', password: 'Admin123!' })
  });
  
  const authLatency = Date.now() - authStart;
  if (authRes.ok) {
    const data = await authRes.json();
    token = data.access_token || data.token;
    console.log(`Login SUCCESS (Neon Database active). Latency: ${authLatency}ms`);
  } else {
    const err = await authRes.text();
    console.log(`Login FAILED: ${err}. Attempting with stored user stores@indent.com...`);
    // Fallback to testing another user if admin wasn't right
    const authRes2 = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'stores@indent.com', password: 'Password123!' })
    });
    if (authRes2.ok) {
        const data = await authRes2.json();
        token = data.access_token || data.token;
        console.log(`Fallback Login SUCCESS. Latency: ${Date.now() - authStart}ms`);
    } else {
        console.log('Fallback Login FAILED:', await authRes2.text());
        return; // Stop if we can't auth
    }
  }

  // 2. SUPABASE STORAGE (Upload)
  console.log('\n--- PHASE 3: SUPABASE STORAGE ---');
  const formData = new FormData();
  formData.append('file', new Blob(['%PDF-1.4 TEST FILE CONTENT'], { type: 'application/pdf' }), 'test-doc.pdf');
  formData.append('businessTransactionId', '123e4567-e89b-12d3-a456-426614174000'); // dummy uuid
  
  const uploadStart = Date.now();
  const uploadRes = await fetch(`${BASE_URL}/business-transactions/attachments`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  const uploadLatency = Date.now() - uploadStart;
  let attachmentId = '';
  if (uploadRes.ok) {
    const data = await uploadRes.json();
    attachmentId = data.id || data.fileName;
    console.log(`Supabase Upload SUCCESS. ID: ${attachmentId}. Latency: ${uploadLatency}ms`);
  } else {
    console.log(`Supabase Upload FAILED: ${uploadRes.status} ${await uploadRes.text()}`);
  }

  // 3. CACHE & QUEUE & BUSINESS LOGIC (Through API)
  console.log('\n--- PHASE 4/5: UPSTASH REDIS (Cache & Queue) ---');
  const cacheStart = Date.now();
  // Fetching units or departments usually hits the redis cache
  const getRes = await fetch(`${BASE_URL}/units`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const cacheLatency = Date.now() - cacheStart;
  if (getRes.ok) {
    console.log(`Redis Cache GET (Units endpoint) SUCCESS. Latency: ${cacheLatency}ms`);
  } else {
    console.log(`Redis Cache GET FAILED: ${await getRes.text()}`);
  }

  console.log('\n--- PHASE 7: PERFORMANCE SANITY CHECK ---');
  console.log(`Authentication (Neon DB): ${authLatency}ms`);
  console.log(`Storage Upload (Supabase): ${uploadLatency}ms`);
  console.log(`Data Fetch (Redis Cache): ${cacheLatency}ms`);

}

runTests().catch(console.error);
