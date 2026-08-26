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
  
  // Request with no compression to get raw uncompressed size
  const uncompRes = await axios.get(`${API_URL}/api/business-transactions?limit=20&page=1`, {
    headers: { 
      Authorization: `Bearer ${token}`,
      'Accept-Encoding': 'identity'  // no compression
    },
    responseType: 'arraybuffer'
  });
  const rawSize = uncompRes.data.length;
  
  // Request with brotli like browser
  const compRes = await axios.get(`${API_URL}/api/business-transactions?limit=20&page=1`, {
    headers: { 
      Authorization: `Bearer ${token}`,
      'Accept-Encoding': 'br, gzip, deflate'
    },
    responseType: 'arraybuffer',
    decompress: false
  });
  const wireSize = compRes.data.length;
  const encoding = compRes.headers['content-encoding'];
  
  console.log('=== PRODUCTION COMPRESSION AUDIT ===');
  console.log('Endpoint: Transaction List (20 records)');
  console.log('Content-Encoding:', encoding || 'none');
  console.log('Uncompressed size:', rawSize, 'bytes');
  console.log('Wire size (compressed):', wireSize, 'bytes');
  console.log('Transfer savings:', rawSize - wireSize, 'bytes (' + ((rawSize - wireSize) / rawSize * 100).toFixed(1) + '%)');
  
  // Detail
  const listStr = uncompRes.data.toString('utf8');
  const listData = JSON.parse(listStr);
  const txId = listData.data?.data?.[0]?.id;
  if (txId) {
    const uncompDetail = await axios.get(`${API_URL}/api/business-transactions/${txId}`, {
      headers: { Authorization: `Bearer ${token}`, 'Accept-Encoding': 'identity' },
      responseType: 'arraybuffer'
    });
    const compDetail = await axios.get(`${API_URL}/api/business-transactions/${txId}`, {
      headers: { Authorization: `Bearer ${token}`, 'Accept-Encoding': 'br, gzip, deflate' },
      responseType: 'arraybuffer',
      decompress: false
    });
    const rawDetailSize = uncompDetail.data.length;
    const wireDetailSize = compDetail.data.length;
    const detailEncoding = compDetail.headers['content-encoding'];
    console.log('\nEndpoint: Transaction Detail');
    console.log('Content-Encoding:', detailEncoding || 'none');
    console.log('Uncompressed size:', rawDetailSize, 'bytes');
    console.log('Wire size (compressed):', wireDetailSize, 'bytes');
    console.log('Transfer savings:', rawDetailSize - wireDetailSize, 'bytes (' + ((rawDetailSize - wireDetailSize) / rawDetailSize * 100).toFixed(1) + '%)');
  }
}

measureCompression().catch(e => { console.error(e.message); if (e.response) console.error(e.response.status); });
