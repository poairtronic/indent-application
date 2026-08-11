import { spawn } from 'child_process';
import http from 'http';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchHeaders(path: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3001,
        path: path,
        method: 'GET',
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

    req.end();
  });
}

async function runTests() {
  console.info('Starting backend server...');
  const server = spawn('node', ['dist/main.js'], {
    env: { ...process.env, PORT: '3001' },
  });

  try {
    console.info('Waiting 5 seconds for server to start...');
    await delay(5000);

    const endpoints = [
      { name: 'Swagger UI', path: '/api' },
      { name: 'API Auth (401)', path: '/api/auth/me' },
    ];

    let passed = 0;
    let failed = 0;

    for (const ep of endpoints) {
      console.info(`\nTesting endpoint: ${ep.name} (${ep.path})`);
      const { statusCode, headers } = await fetchHeaders(ep.path);
      console.info(`Status: ${statusCode}`);

      const expectedHeaders = [
        'content-security-policy',
        'x-content-type-options',
        'x-frame-options',
        'referrer-policy',
      ];

      for (const h of expectedHeaders) {
        if (headers[h]) {
          console.info(`[PASS] Has ${h}: ${headers[h]}`);
          passed++;
        } else {
          console.error(`[FAIL] Missing ${h}`);
          failed++;
        }
      }

      if (headers['x-powered-by']) {
        console.error(`[FAIL] Leaked X-Powered-By header`);
        failed++;
      } else {
        console.info(`[PASS] No X-Powered-By header`);
        passed++;
      }

      // HSTS check (Should be missing since NODE_ENV != production)
      if (headers['strict-transport-security']) {
        console.error(`[FAIL] HSTS should not be present in local development!`);
        failed++;
      } else {
        console.info(`[PASS] HSTS correctly disabled for local development`);
        passed++;
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
