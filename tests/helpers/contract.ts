import { expect } from '@playwright/test';

/** premiumType values seen in real responses. UNKNOWN_PREMIUM_TYPE is the enum default for non-premium domains. */
export const PREMIUM_TYPES = ['UNKNOWN_PREMIUM_TYPE', 'FIRST_YEAR_ONLY', 'FIRST_YEAR_AND_RENEWAL'];

/**
 * Shape of one availability object. Asserts types and allowed values only,
 * never volatile values (price, which names are free today).
 */
export function expectAvailabilityShape(a: unknown, domain: string): void {
  expect(a).toEqual(
    expect.objectContaining({
      domain,
      available: expect.any(Boolean),
      premium: expect.any(Boolean),
      premiumType: expect.any(String),
    }),
  );
  expect(PREMIUM_TYPES).toContain((a as { premiumType: string }).premiumType);
}
