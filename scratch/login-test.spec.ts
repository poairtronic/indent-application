import { test, expect } from '@playwright/test';

test('trace login flow', async ({ page }) => {
  const requests: any[] = [];
  const responses: any[] = [];
  
  page.on('request', request => {
    if (request.url().includes('/api/auth/login') || request.url().includes('/api/auth/profile')) {
      console.log(`[REQUEST] ${request.method()} ${request.url()}`);
      requests.push({ url: request.url(), method: request.method() });
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/api/auth/login') || response.url().includes('/api/auth/profile')) {
      console.log(`[RESPONSE] ${response.status()} ${response.url()}`);
      responses.push({ url: response.url(), status: response.status() });
    }
  });

  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
  });

  await page.goto('http://localhost:5173/login');
  
  await page.fill('input[id="email"]', 'admin@imcms.com');
  await page.fill('input[id="password"]', 'admin123');
  
  console.log('Clicking sign in...');
  await page.click('button[type="submit"]');
  
  await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(e => console.log('Timeout waiting for dashboard'));
  
  console.log('Requests:', requests);
  console.log('Responses:', responses);
  console.log('Final URL:', page.url());
});
