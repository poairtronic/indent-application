# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workflow.spec.ts >> Two-Loop Workflow & RBAC (e2e) >> Stores Issue prevents negative quantities with immediate validation toast
- Location: e2e\workflow.spec.ts:44:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[name="quantity"]')

```

# Page snapshot

```yaml
- generic [ref=e4]:
    - heading "404" [level=1] [ref=e5]
    - heading "Page Not Found" [level=2] [ref=e6]
    - paragraph [ref=e7]: The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
    - button "Return to Dashboard" [ref=e8]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  |
  3  | test.describe('Two-Loop Workflow & RBAC (e2e)', () => {
  4  |   test('Design user can draft and submit an indent successfully', async ({ page }) => {
  5  |     // Navigate and authenticate
  6  |     await page.goto('/login');
  7  |     await page.fill('input[name="email"]', 'design@test.com');
  8  |     await page.fill('input[name="password"]', 'testpassword123');
  9  |     await page.click('button[type="submit"]');
  10 |
  11 |     // Wait for route protection to resolve to Dashboard
  12 |     await expect(page).toHaveURL('/dashboard');
  13 |
  14 |     // Navigate to Indent Creation
  15 |     await page.click('text=New Indent');
  16 |     await expect(page).toHaveURL('/indents/new');
  17 |
  18 |     // Test form constraints
  19 |     await page.fill('input[name="layoutNumber"]', 'LAYOUT-999');
  20 |     await page.click('button[type="submit"]');
  21 |
  22 |     // Simulate API double-click protection
  23 |     const submitBtn = page.locator('button[type="submit"]');
  24 |     await expect(submitBtn).toBeDisabled();
  25 |
  26 |     // Verify React Query invalidation triggered redirect without full reload
  27 |     await expect(page).toHaveURL(/\/transactions\/.+/);
  28 |     await expect(page.locator('text=Draft')).toBeVisible();
  29 |   });
  30 |
  31 |   test('Customer Delivery is strictly hidden across all panels', async ({ page }) => {
  32 |     await page.goto('/login');
  33 |     // Auth bypass for testing
  34 |     await page.evaluate(() =>
  35 |       window.localStorage.setItem('auth-storage', JSON.stringify({ state: { token: 'mock' } })),
  36 |     );
  37 |     await page.goto('/dashboard');
  38 |
  39 |     // Assert Customer Delivery does not exist in the DOM
  40 |     await expect(page.locator('text=CUSTOMER_DELIVERED')).toHaveCount(0);
  41 |     await expect(page.locator('text=Customer Delivery')).toHaveCount(0);
  42 |   });
  43 |
  44 |   test('Stores Issue prevents negative quantities with immediate validation toast', async ({
  45 |     page,
  46 |   }) => {
  47 |     // Navigate as Stores user
  48 |     await page.goto('/stores/issue');
> 49 |     await page.fill('input[name="quantity"]', '-5');
     |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
  50 |     await page.click('button:has-text("Issue Material")');
  51 |
  52 |     // Verify Toast error renders appropriately without stack tracing
  53 |     await expect(page.locator('.toast-error')).toHaveText(/Quantity must be a positive number/i);
  54 |   });
  55 | });
  56 |
```
