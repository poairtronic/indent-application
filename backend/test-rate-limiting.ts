import { spawn } from 'child_process';
import http from 'http';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchPost(path: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3001,
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': '203.0.113.195',
        },
      },
      (res) => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
        });
      },
    );

    req.on('error', (e) => {
      reject(e);
    });

    req.write(JSON.stringify({ email: 'test@example.com', password: 'password123' }));
    req.end();
  });
}

async function runTests() {
  console.info('Starting backend server for Rate Limiting Test...');
  const server = spawn('node', ['dist/main.js'], {
    env: { ...process.env, PORT: '3001' },
  });

  try {
    console.info('Waiting 5 seconds for server to start...');
    await delay(5000);

    let passed = 0;
    let failed = 0;
    const path = '/api/auth/login';

    console.info(`\nFiring 6 rapid requests at ${path}...`);

    for (let i = 1; i <= 6; i++) {
      const { statusCode } = await fetchPost(path);
      console.info(`Request ${i} -> Status: ${statusCode}`);

      if (i <= 5) {
        if (statusCode !== 429) {
          console.info(`[PASS] Request ${i} was not rate-limited.`);
          passed++;
        } else {
          console.error(`[FAIL] Request ${i} was prematurely rate-limited.`);
          failed++;
        }
      } else {
        // Request 6 should be rate limited (429)
        if (statusCode === 429) {
          console.info(`[PASS] Request ${i} was correctly rate-limited with 429.`);
          passed++;
        } else {
          console.error(`[FAIL] Request ${i} was NOT rate-limited! (Got ${statusCode})`);
          failed++;
        }
      }
    }

    console.info(`\nResults: ${passed} passed, ${failed} failed.`);
    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    console.info('Shutting down server...');
    server.kill();
  }
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
