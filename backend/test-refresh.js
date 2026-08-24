require('dotenv').config({ path: './.env' });
const axios = require('axios');
const jwt = require('jsonwebtoken');

async function run() {
  const secret = process.env.JWT_SECRET;
  const admin = {
    id: 'f49aae57-4c59-4635-acfd-a60dd70c5129',
    email: 'admin@indent.com',
    tenantId: '04a625ff-9800-47e2-8924-d2e85a539eb8',
    roleId: '809ccbfa-df86-4e08-9ba2-e25dfebfc715',
  };

  const refreshToken = jwt.sign({
    sub: admin.id,
    email: admin.email,
    tenantId: admin.tenantId,
    roleId: admin.roleId,
    type: 'REFRESH'
  }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

  console.log(`Hitting POST http://localhost:3001/api/auth/refresh`);
  
  try {
    const response = await axios.post(`http://localhost:3001/api/auth/refresh`, {
      refreshToken
    });
    console.log('HTTP Status:', response.status);
    console.log('HTTP Data:', response.data);
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
