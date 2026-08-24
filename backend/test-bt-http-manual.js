require('dotenv').config({ path: './.env' });
const axios = require('axios');
const jwt = require('jsonwebtoken');

async function run() {
  const secret = process.env.JWT_SECRET;
  console.log('JWT_SECRET loaded?', !!secret);
  
  // Create a valid token manually
  const token = jwt.sign({
    sub: 'f49aae57-4c59-4635-acfd-a60dd70c5129', // admin user id from previous logs
    email: 'admin@indent.com',
    tenantId: '04a625ff-9800-47e2-8924-d2e85a539eb8',
    roleId: '809ccbfa-df86-4e08-9ba2-e25dfebfc715',
    type: 'ACCESS'
  }, secret, { expiresIn: '1h' });

  const btId = '554a468e-79d6-458e-a27c-241c16590a1c';
  console.log(`Hitting GET http://localhost:3001/api/business-transactions/${btId} with token...`);
  
  try {
    const btResponse = await axios.get(`http://localhost:3001/api/business-transactions/${btId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('HTTP Status:', btResponse.status);
    console.log('HTTP Data:', JSON.stringify(btResponse.data).slice(0, 300));
  } catch (error) {
    if (error.response) {
      console.log('HTTP Error Status:', error.response.status);
      console.log('HTTP Error Data:', error.response.data);
    } else {
      console.log('HTTP Error:', error.message);
    }
  }
}
run();
