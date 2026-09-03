# aetheriusxAPI Documentation

## Overview

aetheriusxAPI is a crypto-native API marketplace where AI agents pay per request in USDC on Base. Built on x402 protocol.

## Base URL

```
https://api.aetheriusx.io
```

## Authentication

No API keys required. Your wallet address is your identity.

For x402 payments, include your wallet address in the request:

```
X-Wallet: 0xYourWalletAddress
```

## Network

- **Chain:** Base (Ethereum L2)
- **Currency:** USDC
- **Chain ID:** 8453

---

## Endpoints

### Maps

#### GET /v1/maps/search

Search for businesses using OpenStreetMap data.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| q | string | Yes | Search query |
| location | string | No | Location (default: Mexico) |

**Response:**

```json
{
  "query": "coffee shops",
  "location": "Mexico City",
  "count": 42,
  "results": [
    {
      "name": "Starbucks Reforma",
      "address": "Av. Reforma 123",
      "phone": "+52 55 1234 5678",
      "website": "https://starbucks.com",
      "lat": 19.4326,
      "lon": -99.1332
    }
  ]
}
```

**Price:** $0.01

---

#### GET /v1/maps/reviews

Find place information using OpenStreetMap data.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| place_name | string | Yes | Place name to search |

**Response:**

```json
{
  "query": "Zocalo Mexico City",
  "count": 5,
  "results": [
    {
      "name": "Zócalo, Mexico City, CDMX, Mexico",
      "lat": "19.4326",
      "lon": "-99.1332",
      "type": "square",
      "importance": 0.95
    }
  ]
}
```

**Price:** $0.02

---

#### GET /v1/maps/nearby

Find nearby places by coordinates.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| lat | float | Yes | Latitude |
| lon | float | Yes | Longitude |
| radius | int | No | Search radius in meters (default: 1000) |
| category | string | No | Category filter (restaurant, cafe, etc.) |

**Price:** $0.015

---

### Crypto

#### GET /v1/token/analyze

Analyze a crypto token contract for risk indicators.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| address | string | Yes | Token contract address |
| chain | string | No | Blockchain (default: ethereum) |

**Response:**

```json
{
  "address": "0x...",
  "chain": "ethereum",
  "analyzed_at": "2026-09-02T12:00:00Z",
  "checks": {
    "verified": true,
    "has_abi": true
  },
  "risk_score": 30,
  "risk_level": "low"
}
```

**Price:** $0.02

---

#### GET /v1/token/holders

Get token holder distribution.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| address | string | Yes | Token contract address |
| chain | string | No | Blockchain (default: ethereum) |

**Price:** $0.03

---

#### GET /v1/token/price

Get real-time token price.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| address | string | Yes | Token contract address |
| chain | string | No | Blockchain (default: ethereum) |

**Price:** $0.005

---

### Web

#### GET /v1/web/scrape

Scrape a web page and return structured content.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| url | string | Yes | URL to scrape |

**Response:**

```json
{
  "url": "https://example.com",
  "status": 200,
  "title": "Example Page",
  "text_preview": "Page content...",
  "links_count": 25,
  "links": ["https://..."],
  "content_length": 15000
}
```

**Price:** $0.01

---

#### GET /v1/web/screenshot

Capture a screenshot of a website.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| url | string | Yes | URL to capture |
| width | int | No | Viewport width (default: 1280) |
| height | int | No | Viewport height (default: 720) |

**Price:** $0.025

---

### DeFi (Llama, no keys)

| Endpoint | Params | Price |
|----------|--------|-------|
| `GET /v1/defi/yields` | `chain`, `project`, `limit` (def. 20) | $0.02 |
| `GET /v1/defi/stablecoins` | `limit` (def. 30) | $0.01 |
| `GET /v1/defi/fees` | `limit` (def. 20) | $0.015 |
| `GET /v1/defi/tvl` | `chain`, `limit` (def. 20) | $0.01 |

Top yield pools by TVL, stablecoin prices/circulation, protocol fee leaders,
chain TVLs. Upstream failures return honest `502`, never mock data.

### Forex & News (no keys)

| Endpoint | Params | Price |
|----------|--------|-------|
| `GET /v1/forex/rates` | `base` (def. USD), `symbols` CSV | $0.008 |
| `GET /v1/news/hackernews` | `kind` top/new/best, `limit` (def. 10) | $0.01 |

ECB fiat rates via Frankfurter; HN stories with title/url/score via Firebase API.

### Data

#### GET /v1/email/validate

Validate an email address.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| email | string | Yes | Email address |

**Response:**

```json
{
  "email": "user@example.com",
  "valid_syntax": true,
  "has_mx": true,
  "is_disposable": false,
  "risk_score": 10,
  "verdict": "valid"
}
```

**Price:** $0.005

---

#### GET /v1/data/weather

Get weather forecast by location.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| lat | float | Yes | Latitude |
| lon | float | Yes | Longitude |

**Price:** $0.008

---

### Storage Drift

#### GET /v1/storage/drift

Cross-layer slot observation: queries N independent public RPC endpoints and
reports which block number (`slot`) each layer sees, with per-layer latency.
Operators genuinely disagree by 0–3 blocks — that divergence is the measured
phenomenon (distributed-state drift).

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| chain | string | No | base, ethereum, optimism, arbitrum, polygon (default: base) |
| layers | int | No | RPC layers to compare (default: 2) |

**Response:**

```json
{
  "chain": "base",
  "layers": [
    {"name": "mainnet.base.org", "slot": 18420001,
     "observed_at": "...", "latency_ms": 120.5, "error": null}
  ],
  "drift": {
    "slot_delta": 2, "min_slot": 18420001, "max_slot": 18420003,
    "status": "diverged", "reporting_layers": 2, "failed_layers": []
  }
}
```

Status: `converged` (delta ≤ 1) · `diverged` (delta ≥ 2) · `degraded` (a layer failed).

**Price:** $0.02

---

### Telemetry

#### GET /v1/telemetry

Public proof layer — **free, no payment required.** Uptime, totals, per-endpoint
stats, settled USDC volume, wallets seen, recent latencies and events.
Powers the dashboard and grant reporting.

**Response:**

```json
{
  "service": "aetheriusxAPI",
  "uptime_s": 12345.6,
  "totals": {
    "calls": 1000,
    "ok_200": 800,
    "challenges_402": 190,
    "errors": 10,
    "avg_latency_ms": 120.5,
    "volume_usdc": 12.345
  },
  "wallets_seen": 42,
  "per_endpoint": {
    "/v1/email/validate": {
      "calls": 100, "ok_200": 90, "n402": 9, "errors": 1,
      "avg_latency_ms": 15.2, "volume_usdc": 0.45
    }
  }
}
```

**Price:** Free

---

## HTTPS Access (GitHub Pages → VM)

Browsers block HTTPS pages calling HTTP APIs (mixed content). Use the TLS endpoint:

```
https://34-156-149-38.sslip.io/aetherapi
```

Valid Let's Encrypt cert, Nginx 443 → FastAPI, CORS allows
`https://wilnowilx.github.io`. Requires GCP firewall ingress `tcp:443`
(rule `allow-https-aetherapi`) + OS iptables ACCEPT 443 — both active.

---

## Error Responses

All errors follow the x402 standard:

### 402 Payment Required

```json
{
  "error": "Payment required",
  "amount": "0.01",
  "currency": "USDC",
  "network": "eip155:8453",
  "pay_to": "0x..."
}
```

### 400 Bad Request

```json
{
  "error": "Missing required parameter: q"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error"
}
```

---

## Rate Limits

- No rate limits for paying customers
- Free tier: 100 requests per day
- Paid tier: Unlimited

---

## Support

- Twitter: [@aetheriusxAPI](https://x.com/aetheriusxAPI)
- GitHub: [wilnowilx/aetheriusxapi](https://github.com/wilnowilx/aetheriusxapi)
