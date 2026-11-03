import type { APIRequestContext, APIResponse } from '@playwright/test';

/**
 * Thin client for the public Wix Domain Search API (www.wixapis.com).
 * Every API call in this repo goes through here so that:
 *  - credentials come only from env vars (never hard-coded, never logged);
 *  - a per-run call budget is enforced (assignment rule: a few hundred calls in TOTAL).
 *
 * Known limit: the counter lives in the worker process. Playwright restarts the
 * worker after a failed test, which resets it. workers: 1 keeps that rare; the
 * cap is a safety net, not exact accounting.
 */
const MAX_CALLS = Number(process.env.MAX_API_CALLS ?? 60);
let callsMade = 0;

export function authHeaders(): Record<string, string> {
  const key = process.env.WIX_API_KEY;
  const accountId = process.env.WIX_ACCOUNT_ID;
  const missing = [!key && 'WIX_API_KEY', !accountId && 'WIX_ACCOUNT_ID'].filter(Boolean);
  if (!key || !accountId) {
    throw new Error(`Missing ${missing.join(' and ')} (copy .env.example to .env and fill it in)`);
  }
  return { Authorization: key, 'wix-account-id': accountId };
}

function spendOneCall(): void {
  if (callsMade >= MAX_CALLS) {
    throw new Error(`API call budget exhausted (${MAX_CALLS} calls this run). Raise MAX_API_CALLS deliberately, not by accident.`);
  }
  callsMade += 1;
}

export function apiCallsMade(): number {
  return callsMade;
}

/** GET /domain-search/v2/check-domain-availability. Pass `headers` to test bad/missing auth. */
export async function checkAvailability(
  request: APIRequestContext,
  domain: string,
  headers: Record<string, string> = authHeaders(),
): Promise<APIResponse> {
  spendOneCall();
  return request.get('/domain-search/v2/check-domain-availability', {
    params: { domain },
    headers,
  });
}
