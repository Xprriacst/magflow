import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration Playwright pour MagFlow
 * Tests E2E complets pour auth, crédits, et génération
 */
export default defineConfig({
  testDir: './e2e',

  // Timeout pour les tests
  timeout: 60000,

  // Tests en parallèle
  fullyParallel: false,

  // Retries
  retries: process.env.CI ? 2 : 0,

  // Workers
  workers: 1,

  // Reporter
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],

  // Configuration globale
  use: {
    // Base URL
    baseURL: 'http://localhost:5173',

    // Trace et screenshots
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Viewport
    viewport: { width: 1280, height: 720 },

    // Timeouts
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  // Projects (browsers)
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],

  // Web servers à démarrer avant les tests
  // Note: Démarrer manuellement si reuseExistingServer=true
  webServer: [
    // Backend Node.js
    {
      command: 'cd backend && node server.js',
      port: 3001,
      timeout: 30000,
      reuseExistingServer: true,
    },
    // Frontend React
    {
      command: 'npm run dev',
      port: 5173,
      timeout: 30000,
      reuseExistingServer: true,
    },
  ],
});
