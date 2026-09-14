# AETHERIUS Protocol — x402 Enforcement

This document describes the protocol-level enforcement for x402 agent commerce on Base.

## Scope — Verified Catalog

Paid routes are gated by the verified catalog. If the catalog is populated, requests to paid endpoints not in the catalog return `404 not_verified`. Free routes bypass this gate. Empty catalog falls back to allow for compatibility.

- Endpoint: `GET /v1/oracle/verified`
- Error: `{"error":"not_verified","hint":"Endpoint not in verified catalog, check /v1/oracle/verified"}`
- Status: `404`

## Budget — X-Budget Hard Limit

Opt-in hard limit per agent session. Clients send `X-Budget` (USDC) and receive `X-Budget-Remaining` on success.

- Request header: `X-Budget: "1.00"`
- Response header (success): `X-Budget-Remaining: "0.995000"`
- Exhausted: `402 {"error":"budget_exhausted","remaining":0.001,"required":0.005,"hint":"Increase X-Budget or wait"}`
- No header: no enforcement (backward compatible).

State is in-memory with optional Redis backing (TTL).

## Evidence — On-Chain Settlement

Settlement evidence is anchored on Base and indexed via telemetry.

- Each confirmed USDC `Transfer` to the service wallet produces a `tx_hash` verified on BaseScan.
- Evidence is stored as `{"tx_hash","agent","amount_usd","timestamp","endpoint"}` (max 20, most-recent first).
- Exposed via `GET /v1/telemetry` (`recent_settlements`) and `GET /v1/oracle/status`.

## Verification

```bash
# Scope
curl -s https://api.aetherius.dev/v1/web/scrape | jq .error # not_verified if not in catalog

# Budget
curl -s https://api.aetherius.dev/v1/email/validate?email=test@example.com \
  -H "X-PAYMENT: proof" -H "X-Budget: 0.006" -i | grep -i X-Budget-Remaining

# Evidence
curl -s https://api.aetherius.dev/v1/telemetry | jq .recent_settlements[0].tx_hash
curl -s https://api.aetherius.dev/v1/oracle/status | jq .recent_settlements
```

All gates are protocol-level, tested, and have compatibility fallbacks.
