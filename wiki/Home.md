# AETHERIUS Wiki — Home

> **Source of truth for how this system runs.** The README sells the vision;
> this wiki records how the machine actually works: architecture, protocol,
> operations, and decisions. If a page disagrees with production, the page is
> wrong — fix it with a PR.

**Status:** Active · **Owner:** maintainers (`CODEOWNERS`) · **Review:** monthly for
Runbooks, quarterly for the rest, always after an incident.

## Start here

| I want to… | Go to |
|---|---|
| Run the stack locally | [[Getting-Started]] |
| Understand the system | [[Architecture]] |
| Understand payments (402 → pay → 200) | [[x402-Protocol]] |
| Respond to an incident / deploy / renew TLS | [[Runbooks]] |
| Know *why* something was decided | [[ADRs]] |
| Learn by doing (EN/ES) | [[Tutorials]] |

## Rules of this wiki (read once)

1. **PR-only edits.** Source lives in `wiki/` inside the main repo. A GitHub
   Action mirrors it to the Wiki tab on every merge to `main`. **Never edit via
   the Wiki UI — the sync overwrites it** (`rsync --delete`).
2. **Answer, then write.** Every support question answered in Telegram/X becomes
   a wiki paragraph before end of day. The reply and the edit are the same effort.
3. **Small, current, owned.** One page per job. No history lessons in runbooks.
   Every page states its scope; diagrams show production *as it runs now*.
4. **No secrets, ever.** Wallets/URLs already public may be referenced. Private
   keys, tokens, SSH material, and internal research never enter these pages.
5. **PR checklist.** Every code PR answers: *"Does this change require a wiki,
   runbook, or ownership update?"*

## Wiki ↔ repo map

- `README.md` → vision, quickstart, endpoints catalog, pitch.
- `docs/API.md` → per-endpoint reference (params, shapes, prices).
- `docs/tutorials/` → guided lessons EN/ES (canonical lesson files).
- `wiki/` (here) → ownership, architecture, protocol deep-dive, runbooks, ADRs.
- Landing + Dashboard → live product surface (GitHub Pages + backend).
