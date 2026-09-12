# Aether Oracle MCP Server

An MCP (Model Context Protocol) server that allows AI agents to discover and call x402-powered API endpoints on the AetherX platform.

## Overview

The Aether Oracle MCP bridges AI agents to the aetheriusxAPI marketplace. Agents can:

1. **Discover endpoints** — browse all verified x402 endpoints from the oracle catalog
2. **Check oracle health** — query system health, circuit breaker status, and anti-replay stats
3. **Call endpoints** — invoke any API route with x402 payment settlement
4. **Query reputation** — get wallet reputation scores and risk assessments

## Installation

```bash
pip install mcp httpx
```

## Running

### Stdio mode (default)
```bash
python -m aether_oracle_mcp
```

### SSE mode
```bash
python -m aether_oracle_mcp --transport sse --port 4023
```

## Tools

### `discover_endpoints`
Returns all verified endpoints from `/v1/oracle/verified`. No parameters required.

### `get_oracle_status`
Returns system health from `/v1/oracle/status` including circuit breaker state and anti-replay stats. No parameters required.

### `call_endpoint`
Calls a specific API endpoint with optional x402 payment.

**Parameters:**
- `route` (required): API route path (e.g. `/v1/maps/search`)
- `payment_proof` (optional): X-PAYMENT header value for x402 settlement

### `get_reputation`
Returns reputation and risk scores for a wallet address.

**Parameters:**
- `address` (required): Ethereum wallet address (0x-prefixed)

## Architecture

```
AI Agent → MCP Client → aether_oracle_mcp → aetheriusxAPI (localhost:8000)
                                              ├── /v1/oracle/verified
                                              ├── /v1/oracle/status
                                              ├── /v1/x402/risk/{address}
                                              └── /v1/* (paid endpoints)
```

## Configuration

Set `API_BASE` in `server.py` to point to a different aetheriusxAPI instance.

Default: `http://localhost:8000`

## x402 Payment

In simulated mode (default), any non-empty `X-PAYMENT` header passes through.
In real mode, the server validates USDC on-chain via the x402 facilitator.
See `x402_middleware.py` in the aetheriusxAPI for details.

## License

MIT
