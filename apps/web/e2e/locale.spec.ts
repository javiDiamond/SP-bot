import { expect, test } from '@playwright/test';
import { login, resetPreferredLocale, trackConsoleErrors } from './helpers';

/**
 * Runtime locale-switch regression (Section 5.1 of the i18n spec):
 * switching locale mid-session must flip `<html lang|dir>`, preserve the
 * route, persist the choice, and introduce no console errors — without a
 * full page reload.
 */

test.beforeEach(async ({ request }) => {
  await resetPreferredLocale(request, null);
});

test.describe('runtime locale switching', () => {
  test('switcher flips lang/dir, preserves route, persists cookie', async ({ page }) => {
    const consoleErrors = trackConsoleErrors(page);

    // Start on the English login page (unauthenticated surface).
    await page.goto('/en/login');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');

    // Switch to Persian via the switcher (not a fresh load).
    await page.getByRole('button', { name: /language|زبان/i }).click();
    await page.getByRole('menuitemradio', { name: 'فارسی' }).click();

    await page.waitForURL('**/fa/login');
    await expect(page.locator('html')).toHaveAttribute('lang', 'fa');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    // Route preserved (still on login, now Persian) and cookie persisted.
    expect(new URL(page.url()).pathname).toBe('/fa/login');
    const cookies = await page.context().cookies();
    expect(cookies.find((c) => c.name === 'NEXT_LOCALE')?.value).toBe('fa');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('خوش آمدید');

    // Switch back to English — direction must flip back.
    await page.getByRole('button', { name: /زبان|language/i }).click();
    await page.getByRole('menuitemradio', { name: 'English' }).click();

    await page.waitForURL('**/en/login');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome back');

    // No console errors may be introduced by either transition.
    expect(consoleErrors).toEqual([]);
  });

  test('switching preserves an authenticated route and query params', async ({ page }) => {
    const consoleErrors = trackConsoleErrors(page);
    await login(page, 'en');

    // Move to a deep route with a query param (filters).
    await page.goto('/en/dashboard/orders?side=BUY');
    await page.waitForURL('**/dashboard/orders*');
    await expect(page.getByRole('heading').first()).toBeVisible();

    await page.getByRole('button', { name: /language|زبان/i }).click();
    await page.getByRole('menuitemradio', { name: 'فارسی' }).click();

    await page.waitForURL('**/fa/dashboard/orders*');
    const url = new URL(page.url());
    expect(url.pathname).toBe('/fa/dashboard/orders');
    expect(url.searchParams.get('side')).toBe('BUY');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    expect(consoleErrors).toEqual([]);
  });

  test('stored preferredLocale overrides the URL locale at login', async ({ page, request }) => {
    await resetPreferredLocale(request, 'fa');
    const landed = await login(page, 'en');
    expect(landed).toBe('fa');
    await expect(page.locator('html')).toHaveAttribute('lang', 'fa');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });
});

test.describe('server-side direction', () => {
  test('first paint has correct lang/dir for both locales (no flash)', async ({ page }) => {
    for (const [locale, dir] of [
      ['en', 'ltr'],
      ['fa', 'rtl'],
    ] as const) {
      const response = await page.goto(`/${locale}/login`);
      expect(response?.status()).toBeLessThan(400);
      const html = await response?.text();
      expect(html).toContain(`lang="${locale}"`);
      expect(html).toContain(`dir="${dir}"`);
    }
  });
});
