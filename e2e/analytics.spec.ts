import { test, expect } from '@playwright/test';
import { TEST_USER } from './global-setup';

test.describe('Analytics Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.locator('#password').fill(TEST_USER.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('/', { timeout: 15000 });
    
    await page.goto('/analytics');
  });

  test('should display analytics page header', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /analytics/i })).toBeVisible();
    await expect(page.getByText(/executive-level insights/i)).toBeVisible();
  });

  test('should display date range selector', async ({ page }) => {
    await expect(page.getByRole('combobox', { name: /date range/i })).toBeVisible();
  });

  test('should display hero stat cards', async ({ page }) => {
    await expect(page.getByText(/total mentions/i)).toBeVisible();
    await expect(page.getByText(/sentiment score/i)).toBeVisible();
    await expect(page.getByText(/top topic/i)).toBeVisible();
  });

  test('should display filters sidebar', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /filters/i })).toBeVisible();
    await expect(page.getByText(/keywords/i)).toBeVisible();
    await expect(page.getByText(/sources/i)).toBeVisible();
  });

  test('should display sentiment distribution chart', async ({ page }) => {
    await expect(page.getByText(/sentiment distribution/i)).toBeVisible();
  });

  test('should display top topics chart', async ({ page }) => {
    await expect(page.getByText(/top 5 topics/i)).toBeVisible();
  });

  test('should display mention volume chart', async ({ page }) => {
    await expect(page.getByText(/mention volume over time/i)).toBeVisible();
  });

  test('should have refresh button', async ({ page }) => {
    const refreshButton = page.getByRole('button', { name: /refresh/i });
    await expect(refreshButton).toBeVisible();
    await refreshButton.click();
  });

  test('should have export button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /export/i })).toBeVisible();
  });

  test('should toggle keyword filters', async ({ page }) => {
    const keywordBadge = page.locator('[class*="badge"]').first();
    if (await keywordBadge.isVisible()) {
      await keywordBadge.click();
    }
  });

  test('should toggle source checkboxes', async ({ page }) => {
    const checkbox = page.getByRole('checkbox').first();
    if (await checkbox.isVisible()) {
      await checkbox.click();
    }
  });

  test('should change date range', async ({ page }) => {
    await page.getByRole('combobox', { name: /date range/i }).click();
    await page.getByRole('option', { name: /30 days/i }).click();
  });
});
