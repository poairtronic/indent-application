const axios = require('axios');
const zlib = require('zlib');

const API_URL = 'https://indent-application.onrender.com';
const EMAIL = 'admin@indent.com';
const PASSWORD = 'L68fab9dWK52XYPA1!';

async function measureCompression() {
  const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
    email: EMAIL, password: PASSWORD
  });
  const token = loginRes.data.data.accessToken;
  
  // Measure with gzip requested (like a real browser)
  const withGzip = await axios.get(`${API_URL}/api/business-transactions?limit=20&page=1`, {
    headers: { 
      Authorization: `Bearer ${token}`,
      'Accept-Encoding': 'gzip, deflate, br'
    },
    responseType: 'arraybuffer',
    decompress: false  // don't auto-decompress
  });
  
  const encoding = withGzip.headers['content-encoding'];
  const transferSize = withGzip.data.length;
  
  // Decompress to get actual size
  let decompressedSize = 0;
  if (encoding === 'gzip') {
    const unzipped = zlib.gunzipSync(withGzip.data);
    decompressedSize = unzipped.length;
  } else {
    decompressedSize = withGzip.data.length;
  }
  
  console.log('=== PRODUCTION COMPRESSION AUDIT (Transaction List) ===');
  console.log('Content-Encoding:', encoding || 'none');
  console.log('Wire transfer size:', transferSize, 'bytes');
  console.log('Uncompressed size:', decompressedSize, 'bytes');
  console.log('Savings:', decompressedSize - transferSize, 'bytes (' + ((decompressedSize - transferSize) / decompressedSize * 100).toFixed(1) + '%)');

  // Also check detail endpoint
  const listData = JSON.parse(zlib.gunzipSync(withGzip.data).toString('utf8'));
  const txId = listData.data?.data?.[0]?.id;
  if (txId) {
    const detailRes = await axios.get(`${API_URL}/api/business-transactions/${txId}`, {
      headers: { Authorization: `Bearer ${token}`, 'Accept-Encoding': 'gzip, deflate, br' },
      responseType: 'arraybuffer',
      decompress: false
    });
    const detailEncoding = detailRes.headers['content-encoding'];
    const detailTransfer = detailRes.data.length;
    let detailDecompressed = 0;
    if (detailEncoding === 'gzip') {
      detailDecompressed = zlib.gunzipSync(detailRes.data).length;
    } else {
      detailDecompressed = detailTransfer;
    }
    console.log('\n=== PRODUCTION COMPRESSION AUDIT (Transaction Detail) ===');
    console.log('Content-Encoding:', detailEncoding || 'none');
    console.log('Wire transfer size:', detailTransfer, 'bytes');
    console.log('Uncompressed size:', detailDecompressed, 'bytes');
    console.log('Savings:', detailDecompressed - detailTransfer, 'bytes (' + ((detailDecompressed - detailTransfer) / detailDecompressed * 100).toFixed(1) + '%)');
  }
}

measureCompression().catch(e => console.error(e.message));
