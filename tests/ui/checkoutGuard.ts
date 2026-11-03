import { test as base, expect } from '@playwright/test';

/**
 * R11 + assignment rule "never complete a purchase".
 * Every storefront test gets this fixture automatically: any request to a checkout,
 * cart or payment URL is aborted, and the test fails if one was even attempted.
 */
// Matched against the URL PATH only. Analytics calls (frog.wix.com) carry suggested names like
// "googlepaymentsapp.com" in the query string; matching the full URL blocked those by mistake.
const CHECKOUT_PATH = /checkout|\/cart|payment|cashier/i;

export const test = base.extend<{ checkoutGuard: void }>({
  checkoutGuard: [
    async ({ page }, use) => {
      const blocked: string[] = [];
      await page.route((url) => CHECKOUT_PATH.test(url.pathname), (route) => {
        blocked.push(route.request().url());
        return route.abort();
      });
      await use();
      expect(blocked, 'a test tried to reach checkout').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
