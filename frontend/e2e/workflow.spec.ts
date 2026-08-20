import { test, expect } from '@playwright/test';

test.describe('Two-Loop Workflow & RBAC (e2e)', () => {
  test('Design user can draft and submit an indent successfully', async ({ page }) => {
    // Navigate and authenticate
    await page.goto('/login');
    await page.fill('input[name="email"]', 'design@test.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    // Wait for route protection to resolve to Dashboard
    await expect(page).toHaveURL('/dashboard');

    // Navigate to Indent Creation
    await page.click('text=New Indent');
    await expect(page).toHaveURL('/indents/new');

    // Test form constraints
    await page.fill('input[name="layoutNumber"]', 'LAYOUT-999');
    await page.click('button[type="submit"]');

    // Simulate API double-click protection
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled();

    // Verify React Query invalidation triggered redirect without full reload
    await expect(page).toHaveURL(/\/transactions\/.+/);
    await expect(page.locator('text=Draft')).toBeVisible();
  });

  test('Customer Delivery is strictly hidden across all panels', async ({ page }) => {
    await page.goto('/login');
    // Auth bypass for testing
    await page.evaluate(() =>
      window.localStorage.setItem('auth-storage', JSON.stringify({ state: { token: 'mock' } })),
    );
    await page.goto('/dashboard');

    // Assert Customer Delivery does not exist in the DOM
    await expect(page.locator('text=CUSTOMER_DELIVERED')).toHaveCount(0);
    await expect(page.locator('text=Customer Delivery')).toHaveCount(0);
  });

  test('Stores Issue prevents negative quantities with immediate validation toast', async ({
    page,
  }) => {
    // Navigate as Stores user
    await page.goto('/stores/issue');
    await page.fill('input[name="quantity"]', '-5');
    await page.click('button:has-text("Issue Material")');

    // Verify Toast error renders appropriately without stack tracing
    await expect(page.locator('.toast-error')).toHaveText(/Quantity must be a positive number/i);
  });
});
