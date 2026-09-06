---
title: "I Built an API Marketplace Where AI Agents Pay Per Request in USDC — 80 Endpoints in 4 Days, Solo, With $5.80"
published: false
description: "AETHERIUS is an open-source API marketplace where AI agents pay per request in USDC on Base. No accounts. No API keys. No subscriptions. Just wallets and code."
tags: apis, crypto, ai,opensource
series: "Building the Agent Economy"
---

# I Built an API Marketplace Where AI Agents Pay Per Request in USDC — 80 Endpoints in 4 Days, Solo, With $5.80

> **80 live APIs** · **Base Mainnet** · **Real USDC** · **Open Source MIT** · **Solo builder**

**TL;DR:** I built [AETHERIUS](https://github.com/wilnowilx/aetheriusxapi) — an open-source API marketplace where AI agents pay per request in USDC on Base Mainnet. No accounts. No API keys. No subscriptions. 80 live endpoints. Python + JavaScript SDKs. All verifiable on-chain. Built solo in 4 days with $5.80 in ETH.

**🚀 Try it now:** `curl http://34.156.149.38/aetherapi/v1/x402/base-stats`

---

## Why This Matters (30-second version)

Every API on the internet requires a human to sign up. But in 2026, **AI agents are the primary consumers of APIs**. They don't have email addresses. They can't fill out forms. They can't manage subscriptions.

But they *can* send crypto.

**AETHERIUS solves this:** An agent hits an API, gets a `402 Payment Required` response with a USDC amount, pays on-chain, and receives data. Total time: ~200ms. No humans involved.

**This is not a demo. This is live on Base Mainnet with real USDC payments flowing right now.**

---

## The Numbers

| Metric | Value |
|--------|-------|
| Total endpoints | **80** |
| Paid endpoints | 60 ($0.001–$0.03/call) |
| FREE endpoints | 20 (x402 Intelligence — on-chain analytics) |
| Payment currency | USDC on Base Mainnet |
| Build time | 4 days |
| Total capital | $5.80 ETH |
| Team size | 1 (me) |
| Tests | 60/60 passing |
| SDKs | Python v2.0 + JavaScript |
| Grant applications | Base Batches 004 ($100K) + Creator Grant ($4K) |

---

## How It Works

```
1. Agent: GET /v1/data/weather?lat=10.5&lon=-66.9
2. Server: 402 Payment Required → "Pay $0.008 USDC on Base"
3. Agent: Signs USDC transfer (on-chain)
4. Server: Verifies via Coinbase CDP
5. Server: 200 OK → weather data
```

**That's it.** The agent discovered the API, paid for it, and received data — all without a human writing an email, signing up for an account, or managing a subscription.

---

## The 11 API Categories

### Maps & Geocoding (5 endpoints)
Business search, nearby places, reverse geocode — all via OpenStreetMap.

```bash
curl "http://34.156.149.38/aetherapi/v1/maps/search?q=coffee+shop+CDMX&limit=5" \
  -H "X-PAYMENT: anything"
```

### Token & Crypto (13 endpoints)
Real-time prices, token analysis, gas oracle, NFT metadata, wallet balances.

```bash
curl "http://34.156.149.38/aetherapi/v1/token/price?token=bitcoin" \
  -H "X-PAYMENT: anything"
```

### Web (7 endpoints)
Scraper, screenshots, DNS, WHOIS, SSL checks, IP geolocation.

```bash
curl "http://34.156.149.38/aetherapi/v1/web/ssl?domain=github.com" \
  -H "X-PAYMENT: anything"
```

### Data (12 endpoints)
Weather, forecasts, air quality, translations, text summarizer, QR codes.

```bash
curl "http://34.156.149.38/aetherapi/v1/data/weather?lat=40.71&lon=-74.01" \
  -H "X-PAYMENT: anything"
```

### DeFi (10 endpoints)
Yield pools, TVL, stablecoin data, DEX volumes, impermanent loss calculator.

```bash
curl "http://34.156.149.38/aetherapi/v1/defi/yields" \
  -H "X-PAYMENT: anything"
```

### Plus: Email, Forex, News, Crypto, Storage
11 categories. 80 endpoints. All live on Base Mainnet.

---

## The 20 FREE Endpoints Nobody Else Has

This is the part I'm most proud of. **Nobody else is providing on-chain analytics for the agent economy.**

The **x402 Intelligence** endpoints read USDC transfers directly from Base Mainnet. No API key needed. No payment required. Try them right now:

### Core Intelligence

```bash
# Recent USDC transfers
curl "http://34.156.149.38/aetherapi/v1/x402/payments/recent"

# Top USDC spenders leaderboard
curl "http://34.156.149.38/aetherapi/v1/x402/top-agents"

# Network health & trends
curl "http://34.156.149.38/aetherapi/v1/x402/analytics"
```

### Chain & Gas

```bash
# Chain health snapshot (block, gas, chain ID)
curl "http://34.156.149.38/aetherapi/v1/x402/base-stats"

# Gas price analysis
curl "http://34.156.149.38/aetherapi/v1/x402/gas"
```

### Activity Tracking

```bash
# Whale alerts (>$10K transfers)
curl "http://34.156.149.38/aetherapi/v1/x402/whales"

# Hourly volume breakdown
curl "http://34.156.149.38/aetherapi/v1/x402/hourly"

# USDC mint/burn activity
curl "http://34.156.149.38/aetherapi/v1/x402/mint-burn"
```

### Wallet Intelligence

```bash
# Wallet risk score (0-100)
curl "http://34.156.149.38/aetherapi/v1/x402/risk/0x677B483128D0399bCD0A5AB36eE990C0246d7f61"

# Compare two wallets
curl "http://34.156.149.38/aetherapi/v1/x402/compare?a=0x677B...&b=0xAc7d..."
```

### Market Intelligence

```bash
# Top USDC-receiving contracts
curl "http://34.156.149.38/aetherapi/v1/x402/contracts"

# DeFi protocol activity
curl "http://34.156.149.38/aetherapi/v1/x402/defi-pulse"
```

**100% free.** No signup. No API key. Just call.

---

## The Python SDK (v2.0)

I built a Python SDK with typed sub-clients for all 80 endpoints:

```python
from aetheriusx import AetheriusXClient

# Connects to mainnet by default
client = AetheriusXClient()

# ── FREE x402 Intelligence (no payment needed) ──
stats = client.x402.base_stats()
gas = client.x402.gas()
whales = client.x402.whales()
top = client.x402.top_agents()
risk = client.x402.risk("0x677B...")
history = client.x402.history("0x...")

# ── Paid endpoints (auto-handles 402 challenge) ──
weather = client.data.weather(lat=10.5, lon=-66.9)
price = client.token.price(token="bitcoin")
email_ok = client.email.validate(email="user@example.com")

# ── Catalog browsing ──
print(client.catalog.summary())  # Full 80-endpoint catalog
cheapest = client.discover_cheapest()
free_routes = client.discover_free()
```

**Install:** `pip install -e ./sdks/python`

---

## Why x402?

The x402 protocol repurposes HTTP status code 402 ("Payment Required") for crypto payments.

| Old World (API Keys) | New World (x402) |
|---------------------|-------------------|
| Human signs up | Agent pays per request |
| Gets API key | Gets payment challenge |
| Manages subscription | One-time USDC transfer |
| Hits rate limits | No limits |
| Contacts support | Server auto-verifies |

**The x402 response looks like this:**

```json
{
  "error": "Payment required",
  "amount": "0.008",
  "currency": "USDC",
  "network": "eip155:8453",
  "pay_to": "0x677B483128D0399bCD0A5AB36eE990C0246d7f61",
  "route": "/v1/data/weather",
  "hint": "Retry with header 'X-PAYMENT: <payment-proof>'."
}
```

The agent reads this, signs a USDC transfer on Base, and retries with the payment proof. The server verifies on-chain via [Coinbase CDP](https://docs.cdp.coinbase.com/) and returns the data.

**Why USDC on Base?**
- Sub-cent transaction fees
- Instant settlement
- Coinbase backing
- Ethereum security
- Growing ecosystem

---

## The Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Server | FastAPI (Python) | High-performance async API |
| Protocol | x402 | HTTP 402 + crypto payments |
| Payments | USDC on Base | Stablecoin on L2 |
| Verification | Coinbase CDP | On-chain verification |
| Hosting | GCP Compute Engine | Global edge |
| Process | Systemd + Nginx | Service management |
| Dashboard | Vanilla JS | Zero-build control room |
| SDKs | Python + JavaScript | Agent integration |

---

## What I Learned as a Solo Builder

### 1. Solo builders can move 10x faster than teams

No meetings. No approvals. No architecture debates. Just build, ship, iterate.

### 2. Open source is the best distribution

Every line of code is public. Every transaction is verifiable on-chain. This creates trust no marketing budget can buy.

### 3. The agent economy is real

AI agents are already consuming APIs. They just need a payment method that works without human intervention.

### 4. $5.80 is enough to start

No VC. No grants (yet). Just build something useful and ship it.

### 5. Distribution > Building

I spent 4 days building 80 endpoints. I should have spent 2 days building and 2 days distributing. **The hardest part isn't building — it's getting people to use what you built.**

---

## Try It Right Now

```bash
# Free endpoints — no API key needed
curl "http://34.156.149.38/aetherapi/v1/x402/base-stats"
curl "http://34.156.149.38/aetherapi/v1/x402/gas"
curl "http://34.156.149.38/aetherapi/v1/x402/whales"
curl "http://34.156.149.38/aetherapi/v1/x402/top-agents"
```

**Interactive playground:** [wilnowilx.github.io/aetheriusxapi/](https://wilnowilx.github.io/aetheriusxapi/)

**Dashboard:** [wilnowilx.github.io/aetheriusxapi/dashboard/](https://wilnowilx.github.io/aetheriusxapi/dashboard/)

---

## What's Next

- **Expand to 120+ endpoints** with grant funding
- **SDK releases** for Go and Rust
- **Third-party API provider onboarding**
- **Multi-chain support** (Ethereum, Polygon, Arbitrum)
- **500M+ Spanish-speaking developers** included via bilingual docs

---

## Links

| Resource | URL |
|----------|-----|
| GitHub | [github.com/wilnowilx/aetheriusxapi](https://github.com/wilnowilx/aetheriusxapi) |
| Live API | [34.156.149.38/aetherapi](http://34.156.149.38/aetherapi) |
| Dashboard | [wilnowilx.github.io/aetheriusxapi/dashboard/](https://wilnowilx.github.io/aetheriusxapi/dashboard/) |
| Twitter | [@aetheriusxAPI](https://x.com/aetheriusxAPI) |
| Telegram | [@aetherius_xAPI](https://t.me/aetherius_xAPI) |
| YouTube | [Demo video](https://youtu.be/TDzMALSe00A) |

---

*Built by a solo developer from Venezuela 🇻🇪. No bank account. No PayPal. No LinkedIn. Only a crypto wallet. The limit is not money. The limit is imagination.*

**If this resonates:**
- ⭐ [Star the repo](https://github.com/wilnowilx/aetheriusxapi)
- 🔗 [Share with someone building in the agent economy](https://x.com/intent/tweet?text=I%20just%20tried%20AETHERIUS%20%E2%80%94%2080%20APIs%20where%20AI%20agents%20pay%20per%20request%20in%20USDC%20on%20Base.%20No%20accounts.%20No%20API%20keys.%20Open%20source.%20%40aetheriusxAPI%20%23x402%20%23Base)
- 💬 [Join the Telegram](https://t.me/aetherius_xAPI)
