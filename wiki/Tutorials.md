# Tutorials — guided paths (EN/ES)

> Scope: *paths*, not lessons. Canonical lesson files live in
> [`docs/tutorials/`](https://github.com/wilnowilx/aetheriusxapi/tree/main/docs/tutorials)
> (EN/ES pairs). This page orders them by job-to-be-done. To add a lesson:
> PR the lesson file + index it here.

**Status:** Active · **Owner:** maintainers · **Review:** when lessons ship.

## Path 1 — Agent builder (I want my agent to pay for data)

1. [Your First x402 Call (EN)](https://github.com/wilnowilx/aetheriusxapi/blob/main/docs/tutorials/01-first-x402-call.md) /
   [Tu Primera Llamada (ES)](https://github.com/wilnowilx/aetheriusxapi/blob/main/docs/tutorials/01-primera-llamada-x402.md)
   — 402 without payment → 200 with `X-PAYMENT`.
2. [Agent First Paid Call (EN)](https://github.com/wilnowilx/aetheriusxapi/blob/main/docs/tutorials/03-agent-first-paid-call.md) /
   [Llamada Pagada del Agente (ES)](https://github.com/wilnowilx/aetheriusxapi/blob/main/docs/tutorials/03-llamada-pagada-agente.md)
   — discover cheapest endpoint, settle, read data.

## Path 2 — Operator (I run / evaluate the platform)

1. [Dashboard: no signup, in-browser](https://github.com/wilnowilx/aetheriusxapi/blob/main/docs/tutorials/02-pages-dashboard-live.md)
   — catalog + explorer + live telemetry. *(ES in translation; code identical.)*
2. [Storage Drift Slots](https://github.com/wilnowilx/aetheriusxapi/blob/main/docs/tutorials/04-storage-drift.md) /
   [04 ES](https://github.com/wilnowilx/aetheriusxapi/blob/main/docs/tutorials/04-drift-slots.md)
   — converged / diverged / degraded states.

## Path 3 — Analyst (I want free on-chain intel)

- Start at the playground's FREE x402 sidebar
  ([live](https://wilnowilx.github.io/aetheriusxapi/#playground)):
  `base-stats` → `gas` → `market-pulse` → `sentiment` → `whales`.
- Then read [[x402-Protocol]] § Free vs paid to understand what you're seeing.

## Translation contract (honest)

Creator-Grant series = 8 pieces / 6 weeks, EN+ES. Missing ES versions never
block usage (code and endpoints are identical). To help: PR touching only
`docs/tutorials/` + index row here.
