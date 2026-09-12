"""Aether Oracle MCP — x402 endpoint discovery for AI agents."""

from aether_oracle_mcp.server import mcp as server
from aether_oracle_mcp.tools import (
    call_endpoint,
    discover_endpoints,
    get_oracle_status,
    get_reputation,
)

__all__ = ["server", "discover_endpoints", "get_oracle_status", "call_endpoint", "get_reputation"]


def main():
    """Entry point for running as: python -m aether_oracle_mcp"""
    server.run(transport="stdio")


if __name__ == "__main__":
    main()
