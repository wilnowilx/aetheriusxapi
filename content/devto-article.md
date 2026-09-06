---
title: "I Built an API Marketplace Where AI Agents Pay Per Request in USDC — 80 Endpoints in 4 Days, Solo, With $5.80"
published: false
description: "AETHERIUS is an open-source API marketplace where AI agents pay per request in USDC on Base. No accounts. No API keys. No subscriptions. Just wallets and code."
tags: apis, crypto, ai,opensource
canonical_url: https://aetheriusxapi.com
---

# I Built an API Marketplace Where AI Agents Pay Per Request in USDC — 80 Endpoints in 4 Days, Solo, With $5.80

**TL;DR:** I built [AETHERIUS](https://github.com/wilnowilx/aetheriusxapi) — an open-source API marketplace where AI agents pay per request in USDC on Base Mainnet. No accounts. No API keys. No subscriptions. 80 live endpoints. Python + JavaScript SDKs. All verifiable on-chain. Built solo in 4 days with $5.80 in ETH.

---

## The Problem Nobody Talks About

Every API on the internet is designed for humans.

You sign up. You get an API key. You manage a subscription. You hit rate limits. You contact support. You cancel when you don't need it anymore.

That works fine for humans. But what about AI agents?

An autonomous agent doesn't have an email address. It can't fill out a signup form. It can't manage a subscription. It can't call customer support.

What an agent *can* do is send crypto.

**That's the insight behind AETHERIUS:** If payment and API access happen in the same HTTP interaction, an agent can consume data autonomously without human intervention.

## What I Built

[AETHERIUS](https://github.com/wilnowilx/aetheriusxapi) is an API marketplace powered by the [x402 protocol](https://x402.org) — an HTTP 402 status code repurposed for crypto payments.

Here's how it works:

```
1. Agent sends: GET /v1/data/weather?lat=10.5&lon=-66.9
2. Server responds: 402 Payment Required → "Pay $0.008 USDC"
3. Agent signs USDC transfer on Base
4. Server verifies on-chain via Coinbase CDP
5. Server responds: 200 OK → weather data
```

**Total time: ~200ms.** No accounts. No subscriptions. No humans.

### The Numbers

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

### The 11 Categories

- **Maps & Geocoding** (5) — OpenStreetMap search, nearby places, reverse geocode
- **Token & Crypto** (13) — Price feeds, token analysis, gas oracle, NFT metadata
- **Web** (7) — Scraper, screenshots, DNS, WHOIS, SSL, IP geolocation
- **Data** (12) — Weather, forecasts, air quality, translations, summarizer
- **Email** (1) — Validation with disposable detection
- **DeFi** (10) — Yields, TVL, stablecoins, DEX volumes, impermanent loss
- **Forex** (3) — Live rates, historical data, currency conversion
- **News** (6) — Hacker News, Reddit, Dev.to
- **Storage** (1) — Cross-RPC slot drift
- **Crypto** (5) — Market data, Fear & Greed, trending, OHLCV, dominance
- **x402 Intelligence** (20) — USDC transfers, whales, gas, DeFi, risk scores (ALL FREE)

## The 20 FREE Endpoints Nobody Else Has

This is the part I'm most proud of. Nobody else is doing on-chain analytics for the agent economy.

The **x402 Intelligence** endpoints read USDC transfers directly from Base Mainnet:

```bash
# Chain health
curl http://34.156.149.38/aetherapi/v1/x402/base-stats

# Whale alerts (>$10K transfers)
curl http://34.156.149.38/aetherapi/v1/x402/whales

# Wallet risk score (0-100)
curl http://34.156.149.38/aetherapi/v1/x402/risk/0x677B483128D0399bCD0A5AB36eE990C0246d7f61

# Top USDC spenders
curl http://34.156.149.38/aetherapi/v1/x402/top-agents

# DeFi protocol activity
curl http://34.156.149.38/aetherapi/v1/x402/defi-pulse
```

100% free. No API key needed. Try it right now.

## The Python SDK

I built a Python SDK with typed sub-clients for all 80 endpoints:

```python
from aetheriusx import AetheriusXClient

# Connects to mainnet by default
client = AetheriusXClient()

# FREE x402 Intelligence — no payment needed
stats = client.x402.base_stats()
whales = client.x402.whales()
risk = client.x402.risk("0x677B...")

# Paid endpoints — auto-handles 402 challenge
weather = client.data.weather(lat=10.5, lon=-66.9)
price = client.token.price(token="bitcoin")
email_ok = client.email.validate(email="user@example.com")

# Catalog browsing
print(client.catalog.summary())  # Full catalog with all 80 endpoints
```

The SDK is open source: [github.com/wilnowilx/aetheriusxapi/tree/main/sdks/python](https://github.com/wilnowilx/aetheriusxapi/tree/main/sdks/python)

## Why x402?

The x402 protocol is based on HTTP status code 402 ("Payment Required"). Instead of returning an HTML page asking for credit card details, the server returns a machine-readable JSON response:

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

The agent reads this, signs a USDC transfer on Base, and retries with the payment proof. The server verifies on-chain and returns the data.

**Why USDC on Base?**
- Sub-cent transaction fees
- Instant settlement
- Coinbase backing (CDP integration)
- Ethereum security
- Growing ecosystem

## The Tech Stack

| Component | Technology |
|-----------|-----------|
| Server | FastAPI (Python) |
| Protocol | x402 (HTTP 402 + crypto) |
| Payments | USDC on Base L2 |
| Verification | Coinbase CDP |
| Hosting | GCP Compute Engine |
| Process | Systemd + Nginx |
| Dashboard | Vanilla JS (zero build) |
| SDKs | Python + JavaScript |

## What I Learned

### 1. Solo builders can move 10x faster than teams

No meetings. No approvals. No debates about architecture. Just build, ship, iterate.

### 2. Open source is the best distribution

Every line of code is public. Every transaction is verifiable on-chain. This creates trust that no marketing budget can buy.

### 3. The agent economy is real

AI agents are already consuming APIs. They just need a payment method that works without human intervention. x402 provides that.

### 4. $5.80 is enough to start

I didn't raise money. I didn't apply to accelerators (yet). I just built something useful and shipped it.

## What's Next

- **Expand to 120+ endpoints** with grant funding
- **SDK releases** for Go and Rust
- **Third-party API provider onboarding**
- **Multi-chain support** (Ethereum, Polygon, Arbitrum)
- **500M+ Spanish-speaking developers** included via bilingual docs

## Try It Now

```bash
# Free endpoints — no API key needed
curl http://34.156.149.38/aetherapi/v1/x402/base-stats
curl http://34.156.149.38/aetherapi/v1/x402/gas
curl http://34.156.149.38/aetherapi/v1/x402/whales
```

**GitHub:** [github.com/wilnowilx/aetheriusxapi](https://github.com/wilnowilx/aetheriusxapi)
**Dashboard:** [wilnowilx.github.io/aetheriusxapi/dashboard/](https://wilnowilx.github.io/aetheriusxapi/dashboard/)
**Twitter:** [@aetheriusxAPI](https://x.com/aetheriusxAPI)
**Telegram:** [@aetherius_xAPI](https://t.me/aetherius_xAPI)

---

*Built by a solo developer from Venezuela. No bank account. No PayPal. No LinkedIn. Only a crypto wallet. The limit is not money. The limit is imagination.*

*If this resonates, star the repo and share with someone building in the agent economy.* ⭐
