import { expect, type APIRequestContext, type Locator, type Page } from '@playwright/test';
import { checkAvailability } from '../helpers/wixApi';

type Availability = { domain: string; available: boolean };

/** Start waiting for the page's own availability call for `domain` (call BEFORE the action that triggers it). */
export function waitForStorefrontAnswer(page: Page, domain: string): Promise<Availability> {
  return page
    .waitForResponse(
      (r) => r.url().includes('/domain-search/v2/check-domain-availability') && r.url().includes(`domain=${domain}`),
    )
    .then(async (r) => {
      expect(r.status()).toBe(200);
      return (await r.json()).availability as Availability;
    });
}

/** R5: the same question asked through the public API (1 call, counted by the budget). */
export async function publicApiAnswer(request: APIRequestContext, domain: string): Promise<Availability> {
  const res = await checkAvailability(request, domain);
  expect(res.status()).toBe(200);
  return (await res.json()).availability as Availability;
}


/**
 * Type a name and submit with Enter, then wait for the results URL.
 * Wix keeps setting up the page after `load`: in our runs the box lost keystrokes and Enter did
 * nothing. So the whole step is retried until the results page opens (each retry is one more search,
 * browse-only). Enter instead of a click: the cookie banner can cover buttons.
 */
export async function typeAndSubmit(page: Page, box: Locator, text: string, resultUrl: RegExp): Promise<void> {
  await expect(async () => {
    await box.fill(text);
    await expect(box).toHaveValue(text, { timeout: 1000 });
    await box.press('Enter');
    await expect(page).toHaveURL(resultUrl, { timeout: 3000 });
  }).toPass({ timeout: 25_000 });
}

/**
 * The "taken" message differs between visits: sometimes a broker card ("Domain Taken" /
 * "x is taken"), sometimes only a line ("x is already registered" / "x is registered").
 * Seen both on 2026-11-03, so we accept any of them; the backend answer is asserted separately.
 */
export function takenMessage(page: Page, domain: string): Locator {
  const d = domain.replace(/\./g, '\\.');
  return page.getByText(new RegExp(`${d} is (taken|already registered|registered)`)).first();
}
