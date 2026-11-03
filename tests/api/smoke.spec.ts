import { test, expect, type APIRequestContext } from '@playwright/test';
import { checkAvailability } from '../helpers/wixApi';

// One call. Proves: network reachable, key + account ID accepted, response shape as documented.
// google.com is used because it is certain to be registered.
test('smoke: API accepts our credentials and reports google.com as taken', async ({ request }: { request: APIRequestContext }) => {
  const res = await checkAvailability(request, 'google.com');

  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.availability).toMatchObject({ domain: 'google.com', available: false });
});
