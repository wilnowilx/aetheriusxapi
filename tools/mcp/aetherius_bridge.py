#!/usr/bin/env python3
"""AETHERIUS MCP bridge — free x402 Intelligence endpoints as MCP tools.

Stdio MCP server (mcp>=2.x API). Zero secrets: only FREE routes, no payments.
Run:  python3 tools/mcp/aetherius_bridge.py
Opencode desktop: wired via opencode.json -> mcp.aetherius (local stdio).

Every tool hits the live API and returns raw JSON. Paid routes are NOT
exposed here on purpose — this bridge is the free-intelligence funnel.
"""

import json
import urllib.request

from mcp.server.mcpserver import MCPServer

API = "https://34-156-149-38.sslip.io/aetherapi"
FINGERPRINT = "X-AETHERIUS-Fingerprint"

mcp = MCPServer("aetherius")


def _get(path: str, params: dict | None = None) -> str:
    url = API + path
    if params:
        qs = "&".join(f"{k}={v}" for k, v in params.items() if v not in ("", None))
        if qs:
            url += "?" + qs
    req = urllib.request.Request(url, headers={"User-Agent": "aetherius-mcp-bridge/1.0"})
    with urllib.request.urlopen(req, timeout=25) as r:
        body = r.read().decode("utf-8")
        fp = r.headers.get(FINGERPRINT, "absent")
        try:
            data = json.loads(body)
            data["_fingerprint"] = fp
            return json.dumps(data, indent=2)[:8000]
        except json.JSONDecodeError:
            return body[:8000]


@mcp.tool(description="Base Mainnet health snapshot: block, gas, chain ID, RPC status.")
def base_stats() -> str:
    """Chain health snapshot (FREE)."""
    return _get("/v1/x402/base-stats")


@mcp.tool(description="Gas price analysis + cost estimates on Base (FREE).")
def gas() -> str:
    """Gas intelligence (FREE)."""
    return _get("/v1/x402/gas")


@mcp.tool(description="Real-time Base market conditions + bullish/bearish signal (FREE).")
def market_pulse() -> str:
    """Market pulse with signal label (FREE)."""
    return _get("/v1/x402/market-pulse")


@mcp.tool(description="Fear & Greed + BTC trend + composite sentiment score (FREE).")
def sentiment() -> str:
    """On-chain + market sentiment (FREE)."""
    return _get("/v1/x402/sentiment")


@mcp.tool(description="Full Base network health dashboard (FREE).")
def network() -> str:
    """Network dashboard (FREE)."""
    return _get("/v1/x402/network")


@mcp.tool(description="Large USDC transfers over a threshold (FREE).")
def whales(min_amount: int = 10000) -> str:
    """Whale tracker. min_amount in USD (FREE)."""
    return _get("/v1/x402/whales", {"min_amount": min_amount})


@mcp.tool(description="Stablecoin activity: USDC/USDT/DAI flows on Base (FREE).")
def stablecoins() -> str:
    """Stablecoin flows (FREE)."""
    return _get("/v1/x402/stablecoins")


@mcp.tool(description="Network analytics: volume, trends, transfer stats (FREE).")
def analytics() -> str:
    """Analytics snapshot (FREE)."""
    return _get("/v1/x402/analytics")


@mcp.tool(description="Live service telemetry: uptime, counters, latency, volume (FREE).")
def telemetry() -> str:
    """Public telemetry (FREE). Proves the platform is alive."""
    return _get("/v1/telemetry")


if __name__ == "__main__":
    mcp.run()
