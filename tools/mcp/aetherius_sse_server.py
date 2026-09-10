#!/usr/bin/env python3
"""AETHERIUS MCP SSE Server — public discovery endpoint for Bazaar.

Exposes free x402 Intelligence endpoints as MCP tools over HTTP SSE.
Paid routes require x402 payment (402 → proof → access).

Run:  python3 tools/mcp/aetherius_sse_server.py
Port: 4022 (configurable via AETHERIUS_MCP_PORT)
"""

import json
import os
import urllib.request
from typing import Any

from mcp.server.mcpserver import MCPServer
from mcp.server.sse import SseServerTransport
from starlette.applications import Starlette
from starlette.routing import Mount, Route
from starlette.responses import JSONResponse

API = "https://34-156-149-38.sslip.io/aetherapi"
FINGERPRINT = "X-AETHERIUS-Fingerprint"
PORT = int(os.environ.get("AETHERIUS_MCP_PORT", "4022"))

mcp = MCPServer("aetherius", instructions="AETHERIUS x402 Intelligence — free Base network data for AI agents.")


def _get(path: str, params: dict[str, Any] | None = None) -> str:
    """Fetch from live API. Returns JSON string."""
    url = API + path
    if params:
        qs = "&".join(f"{k}={v}" for k, v in params.items() if v not in ("", None))
        if qs:
            url += "?" + qs
    req = urllib.request.Request(url, headers={"User-Agent": "aetherius-mcp-sse/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            body = r.read().decode("utf-8")
            fp = r.headers.get(FINGERPRINT, "absent")
            try:
                data = json.loads(body)
                data["_fingerprint"] = fp
                return json.dumps(data, indent=2)[:8000]
            except json.JSONDecodeError:
                return body[:8000]
    except Exception as e:
        return json.dumps({"error": str(e), "source": "aetherius-mcp-sse"})


# ── Free tools (no payment required) ──────────────────────────────

@mcp.tool(description="Base Mainnet health snapshot: block number, gas price, chain ID, RPC status. Returns live chain data.")
def base_stats() -> str:
    return _get("/v1/x402/base-stats")


@mcp.tool(description="Gas price analysis on Base: current gwei, cost estimates for common operations (swap, transfer, contract deploy).")
def gas() -> str:
    return _get("/v1/x402/gas")


@mcp.tool(description="Real-time Base market conditions: TVL, volume, dominant token, bullish/bearish signal with confidence score.")
def market_pulse() -> str:
    return _get("/v1/x402/market-pulse")


@mcp.tool(description="Crypto sentiment analysis: Fear & Greed index, BTC trend direction, composite sentiment score 0-100.")
def sentiment() -> str:
    return _get("/v1/x402/sentiment")


@mcp.tool(description="Full Base network health dashboard: uptime, block time, peer count, sync status, active validators.")
def network() -> str:
    return _get("/v1/x402/network")


@mcp.tool(description="Whale tracker: large USDC transfers above threshold. Filter by min_amount in USD.")
def whales(min_amount: int = 10000) -> str:
    return _get("/v1/x402/whales", {"min_amount": min_amount})


@mcp.tool(description="Stablecoin flow analysis: USDC/USDT/DAI volumes, mint/burn activity, supply changes on Base.")
def stablecoins() -> str:
    return _get("/v1/x402/stablecoins")


@mcp.tool(description="Network analytics: transfer volume, unique addresses, transaction count, trending tokens.")
def analytics() -> str:
    return _get("/v1/x402/analytics")


@mcp.tool(description="Live AETHERIUS platform telemetry: uptime, request count, latency, error rate. Proves the API is alive.")
def telemetry() -> str:
    return _get("/v1/telemetry")


@mcp.tool(description="Agent health check: wallet balance, chain status, facilitator status. Returns system readiness.")
def health() -> str:
    return _get("/health")


# ── SSE transport + Starlette app ─────────────────────────────────

sse = SseServerTransport("/messages/")


async def handle_sse(request):
    """SSE endpoint for MCP clients."""
    async with sse.connect_sse(
        request.scope, request.receive, request._send
    ) as streams:
        await mcp.run(
            streams[0],
            streams[1],
            mcp.create_initialization_options(),
        )


async def handle_health(request):
    """Health check for load balancers / Bazaar discovery."""
    return JSONResponse({
        "status": "ok",
        "server": "aetherius-mcp-sse",
        "version": "1.0.0",
        "tools": 10,
        "api": API,
    })


app = Starlette(
    routes=[
        Route("/sse", endpoint=handle_sse),
        Route("/health", endpoint=handle_health),
        Mount("/messages/", app=sse.handle_post_message),
    ],
)

if __name__ == "__main__":
    import uvicorn
    print(f"[aetherius-mcp] SSE server on port {PORT}", flush=True)
    print(f"[aetherius-mcp] SSE endpoint: http://0.0.0.0:{PORT}/sse", flush=True)
    print(f"[aetherius-mcp] Health check: http://0.0.0.0:{PORT}/health", flush=True)
    uvicorn.run(app, host="0.0.0.0", port=PORT, log_level="info")
