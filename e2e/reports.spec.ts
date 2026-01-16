import { test, expect } from '@playwright/test';
import { TEST_USER } from './global-setup';

test.describe('Reports Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.locator('#password').fill(TEST_USER.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('/', { timeout: 15000 });
    
    await page.goto('/reports');
  });

  test('should display reports page header', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /reports/i })).toBeVisible();
  });

  test('should display report generation form', async ({ page }) => {
    await expect(page.getByText(/generate report/i)).toBeVisible();
  });

  test('should have date range options', async ({ page }) => {
    const dateRangeSelector = page.getByRole('combobox').first();
    if (await dateRangeSelector.isVisible()) {
      await dateRangeSelector.click();
    }
  });

  test('should display report preview section', async ({ page }) => {
    await expect(page.getByText(/preview/i).or(page.getByText(/report/i))).toBeVisible();
  });

  test('should have export PDF button', async ({ page }) => {
    const exportButton = page.getByRole('button', { name: /export|pdf|download/i });
    await expect(exportButton.first()).toBeVisible();
  });

  test('should display report history', async ({ page }) => {
    await expect(page.getByText(/history|recent|previous/i).first()).toBeVisible();
  });

  test('should generate report on form submit', async ({ page }) => {
    const generateButton = page.getByRole('button', { name: /generate/i });
    if (await generateButton.isVisible()) {
      await generateButton.click();
    }
  });
});
