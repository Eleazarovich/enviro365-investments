import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL;
if (!baseURL || !/^http:\/\/127\.0\.0\.1:\d+$/.test(baseURL)) {
  throw new Error('Run make test-e2e-docker to start the isolated Compose application.');
}

export default defineConfig({
  testDir: './tests',
  // Every test resets the same private H2 database. Never run these in parallel.
  fullyParallel: false,
  workers: 1,
  forbidOnly: true,
  retries: 0,
  timeout: 45_000,
  globalTimeout: 10 * 60_000,
  expect: { timeout: 10_000 },
  outputDir: process.env.E2E_OUTPUT_DIR ?? './test-results',
  reporter: [
    ['list'],
    ['html', { outputFolder: process.env.E2E_REPORT_DIR ?? './playwright-report', open: 'never' }],
    ['junit', { outputFile: process.env.E2E_JUNIT_FILE ?? './test-results/results.xml' }],
  ],
  use: {
    baseURL,
    browserName: 'chromium',
    locale: 'en-ZA',
    timezoneId: 'Africa/Johannesburg',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: '**/responsive.spec.ts',
      use: { viewport: { width: 1440, height: 1000 } },
    },
    {
      name: 'mobile-chromium',
      testMatch: '**/responsive.spec.ts',
      use: { ...devices['Pixel 7'] },
    },
  ],
});
