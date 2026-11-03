# AI log

## Tools used
- **Claude (claude.ai, linked to my Mac through the Claude desktop app)**: planning, guidance
  during manual DevTools exploration, drafting the scaffold and docs. I reviewed and edited
  everything before committing.
- Agent rules: [`CLAUDE.md`](CLAUDE.md).

## Key prompts
- Pre-clock planning (2026-11-01 to 11-03): pasted the full assignment brief and asked for a
  plan that fits 3 hours, plus the stack choice (Playwright + TypeScript).
- Clock start: "Wix - go". Claude wrote the scaffold (config, API client with call budget,
  smoke test, agent rules, this log, README skeleton).
- Docs: shared my DevTools findings and evidence files, asked Claude to draft ARCHITECTURE.md,
  TEST_PLAN.md and FINDINGS.md; I corrected the drafts and set severity and priority.
- Automation: "Proceed with the plan". Claude drafted the API and storefront tests from the
  automation scope in TEST_PLAN.md; I ran them on my Mac and reviewed the results.
- Review of the automation against the brief: "Verify and summarize what we did and why, and whether
  we cover at least one door precisely or not enough." The answer showed TEST_PLAN promised more than
  the tests did (R5 had no public API comparison, R10 had nothing automated).
- Scope I added after that review: "Fix R5. Automate R10, only robust tests. Automate the BNG and
  WHOIS parts of R5. Add tests that type into the search box on /domains."
- Checking the tests themselves: "Shouldn't we confirm the tests with a real browser, not headless?"
  and, for BNG, "Can we wait for an element to be visible, to make sure we type when we should?"
- Consistency before the last commits: "Should we update any .md so everything is consistent?
  Don't we miss anything?" (counts of calls, commands in CLAUDE.md, F3 evidence, repo map).

## Where the AI was wrong and how I caught it
- **Exploration, storefront:** Claude assumed the extra call on a `lia.com` search was a
  second availability check. In the Network panel it was an ownership lookup
  (`/_api/user-domains/v1/user_domains/lia.com` → 403 `domainBelongsToDifferentUser`).
- **Exploration, WHOIS:** Claude guessed the WHOIS door uses different paths for `.com` and
  `.co.il`. Both use the same flow (`rdap-url` then `whois`); only the `parse` flag differs.

- **FINDINGS F1, renewal price:** Claude wrote that "Buy domain only" renews at ₪90.19 (4.2× the
  first-year ₪21.47). I noticed the ₪90.19 comes from the "free first year with a plan" tooltip,
  and the price response has one `renewalPrice` per TLD with no split by purchase option. So the
  renewal price for "domain only" is unknown, not ₪90.19.

- **Automation, checkout guard:** Claude's guard blocked any URL containing `payment`. The first
  storefront run failed: it blocked Wix analytics calls whose query string listed the suggested
  name `googlepaymentsapp.com`. Fixed to match the URL path only. (Claude had flagged this risk
  but shipped the broad pattern anyway.)
- **Automation, "taken" check:** Claude asserted on the broker card ("Domain Taken / Hire a
  Broker"). In my runs Wix sometimes shows only "google.com is (already) registered" with no card.
  The test now accepts any of the "taken" messages; the backend answer is still asserted.
- **Automation, timing:** Claude's first UI steps typed and pressed Enter right after page load.
  Wix ignored them (half-typed names, Enter and Generate did nothing). Several runs, including one
  in a visible browser, to get to the precondition checks + retry-until-outcome approach.
  For BNG I asked for an explicit "is the element visible" check before typing; it is there as a
  precondition, but it is not enough on its own, so the retry stays.

- **Agent rules:** I asked Claude to review CLAUDE.md for missing rules. Five rules we had followed
  all day were never written down (no traces/UI mode, known failures via `test.fail`, how to wait on
  Wix pages, results only from my runs, docs updated with the code). Added as rules 11–15.

## What I changed or threw away
- **FINDINGS:** dropped the "60-TLD bulk cut" finding (.photo/.shop never checked) and moved it
  to TEST_PLAN R6 as a test idea: I could not defend it as a user-facing bug.
- **FINDINGS F1:** rewritten after I caught the renewal mistake above; now it is about the
  plan-choice page not showing the renewal price it receives.
- **ARCHITECTURE:** resolved the ⚠ unconfirmed items with my own DevTools checks.
- **Tests:** asked for more than Claude's first automation scope: the R5 public API cross-check in
  every web test, typing into the real search box instead of opening the results URL, WHOIS and BNG
  tests, and a robust R10 currency check. `.co.il` suggestions stay manual (only true from Israel).

## What I chose NOT to hand to AI
- Running the tests: every run happened on my Mac and I read the failures before asking for
  fixes. I ran the web tests in a visible browser to see they do what their names say.
- The DevTools exploration of the 4 web doors: I clicked through and read the Network panel myself.
- Severity and priority of every finding.
