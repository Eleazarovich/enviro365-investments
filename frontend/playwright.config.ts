import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  // One disposable H2 database; run mutations in sequence.
  fullyParallel: false,
  workers: 1,
  forbidOnly: true,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4029',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      testIgnore: '**/mobile.spec.ts',
      use: { viewport: { width: 1440, height: 1000 } },
    },
    {
      name: 'mobile',
      testMatch: '**/mobile.spec.ts',
      use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    },
  ],
  webServer: [
    {
      command: './mvnw -B -ntp spring-boot:run',
      cwd: '../backend',
      url: 'http://127.0.0.1:8081/api/investors/1/portfolio',
      env: {
        SERVER_PORT: '8081',
        DB_URL: 'jdbc:h2:mem:browser;DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=10000',
        CORS_ALLOWED_ORIGINS: 'http://127.0.0.1:4029',
        SEED_ENABLED: 'true',
      },
      reuseExistingServer: false,
      timeout: 180_000,
    },
    {
      command: 'npx next dev -p 4029',
      url: 'http://127.0.0.1:4029',
      env: {
        NEXT_PUBLIC_API_BASE_URL: 'http://127.0.0.1:8081',
        DIST_DIR: '.next-e2e',
      },
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
