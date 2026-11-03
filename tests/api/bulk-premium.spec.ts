import { test, expect } from '@playwright/test';
import { bulkCheck } from '../helpers/wixApi';
import { expectAvailabilityShape } from '../helpers/contract';

// Domains from the lia.com exploration: a mix of taken, free, premium (evidence/storefront-lia-com-bulk-check.json).
// Premium status can change, so the tests check rules on whatever comes back, not fixed answers.
const SAMPLE = ['lia.store', 'lia.biz', 'lia.art', 'lia.top', 'lia.net', 'lia.co.il', 'lia.services', 'lia.xyz'];

// R4 + R8. 1 call: shape of the bulk response.
test('bulk check: one result per requested domain, each with a valid shape', async ({ request }) => {
  const res = await bulkCheck(request, SAMPLE);
  expect(res.status()).toBe(200);
  const { results } = await res.json();
  expect(results).toHaveLength(SAMPLE.length);
  for (const r of results) {
    expect(r.itemMetadata.success).toBe(true);
    expect(SAMPLE).toContain(r.item.domain);
    expectAvailabilityShape(r.item, r.item.domain);
  }
});

// R4. 1 call. premium:true should say HOW it is premium (first year only, or renewal too).
// Known failure: FINDINGS F3 (lia.art, lia.top: premium:true + UNKNOWN_PREMIUM_TYPE).
// test.fail = "expected to fail"; if Wix fixes it, this test turns red as "unexpectedly passed" and F3 gets re-checked.
test('premium contract: premium:true has a concrete premiumType', async ({ request }) => {
  test.fail(true, 'Known issue FINDINGS.md F3');
  const res = await bulkCheck(request, SAMPLE);
  const { results } = await res.json();
  const badPremium = results
    .map((r: { item: { domain: string; premium: boolean; premiumType: string } }) => r.item)
    .filter((i: { premium: boolean; premiumType: string }) => i.premium && i.premiumType === 'UNKNOWN_PREMIUM_TYPE')
    .map((i: { domain: string }) => i.domain);
  expect(badPremium).toEqual([]);
});

// R8. 1 call. 61 > documented max of 60.
test('bulk check with 61 domains → 400', async ({ request }) => {
  const tooMany = Array.from({ length: 61 }, (_, i) => `qa-limit-${i}.com`);
  const res = await bulkCheck(request, tooMany);
  expect(res.status()).toBe(400);
});
