# Test plan: "Can I get this name?"

## What matters
A user asks one question: **can I get this name, and what will it cost?** Every door must answer
it correctly and consistently. Wrong answers cost in different ways:

- **False "available"**: the user picks a name, then fails at checkout. Lost trust, support tickets.
- **False "taken"**: the user leaves or picks a worse name. Lost sale.
- **Hidden price** (premium, renewal): the user finds out at renewal. Lost trust, refunds,
  consumer-protection exposure.

## Scope
**In:** the 4 doors (storefront, Business Name Generator, WHOIS, public API), from typing a name
to the result and the price shown. Flows stop before checkout.

**Out, on purpose:**
| Left out | Why |
|---|---|
| Purchase, checkout, payment | Assignment rule. UI tests block checkout URLs |
| Load, performance, brute force | Assignment rule. Production only, a few hundred API calls in total |
| Transfer, connecting an existing domain, DNS, mailboxes | Separate flows that start after "can I get it" |
| Other countries and currencies | I can browse only from Israel. Top item for "another week" (VPN) |
| Cross-browser, mobile, deep accessibility | Time. Desktop Chromium only |
| Quality of BNG's generated names | Product/AI quality, not correctness. Names change every run (expected) |
| Correctness of registry WHOIS data | Owned by the registries. I test that Wix shows it and redacts what it should |

## Approach
- **Risk-based.** Priority = impact on the user's answer × how likely it is to break.
  P1 = wrong answer or hidden cost, P2 = inconsistency or contract break, P3 = minor or cosmetic.
- **Test logic at the layer that owns it.** The storefront and the public API call the same
  Domain Search v2 backend ([ARCHITECTURE.md](ARCHITECTURE.md)). So availability rules are tested
  through the API (fast, cheap, stable). UI tests check only that the screen shows what the backend
  returned, by waiting for the real response and comparing.
- **Assert rules, not values.** Suggestions change between calls, and prices depend on location
  and time. "Every suggestion is available" stays true; "the list equals X" breaks tomorrow.
- **Polite to production.** Tests run serially, no retries, and a call budget in code
  (`MAX_API_CALLS`). Bulk checks stay at ≤ 60 domains.
- **Manual where a person's judgment is the test:** price wording, tooltips, what is visible
  without scrolling. Done during exploration; results go into [FINDINGS.md](FINDINGS.md).

## Risks and coverage
| ID | Risk | Pri | How it's tested | Where |
|---|---|---|---|---|
| R1 | Availability is wrong (false available / false taken) | P1 | Known taken name → `available: false`; random fresh name → `available: true`; storefront exact-match card matches the backend response | API + UI |
| R2 | A suggestion offered as available is actually taken | P1 | Sample a few suggestions, check each with `check-domain-availability`. BNG has no own availability call, so it inherits this risk | API |
| R3 | Price or renewal not shown before checkout | P1 | Storefront cards and tooltips, BNG list tooltip, BNG plan choice "Buy domain only" | Manual |
| R4 | Premium data inconsistent (`premium` flag vs `premiumType` vs price) | P2 | Every `premium: true` must have `FIRST_YEAR_ONLY` or `FIRST_YEAR_AND_RENEWAL`; premium domain gets its own price in the UI | API + manual |
| R5 | Doors disagree on the same name (availability or price) | P2 | API vs storefront for the same domain; BNG vs storefront price for the same TLD; WHOIS on a free domain redirects to the storefront | UI + manual |
| R6 | Available names hidden by ranking or paging | P2 | Premium available names wait in the cursor's `pending` queue and the UI has no "load more" (FINDINGS F2). Test idea: the bulk check covers every TLD from `suggested-tlds`. Today 62 non-`.com` TLDs go into a call capped at 60, so `.photo` and `.shop` are skipped; a TLD added to the list would push another out without an error | Manual (evidence) |
| R7 | Input handling | P2 | Uppercase, spaces, leading/trailing dot, missing TLD, 63- vs 64-char label, IDN/Hebrew, empty, unsupported TLD, TLD filter `com` vs `.com` | API |
| R8 | API contract and auth | P2 | Response schema; missing or invalid key → 4xx (not 5xx, no data); documented error codes (`DOMAINS_UNSUPPORTED_TLD`); bulk > 60 → 400 | API |
| R9 | WHOIS shows personal data it should hide, or fails | P3 | `.com` redacted; `.co.il` not redacted (registry policy, expected); free domain → storefront | Manual |
| R10 | Wrong location handling (currency, `.co.il`) | P3 | From Israel: UI shows the currency from the price response, `.co.il` is among suggested TLDs. No currency hard-coded in tests | UI (partial) |
| R11 | A test reaches checkout | — | Guard: storefront tests abort any checkout or cart request | UI |

## What gets automated now
**API** (`tests/api`, ~20 calls per run):
- R1: taken name, random fresh name.
- R2: suggestions with a TLD filter (`com`, no dot); every result ends in `.com`; 3–5 sampled
  results re-checked for availability.
- R4: premium contract on a small bulk check.
- R7: a few input cases (uppercase, missing TLD, unsupported TLD, 64-char label).
- R8: missing and invalid key; bulk with 61 domains → 400.

**Storefront UI** (`tests/ui`, Chromium):
- R1/R5: search a taken name and a fresh name; the page matches the backend response.
- R11: checkout guard active in every test.

**Not automated (manual only):** R3, R6, R9. They need judgment (is the price clear?) or they are
one-time observations already backed by evidence.

## Test data
| Need | Value | Why |
|---|---|---|
| Taken | `google.com` | Certain to stay registered |
| Free | random label generated per run, e.g. `qa<timestamp><random>.com` | Availability is point-in-time; a fresh random name avoids depending on one name staying free |
| Premium | not fixed | Premium status can change; tests check rules on whatever comes back `premium: true` |
| Unsupported TLD | chosen during automation and confirmed with one call | Wix doesn't sell every TLD; must be one outside the 63 in `suggested-tlds` |

## Known limits
- One location (Israel), one browser, one account with no domains (so ownership states can't be
  observed).
- Production only: a passing run says the answer was right at that moment, nothing more.
