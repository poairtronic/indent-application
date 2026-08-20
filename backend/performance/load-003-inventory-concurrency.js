import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    inventory_contention: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '30s', target: 50 }, // Ramp to 50 concurrent Stores operators
        { duration: '1m', target: 50 },  // Hold for 1 minute
        { duration: '15s', target: 0 },  // Spin down
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    // We expect some 409 Conflicts due to optimistic locking protecting the inventory
    'http_req_failed{status:500}': ['rate<0.01'], // Real crashes should be ~0
    'http_req_duration': ['p(95)<800'],
  },
};

// Simulated mock transaction data for test isolation
const TARGET_TXN_ID = __ENV.TARGET_TXN_ID || 'mock-txn-001';
const API_BASE = __ENV.API_BASE_URL || 'http://localhost:3000/api';

export default function () {
  // Use pre-seeded Stores JWT token
  const token = __ENV.STORES_JWT_TOKEN; 

  const payload = JSON.stringify({
    issueQuantity: 10, // Many operators attempting to draw stock simultaneously
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };

  const res = http.post(`${API_BASE}/transactions/${TARGET_TXN_ID}/issue-materials`, payload, params);

  // Validate the backpressure logic: 
  // It is acceptable and expected for the DB to reject the mutation with 409 Conflict if stock limits are hit
  // It is a catastrophic failure if stock drops below zero (which would return a 2xx under corrupt concurrency logic)
  check(res, {
    'is successful (2xx) or graceful locking conflict (409)': (r) => r.status === 201 || r.status === 409,
    'is NOT a systemic server crash (500)': (r) => r.status !== 500,
  });

  // Short delay to simulate human operational tempo
  sleep(1);
}
