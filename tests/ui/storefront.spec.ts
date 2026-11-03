import { test, expect } from './checkoutGuard';
import { freshLabel } from '../helpers/wixApi';

// R1/R5: the storefront must show what its own backend answered.
// We wait for the real check-domain-availability response, then compare the page to it.
// Prices, currency and suggestions are NOT asserted: they change by location and between calls.

async function searchAndGetBackendAnswer(page: import('@playwright/test').Page, domain: string) {
  const backend = page.waitForResponse(
    (r) => r.url().includes('/domain-search/v2/check-domain-availability') && r.url().includes(`domain=${domain}`),
  );
  // Results page URL is what the search box on /domains navigates to.
  await page.goto(`/domain/result/?q=${domain}`);
  const res = await backend;
  expect(res.status()).toBe(200);
  const { availability } = await res.json();
  return availability as { domain: string; available: boolean; premium: boolean };
}

test('taken name: page says taken, matching the backend', async ({ page }) => {
  const a = await searchAndGetBackendAnswer(page, 'google.com');
  expect(a.available).toBe(false);

  const card = page.locator('[data-hook="searched-domain-broker"]');
  await expect(card).toContainText('Domain Taken');
  await expect(page.locator('[data-hook="searched-domain-broker-domain"]')).toHaveText('google.com');
  // A taken name must never be offered as the exact match.
  await expect(page.locator('[data-hook="hero-card"]')).toHaveCount(0);
});

test('fresh name: page says available, matching the backend', async ({ page }) => {
  const domain = `${freshLabel()}.com`;
  const a = await searchAndGetBackendAnswer(page, domain);
  expect(a.available).toBe(true);

  const card = page.locator('[data-hook="hero-card"]');
  await expect(card).toContainText('Available');
  await expect(page.locator('[data-hook="hero-card-title"]')).toHaveText(domain);
  await expect(page.locator('[data-hook="searched-domain-broker"]')).toHaveCount(0);
});
