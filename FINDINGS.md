# Findings

Found during manual exploration on 2026-11-03 (Israel, prices in ₪, my own logged-in account).
Evidence is in [`evidence/`](evidence/). Network details are in [ARCHITECTURE.md](ARCHITECTURE.md).

**Severity** = how badly it hurts the user or the business when it happens.
S1 critical · S2 major · S3 minor · S4 trivial.
**Priority** = how soon I would fix it, given severity, reach and cost of the fix.
P1 now · P2 next sprint · P3 backlog.

| # | Finding | Type | Severity | Priority |
|---|---|---|---|---|
| F1 | Plan-choice page doesn't show the renewal price it receives | Bug (price disclosure) | S2 | P1 |
| F2 | Available premium exact-name domains never shown in search results | Observation / risk | S1 | P1 |
| F3 | `premium: true` with `premiumType: UNKNOWN_PREMIUM_TYPE` | API contract | S2 | P2 |
| F4 | Ownership check says "belongs to a different user" for a domain not at Wix | Observation | S3 | P2 |
| F5 | Public API answers availability without a valid API key | API auth / contract | S3 | P2 |

---

## F1. Plan-choice page doesn't show the renewal price it receives

**Where:** Business Name Generator → Get It → plan-choice page (`manage.wix.com`). Example:
`lianova.co`.

**Steps**
1. Open the Business Name Generator, describe a business, generate names.
2. Hover (i) next to the `.co` price. Tooltip: "Get this domain free for one year with any annual
   plan. Renews at ₪168.63."
3. Click **Get It** with DevTools open. The plan-choice page loads its price from
   `GET /_serverless/domains-serverless-services/v1/display-prices`: `price` ₪0.00,
   `originalPrice` ₪51.38, `pricingStrategy` FREE_FIRST_YEAR, `renewalPrice` ₪168.63.
4. Read both options on the page.

**Expected:** the page where the user chooses and commits shows what each option costs after
the first year. The page already has the number (`renewalPrice` ₪168.63).

**Actual:**
- **"Get this domain for free with a site plan"**: "lianova.co free for the first year". The
  renewal price (₪168.63) is not shown on this page. It was only in the tooltip one step earlier.
- **"Buy domain only"**: "lianova.co for ₪51.38/yr". No renewal price; the (!) icon shows no
  tooltip. The page's price response has **one** renewal number, ₪168.63. So either
  "domain only" renews at ₪51.38 and `renewalPrice` belongs to the plan offer only, or it renews
  at ₪168.63 and "/yr" is misleading. **I can't tell which, and neither can the user.** Checking
  for real needs a purchase and a renewal, which is out of bounds.

**Why it matters:** this is where the user decides and commits to paying. The renewal price is
3.3× the domain-only price (₪168.63 vs ₪51.38). The data is already on the page, so showing it
looks like a cheap fix. If the "domain only" price changes every year then it's S1. 

**Scope:** 48 of the 55 free-first-year TLDs have `renewalPrice` ≠ `originalPrice` (e.g. `.com`
₪21.47 vs ₪90.19). For the other 7, e.g. `.co.il` ₪105.20 / ₪105.20, the "/yr" price is the
renewal price either way.

**Evidence:** [plan choice lianova.co](evidence/plan-choice-lianova-co.png),
[its price response](evidence/plan-choice-lianova-co-display-prices.json),
[BNG tooltip lianova.co](evidence/bng-lianova-co-renewal-tooltip.png),
[plan choice, earlier run](evidence/plan-choice-buy-domain-only-no-renewal.png),
[TLD prices](evidence/storefront-suggested-tld-display-prices.json).

**Severity:** S2 · **Priority:** P1

---

## F2. Available premium exact-name domains never shown in search results

**Steps**
1. Search `lia.com` on the storefront.
2. In DevTools, open the bulk check response: `lia.store` and `lia.biz` are `available: true`,
   `premium: true`.
3. Look at the results: neither is shown. The suggestions response has 50 items and neither is among
   them; the UI has no "load more".
4. Decode the suggestions cursor (base64 JSON): `lia.store` and `lia.biz` are the first two items in
   its `pending` queue for page 2.
5. Search `lia.store` directly: Exact Match, Available, Premium, ₪5,094.39/yr.

**Expected (open question):** a user searching "lia" can find out that `lia.store` and `lia.biz`
can be bought.

**Actual:** the only way to find them is to guess and search them directly. The 5 non-premium
available same-name domains (`lia.services`, `.church`, `.photography`, `.events`, `.coach`) are on
page 1.

**Why it may be on purpose:** hiding very expensive premiums from a general search can be a product
choice. It is reported as a risk to confirm with product, not as a bug: if it is not on purpose,
these are lost high-value sales.

**Evidence:** [bulk check](evidence/storefront-lia-com-bulk-check.json),
[suggestions + cursor](evidence/storefront-lia-com-suggestions.json),
[lia.store direct](evidence/storefront-lia-store-direct-premium.png),
[lia.store price](evidence/storefront-lia-store-display-prices.json).
Suggestions change between runs; these files are from one run.

**Severity:** S1 · **Priority:** P1

---

## F3. `premium: true` with `premiumType: UNKNOWN_PREMIUM_TYPE`

**Steps:** search `lia.com`; in the bulk check response, look at `premiumType` for premium results.

**Expected:** every premium domain says whether the premium price applies to the first year only
(`FIRST_YEAR_ONLY`) or to renewals too (`FIRST_YEAR_AND_RENEWAL`).

**Actual:** 20 of 22 premium results have `FIRST_YEAR_AND_RENEWAL`. `lia.art` and `lia.top` have
`premium: true` with `UNKNOWN_PREMIUM_TYPE`, the enum default that non-premium domains also get.

**Why it matters:** a client can't tell whether renewal will cost the premium price, which is the
same kind of disclosure gap as F1. Both domains are taken, so no user is affected in this sample. The
risk is the same state on an available domain.

**Evidence:** [bulk check](evidence/storefront-lia-com-bulk-check.json). Captured from the
storefront's call; the public API uses the same endpoint (to confirm in the API tests).

**Severity:** S2 · **Priority:** P2

---

## F4. Ownership check says "belongs to a different user" for a domain not at Wix

**Steps:** search `lia.com`; find `GET /_api/user-domains/v1/user_domains/lia.com`.

**Actual:** 403 `DOMAINS_PERMISSION_DENIED`, `domainBelongsToDifferentUser`. But `lia.com` is
registered at Porkbun, not at Wix. A free domain (`lia.services`) gets 404 `domainDoesNotExist`.

**Why it matters:** no visible effect (blocking the call changed nothing on screen). But the
message is wrong, and every search for a domain registered elsewhere produces a 403. In error
monitoring that is noise, and it can hide real permission errors.

**Evidence:** [403 response](evidence/storefront-ownership-lia-com-403.json),
[RDAP lia.com](evidence/whois-rdap-lia-com.json) (registrar: Porkbun LLC).

**Severity:** S3 · **Priority:** P2

---

## F5. Public API answers availability without a valid API key

**Steps:** call `GET https://www.wixapis.com/domain-search/v2/check-domain-availability?domain=google.com`
(1) with no `Authorization` / `wix-account-id` headers, (2) with `Authorization: invalid-key-for-test`.

**Expected:** 401/403 and no data. The brief says the public API needs an account-level API key.

**Actual:** both return HTTP 200 with the full answer:
`{"availability":{"domain":"google.com","available":false,"premium":false,"premiumType":"UNKNOWN_PREMIUM_TYPE"}}`.
Found by the automated R8 tests, confirmed with plain `curl` outside Playwright.

**Why it matters:** availability itself is close to public data (WHOIS, DNS). The risk is that calls
can't be tied to an account, so per-account rate limits and quotas don't apply and anonymous bulk
checking is possible. It may be intended (the storefront calls the same path without a key); then
the docs and the brief should say so. Question for the API owner.

**Evidence:** [no key](evidence/api-no-auth-google-com.txt),
[invalid key](evidence/api-invalid-key-google-com.txt), `tests/api/inputs-auth.spec.ts` (R8 tests
marked as known failures). Only `check-domain-availability` was checked without a key.

**Severity:** S3 · **Priority:** P2

---

## Checked and not reported (expected behavior)
- BNG gives different names for the same prompt: names are generated.
- Suggestions differ between runs and between doors: generated.
- `.co.il` WHOIS is not redacted: ISOC-IL registry policy.
- Premium `lia.store` shows ₪5,094.39 "/yr": checked against `display-prices`; renewal is the same
  price (`REGULAR`), so "/yr" is correct.
