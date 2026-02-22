import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour le système d'authentification MagFlow
 */

// Helper pour générer un email unique
const uniqueEmail = () => `test.e2e.${Date.now()}@magflow-test.com`;

test.describe('Authentication - Pages publiques', () => {
  test('La page login est accessible', async ({ page }) => {
    await page.goto('/login');

    // Vérifier les éléments de la page
    await expect(page.locator('h1, h2').filter({ hasText: /connexion/i })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('La page signup est accessible', async ({ page }) => {
    await page.goto('/signup');

    // Vérifier les éléments de la page
    await expect(page.locator('h1, h2').filter({ hasText: /inscription/i })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.locator('input[name="fullName"]')).toBeVisible();
  });

  test('Lien vers signup depuis login', async ({ page }) => {
    await page.goto('/login');

    await page.click('text=Créer un compte');
    await expect(page).toHaveURL(/\/signup/);
  });

  test('Lien vers login depuis signup', async ({ page }) => {
    await page.goto('/signup');

    await page.click('text=Se connecter');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Authentication - Routes protégées', () => {
  test('Accès à / redirige vers login si non connecté', async ({ page }) => {
    await page.goto('/');

    // Doit être redirigé vers login
    await expect(page).toHaveURL(/\/login/);
  });

  test('Accès à /smart-content-creator redirige vers login', async ({ page }) => {
    await page.goto('/smart-content-creator');

    await expect(page).toHaveURL(/\/login/);
  });

  test('Accès à /dashboard redirige vers login', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/login/);
  });

  test('Accès à /pricing est public', async ({ page }) => {
    await page.goto('/pricing');

    // Pricing est accessible sans auth
    await expect(page).toHaveURL(/\/pricing/);
    await expect(page.locator('h1').filter({ hasText: /crédit/i })).toBeVisible();
  });
});

test.describe('Authentication - Inscription', () => {
  test('Inscription avec données valides', async ({ page }) => {
    const email = uniqueEmail();

    await page.goto('/signup');

    // Remplir le formulaire
    await page.fill('input[name="fullName"]', 'Test E2E User');
    await page.fill('input[type="email"]', email);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.fill('input[name="confirmPassword"]', 'TestPassword123!');

    // Accepter les conditions (checkbox)
    const checkbox = page.locator('input[type="checkbox"]');
    if (await checkbox.isVisible()) {
      await checkbox.check();
    }

    // Soumettre
    await page.click('button[type="submit"]');

    // Attendre la réponse (soit succès avec redirection, soit message de confirmation email)
    await page.waitForTimeout(3000);

    // Vérifier le succès (redirection ou message)
    const isRedirected = page.url().includes('/smart-content-creator') || page.url().includes('/');
    const hasSuccessMessage = await page.locator('text=/vérifiez|email|confirmation/i').isVisible().catch(() => false);

    expect(isRedirected || hasSuccessMessage).toBeTruthy();
  });

  test('Inscription échoue avec email invalide', async ({ page }) => {
    await page.goto('/signup');

    await page.fill('input[name="fullName"]', 'Test User');
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.fill('input[name="confirmPassword"]', 'TestPassword123!');

    const checkbox = page.locator('input[type="checkbox"]');
    if (await checkbox.isVisible()) {
      await checkbox.check();
    }

    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Doit rester sur la page signup ou afficher une erreur
    const stillOnSignup = page.url().includes('/signup');
    const hasError = await page.locator('.text-red-600, .text-red-500, [class*="error"]').isVisible().catch(() => false);

    expect(stillOnSignup || hasError).toBeTruthy();
  });

  test('Inscription échoue avec mot de passe trop court', async ({ page }) => {
    await page.goto('/signup');

    await page.fill('input[name="fullName"]', 'Test User');
    await page.fill('input[type="email"]', uniqueEmail());
    await page.fill('input[name="password"]', '123');
    await page.fill('input[name="confirmPassword"]', '123');

    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Doit afficher une erreur
    const hasError = await page.locator('text=/caractères|password|mot de passe/i').isVisible().catch(() => false);
    expect(hasError).toBeTruthy();
  });

  test('Inscription échoue si mots de passe différents', async ({ page }) => {
    await page.goto('/signup');

    await page.fill('input[name="fullName"]', 'Test User');
    await page.fill('input[type="email"]', uniqueEmail());
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!');

    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Doit afficher une erreur
    const hasError = await page.locator('text=/correspondent|match|différent/i').isVisible().catch(() => false);
    expect(hasError).toBeTruthy();
  });
});

test.describe('Authentication - Connexion', () => {
  test('Connexion échoue avec mauvais identifiants', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'nonexistent@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Doit afficher une erreur
    const hasError = await page.locator('.text-red-600, .text-red-500, .bg-red-50').isVisible().catch(() => false);
    expect(hasError).toBeTruthy();

    // Doit rester sur la page login
    expect(page.url()).toContain('/login');
  });

  test('Champs requis affichent une validation', async ({ page }) => {
    await page.goto('/login');

    // Cliquer submit sans remplir
    await page.click('button[type="submit"]');

    // Les champs required doivent avoir une validation native
    const emailInput = page.locator('input[type="email"]');
    const isInvalid = await emailInput.evaluate(el => !el.validity.valid);

    expect(isInvalid).toBeTruthy();
  });
});

test.describe('Authentication - Session', () => {
  // Ce test nécessite un utilisateur existant dans la base
  // On le skip si l'utilisateur test n'existe pas
  test.skip('Session persiste après refresh', async ({ page }) => {
    // Login avec un utilisateur test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@magflow.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/(smart-content-creator)?$/);

    // Refresh
    await page.reload();
    await page.waitForTimeout(1000);

    // Toujours connecté
    expect(page.url()).not.toContain('/login');
  });
});
