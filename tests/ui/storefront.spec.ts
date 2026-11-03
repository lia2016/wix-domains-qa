import { test, expect } from './checkoutGuard';
import { freshLabel } from '../helpers/wixApi';
import { waitForStorefrontAnswer, publicApiAnswer, typeAndSubmit, takenMessage } from './doors';

// Storefront door (/domains). R1 + R5: what the user types in the search box, what the page shows,
// what the storefront backend answered and what the public API answers must all agree.
// Prices, currency values and suggestions are NOT asserted: they change by location and between calls.

async function searchFromHomePage(page: import('@playwright/test').Page, domain: string) {
  await page.goto('/domains');
  const answer = waitForStorefrontAnswer(page, domain);
  // The page has two identical search boxes (hero and lower section); the user starts at the top one.
  const box = page.getByRole('searchbox', { name: 'Type the domain you want' }).first();
  await typeAndSubmit(page, box, domain, new RegExp(`/domain/result/\\?q=${domain.replace('.', '\\.')}`));
  return answer;
}

test('search box, taken name: page, storefront backend and public API all say taken', async ({ page, request }) => {
  const backend = await searchFromHomePage(page, 'google.com');
  expect(backend.available).toBe(false);
  expect((await publicApiAnswer(request, 'google.com')).available).toBe(backend.available);

  await expect(takenMessage(page, 'google.com')).toBeVisible();
  // A taken name must never be offered as the exact match.
  await expect(page.locator('[data-hook="hero-card"]')).toHaveCount(0);
});

test('search box, fresh name: page, storefront backend and public API all say available', async ({ page, request }) => {
  const domain = `${freshLabel()}.com`;
  const backend = await searchFromHomePage(page, domain);
  expect(backend.available).toBe(true);
  expect((await publicApiAnswer(request, domain)).available).toBe(backend.available);

  await expect(page.locator('[data-hook="hero-card"]')).toContainText('Available');
  await expect(page.locator('[data-hook="hero-card-title"]')).toHaveText(domain);
  await expect(page.locator('[data-hook="searched-domain-broker"]')).toHaveCount(0);
});

// R10 (location): no currency is hard-coded. Whatever currency the price response uses for this
// location, the price cards must show the same symbol. No public API call.
test('prices on the page use the currency from the price response', async ({ page }) => {
  const prices = page.waitForResponse((r) => r.url().includes('/suggested-tld-display-prices'));
  await page.goto(`/domain/result/?q=${freshLabel()}.com`);
  const { displayPrices } = await (await prices).json();
  const symbol = String(displayPrices[0].pricing.originalPrice).replace(/[\d.,\s]/g, '');
  expect(symbol, 'currency symbol in price response').not.toBe('');

  await expect(page.locator('[data-hook="recommendations-content-list-item-0"]')).toContainText(symbol);
});
