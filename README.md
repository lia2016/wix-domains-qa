# Wix Domains QA: "Can I get this name?"

**Total time:** TODO in repo (first to last commit) + about TODO min prep before the first commit
(Wix account and API key, reading the docs, planning, manual exploration of the 4 doors on 2026-11-03).

## How to run
Requires Node 20.12+.

```bash
npm ci
npx playwright install chromium
cp .env.example .env   # fill in WIX_API_KEY and WIX_ACCOUNT_ID
npm test
```

## Repo map
| Path | What |
|---|---|
| `tests/helpers/wixApi.ts` | Public API client: auth from env, per-run call budget |
| `tests/api/` | API tests |
| `evidence/` | Sanitized responses and screenshots behind the findings |
| `CLAUDE.md` | Rules for the AI agent |
| `AI_LOG.md` | How AI was used, where it was wrong |

## With another week
TODO

## Quality strategy for Wix Domains (5 lines)
TODO
