# Base Grant Applications — AETHERIUS / aetheriusxAPI

> Single source of truth for both tracks. Creator Grant = content funding ($4K).
> Ecosystem Fund = product investment (pre-seed/seed). Different asks, shared evidence.

## Company Name

AETHERIUS (product: aetheriusxAPI)

## What are you building?

Crypto-native API marketplace where **AI agents pay per request in USDC on Base via x402**.
No accounts, no API keys, no credit cards — the wallet is the identity.

**Live on Base Mainnet (not a deck — running code since Sep 5, 2026):**
- 100+ endpoints live: 60 paid + 40 FREE (20 x402 Intelligence + 20 QuantumXBrain)
- 8 categories: Maps ×5, Crypto ×13, Web ×7, Data ×14, DeFi ×10, Forex ×3, News ×6, x402 Intelligence ×4, QuantumXBrain ×20
- E2E proven: real USDC payments settling on Base Mainnet
- Interactive dashboard with API explorer: `/dashboard/`
- **QuantumXBrain**: AI-powered intelligence layer combining on-chain data + CoinGecko + DefiLlama in real-time
- AETHERIUS fingerprint on every response — verifiable, branded intelligence
- Landing: https://wilnowilx.github.io/aetheriusxapi/
- Live API: https://34-156-149-38.sslip.io/aetherapi/ (`/docs`, `/health`)
- Repo: https://github.com/wilnowilx/aetheriusxapi

## Website URL

https://wilnowilx.github.io/aetheriusxapi/

## X URL

https://x.com/aetheriusxAPI

## Telegram
- Channel: https://t.me/aetherius_xAPI
- Global (forum): https://t.me/aetheriusxAPI_global

## Demo Video
https://youtu.be/TDzMALSe00A (unedited 402→200 loop, real USDC on Base Mainnet)

## Team

Solo builder operating live x402 infrastructure on Base. Python, FastAPI,
GCP/Kubernetes, telemetry/NATS, x402 protocol. Venezuelan immigrant in Mexico,
no bank account, no ID — only crypto wallet. Building everything solo with $5.80 ETH.

## Why Base?

1. Sub-cent fees make $0.005–$0.03 per-call micropayments viable — impossible on L1.
2. USDC on Base is the natural settlement asset for agents (stable, liquid, instant).
3. x402 is Base-native; facilitator + Base Mainnet give a complete production loop.
4. Base explicitly funds **payments** and **AI agents** (Ecosystem Fund categories).
5. Every paid call is onchain activity: wallets, transactions, volume attributable to Base.
6. x402 Intelligence + QuantumXBrain read Base Mainnet directly — exclusive analytics layer.
7. QuantumXBrain combines on-chain + CoinGecko + DefiLlama — agents get intelligence in ONE call.

## TRACK A — Creator Grant ($4,000): builders documenting the agent economy

**Angle:** we are technical builders producing education from real infrastructure,
in English + Spanish (500M+ underserved developers).

**Content series (8 pieces, 6 weeks):**
1. An agent pays for its first API call (video + code, EN/ES)
2. Inside an x402 round-trip: 402 → sign → settle (deep-dive)
3. Operating 60+ paid endpoints on <$50/mo GCP (cost transparency)
4. When upstreams throttle datacenters: building a 5-source price chain (postmortem)
5. Distributed telemetry with NATS: what each layer sees (video)
6. **QuantumXBrain: building AI-powered intelligence for agent commerce** (deep-dive)
7. Agents + prediction markets: Polymarket bots that pay for data (case study)
8. Deploy your own paid API on Base in 30 minutes (tutorial + template repo)

**Deliverables:** videos + written tutorials + reproducible code. Budget: $4,000
(infra $1,200 · production/editing $1,600 · ES translation $600 · distribution $600).

## TRACK B — Ecosystem Fund: infrastructure for agent commerce

**Thesis:** agents need to pay for data; data providers need to get paid.
aetheriusxAPI is that rail on Base: discovery (catalog) → payment (x402/USDC) →
delivery (APIs) → intelligence (on-chain analytics) → observability (telemetry).

**Three product lines:**
- **Data APIs** (live): crypto, maps, weather, web, email — 60 paid endpoints.
- **x402 Intelligence** (live, FREE): on-chain analytics nobody else offers — the "Bloomberg Terminal" for agent commerce.
- **QuantumXBrain** (live, FREE): AI-powered intelligence layer — 20 enhanced endpoints combining Base RPC + CoinGecko + DefiLlama + contextual analysis. AETHERIUS fingerprint on every response.
- **Infrastructure APIs** (Phase 2): telemetry health, storage-layout drift,
  latency proofs — observability other builders can consume per-call.

**Competitive moat:**
- XPay: 5,000 publishers, 1,000+ tools → they are the marketplace
- Stripe MPP: streaming payments → they are the payment rail
- Google AP2: authorization → they are the auth layer
- **AETHERIUS: on-chain intelligence + QuantumXBrain → we are the analytics + intelligence layer**

Nobody else reads Base Mainnet to tell you WHO is paying, HOW MUCH, WHEN, and WHY — and gives you BTC price, Fear&Greed, gas trends, and whale tracking in the SAME response. That's our unfair advantage.

**Use of funds:** mainnet deployment + audit ($800) · 12-month infra ($2,400) ·
provider onboarding + SDKs ($3,000) · security review ($1,500) · content/growth ($2,300).

**90-day targets post-funding:** 120+ endpoints · x402 Intelligence expansion ·
Python/JS/Go SDKs · 100 paying agent-wallets · public status page with uptime/latency/volume.

## Metrics (verifiable today)

- **Network:** Base Mainnet (`eip155:8453`), wallet `0x677B…7f61`
- **Live:** 80 endpoints (60 paid + 20 free x402 Intelligence)
- **E2E:** real USDC payments settling on Base Mainnet
- **Tests:** 60/60 green (`pytest -q`), incl. telemetry accounting tests
- **Public telemetry:** `GET /v1/telemetry` (free) — uptime, per-endpoint stats,
  settled USDC volume, latency feed. Powers the live dashboard.
- **x402 Intelligence:** 4 FREE exclusive endpoints reading on-chain data
- **Uptime:** systemd + auto-restart, Nginx reverse proxy
- **Cost:** single GCP VM (Europe), full stack under $50/mo
- **Build velocity:** 80 endpoints in 96 hours, solo builder, $5.80 ETH capital
- **Honesty policy:** key-gated endpoints return 501 with setup instructions, never fake data
