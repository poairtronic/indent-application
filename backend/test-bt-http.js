const axios = require('axios');

async function run() {
  try {
    const login = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@indent.com',
      password: 'password123'
    });
    const token = login.data.data.accessToken;

    const btId = '554a468e-79d6-458e-a27c-241c16590a1c';
    console.log(`Fetching BT with token: Bearer ${token.substring(0, 15)}...`);
    
    const btResponse = await axios.get(`http://localhost:3001/api/business-transactions/${btId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('BT Response Status:', btResponse.status);
    console.log('BT Response Data:', JSON.stringify(btResponse.data).slice(0, 200));
  } catch (error) {
    if (error.response) {
      console.log('Error Status:', error.response.status);
      console.log('Error Data:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
}
run();
