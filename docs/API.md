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
