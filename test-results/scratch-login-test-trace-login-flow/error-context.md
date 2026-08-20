# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: scratch\login-test.spec.ts >> trace login flow
- Location: scratch\login-test.spec.ts:3:5

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
Call log:
  - navigating to "http://localhost:5173/login", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('trace login flow', async ({ page }) => {
  4  |   const requests: any[] = [];
  5  |   const responses: any[] = [];
  6  |   
  7  |   page.on('request', request => {
  8  |     if (request.url().includes('/api/auth/login') || request.url().includes('/api/auth/profile')) {
  9  |       console.log(`[REQUEST] ${request.method()} ${request.url()}`);
  10 |       requests.push({ url: request.url(), method: request.method() });
  11 |     }
  12 |   });
  13 | 
  14 |   page.on('response', async response => {
  15 |     if (response.url().includes('/api/auth/login') || response.url().includes('/api/auth/profile')) {
  16 |       console.log(`[RESPONSE] ${response.status()} ${response.url()}`);
  17 |       responses.push({ url: response.url(), status: response.status() });
  18 |     }
  19 |   });
  20 | 
  21 |   page.on('console', msg => {
  22 |     console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
  23 |   });
  24 | 
> 25 |   await page.goto('http://localhost:5173/login');
     |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
  26 |   
  27 |   await page.fill('input[id="email"]', 'admin@imcms.com');
  28 |   await page.fill('input[id="password"]', 'admin123');
  29 |   
  30 |   console.log('Clicking sign in...');
  31 |   await page.click('button[type="submit"]');
  32 |   
  33 |   await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(e => console.log('Timeout waiting for dashboard'));
  34 |   
  35 |   console.log('Requests:', requests);
  36 |   console.log('Responses:', responses);
  37 |   console.log('Final URL:', page.url());
  38 | });
  39 | 
```