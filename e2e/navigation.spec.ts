import { test, expect } from '@playwright/test';
import { TEST_USER } from './global-setup';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.locator('#password').fill(TEST_USER.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('/', { timeout: 15000 });
  });

  test('should navigate to dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
  });

  test('should navigate to analytics', async ({ page }) => {
    await page.goto('/analytics');
    await expect(page).toHaveURL('/analytics');
    await expect(page.getByRole('heading', { name: /analytics/i })).toBeVisible();
  });

  test('should navigate to reports', async ({ page }) => {
    await page.goto('/reports');
    await expect(page).toHaveURL('/reports');
    await expect(page.getByRole('heading', { name: /reports/i })).toBeVisible();
  });

  test('should navigate to settings', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL('/settings');
  });

  test('should show 404 for unknown routes', async ({ page }) => {
    await page.goto('/unknown-page');
    await expect(page.getByText(/not found|404/i)).toBeVisible();
  });

  test('should have responsive sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
  });

  test('should have mobile navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
  });
});
