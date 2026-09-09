## What + why

<!-- One paragraph: what changes, which agent/operator pain it removes. Link issue: Closes #N -->

## Verification

- [ ] `pytest -q` green (or: backend untouched)
- [ ] Live probe where relevant (`/health` 200 · free route 200 · paid route 402-without-payment)
- [ ] No secrets added (keys, tokens, `.env`, PATs, SSH) — `.gitignore` respected

## Docs (answer all three)

- [ ] `docs/API.md` updated (required if routes/prices/shapes changed)
- [ ] Wiki update included or N/A with reason (required if behavior/ops/architecture changed)
- [ ] `CHANGELOG.md` entry under Unreleased

## Narrative guardrails (public repo, grant-facing)

- [ ] No multichain-first language (Base-first; other chains only as measurement baselines)
- [ ] No competitor mentions outside `application.md`
- [ ] No internal research/infra details (Sentinel, VIT-ID, VM internals stay local)
- [ ] Numbers claimed are verifiable (endpoint counts, tests, latency — no invented metrics)
