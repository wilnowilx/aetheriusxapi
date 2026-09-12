"""MCP tool definitions for the Aether Oracle server.

Each tool uses httpx to query the aetheriusxapi and returns
machine-readable JSON results for AI agents.
"""

import httpx

API_BASE = "http://localhost:8000"


async def discover_endpoints() -> str:
    """Query /v1/oracle/verified and return all verified x402 endpoints.

    Returns a JSON string with the full catalog of verified endpoints.
    """
    async with httpx.AsyncClient(timeout=15) as client:
        try:
            r = await client.get(f"{API_BASE}/v1/oracle/verified")
            data = r.json()
            return _format_json(data)
        except Exception as e:
            return _format_error(f"Failed to discover endpoints: {e}")


async def get_oracle_status() -> str:
    """Query /v1/oracle/status and return system health.

    Returns circuit breaker state, anti-replay stats, and operational metrics.
    """
    async with httpx.AsyncClient(timeout=15) as client:
        try:
            r = await client.get(f"{API_BASE}/v1/oracle/status")
            data = r.json()
            return _format_json(data)
        except Exception as e:
            return _format_error(f"Failed to get oracle status: {e}")


async def call_endpoint(route: str, payment_proof: str = "") -> str:
    """Call a specific API endpoint with x402 payment.

    Args:
        route: The API route (e.g. '/v1/maps/search').
        payment_proof: X-PAYMENT header value for x402 settlement.

    Returns the endpoint response or payment requirement.
    """
    url = f"{API_BASE}{route}" if route.startswith("/") else f"{API_BASE}/{route}"
    headers = {"User-Agent": "aether-oracle-mcp/1.0"}
    if payment_proof:
        headers["X-PAYMENT"] = payment_proof

    async with httpx.AsyncClient(timeout=15) as client:
        try:
            r = await client.get(url, headers=headers)
            if r.status_code == 402:
                return _format_json({
                    "status": "payment_required",
                    "route": route,
                    "error": "402 Payment Required — submit a valid x402 proof",
                    "headers": dict(r.headers),
                })
            r.raise_for_status()
            data = r.json()
            data["_x402_status"] = "settled" if payment_proof else "simulated"
            return _format_json(data)
        except httpx.HTTPStatusError as e:
            return _format_error(f"HTTP {e.response.status_code} calling {route}: {e.response.text[:200]}")
        except Exception as e:
            return _format_error(f"Failed to call {route}: {e}")


async def get_reputation(address: str) -> str:
    """Query reputation and risk scores for a wallet address.

    Args:
        address: The wallet address (0x-prefixed).

    Returns reputation score, spending patterns, and risk assessment.
    """
    url = f"{API_BASE}/v1/x402/risk/{address}"
    async with httpx.AsyncClient(timeout=15) as client:
        try:
            r = await client.get(url)
            if r.status_code == 404:
                # Try the agent intelligence endpoint as fallback
                url2 = f"{API_BASE}/v1/x402/agent/{address}"
                r2 = await client.get(url2)
                if r2.status_code == 200:
                    data = r2.json()
                    data["_source"] = "agent_intelligence"
                    return _format_json(data)
                return _format_json({
                    "address": address,
                    "reputation_score": 0,
                    "status": "not_found",
                    "error": "No reputation data available for this address",
                })
            r.raise_for_status()
            data = r.json()
            data["_source"] = "risk_endpoint"
            return _format_json(data)
        except Exception as e:
            return _format_error(f"Failed to get reputation for {address}: {e}")


def _format_json(data: dict) -> str:
    """Convert dict to compact JSON string for MCP tool results."""
    import json
    return json.dumps(data, indent=2, default=str)


def _format_error(message: str) -> str:
    """Format an error as a machine-readable JSON string."""
    import json
    return json.dumps({"error": message, "success": False}, indent=2)


# ── MCP Tool Schema Definitions ──────────────────────────────

TOOL_SCHEMAS = {
    "discover_endpoints": {
        "name": "discover_endpoints",
        "description": "Discover all verified x402 endpoints from the oracle catalog. Returns the full list of endpoints with route, price, category, and settlement info from /v1/oracle/verified.",
        "inputSchema": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    "get_oracle_status": {
        "name": "get_oracle_status",
        "description": "Get the current oracle system health and circuit breaker status. Returns operational metrics from /v1/oracle/status including anti-replay stats and circuit breaker state.",
        "inputSchema": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    "call_endpoint": {
        "name": "call_endpoint",
        "description": "Call a specific x402 API endpoint with optional payment proof. Requires a route path and optional X-PAYMENT header value for x402 settlement.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "route": {
                    "type": "string",
                    "description": "The API route to call (e.g. '/v1/maps/search', '/v1/token/price'). Must start with '/v1/'.",
                },
                "payment_proof": {
                    "type": "string",
                    "description": "Optional x402 payment proof (X-PAYMENT header value). In simulated mode, any non-empty value passes through.",
                },
            },
            "required": ["route"],
        },
    },
    "get_reputation": {
        "name": "get_reputation",
        "description": "Get reputation and risk scores for a wallet address on Base. Returns spending patterns, counterparties, and risk assessment from /v1/x402/risk/{address}.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "address": {
                    "type": "string",
                    "description": "The wallet address to query (e.g. '0x677B483128D0399bCD0A5AB36eE990C0246d7f61'). Must be 0x-prefixed.",
                },
            },
            "required": ["address"],
        },
    },
}
