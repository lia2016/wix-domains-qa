# Wix Domains QA: "Can I get this name?"

**Total time: about 4.25 hours** = 3 hours in the repo (first commit 12:33 to last commit, as the
brief measures it) + 1.25 hours before the first commit (Wix account and API key, reading the docs,
planning, manual DevTools exploration of the 4 doors on 2026-11-03).

## How to run
Requires Node 20.12+.

```bash
npm ci
npx playwright install chromium
cp .env.example .env   # fill in WIX_API_KEY and WIX_ACCOUNT_ID
npm test               # everything: API + storefront
npm run test:api       # public API only (~16 API calls)
npm run test:ui        # web doors only: storefront, WHOIS, BNG (Chromium)
npm run report         # open the HTML report
```

## What is automated and why
- **Public API** (`tests/api`): the answer to "Can I get this name?" (taken / fresh random name),
  suggestions respect the TLD filter and the ones offered are really free, bulk response shape,
  premium contract, input handling and auth. Assertions are on contract and shape, never on
  prices or which names are suggested today (those change by location and between calls).
- **Web doors** (`tests/ui`): storefront search box (taken and fresh name), WHOIS lookup and
  BNG. Each test waits for the page's own backend response, checks the page shows the same answer,
  and asks the public API the same question (R5: the doors must agree). One currency check (R10)
  compares the symbol on the page with the price response instead of hard-coding ₪. Selectors are
  Wix's `data-hook` attributes and accessible names (stable test hooks, not CSS classes).
- **Guards:** every API call goes through `tests/helpers/wixApi.ts` (call budget, default 60 per
  run); every web test aborts checkout/cart/payment requests and fails if one is attempted.
  `workers: 1`, `retries: 0`: these are production endpoints, and a retry would hide flakiness.
  A full `npm test` run uses about 22 public API calls.
- **Waiting on Wix pages:** the pages show their inputs before they react to them (typed text was
  lost, Enter and Generate did nothing). There is no reliable "ready" signal, so a UI step checks
  its preconditions (visible, editable) and then retries until its outcome appears (the results
  URL). No fixed sleeps. This retries one step, not the whole test, so it does not hide failures.
- **Known failures kept visible:** the premium contract test (FINDINGS F3) and the two auth tests
  (F5) are marked `test.fail`. They pass while the issue exists; if Wix fixes it, the test reports
  "unexpectedly passed" so the finding gets re-checked.
- **Not automated:** price disclosure (R3), the 60-TLD bulk cut (R6), WHOIS redaction (R9),
  BNG vs storefront price, `.co.il` suggestions (location-dependent). See
  [TEST_PLAN.md](TEST_PLAN.md).

## Repo map
| Path | What |
|---|---|
| `tests/helpers/wixApi.ts` | Public API client: auth from env, per-run call budget |
| `tests/helpers/contract.ts` | Shared shape check for an availability object |
| `tests/api/` | API tests |
| `tests/ui/` | Web door tests (storefront, WHOIS, BNG), `doors.ts` shared steps, checkout guard fixture |
| `ARCHITECTURE.md`, `TEST_PLAN.md`, `FINDINGS.md` | The written deliverables |
| `evidence/` | Sanitized responses and screenshots behind the findings |
| `CLAUDE.md` | Rules for the AI agent |
| `AI_LOG.md` | How AI was used, where it was wrong |

## With another week
- **Location (R10):** run from other countries (VPN: US, EU) to check currency, prices and
  `.co.il` vs local TLDs. Today everything is seen from Israel only.
- **Price across doors (R3, R5):** the same domain's price and renewal on storefront, BNG and the
  plan-choice page, automated once product confirms what should be shown (F1).
- **Hidden available names (F2, R6):** bulk-check every TLD from `suggested-tlds` (in batches of
  60) and compare with what the results page shows, so nothing free and premium stays out of sight.
- **Auth on every endpoint (F5):** repeat the no-key check for suggestions and bulk check; ask the
  API owner whether anonymous access is intended.
- **More input cases (R7):** IDN/Hebrew, spaces, trailing dot, the 63-char boundary, `.com` vs `com`
  as the TLD filter.
- **Ownership states (F4):** a test account that owns a domain, to see the "you own this" path.
- **CI:** GitHub Actions on a schedule, key as a secret, HTML report as an artifact, and an alert when
  a known-failure test starts passing (F3, F5 fixed).

## Quality strategy for Wix Domains (5 lines)
1. Test by risk: a wrong "available" (failed checkout) or a hidden cost hurts most; start there.
2. One answer, four doors: check that every door shows what the shared backend returned.
3. Contract tests on the public API and the internal endpoints the doors share, on every deploy.
4. Assert rules, not volatile values: prices, suggestions and currency change by design.
5. Production checks stay small and safe (call budget, no checkout) and run on a schedule as a monitor.
