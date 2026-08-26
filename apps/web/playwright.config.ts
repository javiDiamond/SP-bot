import { defineConfig, devices } from '@playwright/test';

/**
 * e2e / visual-regression suite for the localized dashboard.
 *
 * Requires the backing stack (postgres + redis + api on :4000) to be running —
 * the same stack used for development (docker compose up). The web server below
 * serves the production build and proxies /api to it.
 *
 * Run:  pnpm --filter @wallex-grid/web build && pnpm --filter @wallex-grid/web test:e2e
 * Update baselines:  pnpm --filter @wallex-grid/web test:e2e -- --update-snapshots
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list']],
  timeout: 60_000,
  expect: {
    toHaveScreenshot: {
      // Real-time dashboards poll/push updates; allow small pixel drift.
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    },
  },
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',
  use: {
    baseURL: 'http://localhost:3111',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: {
    command: 'pnpm exec next start -p 3111',
    url: 'http://localhost:3111/en/login',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
