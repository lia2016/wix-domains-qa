import { test, expect } from '@playwright/test';
import { checkAvailability, freshLabel } from '../helpers/wixApi';
import { expectAvailabilityShape } from '../helpers/contract';

// R1: the core answer to "Can I get this name?". 2 calls.
test.describe('R1 availability', () => {
  test('taken name → available:false, valid shape', async ({ request }) => {
    const res = await checkAvailability(request, 'google.com');
    expect(res.status()).toBe(200);
    const { availability } = await res.json();
    expectAvailabilityShape(availability, 'google.com');
    expect(availability.available).toBe(false);
  });

  test('fresh random name → available:true, valid shape', async ({ request }) => {
    const domain = `${freshLabel()}.com`;
    const res = await checkAvailability(request, domain);
    expect(res.status()).toBe(200);
    const { availability } = await res.json();
    expectAvailabilityShape(availability, domain);
    expect(availability.available).toBe(true);
  });
});
