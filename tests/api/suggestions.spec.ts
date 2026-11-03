import { test, expect } from '@playwright/test';
import { suggestDomains, checkAvailability } from '../helpers/wixApi';

// R2: suggestions respect the TLD filter and are really available. 1 + 3 calls.
// The filter value has NO dot (`com`), unlike the domain itself (`x.com`): expected API design.
test('R2 suggestions with tlds=com: all end in .com, sampled ones are available', async ({ request }) => {
  const res = await suggestDomains(request, 'bakery', { tld: 'com', limit: 10 });
  expect(res.status()).toBe(200);
  const { suggestions } = await res.json();

  // Assert on shape and rules, not on which names come back (they change between calls).
  expect(Array.isArray(suggestions)).toBe(true);
  expect(suggestions.length).toBeGreaterThan(0);
  for (const s of suggestions) {
    expect(s.domain, `suggestion ${s.domain}`).toMatch(/\.com$/);
    expect(typeof s.premium).toBe('boolean');
  }

  // Cross-check: a suggestion we offer must be buyable now. Sample 3 to stay inside the call budget.
  for (const s of suggestions.slice(0, 3)) {
    const check = await checkAvailability(request, s.domain);
    expect(check.status()).toBe(200);
    const { availability } = await check.json();
    expect.soft(availability.available, `${s.domain} was suggested but is not available`).toBe(true);
  }
});
