# Base Grant Applications — AETHERIUS / aetheriusxAPI

> Single source of truth for both tracks. Creator Grant = content funding ($4K).
> Ecosystem Fund = product investment (pre-seed/seed). Different asks, shared evidence.

## Company Name

AETHERIUS (product: aetheriusxAPI)

## What are you building?

Crypto-native API marketplace where **AI agents pay per request in USDC on Base via x402**.
No accounts, no API keys, no credit cards — the wallet is the identity.

**Live on Base Sepolia testnet (not a deck — running code):**
- 30 endpoints: maps ×4, token ×5, web ×3, data ×5, drift, DeFi ×7,
  forex ×2, news ×3
- 29 wired to live upstreams (OSM, Llama suite, Open-Meteo, Frankfurter,
  Firebase, Etherscan, dictionary, ip-api, public RPCs, …) with honest errors
- E2E proven: 6/6 endpoints return 200 with real USDC settlement
- Interactive dashboard with API explorer: `/dashboard/`
- Landing: https://wilnowilx.github.io/aetheriusxapi/
- Live API: http://34.156.149.38/aetherapi/ (`/docs`, `/health`)
- Repo: https://github.com/wilnowilx/aetheriusxapi

## Website URL

https://wilnowilx.github.io/aetheriusxapi/

## X URL

https://x.com/aetheriusxAPI

## Team

Solo builder, 13+ years in crypto (since 2013). Python, FastAPI, GCP/Kubernetes,
telemetry/NATS, x402 protocol. Google for Startups member with GCP infrastructure
(Europe region, systemd + Nginx, monitored 24/7).

## Why Base?

1. Sub-cent fees make $0.005–$0.03 per-call micropayments viable — impossible on L1.
2. USDC on Base is the natural settlement asset for agents (stable, liquid, instant).
3. x402 is Base-native; facilitator + Base Sepolia give a complete test loop.
4. Base explicitly funds **payments** and **AI agents** (Ecosystem Fund categories).
5. Every paid call is onchain activity: wallets, transactions, volume attributable to Base.

## TRACK A — Creator Grant ($4,000): builders documenting the agent economy

**Angle:** we are technical builders producing education from real infrastructure,
in English + Spanish (underserved audience).

**Content series (8 pieces, 6 weeks):**
1. An agent pays for its first API call (video + code, EN/ES)
2. Inside an x402 round-trip: 402 → sign → settle (deep-dive)
3. Operating 11 paid endpoints on $X/month GCP (cost transparency)
4. When upstreams throttle datacenters: building a 5-source price chain (postmortem)
5. Distributed telemetry with NATS: what each layer sees (video)
6. Storage-layout drift: detecting divergent state between layers (demo + API preview)
7. Agents + prediction markets: Polymarket bots that pay for data (case study)
8. Deploy your own paid API on Base in 30 minutes (tutorial + template repo)

**Deliverables:** videos + written tutorials + reproducible code. Budget: $4,000
(infra $1,200 · production/editing $1,600 · ES translation $600 · distribution $600).

## TRACK B — Ecosystem Fund: infrastructure for agent commerce

**Thesis:** agents need to pay for data; data providers need to get paid.
aetheriusxAPI is that rail on Base: discovery (catalog) → payment (x402/USDC) →
delivery (APIs) → observability (telemetry, drift detection).

**Three product lines:**
- **Data APIs** (live): crypto, maps, weather, web, email.
- **Agent APIs** (next): Polymarket markets/signals, protocol discovery (80+ mapped).
- **Infrastructure APIs** (Phase 2): telemetry health, storage-layout drift,
  latency proofs — observability other builders can consume per-call.

**Use of funds:** mainnet deployment + audit ($800) · 12-month infra ($2,400) ·
provider onboarding + SDKs ($3,000) · security review ($1,500) · content/growth ($2,300).

**90-day targets post-funding:** mainnet live · 25+ endpoints · Python/JS SDKs ·
100 paying agent-wallets · public status page with uptime/latency/volume.

## Metrics (verifiable today)

- Testnet: Base Sepolia (`eip155:84532`), wallet `0x677B…7f61`
- E2E: 6/6 paid endpoints → 200 (receipts in repo history / demo video)
- Suite: 23/23 tests green (`pytest -q`), incl. telemetry accounting tests
- Public telemetry: `GET /v1/telemetry` (free) — uptime, per-endpoint stats,
  settled USDC volume, latency feed. Powers the live dashboard.
- Uptime: systemd + auto-restart, Nginx reverse proxy, 90s upstream budget
- Cost: single GCP VM (Europe), full stack under $50/mo
- Honesty policy: key-gated endpoints return 501 with setup instructions, never fake data
