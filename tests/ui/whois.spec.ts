import { test, expect } from './checkoutGuard';
import { freshLabel } from '../helpers/wixApi';
import { publicApiAnswer, typeAndSubmit, takenMessage } from './doors';

// WHOIS door (/domains/whois). R5: the WHOIS answer agrees with the public API.
// A registered name shows WHOIS data; a free name has no WHOIS record and goes to the storefront.
// WHOIS field values (dates, registrar) are not asserted: they are someone else's data and change.

async function whoisLookup(page: import('@playwright/test').Page, domain: string, resultUrl: RegExp) {
  await page.goto('/domains/whois');
  const box = page.getByRole('textbox', { name: 'Enter a domain name or URL' }).first();
  await typeAndSubmit(page, box, domain, resultUrl);
}

test('taken name: WHOIS page shows it as taken, public API agrees', async ({ page, request }) => {
  await whoisLookup(page, 'google.com', /\/domain\/result\/whois\?query=google\.com/);
  await expect(page.getByText('WHOIS Information')).toBeVisible();
  await expect(takenMessage(page, 'google.com')).toBeVisible();

  expect((await publicApiAnswer(request, 'google.com')).available).toBe(false);
});

test('free name: WHOIS sends the user to the storefront, which offers it; public API agrees', async ({ page, request }) => {
  const domain = `${freshLabel()}.com`;
  // Free name: no WHOIS record, the user is sent to the storefront results page.
  await whoisLookup(page, domain, /\/domain\/result\/\?q=/);
  await expect(page.locator('[data-hook="hero-card-title"]')).toHaveText(domain);
  await expect(page.locator('[data-hook="hero-card"]')).toContainText('Available');

  expect((await publicApiAnswer(request, domain)).available).toBe(true);
});
