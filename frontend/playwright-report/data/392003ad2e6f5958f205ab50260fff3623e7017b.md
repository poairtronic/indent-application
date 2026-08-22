# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-001-happy-path.spec.ts >> E2E-001: The Canonical Two-Loop Workflow >> ACTOR 1: Design drafts and submits indent
- Location: e2e\e2e-001-happy-path.spec.ts:9:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('text=New Indent')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic:
    - img "Modern Automated Manufacturing Plant"
  - banner [ref=e4]:
    - generic [ref=e11]:
      - generic [ref=e12]: MERC
      - generic [ref=e13]: Manufacturing Enterprise Resource & Costing
    - button "Toggle light/dark theme" [ref=e14]
  - main [ref=e17]:
    - generic [ref=e18]:
      - heading "Optimizing yield, tracking real-time cost." [level=1] [ref=e19]: Optimizing yield,tracking real-time cost.
      - paragraph [ref=e20]: Unify supply workflows, machine telemetry, automated indents, and operational costs into a single control plane built for modern heavy industry.
    - generic [ref=e23]:
      - generic [ref=e28]:
        - heading "Sign In to MERC" [level=2] [ref=e29]
        - paragraph [ref=e30]: Access your manufacturing control portal
      - alert [ref=e31]:
        - generic [ref=e34]: Login failed. Please check your credentials and try again.
      - generic [ref=e35]:
        - generic [ref=e36]:
          - generic [ref=e37]: EMAIL ADDRESS
          - textbox "admin@indent.com" [ref=e41]: design@test.com
        - generic [ref=e42]:
          - generic [ref=e43]: PASSWORD
          - generic [ref=e44]:
            - textbox "••••••••••••" [ref=e47]: testpassword123
            - button "Show password" [ref=e48] [cursor=pointer]
        - generic [ref=e52]:
          - generic [ref=e53] [cursor=pointer]:
            - checkbox "Remember Me" [ref=e54]
            - text: Remember Me
          - link "Forgot Password?" [ref=e55] [cursor=pointer]:
            - /url: /forgot-password
        - button "Sign In" [ref=e56]
  - contentinfo [ref=e60]:
    - generic [ref=e61]: © 2026 MERC Enterprise Systems. All rights reserved.
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('E2E-001: The Canonical Two-Loop Workflow', () => {
  4  |   // Test utilizes shared transaction ID passed between contexts
  5  |   let transactionId = '';
  6  | 
  7  |   test.describe.configure({ mode: 'serial' }); // Execute steps sequentially across roles
  8  | 
  9  |   test('ACTOR 1: Design drafts and submits indent', async ({ page }) => {
  10 |     await page.goto('/login');
  11 |     await page.fill('input[name="email"]', 'design@test.com');
  12 |     await page.fill('input[name="password"]', 'testpassword123');
  13 |     await page.click('button[type="submit"]');
  14 | 
> 15 |     await page.click('text=New Indent');
     |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  16 |     await page.fill('input[name="layoutNumber"]', 'LAYOUT-E2E-001');
  17 |     await page.click('button[type="submit"]');
  18 | 
  19 |     // Simulate navigation to details and state extraction
  20 |     await expect(page).toHaveURL(/\/transactions\/.+/);
  21 |     await expect(page.locator('text=Draft')).toBeVisible();
  22 | 
  23 |     // Submit transaction to next phase
  24 |     await page.click('button:has-text("Submit Transaction")');
  25 |     await expect(page.locator('text=Stores Processing')).toBeVisible();
  26 | 
  27 |     // In a real E2E, capture the generated ID
  28 |     transactionId = 'mock-txn-id';
  29 |   });
  30 | 
  31 |   test('ACTOR 2: Stores issues material and transitions state', async ({ page }) => {
  32 |     await page.goto('/login');
  33 |     await page.fill('input[name="email"]', 'stores@test.com');
  34 |     await page.fill('input[name="password"]', 'testpassword123');
  35 |     await page.click('button[type="submit"]');
  36 | 
  37 |     await page.goto(`/transactions/${transactionId}`);
  38 | 
  39 |     // Validate optimistic concurrency protection
  40 |     await page.fill('input[name="issueQuantity"]', '5');
  41 |     await page.click('button:has-text("Issue Materials")');
  42 |     await expect(page.locator('.toast-success')).toHaveText(/Issued Successfully/i);
  43 | 
  44 |     await expect(page.locator('text=Production Processing')).toBeVisible();
  45 |   });
  46 | 
  47 |   test('ACTOR 3: Production completes manufacturing strictly avoiding delivery', async ({
  48 |     page,
  49 |   }) => {
  50 |     await page.goto('/login');
  51 |     await page.fill('input[name="email"]', 'production@test.com');
  52 |     await page.fill('input[name="password"]', 'testpassword123');
  53 |     await page.click('button[type="submit"]');
  54 | 
  55 |     await page.goto(`/transactions/${transactionId}`);
  56 | 
  57 |     // Validate negative state protection (Customer Delivery does not exist)
  58 |     await expect(page.locator('text=CUSTOMER_DELIVERED')).toHaveCount(0);
  59 | 
  60 |     await page.click('button:has-text("Complete Manufacturing")');
  61 |     await expect(page.locator('text=Accounts Cost Verification')).toBeVisible();
  62 |   });
  63 | 
  64 |   test('ACTOR 4: Accounts updates actual cost and finalizes closure', async ({ page }) => {
  65 |     await page.goto('/login');
  66 |     await page.fill('input[name="email"]', 'accounts@test.com');
  67 |     await page.fill('input[name="password"]', 'testpassword123');
  68 |     await page.click('button[type="submit"]');
  69 | 
  70 |     await page.goto(`/transactions/${transactionId}`);
  71 | 
  72 |     await page.fill('input[name="actualCost"]', '150.0000');
  73 |     await page.click('button:has-text("Update Actual Cost")');
  74 |     await expect(page.locator('text=Actual Cost Updated')).toBeVisible();
  75 | 
  76 |     await page.click('button:has-text("Financial Closure")');
  77 |     await expect(page.locator('text=Archived')).toBeVisible();
  78 |   });
  79 | 
  80 |   test('ACTOR 5: Management verifies Zero-Approval monitoring and confirms COMPLETION', async ({
  81 |     page,
  82 |   }) => {
  83 |     await page.goto('/login');
  84 |     await page.fill('input[name="email"]', 'gm@test.com');
  85 |     await page.fill('input[name="password"]', 'testpassword123');
  86 |     await page.click('button[type="submit"]');
  87 | 
  88 |     await page.goto(`/transactions/${transactionId}`);
  89 | 
  90 |     // Zero-Approval validation: Ensure GM cannot mutate transaction
  91 |     await expect(page.locator('button:has-text("Approve")')).toHaveCount(0);
  92 |     await expect(page.locator('button:has-text("Reject")')).toHaveCount(0);
  93 | 
  94 |     // Assert Final Backend State
  95 |     await expect(page.locator('text=Completed')).toBeVisible();
  96 |   });
  97 | });
  98 | 
```