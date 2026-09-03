<div align="center">

![AETHERIUS](https://img.shields.io/badge/AETHERIUS-aetheriusxAPI-8B5CF6?style=for-the-badge&labelColor=09090b)
![Base](https://img.shields.io/badge/Base-Mainnet-0052FF?style=for-the-badge&labelColor=09090b)
![x402](https://img.shields.io/badge/x402-Protocol-10B981?style=for-the-badge&labelColor=09090b)
![USDC](https://img.shields.io/badge/USDC-Payments-2775CA?style=for-the-badge&labelColor=09090b)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge&labelColor=09090b)

# AETHERIUS — aetheriusxAPI

### The Operating System for AI Agent Commerce

**120+ APIs where autonomous AI agents pay per request in USDC on Base.**
**No accounts. No subscriptions. No human friction. Just code.**

[Website](https://wilnowilx.github.io/aetheriusxapi/) · [Documentation](https://github.com/wilnowilx/aetheriusxapi/blob/main/docs/API.md) · [Twitter](https://x.com/aetheriusxAPI) · [x402 Protocol](https://x402.org)

</div>

---

## Table of Contents

- [The Problem](#the-problem)
- [The Vision](#the-vision)
- [Concept Map](#concept-map)
- [Mental Model: How x402 Changes Everything](#mental-model-how-x402-changes-everything)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Dashboard](#dashboard)
- [Endpoints](#endpoints)
- [Categories](#categories)
- [Rate Limits](#rate-limits)
- [Tech Stack](#tech-stack)
- [Roadmap](#roadmap)
- [Grant Application](#grant-application)
- [Contributing](#contributing)
- [License](#license)
- [Links](#links)

---

## The Problem

The AI agent economy is emerging, but the API layer is stuck in 2015:

| Pain Point | Traditional APIs | aetheriusxAPI |
|------------|-----------------|---------------|
| **Access** | Credit card + email signup | Wallet connection only |
| **Pricing** | Monthly subscriptions | Pay per request |
| **Identity** | API keys + secrets | Your wallet IS your identity |
| **KYC/AML** | Required for most services | Permissionless |
| **Settlement** | 3-5 business days | Instant on-chain |
| **Global reach** | Restricted by banks/policy | Anyone with a crypto wallet |
| **Agent autonomy** | Requires human in the loop | Full machine-to-machine |

> **Core insight:** AI agents can't hold credit cards. They can hold crypto wallets. The API economy needs to meet them where they are.

---

## The Vision

```
┌─────────────────────────────────────────────────────────────────┐
│                     AETHERIUS ECOSYSTEM                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────┐    x402 Protocol    ┌──────────┐                 │
│   │   AI     │ ◄──── Payment ────► │   API    │                 │
│   │  Agent   │     USDC on Base    │ Provider │                 │
│   │ (Buyer)  │                     │ (Seller) │                 │
│   └──────────┘                     └──────────┘                 │
│        │                                │                       │
│        │    ┌──────────────────────┐    │                       │
│        └───►│   AETHERIUS Hub      │◄───┘                       │
│             │  ┌────────────────┐  │                            │
│             │  │  120+ APIs     │  │                            │
│             │  │  12 Categories │  │                            │
│             │  │  Auto-pay      │  │                            │
│             │  └────────────────┘  │                            │
│             └──────────────────────┘                            │
│                                                                 │
│   ┌──────────────────────────────────────────────────────┐      │
│   │                  Infrastructure                      │      │
│   │  FastAPI · x402 Middleware · Base L2 · Coinbase CDP  │      │
│   └──────────────────────────────────────────────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Mission:** Become the default API layer for autonomous agents — the Stripe of the agent economy.

**Strategy:**
1. **Launch** with 10 curated API categories (120+ endpoints)
2. **Prove** the x402 payment flow works end-to-end on Base mainnet
3. **Scale** to 500+ endpoints after Base Builder Grant funding
4. **Become** the infrastructure that AI agents depend on

---

## Mental Model: How x402 Changes Everything

### The Old World (API Key Era)

```
Developer → signs up → gets API key → manages billing → hopes it works
    │                                                    │
    │    ┌─────────────┐    ┌─────────────┐              │
    └───►│  Credit Card │───►│  Dashboard  │───► API Access
         └─────────────┘    └─────────────┘
              Human friction at every step
```

### The New World (x402 Protocol)

```
AI Agent → connects wallet → makes request → pays automatically → gets data
    │                                                         │
    │    ┌─────────────┐    ┌─────────────┐                   │
    └───►│  Crypto     │───►│  x402      │───► Response       │
         │  Wallet     │    │  Protocol  │                    │
         └─────────────┘    └─────────────┘
              Zero friction. Machine-native.
```

### Key Concepts

| Concept | Definition | Why It Matters |
|---------|-----------|----------------|
| **x402** | HTTP 402 status code repurposed for crypto payments | Standardized machine-to-machine payment protocol |
| **USDC** | USD-pegged stablecoin on Base L2 | Stable value, sub-cent fees, instant settlement |
| **Base** | Ethereum L2 by Coinbase | Low gas fees, high throughput, Coinbase integration |
| **Facilitator** | Service that verifies payment proofs on-chain | Trustless verification without intermediaries |
| **Wallet-as-Identity** | Your Ethereum address = your account | No signup, no KYC, no email, no password |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                         │
│                                                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────┐    │
│  │ Python  │  │   JS    │  │   Go    │  │   Rust   │    │
│  │   SDK   │  │   SDK   │  │   SDK   │  │   SDK    │    │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬─────┘    │
│       └─────────────┴────────────┴────────────┘         │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                   GATEWAY LAYER                         │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Nginx Reverse Proxy                │    │
│  │          Rate Limiting · SSL · Routing          │    │
│  └──────────────────────┬──────────────────────────┘    │
│                          │                              │
│  ┌──────────────────────▼──────────────────────────┐    │
│  │            AetherAPI Server (FastAPI)           │    │
│  │                                                 │    │
│  │  ┌────────────┐  ┌────────────┐  ┌───────────┐  │    │
│  │  │   Auth     │  │   x402     │  │  Router   │  │    │
│  │  │  (Wallet)  │  │ Middleware │  │           │  │    │
│  │  └────────────┘  └────────────┘  └───────────┘  │    │
│  └──────────────────────┬──────────────────────────┘    │
│                          │                              │
│  ┌──────────────────────▼──────────────────────────┐    │
│  │              API Providers (Upstream)           │    │
│  │                                                 │    │
│  │  Google Maps · CoinGecko · OpenWeather · ...    │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                   SETTLEMENT LAYER                      │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │         x402 Facilitator (Coinbase CDP)         │    │
│  │                                                 │    │
│  │  • Verifies payment proofs on-chain             │    │
│  │  • Settles USDC on Base                         │    │
│  │  • Instant finality                             │    │
│  └─────────────────────────────────────────────────┘    │
│                          │                              │
│  ┌──────────────────────▼──────────────────────────┐    │
│  │              Base (Ethereum L2)                 │    │
│  │                                                 │    │
│  │  • Low gas fees (~$0.001 per tx)                │    │
│  │  • High throughput (2000+ TPS)                  │    │
│  │  • Coinbase ecosystem integration               │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Quick Start

### For AI Agents (Buyers)

```bash
# Install the SDK
pip install aetheriusx
```

```python
from aetheriusx import Client

# Initialize with your wallet
client = Client("0xYourWalletAddress")

# Call any API — payment is automatic
response = client.get("/v1/crypto/price",
    params={"token": "ETH"})

print(response.data)
# {"price": 2384.50, "change": 2.3}
# That's it. Payment handled via x402.
```

### For API Providers (Sellers)

```python
from fastapi import FastAPI
from x402.http import FacilitatorConfig, HTTPFacilitatorClient
from x402.http.middleware.fastapi import PaymentMiddlewareASGI

app = FastAPI()

# Add x402 payment middleware
facilitator = HTTPFacilitatorClient(
    FacilitatorConfig(url="https://x402.org/facilitator")
)

app.add_middleware(PaymentMiddlewareASGI, routes={
    "GET /your-endpoint": {
        "accepts": [{
            "scheme": "exact",
            "pay_to": "0xYourWallet",
            "price": "$0.01",
            "network": "eip155:8453"
        }],
        "description": "Your premium API endpoint",
    }
}, server=facilitator)
```

### For cURL Users

```bash
curl -X GET \
  "https://api.aetheriusx.io/v1/crypto/price?token=ETH" \
  -H "X-PAYMENT: 0x...payment-proof" \
  -H "Content-Type: application/json"

# Response
{
  "data": {
    "price": 2384.50,
    "change_24h": 2.3
  }
}
```

---

## Dashboard

Interactive control room (no build step, vanilla JS) served by the backend itself:

```bash
uvicorn main:app --reload --port 4020
# open http://127.0.0.1:4020/dashboard/
```

- **API Catalog** — all 10 endpoints with live prices from `/health`
- **Explorer** — param forms, one-click paid calls, `Show 402` renders the payment challenge
- **Live Metrics** — REAL server telemetry (`/v1/telemetry`): uptime, totals, settled USDC volume, wallets seen, latency bars, event feed. Zero simulated numbers.
- **Wallet** — memory-only demo connect (real x402 signing in production client)
- **Storage Drift** — probes `/v1/storage/drift`, shows planned payload until Phase 2
- **Activity** — client-side call log

Live (testnet): `http://34.156.149.38/aetherapi/dashboard/`

---

## Endpoints

| Endpoint | Description | Price | Latency |
|----------|-------------|-------|---------|
| `GET /v1/crypto/price` | Real-time token price from multiple DEXs | $0.005 | ~30ms |
| `GET /v1/crypto/analyze` | Token risk analysis + holder distribution | $0.02 | ~80ms |
| `GET /v1/crypto/holders` | Top holder distribution + whale tracking | $0.03 | ~60ms |
| `GET /v1/maps/search` | Google Maps business search | $0.01 | ~120ms |
| `GET /v1/maps/reviews` | Business reviews scraper | $0.02 | ~200ms |
| `GET /v1/maps/nearby` | Nearby places by coordinates | $0.015 | ~90ms |
| `GET /v1/web/scrape` | Universal web scraper | $0.01 | ~150ms |
| `GET /v1/web/screenshot` | Website screenshot capture | $0.025 | ~300ms |
| `GET /v1/email/validate` | Email verification service | $0.005 | ~40ms |
| `GET /v1/weather/current` | Weather forecast by location | $0.008 | ~50ms |

> **Note:** These are the initial 10 endpoints. With Base Builder Grant funding, we'll expand to **120+ endpoints across 12 categories.**

---

## Categories

| Category | APIs | Examples |
|----------|------|----------|
| **Crypto & DeFi** | 15+ | Price feeds, DEX data, token analysis, yield tracking |
| **AI & ML** | 12+ | Text generation, image analysis, embeddings, classification |
| **Maps & Location** | 10+ | Geocoding, places search, routing, geofencing |
| **Web & Scraping** | 10+ | HTML extraction, screenshots, DOM parsing, proxy rotation |
| **Finance** | 10+ | Stock data, forex rates, economic indicators |
| **Communication** | 10+ | Email send, SMS, push notifications, webhooks |
| **Weather** | 10+ | Forecasts, historical data, alerts, air quality |
| **News & Media** | 10+ | Headlines, sentiment analysis, RSS aggregation |
| **Security** | 10+ | Threat detection, vulnerability scanning, IP lookup |
| **Data & Analytics** | 10+ | Data transformation, statistical analysis, visualization |
| **Gaming** | 10+ | Game data, leaderboards, matchmaking, asset pricing |
| **Health & Science** | 10+ | Drug interaction, genomics, clinical data |

---

## Rate Limits

| Tier | Requests/min | Requests/day | Burst | Price |
|------|-------------|-------------|-------|-------|
| **Free** | 10 | 100 | 20 | $0 |
| **Pro** | 100 | 10,000 | 200 | Per-request |
| **Enterprise** | 1,000 | Unlimited | Custom | Custom |

> Free tier: First 100 requests per day. No credit card required.

---

## Tech Stack

```
┌─────────────────────────────────────────────────┐
│                 APPLICATION                      │
│  FastAPI · Python 3.11+ · Pydantic              │
├─────────────────────────────────────────────────┤
│                 PROTOCOL                         │
│  x402 · HTTP 402 · USDC · Base L2               │
├─────────────────────────────────────────────────┤
│                 INFRASTRUCTURE                   │
│  Nginx · Systemd · GCP Compute Engine           │
├─────────────────────────────────────────────────┤
│                 PAYMENTS                         │
│  Coinbase CDP · USDC · Ethereum L2               │
└─────────────────────────────────────────────────┘
```

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Server** | FastAPI (Python) | High-performance async API server |
| **Protocol** | x402 | HTTP 402 with crypto payments |
| **Payments** | USDC on Base | Stablecoin payments on L2 |
| **Facilitation** | Coinbase CDP | Payment verification and settlement |
| **Hosting** | GCP Compute Engine | Global edge deployment |
| **Proxy** | Nginx | Rate limiting, SSL, load balancing |
| **Process** | Systemd | Service management and auto-restart |

---

## Roadmap

### Phase 1: Foundation (Current)
- [x] Core API server with x402 middleware (simulated + real modes)
- [x] 10 endpoints, 8 with live upstream logic (no mocked data)
- [x] E2E payment flow proven on testnet (6/6 → 200, real USDC settled)
- [x] Upstream resilience (Overpass mirrors, 5-source price chain, Nominatim fallbacks)
- [x] Interactive dashboard (`/dashboard/`) with API explorer
- [x] Coinbase CDP API credentials
- [x] Professional landing page
- [ ] **Mainnet deployment** (pending ETH funding)
- [ ] Base grant applications (Creator + Ecosystem Fund)

### Phase 2: Scale (Post-Grant)
- [ ] Expand to 120+ endpoints
- [ ] 12 API categories
- [ ] SDK release (Python, JavaScript, Go, Rust)
- [ ] Developer dashboard
- [ ] API analytics and monitoring
- [ ] Rate limit management UI

### Phase 3: Ecosystem (Q1 2027)
- [ ] Third-party API provider onboarding
- [ ] Revenue sharing model
- [ ] Agent marketplace
- [ ] Enterprise tier with SLA
- [ ] Multi-chain support (Ethereum, Polygon, Arbitrum)

---

## Grant Application

We are applying for the **Base Builder Grants** program:

- **Amount:** $5,000 seed + GTM support
- **Use of funds:** Mainnet deployment, expand to 120+ endpoints, SDK development
- **Timeline:** 4 weeks post-funding
- **Metrics:** First 100 paying API consumers within 90 days

[Application text](application.md) · [Base Builder Grants](https://www.base.org/ecosystem-fund/apply)

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/wilnowilx/aetheriusxapi.git

# Navigate to the project
cd aetheriusxapi

# Install dependencies (if building locally)
pip install -r requirements.txt

# Run the server locally
uvicorn main:app --reload --port 4020
```

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Links

| Resource | URL |
|----------|-----|
| **Website** | [wilnowilx.github.io/aetheriusxapi](https://wilnowilx.github.io/aetheriusxapi/) |
| **Documentation** | [GitHub Docs](https://github.com/wilnowilx/aetheriusxapi/blob/main/docs/API.md) |
| **Twitter** | [@aetheriusxAPI](https://x.com/aetheriusxAPI) |
| **GitHub** | [wilnowilx/aetheriusxapi](https://github.com/wilnowilx/aetheriusxapi) |
| **x402 Protocol** | [docs.x402.org](https://docs.x402.org) |
| **Base** | [base.org](https://base.org) |
| **Live API** | [api.aetheriusx.io](https://api.aetheriusx.io) |

---

<div align="center">

**Built for the agent economy.**

AETHERIUS — The infrastructure that lets AI agents pay for themselves.

[![Twitter](https://img.shields.io/badge/Follow-%40aetheriusxAPI-1DA1F2?style=for-the-badge&logo=twitter&labelColor=09090b)](https://x.com/aetheriusxAPI)
[![GitHub](https://img.shields.io/badge/Star-wilnowilx-fff?style=for-the-badge&logo=github&labelColor=09090b)](https://github.com/wilnowilx/aetheriusxapi)

</div>
