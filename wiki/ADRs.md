# Architecture Decision Records

> Format: Status / Date / Context / Decision / Consequences. New ADR per
> durable call (never silently reverse one — supersede explicitly).

## ADR-001 — Simulated settlement live, real path proven in tests

- **Status:** Accepted · **Date:** 2026-09-05
- **Context:** Live facilitator settlement adds latency, cost, and failure modes
  on day one; agents need a stable 402→200 loop to integrate against.
- **Decision:** Live mode = simulated (any non-empty `X-PAYMENT` settles);
  real facilitator path implemented, tested E2E, and switchable. Volume metric
  counts facilitator-approved payments and says so publicly.
- **Consequences:** Sub-50ms paid responses; honest docs required (README states
  `simulated`). Flip to real mode is a config change, not a rewrite.

## ADR-002 — Base-first public positioning

- **Status:** Accepted · **Date:** 2026-09-08
- **Context:** Grant committees fund ecosystem consolidation (Base txs, wallets,
  dev retention). A multichain-first narrative dilutes perceived traction.
- **Decision:** All public narrative is Base-native (endpoints, payments,
  telemetry, milestones accrue to Base). Chain abstraction stays in code as a
  future technical evolution, never the lead message.
- **Consequences:** Roadmap/grant docs scrubbed of multichain lead; drift-type
  tools keep other chains only as measurement baselines.

## ADR-003 — Free QuantumXBrain intelligence layer

- **Status:** Accepted · **Date:** 2026-09-06
- **Context:** Paid data APIs alone don't differentiate; agents also need to
  *understand* the chain they're paying on.
- **Decision:** 40 free endpoints (20 Intelligence + 20 QuantumXBrain) reading
  Base RPC + CoinGecko + DefiLlama, fingerprinted
  (`X-AETHERIUS-Fingerprint`), no payment, no keys.
- **Consequences:** The free layer is the funnel and the moat; it must stay
  free and stay live (a 402 on `/v1/x402/*` is a regression).

## ADR-004 — `wiki/` as docs source of truth, mirrored to Wiki tab

- **Status:** Accepted · **Date:** 2026-09-09
- **Context:** GitHub Wiki UI edits bypass review and rot; knowledge scattered
  across chats and memory doesn't survive.
- **Decision:** Author in `wiki/` (PR-reviewed) → Action mirrors to `.wiki.git`
  on merge to `main`. UI edits forbidden (overwritten by sync).
- **Consequences:** Docs change with code; needs a `WIKI_TOKEN` PAT secret
  (rotate documented here when expiry breaks sync).
