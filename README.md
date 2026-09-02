# aetheriusxAPI

<div align="center">

![AETHERIUS](https://img.shields.io/badge/AETHERIUS-aetheriusxAPI-8B5CF6?style=for-the-badge&labelColor=09090b)
![Base](https://img.shields.io/badge/Base-Mainnet-0052FF?style=for-the-badge&labelColor=09090b)
![x402](https://img.shields.io/badge/x402-Protocol-10B981?style=for-the-badge&labelColor=09090b)
![USDC](https://img.shields.io/badge/USDC-Payments-2775CA?style=for-the-badge&labelColor=09090b)

**The API Marketplace for AI Agents**

Crypto-native APIs where AI agents pay per request in USDC.
Built on x402 protocol. No subscriptions, no KYC, no friction.

[Documentation](https://wilnowilx.github.io/aetheriusx-api-site/) · [Twitter](https://x.com/aetheriusxAPI) · [API Reference](#endpoints)

</div>

---

## Why aetheriusxAPI?

Traditional APIs require credit cards, subscriptions, and human intervention. **aetheriusxAPI** is built for the agent economy — AI agents pay per request directly from their wallets.

| Traditional APIs | aetheriusxAPI |
|-----------------|---------------|
| Credit card required | Crypto wallet only |
| Monthly subscriptions | Pay per request |
| API key management | Wallet = identity |
| KYC required | Permissionless |
| Slow settlement | Instant on-chain |

---

## Quick Start

### For AI Agents (Buyers)

```python
import httpx

# Make a request - x402 handles payment automatically
response = httpx.get(
    "https://api.aetheriusx.io/v1/maps/search",
    params={"q": "coffee shops", "location": "Mexico City"},
    headers={"X-Wallet": "0xYourWallet"}
)

data = response.json()
```

### For Developers (Sellers)

```python
from fastapi import FastAPI
from x402.http import FacilitatorConfig, HTTPFacilitatorClient
from x402.http.middleware.fastapi import PaymentMiddlewareASGI

app = FastAPI()

# Add payment middleware
facilitator = HTTPFacilitatorClient(FacilitatorConfig(url="https://x402.org/facilitator"))
app.add_middleware(PaymentMiddlewareASGI, routes={
    "GET /your-endpoint": {
        "accepts": [{"scheme": "exact", "pay_to": "0xYourWallet", "price": "$0.01", "network": "eip155:8453"}],
        "description": "Your API endpoint",
    }
}, server=facilitator)
```

---

## Endpoints

| Endpoint | Description | Price |
|----------|-------------|-------|
| `GET /v1/maps/search` | Google Maps business search | $0.01 |
| `GET /v1/maps/reviews` | Business reviews scraper | $0.02 |
| `GET /v1/maps/nearby` | Nearby places by coordinates | $0.015 |
| `GET /v1/token/analyze` | Crypto token risk analysis | $0.02 |
| `GET /v1/token/holders` | Token holder distribution | $0.03 |
| `GET /v1/token/price` | Real-time token price | $0.005 |
| `GET /v1/web/scrape` | Universal web scraper | $0.01 |
| `GET /v1/web/screenshot` | Website screenshot capture | $0.025 |
| `GET /v1/email/validate` | Email verification service | $0.005 |
| `GET /v1/data/weather` | Weather forecast by location | $0.008 |

---

## How It Works

1. **Connect Wallet** — Your crypto wallet is your identity
2. **Make Request** — Call any endpoint like a normal REST API
3. **Pay in USDC** — x402 handles payment automatically
4. **Get Data** — Receive instant JSON response

No accounts. No subscriptions. No API keys.

---

## Tech Stack

- **FastAPI** — High-performance Python web framework
- **x402 Protocol** — HTTP 402 with crypto payments
- **Base L2** — Ethereum Layer 2 for low fees
- **USDC** — Stablecoin for payments
- **Coinbase CDP** — Payment facilitation

---

## Documentation

- [Getting Started](https://wilnowilx.github.io/aetheriusx-api-site/)
- [x402 Protocol](https://docs.x402.org)
- [API Reference](#endpoints)
- [Examples](#quick-start)

---

## Pricing

| Tier | Price | What You Get |
|------|-------|--------------|
| Free | $0 | Health check, documentation |
| Basic | $0.005-0.01 | Maps, web scraping, validation |
| Pro | $0.02-0.03 | Token analysis, screenshots |

No subscriptions. No minimums. Pay only for what you use.

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Links

- [Website](https://wilnowilx.github.io/aetheriusx-api-site/)
- [Twitter](https://x.com/aetheriusxAPI)
- [GitHub](https://github.com/wilnowilx/aetheriusx-api-site)
- [x402 Protocol](https://x402.org)
- [Base](https://base.org)

---

<div align="center">

**Built with ❤️ by [AETHERIUS](https://x.com/aetheriusxAPI)**

</div>
