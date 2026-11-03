# AI log

## Tools used
- **Claude (claude.ai, linked to my Mac through the Claude desktop app)**: planning, guidance
  during manual DevTools exploration, drafting the scaffold and docs. I reviewed and edited
  everything before committing.
- Agent rules: [`CLAUDE.md`](CLAUDE.md).

## Key prompts
<!-- TODO(Lia): add the real prompts as you go -->
- Pre-clock planning (2026-11-01 to 11-03): pasted the full assignment brief and asked for a
  plan that fits 3 hours, plus the stack choice (Playwright + TypeScript).
- Clock start: "Wix - go". Claude wrote the scaffold (config, API client with call budget,
  smoke test, agent rules, this log, README skeleton).

## Where the AI was wrong and how I caught it
- **Exploration, storefront:** Claude assumed the extra call on a `lia.com` search was a
  second availability check. In the Network panel it was an ownership lookup
  (`/_api/user-domains/v1/user_domains/lia.com` → 403 `domainBelongsToDifferentUser`).
- **Exploration, WHOIS:** Claude guessed the WHOIS door uses different paths for `.com` and
  `.co.il`. Both use the same flow (`rdap-url` then `whois`); only the `parse` flag differs.

## What I changed or threw away
<!-- TODO(Lia) -->

## What I chose NOT to hand to AI
- The DevTools exploration of the 3 web doors: I clicked through and read the Network panel myself.
- Severity and priority of every finding.
