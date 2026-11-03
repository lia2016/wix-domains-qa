import { test, expect } from '@playwright/test';
import { checkAvailability, authHeaders } from '../helpers/wixApi';

// R7 input handling. 4 calls. Bad input must give a clean 4xx, never a 5xx and never a fake answer.
test.describe('R7 inputs', () => {
  test('uppercase GOOGLE.COM gives the same answer as google.com', async ({ request }) => {
    const res = await checkAvailability(request, 'GOOGLE.COM');
    expect(res.status()).toBe(200);
    const { availability } = await res.json();
    expect(availability.available).toBe(false);
  });

  test('missing TLD → 400', async ({ request }) => {
    const res = await checkAvailability(request, 'mybakery');
    expect(res.status()).toBe(400);
  });

  test('TLD Wix does not sell → 4xx with DOMAINS_UNSUPPORTED_TLD', async ({ request }) => {
    // .gov is restricted to the US government and is not among Wix's 63 suggested TLDs.
    const res = await checkAvailability(request, 'mybakery.gov');
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
    expect(await res.text()).toContain('DOMAINS_UNSUPPORTED_TLD');
  });

  test('64-char label (DNS max is 63) → 400', async ({ request }) => {
    const res = await checkAvailability(request, `${'a'.repeat(64)}.com`);
    expect(res.status()).toBe(400);
  });
});

// R8 auth. 2 calls. Expected per the brief: no answer without a valid account-level key.
// Known failure: FINDINGS F5. The API answers 200 with real data without a key or with a fake one
// (evidence/api-no-auth-google-com.txt, evidence/api-invalid-key-google-com.txt).
test.describe('R8 auth', () => {
  test('missing key → 401/403, no availability data', async ({ request }) => {
    test.fail(true, 'Known issue FINDINGS.md F5');
    const res = await checkAvailability(request, 'google.com', {});
    expect([401, 403]).toContain(res.status());
    expect(await res.text()).not.toContain('"available"');
  });

  test('invalid key → 401/403, no availability data', async ({ request }) => {
    test.fail(true, 'Known issue FINDINGS.md F5');
    const headers = { ...authHeaders(), Authorization: 'invalid-key-for-test' };
    const res = await checkAvailability(request, 'google.com', headers);
    expect([401, 403]).toContain(res.status());
    expect(await res.text()).not.toContain('"available"');
  });
});
