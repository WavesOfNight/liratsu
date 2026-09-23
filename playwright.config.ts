import { defineConfig, devices } from '@playwright/test'
import 'dotenv/config'

/**
 * Tests end-to-end.
 *   npx playwright install chromium   (une fois)
 *   npm run test:e2e
 * Le test d'achat nécessite les clés Stripe TEST dans l'admin et `stripe listen` (voir README).
 */
export default defineConfig({
  testDir: './tests/e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  timeout: 90_000,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    locale: 'fr-FR',
  },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: 'npm run dev', reuseExistingServer: true, url: 'http://localhost:3000', timeout: 180_000 },
})
