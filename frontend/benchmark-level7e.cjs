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

  const BASE_URL = 'http://localhost:5173'; // Assuming standard Vite port

  console.log('--- Navigating to Login ---');
  await page.goto(`${BASE_URL}/login`);
  await page.waitForTimeout(1000);

  console.log('--- Logging In ---');
  await page.fill('input[name="email"]', 'admin@indent.com');
  await page.fill('input[name="password"]', 'Password123!');
  await Promise.all([page.waitForNavigation(), page.click('button[type="submit"]')]);
  await page.waitForTimeout(2000);

  console.log('--- Dashboard to Indents ---');
  await page.click('a:has-text("Indents")');
  await page.waitForTimeout(2000);

  console.log('--- Indents to Create Indent ---');
  await page.click('button:has-text("Create Indent"), a:has-text("Create Indent")');
  await page.waitForTimeout(2000);

  console.log('--- Writing Results ---');

  const apiRequests = requests.filter((r) => r.url.includes('/api/'));

  const report = apiRequests
    .map((r) => `${r.method} ${r.url} - ${r.status} - ${r.duration}ms`)
    .join('\n');
  fs.writeFileSync('waterfall-before.txt', report);

  console.log('Done.');
  await browser.close();
}

run().catch(console.error);
