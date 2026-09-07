# AETHERIUS — AI Agent Commerce Platform

> **100+ live APIs where AI agents pay per request in USDC on Base.**
> **No accounts. No API keys. No subscriptions. Just your wallet and code.**

| Metric | Value |
|--------|-------|
| **Network** | Base Mainnet (eip155:8453) |
| **Protocol** | x402 — HTTP payment protocol |
| **Currency** | USDC on Base |
| **Wallet** | `0x677B483128D0399bCD0A5AB36eE990C0246d7f61` |
| **Endpoints** | 100+ (60 paid + 40 free QuantumXBrain) |
| **License** | MIT |

---

## Architecture

```
┌─────────────────────────────────────────┐
│  Frontend (GitHub Pages)                │
│  React 19 + R3F 9 + Vite 6 + GSAP     │
│  20 sections · 3D globe · playground    │
├─────────────────────────────────────────┤
│  Backend (VM sentinel-v4)               │
│  FastAPI + x402 + QuantumXBrain         │
│  100+ endpoints (60 paid + 40 free)     │
├─────────────────────────────────────────┤
│  Protocol: x402 (USDC on Base)          │
│  Facilitator: Coinbase CDP              │
│  Wallet: 0x677B...7f61                  │
└─────────────────────────────────────────┘
```

---

## Endpoints — All 100+

### Maps (5)
| Endpoint | Description | Price |
|----------|-------------|-------|
| `GET /v1/maps/search` | Business search via OpenStreetMap | $0.01 |
| `GET /v1/maps/reviews` | Place lookup via OpenStreetMap | $0.02 |
| `GET /v1/maps/nearby` | Nearby places by coordinates | $0.015 |
| `GET /v1/maps/reverse` | Coordinates to address | $0.01 |
| `GET /v1/maps/geocode` | Forward geocoding | $0.01 |

### Crypto (7)
| Endpoint | Description | Price |
|----------|-------------|-------|
| `GET /v1/crypto/market` | Global crypto market data | $0.01 |
| `GET /v1/crypto/fear-greed` | Fear & Greed Index | $0.005 |
| `GET /v1/crypto/trending` | Trending coins | $0.01 |
| `GET /v1/crypto/ohlcv` | OHLCV candlestick data | $0.015 |
| `GET /v1/crypto/dominance` | BTC/ETH dominance | $0.008 |
| `GET /v1/token/price` | Real-time token price | $0.005 |
| `GET /v1/token/prices` | Batch token prices | $0.01 |

### Token (7)
| Endpoint | Description | Price |
|----------|-------------|-------|
| `GET /v1/token/analyze` | Token contract analysis | $0.02 |
| `GET /v1/token/holders` | Holder distribution (key-gated) | $0.03 |
| `GET /v1/token/gas` | Gas oracle | $0.01 |
| `GET /v1/token/balance` | ETH balance | $0.01 |
| `GET /v1/token/transactions` | Wallet transactions | $0.02 |
| `GET /v1/token/global` | Global crypto stats | $0.01 |
| `GET /v1/token/nft` | NFT metadata | $0.02 |

### Web (6)
| Endpoint | Description | Price |
|----------|-------------|-------|
| `GET /v1/web/scrape` | Universal web scraper | $0.01 |
| `GET /v1/web/screenshot` | Website screenshot | $0.025 |
| `GET /v1/web/whois` | Domain WHOIS lookup | $0.01 |
| `GET /v1/web/headers` | HTTP headers checker | $0.005 |
| `GET /v1/web/ssl` | SSL certificate info | $0.008 |
| `GET /v1/web/dns` | DNS lookup | $0.005 |
| `GET /v1/web/geoip` | IP geolocation | $0.008 |

### Data (12)
| Endpoint | Description | Price |
|----------|-------------|-------|
| `GET /v1/data/weather` | Current weather | $0.008 |
| `GET /v1/data/forecast` | 7-day forecast | $0.008 |
| `GET /v1/data/airquality` | Air quality index | $0.008 |
| `GET /v1/data/define` | Dictionary definitions | $0.005 |
| `GET /v1/data/words` | Synonyms/antonyms/rhymes | $0.005 |
| `GET /v1/data/elevation` | Elevation lookup | $0.005 |
| `GET /v1/data/ip` | IP geolocation | $0.005 |
| `GET /v1/data/ua` | User-Agent parser | $0.003 |
| `GET /v1/data/hash` | Hash generator (MD5/SHA) | $0.002 |
| `GET /v1/data/uuid` | UUID v4 generator | $0.001 |
| `GET /v1/data/qrcode` | QR code generator | $0.005 |
| `GET /v1/data/translate` | Text translation | $0.01 |
| `GET /v1/data/summarize` | Text summarizer | $0.015 |

### Email (1)
| Endpoint | Description | Price |
|----------|-------------|-------|
| `GET /v1/email/validate` | Email verification (syntax + MX + disposable) | $0.005 |

### DeFi (9)
| Endpoint | Description | Price |
|----------|-------------|-------|
| `GET /v1/defi/yields` | Top yield pools | $0.02 |
| `GET /v1/defi/stablecoins` | Stablecoin list | $0.01 |
| `GET /v1/defi/fees` | Protocol fees | $0.015 |
| `GET /v1/defi/tvl` | Chain TVLs | $0.01 |
| `GET /v1/defi/protocols` | Protocols by TVL | $0.01 |
| `GET /v1/defi/dexs` | DEX volumes | $0.015 |
| `GET /v1/defi/stablecoinchains` | Stables by chain | $0.01 |
| `GET /v1/defi/stablecoin-history` | Stable history | $0.01 |
| `GET /v1/defi/impermanent-loss` | IL calculator | $0.01 |
| `GET /v1/defi/staking-apy` | Staking APY tracker | $0.01 |

### Forex (3)
| Endpoint | Description | Price |
|----------|-------------|-------|
| `GET /v1/forex/rates` | Fiat FX rates | $0.008 |
| `GET /v1/forex/history` | Historical FX | $0.01 |
| `GET /v1/forex/convert` | Currency conversion | $0.008 |

### News (6)
| Endpoint | Description | Price |
|----------|-------------|-------|
| `GET /v1/news/hackernews` | HN front page | $0.01 |
| `GET /v1/news/hn-item` | HN item by ID | $0.005 |
| `GET /v1/news/hn-user` | HN user profile | $0.005 |
| `GET /v1/news/hn-feed` | HN Ask/Show/Jobs | $0.01 |
| `GET /v1/news/reddit` | Reddit posts | $0.01 |
| `GET /v1/news/devto` | Dev.to articles | $0.008 |

### Storage (1)
| Endpoint | Description | Price |
|----------|-------------|-------|
| `GET /v1/storage/drift` | Cross-RPC slot drift | $0.02 |

### QuantumXBrain — 40 FREE Intelligence Endpoints

Every response carries `X-AETHERIUS-Fingerprint: quantumxbrain-v1`. **No payment required.**

| Endpoint | Description |
|----------|-------------|
| `GET /v1/x402/brain` | AI endpoint recommender |
| `GET /v1/x402/intelligence` | Aggregated intelligence |
| `GET /v1/x402/market-pulse` | Real-time Base market conditions |
| `GET /v1/x402/wallet-intel/{addr}` | Full wallet profile + risk |
| `GET /v1/x402/sentiment` | Fear & Greed + BTC trend |
| `GET /v1/x402/compliance` | KYC/AML compliance indicators |
| `GET /v1/x402/gas-intelligence` | Gas trends + optimal timing |
| `GET /v1/x402/token-discovery` | Active contracts on Base |
| `GET /v1/x402/whale-intelligence` | Whale tracking + clustering |
| `GET /v1/x402/network-health` | Full Base network health |
| `GET /v1/x402/stablecoin-flow` | USDC flow analysis |
| `GET /v1/x402/defi-yield` | Top DeFi yield pools on Base |
| `GET /v1/x402/tx-patterns` | Transaction size distribution |
| `GET /v1/x402/wallet-compare` | Compare two wallets side by side |
| `GET /v1/x402/leaderboard` | Top USDC activity ranking |
| `GET /v1/x402/contract-intel/{addr}` | Contract verification + type detection |
| `GET /v1/x402/velocity-intel` | Transfer velocity with 12h trend |
| `GET /v1/x402/history-intel/{addr}` | Enhanced transfer history |
| `GET /v1/x402/risk-intel/{addr}` | Multi-factor risk scoring |
| `GET /v1/x402/search-intel` | Universal search (address, tx, domain) |
| `GET /v1/x402/payments/recent` | Recent USDC transfers on Base |
| `GET /v1/x402/agent/{address}` | Wallet spending intelligence |
| `GET /v1/x402/analytics` | Network health & trends |
| `GET /v1/x402/top-agents` | Top spenders leaderboard |
| `GET /v1/x402/base-stats` | Chain health snapshot |
| `GET /v1/x402/gas` | Gas price analysis |
| `GET /v1/x402/whales` | Large transfers (>$10K) |
| `GET /v1/x402/velocity` | Transfer frequency (24h) |
| `GET /v1/x402/hourly` | Hourly volume breakdown |
| `GET /v1/x402/token/{address}` | ERC-20 token metadata |
| `GET /v1/x402/contracts` | Top USDC-receiving contracts |
| `GET /v1/x402/search` | Address or tx lookup |
| `GET /v1/x402/history/{address}` | Transfer history |
| `GET /v1/x402/compare` | Compare two wallets |
| `GET /v1/x402/risk/{address}` | Wallet risk score (0-100) |
| `GET /v1/x402/stablecoins` | All stablecoin activity |
| `GET /v1/x402/mint-burn` | USDC supply changes |
| `GET /v1/x402/bridge` | Cross-chain bridge flow |
| `GET /v1/x402/defi-pulse` | DeFi protocol activity |
| `GET /v1/x402/network` | Full network dashboard |

---

## Quick Start

```bash
# Python SDK
pip install aetheriusx
```

```python
from aetheriusx import Client

# Connects to mainnet by default
client = Client("0xYourWallet")

# Free intelligence (no payment needed)
stats = client.get("/v1/x402/base-stats")

# Paid endpoint — auto-handles x402 challenge
resp = client.get("/v1/crypto/price", params={"token": "ETH"})
```

```bash
# JavaScript SDK
npm install aetheriusx
```

```javascript
import { AetheriusXClient } from "aetheriusx";

const client = new AetheriusXClient();
const health = await client.health();
const { route, price } = await client.discoverCheapest();
```

---

## Frontend (R3F Landing)

| Stack | Version |
|-------|---------|
| React | 19 |
| React Three Fiber | 9 |
| @react-three/drei | 10 |
| @react-three/postprocessing | 3 |
| Three.js | 0.175 |
| GSAP + ScrollTrigger | 3.12 |
| Lenis smooth scroll | 1.2 |
| Vite | 6 |

20 sections with 3D interactive globe. Aurora plasma background. Live API playground.

```bash
cd frontend && npm install && npm run build
```

---

## Deployment

| Component | Location | URL |
|-----------|----------|-----|
| **Frontend** | GitHub Pages (auto-deploy from main) | https://wilnowilx.github.io/aetheriusxapi/ |
| **Backend** | VM sentinel-v4 (34.156.149.38) | https://34-156-149-38.sslip.io/aetherapi |
| **Dashboard** | GitHub Pages | https://wilnowilx.github.io/aetheriusxapi/dashboard/ |
| **DonateX** | GitHub Pages | https://wilnowilx.github.io/aetheriusxapi/donatex/ |

---

## Grant Applications

| Grant | Amount | Status |
|-------|--------|--------|
| **Base Batches 004** | $100K + accelerator | Applied — result Sep 17, 2026 |
| **Base Ecosystem Fund** | Variable | Pending |
| **Base Creator Grant** | $4K | Applied |

---

## Links

| Resource | URL |
|----------|-----|
| **Landing** | https://wilnowilx.github.io/aetheriusxapi/ |
| **API** | https://34-156-149-38.sslip.io/aetherapi |
| **Dashboard** | https://wilnowilx.github.io/aetheriusxapi/dashboard/ |
| **DonateX** | https://wilnowilx.github.io/aetheriusxapi/donatex/ |
| **X/Twitter** | https://x.com/aetheriusxAPI |
| **Telegram** | https://t.me/aetheriusxAPI_global |
| **GitHub** | https://github.com/wilnowilx/aetheriusxapi |
| **YouTube** | https://youtu.be/TDzMALSe00A |
| **x402 Protocol** | https://x402.org |
| **Base** | https://base.org |

---

## License

MIT
