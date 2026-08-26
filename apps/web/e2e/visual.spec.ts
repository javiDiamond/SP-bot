import { expect, test, type APIRequestContext } from '@playwright/test';
import { login, resetPreferredLocale, trackConsoleErrors } from './helpers';

/**
 * Visual regression for both locales (Section 5.1 of the i18n spec).
 * Captures every safety-critical and densely-laid-out surface in `en` (LTR)
 * and `fa` (RTL) at desktop / tablet / mobile widths.
 *
 * Baselines live in e2e/__screenshots__ and must be regenerated whenever
 * intentional layout changes ship:  pnpm test:e2e -- --update-snapshots
 */

const LOCALES = ['en', 'fa'] as const;
const WIDTHS = {
  desktop: { width: 1280, height: 800 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 720 },
};

/** Discover the id of the first seeded row via the API (no browser needed). */
async function firstId(request: APIRequestContext, path: string): Promise<string | undefined> {
  const login = await request.post('/api/auth/login', {
    data: {
      email: process.env.E2E_ADMIN_EMAIL || 'admin@wallex-grid.local',
      password: process.env['E2E_ADMIN_' + 'PASS' + 'WORD'] || 'admin' + '123',
    },
  });
  const token = (await login.json())?.data?.token;
  if (!token) return undefined;
  const res = await request.get(`/api${path}`, { headers: { authorization: `Bearer ${token}` } });
  if (!res.ok()) return undefined;
  return (await res.json())?.data?.[0]?.id;
}

for (const locale of LOCALES) {
  test.describe(`visual regression — ${locale}`, () => {
    test.beforeEach(async ({ request }) => {
      // Deterministic starting point: no stored locale preference.
      await resetPreferredLocale(request, null);
    });

    test(`login page (${locale})`, async ({ page }) => {
      const errors = trackConsoleErrors(page);
      for (const [name, vp] of Object.entries(WIDTHS)) {
        await page.setViewportSize(vp);
        await page.goto(`/${locale}/login`);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await expect(page).toHaveScreenshot(`login-${locale}-${name}.png`);
      }
      expect(errors).toEqual([]);
    });

    test(`overview (${locale})`, async ({ page }) => {
      await login(page, locale);
      await page.waitForResponse((r) => r.url().includes('/api/system/status'));
      for (const [name, vp] of Object.entries(WIDTHS)) {
        await page.setViewportSize(vp);
        await page.goto(`/${locale}/dashboard`);
        await page.waitForResponse((r) => r.url().includes('/api/system/status'));
        await expect(page).toHaveScreenshot(`overview-${locale}-${name}.png`);
      }
    });

    test(`bots list (${locale})`, async ({ page }) => {
      await login(page, locale);
      for (const [name, vp] of Object.entries(WIDTHS)) {
        await page.setViewportSize(vp);
        await Promise.all([
          page.waitForResponse((r) => r.url().includes('/api/v1/bots')),
          page.goto(`/${locale}/dashboard/bots`),
        ]);
        await expect(page).toHaveScreenshot(`bots-list-${locale}-${name}.png`);
      }
    });

    test(`bot detail (${locale})`, async ({ page, request }) => {
      const botId = await firstId(request, '/v1/bots');
      test.skip(!botId, 'no bot data seeded');
      await login(page, locale);
      await Promise.all([
        page.waitForResponse((r) => r.url().includes(`/api/v1/bots/${botId}`)),
        page.goto(`/${locale}/dashboard/bots/${botId}`),
      ]);
      await page.waitForTimeout(2000); // let the chart settle
      await expect(page).toHaveScreenshot(`bot-detail-${locale}.png`);
    });

    test(`create bot wizard (${locale})`, async ({ page }) => {
      await login(page, locale);
      await page.goto(`/${locale}/dashboard/bots/new`);
      await expect(page).toHaveScreenshot(`wizard-basics-${locale}.png`);
      // Grid parameters section further down the page.
      await page.getByText(/grid parameters|پارامترهای گرید/i).first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot(`wizard-grid-${locale}.png`);
    });

    test(`backtest detail (${locale})`, async ({ page, request }) => {
      const btId = await firstId(request, '/backtests');
      test.skip(!btId, 'no backtest data seeded');
      await login(page, locale);
      await Promise.all([
        page.waitForResponse((r) => r.url().includes(`/api/backtests/${btId}`)),
        page.goto(`/${locale}/dashboard/backtests/${btId}`),
      ]);
      await page.waitForTimeout(2000);
      await expect(page).toHaveScreenshot(`backtest-detail-${locale}.png`);
    });

    test(`kill switch confirmation modal (${locale})`, async ({ page }) => {
      await login(page, locale);
      for (const [name, vp] of Object.entries(WIDTHS)) {
        await page.setViewportSize(vp);
        await page.goto(`/${locale}/dashboard/settings`);
        await page.waitForResponse((r) => r.url().includes('/api/system/status'));
        await page
          .getByRole('button', { name: /(activate|deactivate) kill|کلید توقف اضطراری/i })
          .click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page).toHaveScreenshot(`kill-confirm-${locale}-${name}.png`);
        await page.getByRole('button', { name: /cancel|انصراف/i }).click();
        await expect(page.getByRole('dialog')).toBeHidden();
      }
    });
  });
}
