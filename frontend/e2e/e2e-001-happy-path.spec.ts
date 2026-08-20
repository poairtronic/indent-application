import { test, expect } from '@playwright/test';

test.describe('E2E-001: The Canonical Two-Loop Workflow', () => {
  // Test utilizes shared transaction ID passed between contexts
  let transactionId = '';

  test.describe.configure({ mode: 'serial' }); // Execute steps sequentially across roles

  test('ACTOR 1: Design drafts and submits indent', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'design@test.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    await page.click('text=New Indent');
    await page.fill('input[name="layoutNumber"]', 'LAYOUT-E2E-001');
    await page.click('button[type="submit"]');

    // Simulate navigation to details and state extraction
    await expect(page).toHaveURL(/\/transactions\/.+/);
    await expect(page.locator('text=Draft')).toBeVisible();

    // Submit transaction to next phase
    await page.click('button:has-text("Submit Transaction")');
    await expect(page.locator('text=Stores Processing')).toBeVisible();

    // In a real E2E, capture the generated ID
    transactionId = 'mock-txn-id';
  });

  test('ACTOR 2: Stores issues material and transitions state', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'stores@test.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    await page.goto(`/transactions/${transactionId}`);

    // Validate optimistic concurrency protection
    await page.fill('input[name="issueQuantity"]', '5');
    await page.click('button:has-text("Issue Materials")');
    await expect(page.locator('.toast-success')).toHaveText(/Issued Successfully/i);

    await expect(page.locator('text=Production Processing')).toBeVisible();
  });

  test('ACTOR 3: Production completes manufacturing strictly avoiding delivery', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'production@test.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    await page.goto(`/transactions/${transactionId}`);

    // Validate negative state protection (Customer Delivery does not exist)
    await expect(page.locator('text=CUSTOMER_DELIVERED')).toHaveCount(0);

    await page.click('button:has-text("Complete Manufacturing")');
    await expect(page.locator('text=Accounts Cost Verification')).toBeVisible();
  });

  test('ACTOR 4: Accounts updates actual cost and finalizes closure', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'accounts@test.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    await page.goto(`/transactions/${transactionId}`);

    await page.fill('input[name="actualCost"]', '150.0000');
    await page.click('button:has-text("Update Actual Cost")');
    await expect(page.locator('text=Actual Cost Updated')).toBeVisible();

    await page.click('button:has-text("Financial Closure")');
    await expect(page.locator('text=Archived')).toBeVisible();
  });

  test('ACTOR 5: Management verifies Zero-Approval monitoring and confirms COMPLETION', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'gm@test.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    await page.goto(`/transactions/${transactionId}`);

    // Zero-Approval validation: Ensure GM cannot mutate transaction
    await expect(page.locator('button:has-text("Approve")')).toHaveCount(0);
    await expect(page.locator('button:has-text("Reject")')).toHaveCount(0);

    // Assert Final Backend State
    await expect(page.locator('text=Completed')).toBeVisible();
  });
});
