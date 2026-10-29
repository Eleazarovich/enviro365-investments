import { defineConfig } from '@playwright/test';

// No intercepted responses: this suite starts Java/H2 and exercises the existing HTTP adapter.
export default defineConfig({
  testDir: './tests/live',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4030',
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
  webServer: [
    {
      command: './mvnw -B -ntp spring-boot:run',
      cwd: '../backend',
      url: 'http://127.0.0.1:8081/api/investors/1/portfolio',
      env: {
        SERVER_PORT: '8081',
        DB_URL: 'jdbc:h2:mem:live-browser;DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=10000',
        CORS_ALLOWED_ORIGINS: 'http://127.0.0.1:4030',
        SEED_ENABLED: 'true',
      },
      reuseExistingServer: false,
      timeout: 180_000,
    },
    {
      command: 'npx next dev -p 4030',
      url: 'http://127.0.0.1:4030',
      env: {
        NEXT_PUBLIC_USE_MOCK_API: 'false',
        NEXT_PUBLIC_API_BASE_URL: 'http://127.0.0.1:8081',
        DIST_DIR: '.next-live',
      },
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
