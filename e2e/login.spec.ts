import { test, expect } from '@playwright/test';
import { TEST_USER } from './global-setup';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /welcome to aricainsights/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should switch between login and signup tabs', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /sign up/i })).toBeVisible();
    
    await page.getByRole('tab', { name: /sign up/i }).click();
    await expect(page.getByLabel(/first name/i)).toBeVisible();
    await expect(page.getByLabel(/last name/i)).toBeVisible();
  });

  test('should show password visibility toggle', async ({ page }) => {
    const passwordInput = page.locator('#password');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    await page.locator('button[type="button"]').first().click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });

  test('should require email and password', async ({ page }) => {
    await page.getByRole('button', { name: /sign in/i }).click();
    
    const emailInput = page.locator('#email');
    await expect(emailInput).toHaveAttribute('required', '');
  });

  test('should navigate to dashboard after login', async ({ page }) => {
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.locator('#password').fill(TEST_USER.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    
    await page.waitForURL('/', { timeout: 15000 });
    await expect(page).toHaveURL('/');
  });

  test('should show loading state during login', async ({ page }) => {
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.locator('#password').fill(TEST_USER.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Button should be disabled while loading
    await expect(page.getByRole('button', { name: /sign in/i })).toBeDisabled();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.locator('#password').fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should stay on login page (not navigate away)
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL('/login');
  });
});
