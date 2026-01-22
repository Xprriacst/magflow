import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const UNIQUE_EMAIL = `test${Date.now()}@magflow.com`;

test.describe('Authentication System', () => {
  test('should register a new user', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Navigate to signup page
    await page.click('text=S\'inscrire');
    
    // Fill registration form
    await page.fill('input[type="email"]', UNIQUE_EMAIL);
    await page.fill('input[type="password"]', 'testpass123');
    await page.fill('input[name="fullName"]', 'Test User');
    await page.fill('input[name="companyName"]', 'MagFlow Test');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for redirect after successful registration
    await page.waitForURL(/\/(dashboard|home|generate)/, { timeout: 10000 });
    
    // Verify user is logged in (check for logout button or user menu)
    const isLoggedIn = await page.locator('text=Déconnexion').isVisible().catch(() => false) ||
                       await page.locator('[data-testid="user-menu"]').isVisible().catch(() => false);
    
    expect(isLoggedIn).toBeTruthy();
    
    console.log('✅ Registration successful for:', UNIQUE_EMAIL);
  });

  test('should login with existing credentials', async ({ page }) => {
    // First register a user
    const email = `test${Date.now()}@magflow.com`;
    const password = 'testpass123';
    
    await page.goto(BASE_URL);
    await page.click('text=S\'inscrire');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.fill('input[name="fullName"]', 'Test User');
    await page.fill('input[name="companyName"]', 'MagFlow Test');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Logout
    const logoutButton = page.locator('text=Déconnexion').first();
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Now test login
    await page.goto(BASE_URL);
    await page.click('text=Se connecter');
    
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL(/\/(dashboard|home|generate)/, { timeout: 10000 });
    
    const isLoggedIn = await page.locator('text=Déconnexion').isVisible().catch(() => false) ||
                       await page.locator('[data-testid="user-menu"]').isVisible().catch(() => false);
    
    expect(isLoggedIn).toBeTruthy();
    
    console.log('✅ Login successful for:', email);
  });

  test('should persist session after page refresh', async ({ page }) => {
    // Register and login
    const email = `test${Date.now()}@magflow.com`;
    
    await page.goto(BASE_URL);
    await page.click('text=S\'inscrire');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'testpass123');
    await page.fill('input[name="fullName"]', 'Test User');
    await page.fill('input[name="companyName"]', 'MagFlow Test');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Refresh the page
    await page.reload();
    await page.waitForTimeout(1000);
    
    // Check if still logged in
    const isLoggedIn = await page.locator('text=Déconnexion').isVisible().catch(() => false) ||
                       await page.locator('[data-testid="user-menu"]').isVisible().catch(() => false);
    
    expect(isLoggedIn).toBeTruthy();
    
    console.log('✅ Session persisted after refresh');
  });

  test('should logout successfully', async ({ page }) => {
    // Register and login
    const email = `test${Date.now()}@magflow.com`;
    
    await page.goto(BASE_URL);
    await page.click('text=S\'inscrire');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'testpass123');
    await page.fill('input[name="fullName"]', 'Test User');
    await page.fill('input[name="companyName"]', 'MagFlow Test');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Logout
    const logoutButton = page.locator('text=Déconnexion').first();
    await logoutButton.click();
    await page.waitForTimeout(1000);
    
    // Verify redirected to login page
    const isOnLoginPage = await page.locator('text=Se connecter').isVisible() ||
                          await page.locator('text=S\'inscrire').isVisible();
    
    expect(isOnLoginPage).toBeTruthy();
    
    console.log('✅ Logout successful');
  });

  test('should reject invalid email format', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('text=S\'inscrire');
    
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'testpass123');
    await page.fill('input[name="fullName"]', 'Test User');
    await page.fill('input[name="companyName"]', 'MagFlow Test');
    
    await page.click('button[type="submit"]');
    
    // Should show error or stay on same page
    await page.waitForTimeout(1000);
    const hasError = await page.locator('text=/email|invalide/i').isVisible().catch(() => false);
    
    expect(hasError).toBeTruthy();
    
    console.log('✅ Invalid email rejected');
  });

  test('should reject short password', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('text=S\'inscrire');
    
    await page.fill('input[type="email"]', `test${Date.now()}@magflow.com`);
    await page.fill('input[type="password"]', 'short');
    await page.fill('input[name="fullName"]', 'Test User');
    await page.fill('input[name="companyName"]', 'MagFlow Test');
    
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(1000);
    const hasError = await page.locator('text=/password|mot de passe|caractères/i').isVisible().catch(() => false);
    
    expect(hasError).toBeTruthy();
    
    console.log('✅ Short password rejected');
  });
});
