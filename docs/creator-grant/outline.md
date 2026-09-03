# Creator Grant Track A: Content Series Outline

Eight pieces over six weeks. The series documents real infrastructure for agent commerce on Base in English and Spanish, with reproducible code and honest network labels.

| # | Piece | Format | Status | Proof / next artifact |
|---:|---|---|---|---|
| 1 | An agent pays for its first API call | Video + code, EN/ES | hecho | `docs/tutorials/01-first-x402-call.md`, `examples/` |
| 2 | Inside an x402 round-trip: 402 -> sign -> settle | Technical deep dive | pendiente | Capture a signed testnet flow and receipt |
| 3 | Operating 10 paid endpoints on $X/month GCP | Cost transparency post | borrador | Collect one month of infra, latency, and volume data |
| 4 | When upstreams throttle datacenters: a 5-source price chain | Postmortem | hecho | Document fallback behavior and observed provider responses |
| 5 | Distributed telemetry with NATS: what each layer sees | Video + architecture walkthrough | pendiente | Publish a sanitized event trace and diagram |
| 6 | Storage-layout drift: divergent state between layers | Demo + API preview | borrador | Expose a stable JSON contract and record a live drift run |
| 7 | Agents + prediction markets: Polymarket bots that pay for data | Case study | pendiente | Show a paper-trading run, costs, and risk controls |
| 8 | Deploy your own paid API on Base in 30 minutes | Tutorial + template repository | pendiente | Finish a clean deployment template and verification checklist |

## Delivery standard

Every piece should include:

- a reproducible repository path or command;
- a clear distinction between simulated, testnet, and mainnet behavior;
- observed outputs or transaction references where applicable;
- security notes for wallets, keys, rate limits, and upstream credentials;
- English and Spanish versions or subtitles.

## Status definitions

- **hecho:** reproducible artifact or published draft exists.
- **borrador:** scope and proof plan exist; the final artifact is incomplete.
- **pendiente:** not started or waiting on a live dependency.
