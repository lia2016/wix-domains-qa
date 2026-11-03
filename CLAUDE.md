# Agent rules for this repo

Context: Wix QA Engineer (Domains) home assignment. Question under test: "Can I get this name?"
across the storefront, Business Name Generator, WHOIS and the public Domain Search API.
Owner: Lia. The AI drafts and suggests; Lia reviews, edits and commits every line.

## Hard rules
1. **Secrets.** Never read, print, log or commit `.env`, the API key, the account ID, cookies,
   XSRF tokens or any session data. Never ask Lia to paste them into chat.
2. **No purchases.** Browse and search only. Never click "Buy domain only", checkout or payment
   steps. UI tests must block checkout URLs.
3. **API budget.** A few hundred calls in total for the whole assignment. Every API call goes
   through `tests/helpers/wixApi.ts` (budget counter). No loops over big lists, no load tests,
   no brute force, no scraping. Bulk check: max 60 domains per call.
4. **Scope.** Public pages and Lia's own Wix account only.
5. **No invented bugs.** A finding needs repro steps plus a saved response or screenshot in
   `evidence/`. If unsure, call it an observation or risk. Severity and priority are Lia's call.
6. **Expected behavior, not bugs:** Wix doesn't sell every TLD; API domain includes the TLD but
   the TLD filter has no dot (`com`); premium can cost more (first year only or renewal too);
   price, currency and suggestions vary by location and between calls; most WHOIS is redacted;
   availability is point-in-time.
7. **Stable assertions.** Assert on contract and shape, not on volatile values (prices,
   suggestion lists, currency).
8. **Git.** Lia commits. Small commits as work happens; never squash or rewrite history.
9. **Raw captures stay out of git.** `*.har` and `evidence/raw/` are ignored; commit only
   sanitized copies. Unredacted WHOIS of a real person is never committed.
10. **AI_LOG.md.** When Lia catches an AI mistake, log it there. Real ones only.

## Commands
- `npm test`: all tests
- `npm run test:api`: API tests only
- `npm run typecheck`: TypeScript check
