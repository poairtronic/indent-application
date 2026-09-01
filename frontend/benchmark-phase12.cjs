const { chromium } = require('playwright');
const fs = require('fs');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let requests = [];

  page.on('request', (request) => {
    requests.push({
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
      startTime: Date.now(),
    });
  });

  page.on('response', (response) => {
    const req = requests.find(
      (r) => r.url === response.url() && r.method === response.request().method(),
    );
    if (req) {
      req.status = response.status();
      req.endTime = Date.now();
      req.duration = req.endTime - req.startTime;
    }
  });

  const BASE_URL = 'http://localhost:5173';

  console.log('--- Navigating to Login ---');
  await page.goto(`${BASE_URL}/login`);
  await page.waitForTimeout(1000);

  console.log('--- Logging In ---');
  await page.fill('input[name="email"]', 'admin@indent.com');
  await page.fill('input[name="password"]', 'Password123!');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }),
    page.click('button[type="submit"]'),
  ]);

  console.log('--- Navigating directly to Indents Create ---');
  await page.goto(`${BASE_URL}/indents/create`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000); // give time for late API calls

  console.log('--- Writing Results ---');

  const apiRequests = requests
    .filter((r) => r.url.includes('/api/') && r.method !== 'OPTIONS')
    .sort((a, b) => a.startTime - b.startTime);

  const report = apiRequests
    .map(
      (r) =>
        `${r.method} ${r.url.replace('http://localhost:3001', '')} - ${r.status} - ${r.duration}ms`,
    )
    .join('\n');
  fs.writeFileSync('waterfall-baseline.txt', report);

  console.log('Done. Report saved to waterfall-baseline.txt');
  await browser.close();
}

run().catch(console.error);
