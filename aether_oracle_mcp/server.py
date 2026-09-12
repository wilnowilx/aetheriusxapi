"""Aether Oracle MCP Server — x402 endpoint discovery for AI agents.

Provides tools for AI agents to discover x402 endpoints, check oracle
health, call paid endpoints with x402 payment, and query reputation scores.
"""

from mcp.server import Server
from mcp.server.mcpserver import MCPServer

from aether_oracle_mcp.tools import (
    call_endpoint,
    discover_endpoints,
    get_oracle_status,
    get_reputation,
)

API_BASE = "http://localhost:8000"

# Import Server from mcp.server as required;
# use MCPServer for the @tool() decorator API.
mcp = MCPServer("aether-oracle")


@mcp.tool()
async def discover_endpoints() -> str:
    """Discover all verified x402 endpoints from the oracle catalog.

    Returns the full list of verified endpoints from /v1/oracle/verified
    including route, price, category, and settlement info.
    """
    return await discover_endpoints()


@mcp.tool()
async def get_oracle_status() -> str:
    """Get the current oracle system health and circuit breaker status.

    Returns system health data from /v1/oracle/status including
    circuit breaker state, anti-replay stats, and operational metrics.
    """
    return await get_oracle_status()


@mcp.tool()
async def call_endpoint(route: str, payment_proof: str = "") -> str:
    """Call a specific x402 endpoint with optional payment proof.

    Args:
        route: The API route to call (e.g. '/v1/maps/search').
        payment_proof: Optional x402 payment proof (X-PAYMENT header value).
            In simulated mode, any non-empty value passes through.

    Returns:
        The endpoint response data or a 402 payment required message.
    """
    return await call_endpoint(route, payment_proof)


@mcp.tool()
async def get_reputation(address: str) -> str:
    """Get reputation and risk scores for a wallet address.

    Args:
        address: The wallet address to query (e.g. '0x...').

    Returns:
        Reputation score, spending patterns, counterparties, and risk assessment.
    """
    return await get_reputation(address)


def run(transport: str = "stdio"):
    """Start the MCP server.

    Args:
        transport: Transport type — 'stdio', 'sse', or 'streamable-http'.
    """
    mcp.run(transport=transport)


if __name__ == "__main__":
    run()
