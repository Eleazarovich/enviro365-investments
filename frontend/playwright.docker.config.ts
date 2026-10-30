import { defineConfig } from '@playwright/test';

// Start a disposable, seeded container before running this suite; tests create withdrawals.
const baseURL = process.env.DOCKER_BASE_URL ?? 'http://127.0.0.1:8080';
process.env.LIVE_API_BASE_URL = baseURL;

export default defineConfig({
  testDir: './tests',
  testMatch: ['**/live/backend.spec.ts', '**/docker/*.spec.ts'],
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    {
      name: 'mobile',
      use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    },
  ],
});
