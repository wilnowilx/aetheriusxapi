from __future__ import annotations

import argparse
import asyncio
import sys

from .client import VerifiedCatalog
from .health import HealthChecker


async def main():
    parser = argparse.ArgumentParser(description="Aether Oracle CLI")
    parser.add_argument("--base-url", default="https://oracle.example.com", help="Oracle base URL")
    parser.add_argument("--action", choices=["discover", "status", "health"], default="discover")
    parser.add_argument("--endpoints", nargs="*", default=[], help="Endpoints to check")
    parser.add_argument("--api-key", default=None, help="API key")

    args = parser.parse_args()

    if args.action == "discover":
        catalog = VerifiedCatalog(base_url=args.base_url, api_key=args.api_key)
        endpoints = await catalog.discover()
        print(f"Discovered {len(endpoints)} endpoints:")
        for ep in endpoints:
            print(f"  - {ep}")
        await catalog.close()

    elif args.action == "status":
        catalog = VerifiedCatalog(base_url=args.base_url, api_key=args.api_key)
        status = await catalog.get_status()
        print(f"Oracle status: {status}")
        await catalog.close()

    elif args.action == "health":
        checker = HealthChecker()
        results = await checker.check_all(args.endpoints)
        for result in results:
            print(f"  {result['endpoint']}: {result['status']} (latency: {result['latency']})")
        for route in args.endpoints:
            uptime = await checker.get_uptime(route)
            p95 = await checker.get_latency_p95(route)
            print(f"  {route} uptime: {uptime}%, p95 latency: {p95}")

    sys.exit(0)


if __name__ == "__main__":
    asyncio.run(main())
