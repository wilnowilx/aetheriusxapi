---
title: "I Built an API Marketplace Where AI Agents Pay Per Request in USDC — Canary Live, MCP Discovery, 100 Endpoints in 8 Days, Solo"
published: false
description: "AETHERIUS is live on Base Mainnet with real USDC payments. 100 endpoints. MCP discovery for AI agents. Canary settling $0.001 USDC via Coinbase CDP. Built solo in 8 days."
tags: apis, crypto, ai, opensource
series: "Building the Agent Economy"
canonical_url: https://dev.to/wilnowilx/i-built-an-api-marketplace-where-ai-agents-pay-per-request-in-usdc-canary-live-mcp-discovery-100-endpoints-in-8-days-solo
---

# I Built an API Marketplace Where AI Agents Pay Per Request in USDC — Canary Live, MCP Discovery, 100 Endpoints in 8 Days, Solo

**TL;DR:** [AETHERIUS](https://github.com/wilnowilx/aetheriusxapi) is an open-source API marketplace where AI agents pay per request in USDC on Base Mainnet. No accounts. No API keys. No subscriptions. **100 live endpoints. Canary LIVE. MCP discovery deployed.** Python + JavaScript SDKs. All verifiable on-chain. Built solo in 8 days with $5.80 in ETH.

**🚀 Try it now:**
```bash
curl https://34-156-149-38.sslip.io/aetherapi/v1/x402/base-stats
```

---

## What Changed Since Last Time

Six days ago I wrote about building 80 endpoints in 4 days. Here's what happened since:

| What | Sep 6 (Last Article) | Sep 10 (Now) |
|------|---------------------|---------------|
| Endpoints | 80 (60 paid + 20 free) | **100** (60 paid + 40 free) |
| Payment mode | Simulated | **Canary LIVE** (real $0.001 USDC via CDP) |
| MCP | Not deployed | **10 tools over HTTPS SSE** |
| Discovery | Manual | **Bazaar manifest** (`/mcp/discovery`) |
| Governance | None | **SECURITY + CODEOWNERS + TERMS + CITATION** |
| Wiki | Empty | **9 institutional pages** |
| Build time | 4 days | **8 days** |
| Total commits | 150+ | **215+** |

**The big one:** The canary route (`/v1/data/uuid`) is settling real USDC on Base Mainnet via Coinbase CDP facilitator. Not simulated. Not testnet. Real money, real settlement, real data.

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
| Total endpoints | **100** |
| Paid endpoints | 60 ($0.001–$0.03/call) |
| FREE endpoints | 40 (20 x402 Intelligence + 20 QuantumXBrain) |
| Payment currency | USDC on Base Mainnet |
| **Canary status** | **LIVE** — `/v1/data/uuid` settling real $0.001 USDC |
| **MCP tools** | **10 over HTTPS SSE** |
| Build time | 8 days |
| Total capital | $5.80 ETH |
| Team size | 1 (me) |
| Tests | 39 passing |
| SDKs | Python v2.0 + JavaScript |
| Grant applications | Base Batches 004 ($100K) + Creator Grant ($4K) |

---

## How It Works

```plaintext
1. Agent: GET /v1/data/weather?lat=10.5&lon=-66.9
2. Server: 402 Payment Required → "Pay $0.008 USDC on Base"
3. Agent: Signs USDC transfer (on-chain)
4. Server: Verifies via Coinbase CDP
5. Server: 200 OK → weather data
```

**That's it.** The agent discovered the API, paid for it, and received data — all without a human writing an email, signing up for an account, or managing a subscription.

---

## The Canary: Real USDC on Base Mainnet

This is the part I'm most proud of. On Sep 10, 2026, I flipped the canary from simulated to real mode.

**What happened:**
1. CDP facilitator verified the payment signature
2. $0.001 USDC settled on Base Mainnet
3. Volume ticked from 0.620 → 0.621 USDC
4. The data was returned

```bash
# The canary route — real settlement
curl "https://34-156-149-38.sslip.io/aetherapi/v1/data/uuid"
```

**If it breaks:** Non-canary routes stay simulated (fail-open). Zero unguarded routes. The canary can be flipped back to simulated in one line of code.

---

## MCP Discovery: AI Agents Can Find Us

I deployed an MCP (Model Context Protocol) server with SSE transport over HTTPS. AI agents can now discover and use AETHERIUS tools directly.

```bash
# See all available tools
curl "https://34-156-149-38.sslip.io/aetherapi/mcp/discovery"

# Connect via SSE
curl "https://34-156-149-38.sslip.io/aetherapi/mcp/sse"

# Health check
curl "https://34-156-149-38.sslip.io/aetherapi/mcp/health"
```

**10 free x402 tools** available via MCP:
- `aetherius_network` — Full Base network health
- `aetherius_stablecoins` — USDC/USDT/DAI flows
- `aetherius_gas` — Gas price analysis
- `aetherius_whales` — Large USDC transfers
- `aetherius_sentiment` — Fear & Greed + BTC trend
- `aetherius_market_pulse` — Real-time market conditions
- `aetherius_base_stats` — Chain health snapshot
- `aetherius_telemetry` — Live service telemetry
- `aetherius_analytics` — Volume and trends
- `aetherius_health` — API health

**Why this matters:** A Claude, Cursor, or LangChain agent can now discover AETHERIUS tools without me having to manually configure anything. The Bazaar manifest (`/mcp/discovery`) is the entry point.

---

## The 11 API Categories

### Maps & Geocoding (5 endpoints)
Business search, nearby places, reverse geocode — all via OpenStreetMap.

```bash
curl "https://34-156-149-38.sslip.io/aetherapi/v1/maps/search?q=coffee+shop+CDMX&limit=5" \
  -H "X-PAYMENT: anything"
```

### Token & Crypto (13 endpoints)
Real-time prices, token analysis, gas oracle, NFT metadata, wallet balances.

```bash
curl "https://34-156-149-38.sslip.io/aetherapi/v1/token/price?token=bitcoin" \
  -H "X-PAYMENT: anything"
```

### Web (7 endpoints)
Scraper, screenshots, DNS, WHOIS, SSL checks, IP geolocation.

```bash
curl "https://34-156-149-38.sslip.io/aetherapi/v1/web/ssl?domain=github.com" \
  -H "X-PAYMENT: anything"
```

### Data (12 endpoints)
Weather, forecasts, air quality, translations, text summarizer, QR codes.

```bash
curl "https://34-156-149-38.sslip.io/aetherapi/v1/data/weather?lat=40.71&lon=-74.01" \
  -H "X-PAYMENT: anything"
```

### DeFi (10 endpoints)
Yield pools, TVL, stablecoin data, DEX volumes, impermanent loss calculator.

```bash
curl "https://34-156-149-38.sslip.io/aetherapi/v1/defi/yields" \
  -H "X-PAYMENT: anything"
```

### Plus: Email, Forex, News, Crypto, Storage
11 categories. 100 endpoints. All live on Base Mainnet.

---

## The 40 FREE Endpoints Nobody Else Has

This is the part I'm most proud of. **Nobody else is providing on-chain analytics for the agent economy.**

The **x402 Intelligence** + **QuantumXBrain** endpoints read USDC transfers directly from Base Mainnet + CoinGecko + DefiLlama. No API key needed. No payment required. Try them right now:

### Core Intelligence

```bash
# Recent USDC transfers
curl "https://34-156-149-38.sslip.io/aetherapi/v1/x402/payments/recent"

# Top USDC spenders leaderboard
curl "https://34-156-149-38.sslip.io/aetherapi/v1/x402/top-agents"

# Network health & trends
curl "https://34-156-149-38.sslip.io/aetherapi/v1/x402/analytics"
```

### Chain & Gas

```bash
# Chain health snapshot (block, gas, chain ID)
curl "https://34-156-149-38.sslip.io/aetherapi/v1/x402/base-stats"

# Gas price analysis
curl "https://34-156-149-38.sslip.io/aetherapi/v1/x402/gas"
```

### Activity Tracking

```bash
# Whale alerts (>$10K transfers)
curl "https://34-156-149-38.sslip.io/aetherapi/v1/x402/whales"

# Hourly volume breakdown
curl "https://34-156-149-38.sslip.io/aetherapi/v1/x402/hourly"

# USDC mint/burn activity
curl "https://34-156-149-38.sslip.io/aetherapi/v1/x402/mint-burn"
```

### Wallet Intelligence

```bash
# Wallet risk score (0-100)
curl "https://34-156-149-38.sslip.io/aetherapi/v1/x402/risk/0x677B483128D0399bCD0A5AB36eE990C0246d7f61"

# Compare two wallets
curl "https://34-156-149-38.sslip.io/aetherapi/v1/x402/compare?a=0x677B...&b=0xAc7d..."
```

### Market Intelligence

```bash
# Top USDC-receiving contracts
curl "https://34-156-149-38.sslip.io/aetherapi/v1/x402/contracts"

# DeFi protocol activity
curl "https://34-156-149-38.sslip.io/aetherapi/v1/x402/defi-pulse"
```

**100% free.** No signup. No API key. Just call.

---

## The Python SDK (v2.0)

I built a Python SDK with typed sub-clients for all 100 endpoints:

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
print(client.catalog.summary())  # Full 100-endpoint catalog
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
| Landing | React 19 + Three Fiber + GSAP | 3D globe, 20 sections |
| MCP | SSE over HTTPS | Agent discovery |
| SDKs | Python + JavaScript | Agent integration |

---

## What I Learned as a Solo Builder

### 1. Canary beats "it works on my machine"
Simulated mode proves the flow. Canary proves the economics. The moment I flipped from simulated to real, everything changed. The data I got back was worth more than any test.

### 2. MCP is the missing piece
AI agents can't use APIs they can't find. MCP discovery (`/mcp/discovery`) makes AETHERIUS self-describing. Claude, Cursor, or any MCP-compatible client can discover and use the tools without manual configuration.

### 3. Open source is the best distribution
Every line of code is public. Every transaction is verifiable on-chain. This creates trust no marketing budget can buy.

### 4. The agent economy is real
AI agents are already consuming APIs. They just need a payment method that works without human intervention.

### 5. $5.80 is enough to start
No VC. No grants (yet). Just build something useful and ship it.

### 6. Distribution > Building
I spent 8 days building 100 endpoints. I should have spent 4 days building and 4 days distributing. **The hardest part isn't building — it's getting people to use what you built.**

---

## Try It Right Now

```bash
# Free endpoints — no API key needed
curl "https://34-156-149-38.sslip.io/aetherapi/v1/x402/base-stats"
curl "https://34-156-149-38.sslip.io/aetherapi/v1/x402/gas"
curl "https://34-156-149-38.sslip.io/aetherapi/v1/x402/whales"
curl "https://34-156-149-38.sslip.io/aetherapi/v1/x402/top-agents"
```

**MCP Discovery:**
```bash
curl "https://34-156-149-38.sslip.io/aetherapi/mcp/discovery"
```

**Interactive playground:** [wilnowilx.github.io/aetheriusxapi/](https://wilnowilx.github.io/aetheriusxapi/)

**Dashboard:** [wilnowilx.github.io/aetheriusxapi/dashboard/](https://wilnowilx.github.io/aetheriusxapi/dashboard/)

---

## What's Next

- **Expand to 120+ endpoints** with grant funding
- **MCP tools expansion** — more free tools for agent discovery
- **SDK releases** for Go and Rust
- **Third-party API provider onboarding**
- **500M+ Spanish-speaking developers** included via bilingual docs

---

## Links

| Resource | URL |
|----------|-----|
| GitHub | [github.com/wilnowilx/aetheriusxapi](https://github.com/wilnowilx/aetheriusxapi) |
| Live API | [34-156-149-38.sslip.io/aetherapi](https://34-156-149-38.sslip.io/aetherapi) |
| MCP Discovery | [34-156-149-38.sslip.io/aetherapi/mcp/discovery](https://34-156-149-38.sslip.io/aetherapi/mcp/discovery) |
| Dashboard | [wilnowilx.github.io/aetheriusxapi/dashboard/](https://wilnowilx.github.io/aetheriusxapi/dashboard/) |
| Twitter | [@aetheriusxAPI](https://x.com/aetheriusxAPI) |
| Telegram | [@aetherius_xAPI](https://t.me/aetherius_xAPI) |
| YouTube | [Demo video](https://youtu.be/TDzMALSe00A) |

---

*Built by a solo developer from Venezuela 🇻🇪. No bank account. No PayPal. No LinkedIn. Only a crypto wallet. The limit is not money. The limit is imagination.*

**If this resonates:**
- ⭐ [Star the repo](https://github.com/wilnowilx/aetheriusxapi)
- 🔗 [Share with someone building in the agent economy](https://x.com/intent/tweet?text=I%20just%20tried%20AETHERIUS%20%E2%80%94%20100%20APIs%20where%20AI%20agents%20pay%20per%20request%20in%20USDC%20on%20Base.%20No%20accounts.%20No%20API%20keys.%20Open%20source.%20%40aetheriusxAPI%20%23x402%20%23Base)
- 💬 [Join the Telegram](https://t.me/aetherius_xAPI)
