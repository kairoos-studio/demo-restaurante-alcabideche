import { defineConfig, devices } from '@playwright/test';

const PORTA = 4418;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORTA}/`,
    locale: 'pt-PT',
    launchOptions: { chromiumSandbox: false },
  },
  projects: [
    { name: 'mobile', use: { ...devices['iPhone 13'], browserName: 'chromium' } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: `node scripts/servir.mjs ${PORTA}`,
    url: `http://localhost:${PORTA}/`,
    reuseExistingServer: false,
  },
});
