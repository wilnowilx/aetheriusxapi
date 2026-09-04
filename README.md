<div align="center">

![AETHERIUS](https://img.shields.io/badge/AETHERIUS-aetheriusxAPI-8B5CF6?style=for-the-badge&labelColor=09090b)
![Testnet](https://img.shields.io/badge/Base_Sepolia-Live-10B981?style=for-the-badge&labelColor=09090b)
![x402](https://img.shields.io/badge/x402-Protocol-10B981?style=for-the-badge&labelColor=09090b)
![USDC](https://img.shields.io/badge/USDC-Payments-2775CA?style=for-the-badge&labelColor=09090b)
![Endpoints](https://img.shields.io/badge/Endpoints-40-d946ef?style=for-the-badge&labelColor=09090b)
![Tests](https://img.shields.io/badge/Tests-29_passing-brightgreen?style=for-the-badge&labelColor=09090b)
![Dashboard](https://img.shields.io/badge/Dashboard-Live-ec4899?style=for-the-badge&labelColor=09090b)
![SDK](https://img.shields.io/badge/Python_SDK-ready-3776AB?style=for-the-badge&labelColor=09090b)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge&labelColor=09090b)
![Stars](https://img.shields.io/github/stars/wilnowilx/aetheriusxapi?style=for-the-badge&labelColor=09090b&color=8B5CF6)
![Forks](https://img.shields.io/github/forks/wilnowilx/aetheriusxapi?style=for-the-badge&labelColor=09090b&color=8B5CF6)
![Repo views](https://visitor-badge.laobi.icu/badge?page_id=wilnowilx.aetheriusxapi&left_color=09090b&right_color=8B5CF6)

# AETHERIUS — aetheriusxAPI

### The Operating System for AI Agent Commerce

**40 live APIs (120+ on the roadmap) where autonomous AI agents pay per request in USDC on Base.**
**No accounts. No subscriptions. No human friction. Just code.**

[Website](https://wilnowilx.github.io/aetheriusxapi/) · [Documentation](https://github.com/wilnowilx/aetheriusxapi/blob/main/docs/API.md) · [Twitter](https://x.com/aetheriusxAPI) · [x402 Protocol](https://x402.org)

</div>

---

## Table of Contents

- [⚡ Built in 48 Hours](#built-in-48-hours)
- [🔥 The Problem](#the-problem)
- [🗺️ System Overview](#system-overview)
- [📡 Live Status](#live-status)
- [🎬 Live Demo](#live-demo)
- [🐍 SDKs](#sdks)
- [🔭 The Vision](#the-vision)
- [🧠 Mental Model: How x402 Changes Everything](#mental-model-how-x402-changes-everything)
- [🏗️ Architecture](#architecture)
- [🚀 Quick Start](#quick-start)
- [🎛️ Dashboard](#dashboard)
- [⚡ Endpoints](#endpoints)
- [🗂️ Categories](#categories)
- [🚦 Rate Limits](#rate-limits)
- [🧱 Tech Stack](#tech-stack)
- [🛣️ Roadmap](#roadmap)
- [💰 Grant Application](#grant-application)
- [🤝 Contributing](#contributing)
- [📄 License](#license)
- [🔗 Links](#links)

---

## 🗺️ System Overview

![System flow](https://mermaid.ink/svg/JSV7aW5pdDogeyd0aGVtZSc6ICdkYXJrJ319JSUKZmxvd2NoYXJ0IExSCiAgICBBW_CfpJYgQUkgQWdlbnRdIC0tPnxHRVQgL3YxLy4uLnwgR1tBRVRIRVJJVVMgR2F0ZXdheTxici8-RmFzdEFQSSDCtyB4NDAyXQogICAgRyAtLT58NDAyICsgcHJpY2V8IEEKICAgIEcgLS0-fHBhaWQgMjAwfCBBCiAgICBHIC0tPiBNW01hcHMgwrcgT1NNXQogICAgRyAtLT4gQ1tDcnlwdG8gwrcgQ29pbkdlY2tvL0NvaW5iYXNlL0xsYW1hXQogICAgRyAtLT4gV1tXZWIgwrcgZGlyZWN0IGZldGNoXQogICAgRyAtLT4gRFtEYXRhIMK3IE9wZW4tTWV0ZW8vTm9taW5hdGltXQogICAgRyAtLT4gUltEcmlmdCDCtyBwdWJsaWMgUlBDc10KICAgIEcgLS0-IFRbVGVsZW1ldHJ5PGJyLz5TUUxpdGUgKyAvdjEvdGVsZW1ldHJ5XQogICAgQSAtLT58JCBVU0RDIHNldHRsZXwgQlsoQmFzZSBMMildCiAgICBHIC0uLT58dmVyaWZ5IHByb29mfCBGW0ZhY2lsaXRhdG9yXQ==)

![x402 payment sequence](https://mermaid.ink/svg/JSV7aW5pdDogeyd0aGVtZSc6ICdkYXJrJ319JSUKc2VxdWVuY2VEaWFncmFtCiAgICBwYXJ0aWNpcGFudCBBZ2VudCBhcyDwn6SWIEFnZW50CiAgICBwYXJ0aWNpcGFudCBBUEkgYXMgYWV0aGVyaXVzeEFQSQogICAgcGFydGljaXBhbnQgRmFjIGFzIEZhY2lsaXRhdG9yCiAgICBwYXJ0aWNpcGFudCBCYXNlIGFzIEJhc2UgTDIKICAgIEFnZW50LT4-QVBJOiBHRVQgL3YxL2VtYWlsL3ZhbGlkYXRlCiAgICBBUEktLT4-QWdlbnQ6IDQwMiArIHByaWNlICQwLjAwNSBVU0RDCiAgICBBZ2VudC0-PkFnZW50OiBzaWduIFVTREMgdHJhbnNmZXIKICAgIEFnZW50LT4-QVBJOiByZXRyeSArIFgtUEFZTUVOVCBwcm9vZgogICAgQVBJLT4-RmFjOiB2ZXJpZnkgcHJvb2YKICAgIEZhYy0tPj5BUEk6IHZhbGlkIOKGkiBzZXR0bGUgb24gQmFzZQogICAgQVBJLS0-PkFnZW50OiAyMDAgKyBkYXRh)

---

## ⚡ Built in 48 Hours — With <$99

| Fact | Proof |
|------|-------|
| Repo born | Sep 2, 2026 — `3a6aeb6` "Initial commit", LICENSE timestamp |
| 40 paid endpoints live | Sep 3, 2026 — every one settled real USDC on Base Sepolia |
| Commits | 87+ and counting (`git log` — velocity is public) |
| Total spend | <$99 — dialectic, exocortex, workflow. No salaries, no agency |
| Team | 1 human + AI builders |

If one person with <$99 builds this in 48 hours, imagine what funded builders ship on Base. That is the democratization thesis: lowering the cost of building until anyone can. Velocity isn't our bragging — it's our evidence.

---

## 🔥 The Problem

### Problem statement

Most APIs are designed for a human-led workflow: a developer creates an account, provisions credentials, accepts a subscription or credit limit, and reconciles usage through a separate billing system. That model works for teams, but adds coordination and trust boundaries when the client is an autonomous agent.

An agent needs to discover a service, authorize a bounded amount, call it, and receive a verifiable result without a human present for every transaction. API keys identify a client but do not provide per-request authorization; subscription billing separates consumption from settlement; and conventional payment rails are not optimized for low-value, high-frequency machine-to-machine calls.

### Thesis

If payment authorization and API access are expressed in the same HTTP interaction, an agent can consume external capabilities autonomously while the provider keeps a standard request/response interface. x402 provides that interaction: the provider returns `402 Payment Required` with machine-readable requirements, the client supplies a payment proof, and the request is verified and settled with USDC on Base.

### Engineering requirements

| Requirement | Design implication |
|-------------|-------------------|
| **Programmatic authorization** | Approve a specific request and amount without sharing a long-lived secret. |
| **Usage-based economics** | Keep price, request, response, and settlement correlated at the API boundary. |
| **Low-value viability** | Support micro-payments without monthly commitments. |
| **Provider compatibility** | Keep services as ordinary HTTP APIs protected by middleware. |
| **Operational verifiability** | Measure health, latency, payment events, and failures independently. |

**AetheriusX hypothesis:** a marketplace of capability APIs with x402-native settlement can reduce the operational friction of agent commerce while preserving familiar HTTP semantics. The hypothesis is testable through payment conversion, latency, repeat usage, request success rate, and settled volume.

---

## 🔭 The Vision

<img src="https://mermaid.ink/svg/JSV7aW5pdDogeyd0aGVtZSc6ICdkYXJrJ319JSUKZmxvd2NoYXJ0IFRCCiAgICBBR1vwn6SWIEFJIEFnZW50IC0gQnV5ZXJdIC0tPnx4NDAyIFVTREMgb24gQmFzZXwgQVBb8J-nqSBBUEkgUHJvdmlkZXIgLSBTZWxsZXJdCiAgICBBUCAtLT58ZGF0YSBhbmQgc2VydmljZXwgQUcKICAgIEFHIC0tPiBIVUJbQUVUSEVSSVVTIEh1YiAtIDExIEFQSXMsIGF1dG8tcGF5XQogICAgQVAgLS0-IEhVQgogICAgSFVCIC0tPiBJTkZbRmFzdEFQSSwgeDQwMiwgQmFzZSBMMiwgQ29pbmJhc2UgQ0RQXQ==" alt="Ecosystem" width="560">

**Mission:** Become the default API layer for autonomous agents — the Stripe of the agent economy.

**Strategy:**
1. **Live now:** 8 categories, 40 endpoints verified with real USDC on Base Sepolia
2. **Next:** mainnet (1 env var + funding) + 10-per-category depth
3. **Scale** to 120+ with grant funding, then 500+
4. **Become** the infrastructure that AI agents depend on

---

## 🧠 Mental Model: How x402 Changes Everything

### The Old World (API Key Era)

![Old world](https://mermaid.ink/svg/JSV7aW5pdDogeyd0aGVtZSc6ICdkYXJrJ319JSUKZmxvd2NoYXJ0IExSCiAgICBEW_CfkajigI3wn5K7IERldmVsb3Blcl0gLS0-IFNbU2lnbiB1cF0gLS0-IEtbQVBJIGtleV0gLS0-IEJb8J-SsyBDcmVkaXQgY2FyZCArIGJpbGxpbmddIC0tPiBIW_CfpJ4gSG9wZSBpdCB3b3Jrc10=)

### The New World (x402 Protocol)

![New world](https://mermaid.ink/svg/JSV7aW5pdDogeyd0aGVtZSc6ICdkYXJrJ319JSUKZmxvd2NoYXJ0IExSCiAgICBBW_CfpJYgQUkgQWdlbnRdIC0tPiBXW_CfkZsgV2FsbGV0XSAtLT4gUlvwn5OhIFJlcXVlc3RdIC0tPiBQW-KaoSBBdXRvLXBheSBVU0RDXSAtLT4gRFvwn5OmIERhdGFd)

### Key Concepts

| Concept | Definition | Why It Matters |
|---------|-----------|----------------|
| **x402** | HTTP 402 status code repurposed for crypto payments | Standardized machine-to-machine payment protocol |
| **USDC** | USD-pegged stablecoin on Base L2 | Stable value, sub-cent fees, instant settlement |
| **Base** | Ethereum L2 by Coinbase | Low gas fees, high throughput, Coinbase integration |
| **Facilitator** | Service that verifies payment proofs on-chain | Trustless verification without intermediaries |
| **Wallet-as-Identity** | Your Ethereum address = your account | No signup, no KYC, no email, no password |

---

## 🏗️ Architecture

![Architecture](https://mermaid.ink/svg/JSV7aW5pdDogeyd0aGVtZSc6ICdkYXJrJ319JSUKZmxvd2NoYXJ0IFRCCiAgICBQWVtQeXRob24gU0RLXSAtLT4gTlgKICAgIEpTW0pTIFNES10gLS0-IE5YCiAgICBHT1tHbyBTREtdIC0tPiBOWAogICAgUlNbUnVzdCBTREtdIC0tPiBOWAogICAgTlhbTmdpbnggLSByYXRlIGxpbWl0LCBTU0wsIHJvdXRpbmddIC0tPiBGV1tGYXN0QVBJIC0gYXV0aCwgeDQwMiwgcm91dGVyXQogICAgRlcgLS0-IFVQW1Vwc3RyZWFtIC0gT1NNLCBDb2luR2Vja28sIE9wZW4tTWV0ZW8sIFJQQ3NdCiAgICBGVyAtLT4gVEVMW1RlbGVtZXRyeSAtIFNRTGl0ZSwgL3YxL3RlbGVtZXRyeV0KICAgIE5YIC0tPiBGQUNbRmFjaWxpdGF0b3IgLSBDb2luYmFzZSBDRFBdCiAgICBGQUMgLS0-IEJBU0VbQmFzZSBMMiAtIFVTREMgc2V0dGxlbWVudF0=)

---

## 🚀 Quick Start

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

## 🐍 SDKs

### Python (`sdks/python/`)

```bash
pip install -e ./sdks/python
```

```python
from aetheriusx import AetheriusXClient

with AetheriusXClient() as client:  # default: http://127.0.0.1:4020
    print(client.health()["version"])
    route, price = client.discover_cheapest()  # cheapest paid endpoint
    res = client.paid_get(route, {"email": "user@example.com"}, payment="anything")
    print(res.status_code, res.json())
```

`payment` is caller-supplied: any string works in local simulated mode,
live testnet needs a real x402 USDC proof. The client never touches private keys.
Runnable flows: [`examples/`](examples/) · JS SDK in roadmap.

---

## 📡 Live Status

| Signal | Value |
|--------|-------|
| Network | Base Sepolia `eip155:84532` (mainnet after funding) |
| Mode | `real` — on-chain USDC verification via facilitator |
| Health | `GET /health` (free) |
| Telemetry | `GET /v1/telemetry` (free): uptime, per-endpoint stats, settled USDC volume |
| Dashboard | [`/dashboard/`](https://wilnowilx.github.io/aetheriusxapi/dashboard/) + backend bar |
| Live API | `http://34.156.149.38/aetherapi` · TLS `https://34-156-149-38.sslip.io/aetherapi` |
| Version | v2.0.0 · 11 endpoints · 29/29 tests green |

Snapshot 2026-09-03: E2E 6/6 paid endpoints → 200 with real settlement.

---

## 🎬 Live Demo

Unedited terminal replay: agent discovers the catalog → hits `402` → pays real
USDC → gets `200` + data → telemetry moves. Recorded against Base Sepolia.

**[▶ Watch the 19-second demo](https://wilnowilx.github.io/aetheriusxapi/docs/demo/player.html)**
· [raw .cast](https://wilnowilx.github.io/aetheriusxapi/docs/demo/take-1.cast)
· [script](docs/demo/demo_90s.py)

> Reproduce it: set `DEMO_STEP=1`, run the script with a testnet key, press
> ENTER per scene. Same code path as `sdks/python` — what you see is what
> a client gets.

---

## 🎛️ Dashboard

Interactive control room (no build step, vanilla JS) served by the backend itself:

```bash
uvicorn main:app --reload --port 4020
# open http://127.0.0.1:4020/dashboard/
```

- **API Catalog** — all 11 endpoints with live prices from `/health`
- **Explorer** — param forms, one-click paid calls, `Show 402` renders the payment challenge
- **Live Metrics** — REAL server telemetry (`/v1/telemetry`): uptime, totals, settled USDC volume, wallets seen, latency bars, event feed. Zero simulated numbers.
- **Wallet** — memory-only demo connect (real x402 signing in production client)
- **Storage Drift** — probes `/v1/storage/drift`, shows planned payload until Phase 2
- **Activity** — client-side call log

Live (testnet): `http://34.156.149.38/aetherapi/dashboard/`

---

## ⚡ Endpoints

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

> **Note:** These are the initial 11 endpoints. With Base Builder Grant funding, we'll expand to **120+ endpoints across 12 categories.**

---

## 🗂️ Categories

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

## 🚦 Rate Limits

| Tier | Requests/min | Requests/day | Burst | Price |
|------|-------------|-------------|-------|-------|
| **Free** | 10 | 100 | 20 | $0 |
| **Pro** | 100 | 10,000 | 200 | Per-request |
| **Enterprise** | 1,000 | Unlimited | Custom | Custom |

> Free tier: First 100 requests per day. No credit card required.

---

## 🧱 Tech Stack

<img src="https://mermaid.ink/svg/JSV7aW5pdDogeyd0aGVtZSc6ICdkYXJrJ319JSUKZmxvd2NoYXJ0IExSCiAgICBBUFBb8J-nsSBGYXN0QVBJPGJyLz5QeXRob24gwrcgUHlkYW50aWNdIC0tPiBQUk9b8J-UjCB4NDAyPGJyLz5IVFRQIDQwMiDCtyBVU0RDIMK3IEJhc2VdCiAgICBQUk8gLS0-IElORlvimIHvuI8gTmdpbng8YnIvPlN5c3RlbWQgwrcgR0NQXQogICAgSU5GIC0tPiBQQVlb8J-StSBDb2luYmFzZSBDRFA8YnIvPlVTREMgwrcgTDJd" alt="Tech stack" width="700">

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

## 🛣️ Roadmap

### Phase 1: Foundation (Current)
- [x] Core API server with x402 middleware (simulated + real modes)
- [x] 40 endpoints, 40 verified live with real USDC payments (no mocked data)
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

## 💰 Grant Application

We are applying for the **Base Builder Grants** program:

- **Amount:** $5,000 seed + GTM support
- **Use of funds:** Mainnet deployment, expand to 120+ endpoints, SDK development
- **Timeline:** 4 weeks post-funding
- **Metrics:** First 100 paying API consumers within 90 days

[Application text](application.md) · [Base Builder Grants](https://www.base.org/ecosystem-fund/apply)

---

## 🤝 Contributing

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

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🔗 Links

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

**Built for AETHERIUS** 💜

</div>
