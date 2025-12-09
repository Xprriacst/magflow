import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration Playwright pour MagFlow
 * Tests E2E complets avec multi-services
 */
export default defineConfig({
  testDir: './e2e',
  
  // Timeout pour les tests (génération InDesign peut être longue)
  timeout: 120000,
  
  // Tests en parallèle
  fullyParallel: false, // Séquentiel pour éviter conflits InDesign
  
  // Pas de retry en local, 2 retry en CI
  retries: process.env.CI ? 2 : 0,
  
  // Workers
  workers: process.env.CI ? 1 : 1, // 1 seul worker pour InDesign
  
  // Reporter
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],
  
  // Configuration globale
  use: {
    // Base URL
    baseURL: 'http://localhost:5173',
    
    // Trace
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Viewport
    viewport: { width: 1920, height: 1080 },
    
    // Timeouts
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  
  // Projects (browsers)
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--disable-web-security'] // Pour CORS en dev
        }
      },
    },
    
    // Optionnel: autres navigateurs
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
  
  // Web servers à démarrer avant les tests
  webServer: [
    // Backend Node.js
    {
      command: 'npm run dev',
      cwd: './magflow/backend',
      port: 3001,
      timeout: 120000,
      reuseExistingServer: !process.env.CI,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    
    // Frontend React
    {
      command: 'npm run dev',
      cwd: './magflow',
      port: 5173,
      timeout: 120000,
      reuseExistingServer: !process.env.CI,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    
    // Flask API
    {
      command: 'source venv/bin/activate && python3 app.py',
      cwd: './magflow/flask-api',
      port: 5003,
      timeout: 120000,
      reuseExistingServer: !process.env.CI,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
});
