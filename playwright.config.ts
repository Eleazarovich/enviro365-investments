import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  workers: 2,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4029',
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
  webServer: {
    command: 'npx next dev -p 4029',
    url: 'http://127.0.0.1:4029',
    env: {
      NEXT_PUBLIC_USE_MOCK_API: 'false',
      NEXT_PUBLIC_API_BASE_URL: '',
      DIST_DIR: '.next-e2e',
    },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
