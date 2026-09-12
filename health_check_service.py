"""Endpoint verification and health-check discovery layer.

This service continuously verifies that all endpoints listed in /v1/* are reachable
and healthy, providing a consolidated health-check discovery layer that ensures
100% endpoint liveliness for the AETHERIUS marketplace.
"""

import asyncio
import time
import httpx
import json
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Simple import for persistent storage stats - avoid circular dependency
# We'll get stats directly from the middleware module
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Define a simple interface for storage stats
class StorageStatsAdapter:
    @staticmethod
    def get_stats():
        """Get persistent storage stats. This will be called from x402_middleware."""
        try:
            from x402_middleware import _persistent_storage
            return _persistent_storage.stats()
        except ImportError:
            return {"type": "memory", "active_nonces": 0, "ttl_seconds": 300}

@dataclass
class EndpointHealth:
    """Health status of a single endpoint."""
    route: str
    status: str  # "healthy", "unhealthy", "unknown"
    last_checked: datetime
    response_time_ms: float
    error_message: Optional[str] = None
    consecutive_failures: int = 0
    total_checks: int = 0
    success_rate: float = 1.0


@dataclass
class HealthCheckResult:
    """Results from a health check operation."""
    timestamp: datetime
    total_endpoints: int
    healthy_endpoints: int
    unhealthy_endpoints: int
    unknown_endpoints: int
    average_response_time_ms: float
    endpoint_healths: List[EndpointHealth]


class EndpointVerificationService:
    """Service that verifies endpoint health and provides continuous discovery."""

    def __init__(self, base_url: str = "http://localhost:8000", check_interval: int = 60):
        self.base_url = base_url.rstrip('/')
        self.check_interval = check_interval
        self.endpoints: Dict[str, str] = {}  # route -> description
        self.health_status: Dict[str, EndpointHealth] = {}
        self.is_running = False
        self.client_timeout = httpx.Timeout(timeout=10.0)
        
        # Initialize with known endpoints from aetheriusxAPI
        self._initialize_endpoints()

    def _initialize_endpoints(self):
        """Initialize with endpoints from main.py and their descriptions."""
        # These are the endpoints that should be verified
        # They correspond to routes in the aetheriusxAPI main.py
        endpoints_to_check = [
            # Maps endpoints
            ("/v1/maps/search", "Business search via OpenStreetMap"),
            ("/v1/maps/reviews", "Place lookup via OpenStreetMap"),
            ("/v1/maps/nearby", "Nearby places by coordinates"),
            ("/v1/maps/reverse", "Coordinates to address"),
            ("/v1/maps/geocode", "Forward geocode via Photon"),
            
            # Token endpoints
            ("/v1/token/analyze", "Token contract analysis and verification"),
            ("/v1/token/holders", "Token holder distribution"),
            ("/v1/token/price", "Real-time token pricing"),
            ("/v1/token/global", "Global crypto statistics"),
            ("/v1/token/balance", "ETH balance lookup"),
            ("/v1/token/transactions", "Wallet transaction history"),
            ("/v1/token/nft", "NFT metadata fetcher"),
            
            # Web endpoints
            ("/v1/web/scrape", "Web scraper for structured content"),
            ("/v1/web/screenshot", "Website screenshot capture"),
            ("/v1/web/whois", "Domain WHOIS lookup"),
            ("/v1/web/headers", "HTTP headers checker"),
            ("/v1/web/ssl", "SSL certificate information"),
            ("/v1/web/geoip", "IP geolocation and ISP info"),
            ("/v1/web/dns", "DNS over HTTPS lookup"),
            
            # Data endpoints
            ("/v1/data/weather", "Current weather by coordinates"),
            ("/v1/data/forecast", "7-day weather forecast"),
            ("/v1/data/airquality", "Air quality data"),
            ("/v1/data/elevation", "Ground elevation data"),
            ("/v1/data/words", "Synonyms/antonyms/rhymes"),
            ("/v1/data/define", "Dictionary definitions"),
            ("/v1/data/ip", "IP address geolocation"),
            ("/v1/data/ua", "User-Agent parser"),
            ("/v1/data/hash", "Hash generator"),
            ("/v1/data/uuid", "UUID v4 generator"),
            ("/v1/data/qrcode", "QR code generator"),
            ("/v1/data/translate", "Text translation"),
            ("/v1/data/summarize", "Text summarizer"),
            
            # News endpoints
            ("/v1/news/hackernews", "Hacker News top stories"),
            ("/v1/news/hn-item", "Single HN item by id"),
            ("/v1/news/hn-user", "HN user profile and karma"),
            ("/v1/news/hn-feed", "HN Ask/Show/Jobs feeds"),
            ("/v1/news/reddit", "Reddit posts from any subreddit"),
            ("/v1/news/devto", "Dev.to articles"),
            
            # Forex endpoints
            ("/v1/forex/rates", "Fiat exchange rates"),
            ("/v1/forex/history", "Historical FX ranges"),
            ("/v1/forex/convert", "Currency conversion"),
            
            # DeFi endpoints
            ("/v1/defi/yields", "Top DeFi yield pools"),
            ("/v1/defi/stablecoins", "Stablecoin list with prices"),
            ("/v1/defi/fees", "Protocol fees and revenue"),
            ("/v1/defi/tvl", "Chain TVLs"),
            ("/v1/defi/protocols", "DeFi protocols by TVL"),
            ("/v1/defi/dexs", "DEX volume leaders"),
            ("/v1/defi/stablecoinchains", "Stable distribution by chain"),
            ("/v1/defi/stablecoin-history", "Stable circulation history"),
            ("/v1/defi/impermanent-loss", "Impermanent loss calculator"),
            ("/v1/defi/staking-apy", "Staking APY tracker"),
            
            # Crypto endpoints
            ("/v1/crypto/market", "Global crypto market data"),
            ("/v1/crypto/fear-greed", "Crypto Fear and Greed Index"),
            ("/v1/crypto/trending", "Trending coins"),
            ("/v1/crypto/ohlcv", "OHLCV candlestick data"),
            ("/v1/crypto/dominance", "Crypto dominance indices"),
            
            # Storage endpoints
            ("/v1/storage/drift", "Cross-RPC slot drift data"),
            
            # x402 Intelligence endpoints (free routes)
            ("/v1/x402/payments/recent", "Recent USDC transfers on Base"),
            ("/v1/x402/agent/{address}", "Wallet intelligence"),
            ("/v1/x402/analytics", "Network health analytics"),
            ("/v1/x402/top-agents", "Top USDC spenders leaderboard"),
            ("/v1/x402/base-stats", "Chain health snapshot"),
            ("/v1/x402/gas", "Gas price analysis"),
            ("/v1/x402/whales", "Large USDC transfer tracker"),
            ("/v1/x402/velocity", "Transfer frequency per hour"),
            ("/v1/x402/hourly", "Hourly volume breakdown"),
            ("/v1/x402/token/{address}", "ERC-20 token metadata"),
            ("/v1/x402/contracts", "Top USDC-receiving contracts"),
            ("/v1/x402/search", "Address or transaction lookup"),
            ("/v1/x402/history/{address}", "Transfer history for any wallet"),
            ("/v1/x402/compare", "Compare two wallets"),
            ("/v1/x402/risk/{address}", "Wallet risk score"),
            ("/v1/x402/stablecoins", "All stablecoin activity"),
            ("/v1/x402/mint-burn", "USDC supply changes"),
            ("/v1/x402/bridge", "Cross-chain bridge activity"),
            ("/v1/x402/defi-pulse", "DeFi protocol activity on Base"),
            ("/v1/x402/network", "Full network health dashboard"),
            
            # New v2.1 endpoints
            ("/v1/data/forecast", "Weather forecast"),
            ("/v1/data/airquality", "Air quality"),
            ("/v1/data/define", "Dictionary definitions"),
            ("/v1/data/elevation", "Elevation data"),
            ("/v1/data/words", "Synonyms/antonyms/rhymes"),
            ("/v1/data/ip", "IP geolocation"),
            ("/v1/data/ua", "User-Agent parser"),
            ("/v1/data/hash", "Hash generator"),
            ("/v1/data/uuid", "UUID generator"),
            ("/v1/data/qrcode", "QR code generator"),
            ("/v1/data/translate", "Text translation"),
            ("/v1/data/summarize", "Text summarizer"),
        ]
        
        for route, description in endpoints_to_check:
            self.endpoints[route] = description
            self.health_status[route] = EndpointHealth(
                route=route,
                status="unknown",
                last_checked=datetime.now(timezone.utc),
                response_time_ms=0.0,
                error_message="Not checked yet",
                consecutive_failures=0,
                total_checks=0,
                success_rate=1.0
            )

    async def check_endpoint(self, route: str) -> EndpointHealth:
        """Check health of a single endpoint."""
        url = f"{self.base_url}{route}"
        start_time = time.monotonic()
        status = "unknown"
        error_message = None
        
        try:
            async with httpx.AsyncClient(timeout=self.client_timeout) as client:
                response = await client.get(url)
                response_time = (time.monotonic() - start_time) * 1000
                
                if 200 <= response.status_code < 300:
                    status = "healthy"
                elif 500 <= response.status_code < 600:
                    status = "unhealthy"
                    error_message = f"HTTP {response.status_code}"
                else:
                    # 4xx errors might be expected (payment required, etc.)
                    status = "healthy"
                    
        except Exception as e:
            response_time = (time.monotonic() - start_time) * 1000
            status = "unhealthy"
            error_message = str(e)[:200]  # Truncate for readability

        # Update health status
        health = self.health_status[route]
        health.last_checked = datetime.now(timezone.utc)
        health.response_time_ms = response_time
        health.error_message = error_message
        health.total_checks += 1
        
        if status == "healthy":
            health.consecutive_failures = 0
            health.success_rate = (health.success_rate * (health.total_checks - 1) + 1.0) / health.total_checks
        else:
            health.consecutive_failures += 1
            health.success_rate = (health.success_rate * (health.total_checks - 1)) / health.total_checks
            
        health.status = status
        
        logger.info(f"Endpoint {route}: {status} ({response_time:.1f}ms)")
        
        return health

    async def check_all_endpoints(self) -> HealthCheckResult:
        """Check health of all endpoints concurrently."""
        logger.info("Starting comprehensive endpoint health check")
        
        # Create tasks for all endpoints
        tasks = []
        for route in self.endpoints:
            task = asyncio.create_task(self.check_endpoint(route))
            tasks.append((route, task))
        
        # Wait for all checks to complete
        results = []
        for route, task in tasks:
            try:
                health = await task
                results.append(health)
            except Exception as e:
                logger.error(f"Error checking endpoint {route}: {e}")
                # Mark as unhealthy
                health = self.health_status[route]
                health.status = "unhealthy"
                health.error_message = f"Check error: {e}"
                health.last_checked = datetime.now(timezone.utc)
                results.append(health)
        
        # Calculate overall statistics
        total_endpoints = len(results)
        healthy_endpoints = sum(1 for h in results if h.status == "healthy")
        unhealthy_endpoints = sum(1 for h in results if h.status == "unhealthy")
        unknown_endpoints = sum(1 for h in results if h.status == "unknown")
        
        average_response_time = (
            sum(h.response_time_ms for h in results if h.total_checks > 0) / total_endpoints
            if total_endpoints > 0 else 0.0
        )
        
        # Update health status with latest results
        for health in results:
            self.health_status[health.route] = health
        
        result = HealthCheckResult(
            timestamp=datetime.now(timezone.utc),
            total_endpoints=total_endpoints,
            healthy_endpoints=healthy_endpoints,
            unhealthy_endpoints=unhealthy_endpoints,
            unknown_endpoints=unknown_endpoints,
            average_response_time_ms=average_response_time,
            endpoint_healths=results,
        )
        
        logger.info(f"Health check complete: {healthy_endpoints}/{total_endpoints} healthy, "
                   f"avg response: {average_response_time:.1f}ms")
        
        return result

    async def start_continuous_monitoring(self):
        """Start continuous endpoint monitoring in the background."""
        self.is_running = True
        logger.info(f"Starting continuous endpoint monitoring (interval: {self.check_interval}s)")
        
        while self.is_running:
            try:
                await self.check_all_endpoints()
                await asyncio.sleep(self.check_interval)
            except Exception as e:
                logger.error(f"Error in endpoint monitoring loop: {e}")
                await asyncio.sleep(30)  # Wait before retrying

    def stop_monitoring(self):
        """Stop continuous monitoring."""
        self.is_running = False
        logger.info("Endpoint monitoring stopped")

    def get_current_health(self) -> Dict[str, Any]:
        """Get current health status of all endpoints."""
        healthy_routes = []
        unhealthy_routes = []
        unknown_routes = []
        
        for route, health in self.health_status.items():
            if health.status == "healthy":
                healthy_routes.append({
                    "route": route,
                    "description": self.endpoints.get(route, ""),
                    "response_time_ms": health.response_time_ms,
                    "last_checked": health.last_checked.isoformat(),
                    "success_rate": health.success_rate,
                    "consecutive_failures": health.consecutive_failures,
                })
            elif health.status == "unhealthy":
                unhealthy_routes.append({
                    "route": route,
                    "description": self.endpoints.get(route, ""),
                    "response_time_ms": health.response_time_ms,
                    "last_checked": health.last_checked.isoformat(),
                    "success_rate": health.success_rate,
                    "consecutive_failures": health.consecutive_failures,
                    "error": health.error_message,
                })
            else:
                unknown_routes.append({
                    "route": route,
                    "description": self.endpoints.get(route, ""),
                    "error": health.error_message,
                })
        
        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "summary": {
                "total_endpoints": len(self.health_status),
                "healthy_endpoints": len(healthy_routes),
                "unhealthy_endpoints": len(unhealthy_routes),
                "unknown_endpoints": len(unknown_routes),
                "overall_health": "healthy" if len(unhealthy_routes) == 0 else "unhealthy",
            },
            "healthy_endpoints": healthy_routes,
            "unhealthy_endpoints": unhealthy_routes,
            "unknown_endpoints": unknown_routes,
        }

    def get_failed_endpoints(self) -> List[Dict[str, Any]]:
        """Get list of endpoints that are currently unhealthy."""
        return [
            {
                "route": route,
                "description": self.endpoints.get(route, ""),
                "status": health.status,
                "last_checked": health.last_checked.isoformat(),
                "consecutive_failures": health.consecutive_failures,
                "success_rate": health.success_rate,
                "error": health.error_message,
            }
            for route, health in self.health_status.items()
            if health.status == "unhealthy"
        ]

    def get_endpoint_by_route(self, route: str) -> Optional[Dict[str, Any]]:
        """Get health status for a specific route."""
        if route not in self.health_status:
            return None
            
        health = self.health_status[route]
        return {
            "route": route,
            "description": self.endpoints.get(route, ""),
            "status": health.status,
            "last_checked": health.last_checked.isoformat(),
            "response_time_ms": health.response_time_ms,
            "error": health.error_message,
            "consecutive_failures": health.consecutive_failures,
            "total_checks": health.total_checks,
            "success_rate": health.success_rate,
        }

    def get_critical_endpoints(self) -> List[Dict[str, Any]]:
        """Get list of endpoints that have failed multiple times consecutively."""
        critical = []
        
        for route, health in self.health_status.items():
            if health.consecutive_failures >= 3:
                critical.append({
                    "route": route,
                    "description": self.endpoints.get(route, ""),
                    "status": health.status,
                    "consecutive_failures": health.consecutive_failures,
                    "last_checked": health.last_checked.isoformat(),
                    "error": health.error_message,
                    "success_rate": health.success_rate,
                })
        
        return critical
