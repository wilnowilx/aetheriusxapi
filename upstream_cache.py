"""
Upstream Cache — TTL-based caching for external API calls.

Saves ~370ms per CoinGecko request, ~1,900ms per DefiLlama request.
The second request to the same endpoint is instant (in-memory hit).

Usage:
  from upstream_cache import cached_get

  # Instead of:
  # async with httpx.AsyncClient() as client:
  #     resp = await client.get("https://api.coingecko.com/api/v3/...")

  # Use:
  data = await cached_get("https://api.coingecko.com/api/v3/...", ttl=30)
"""

import time
import logging
from typing import Optional, Any
from dataclasses import dataclass, field

import httpx

logger = logging.getLogger("upstream_cache")


@dataclass
class CacheEntry:
    """Single cached response."""
    data: Any
    timestamp: float
    status_code: int
    ttl: float

    def is_expired(self) -> bool:
        return (time.time() - self.timestamp) > self.ttl


@dataclass
class UpstreamCache:
    """
    TTL-based cache for upstream HTTP responses.

    Saves hundreds of milliseconds on repeated calls to CoinGecko, DefiLlama, etc.
    Memory footprint: ~1MB per 1000 cached responses.
    """
    default_ttl: float = 30.0       # 30 seconds default
    max_entries: int = 500          # Max cached responses
    _cache: dict = field(default_factory=dict)
    _hits: int = 0
    _misses: int = 0

    async def get(
        self,
        url: str,
        ttl: Optional[float] = None,
        headers: Optional[dict] = None,
        timeout: float = 10.0,
    ) -> tuple[Any, int, bool]:
        """
        Fetch with caching. Returns (data, status_code, from_cache).
        """
        effective_ttl = ttl or self.default_ttl
        cache_key = url

        # Check cache
        if cache_key in self._cache:
            entry = self._cache[cache_key]
            if not entry.is_expired():
                self._hits += 1
                logger.debug(f"Cache HIT: {url} (age: {time.time() - entry.timestamp:.1f}s)")
                return entry.data, entry.status_code, True
            else:
                del self._cache[cache_key]

        # Cache miss — fetch from upstream
        self._misses += 1
        logger.debug(f"Cache MISS: {url}")

        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.get(url, headers=headers)
                data = resp.json() if "json" in resp.headers.get("content-type", "") else resp.text

                # Store in cache
                self._cache[cache_key] = CacheEntry(
                    data=data,
                    timestamp=time.time(),
                    status_code=resp.status_code,
                    ttl=effective_ttl,
                )

                # Evict oldest if over limit
                if len(self._cache) > self.max_entries:
                    oldest_key = min(self._cache, key=lambda k: self._cache[k].timestamp)
                    del self._cache[oldest_key]

                return data, resp.status_code, False

        except Exception as e:
            logger.error(f"Upstream error: {url} — {e}")
            return {"error": str(e)}, 502, False

    def get_stats(self) -> dict:
        """Cache performance stats."""
        total = self._hits + self._misses
        hit_rate = (self._hits / total * 100) if total > 0 else 0
        return {
            "entries": len(self._cache),
            "hits": self._hits,
            "misses": self._misses,
            "hit_rate": f"{hit_rate:.1f}%",
        }


# ── Singleton instance ──────────────────────────────────────────────
_cache = UpstreamCache()


async def cached_get(
    url: str,
    ttl: float = 30.0,
    headers: Optional[dict] = None,
    timeout: float = 10.0,
) -> tuple[Any, int, bool]:
    """Module-level shortcut for cached GET."""
    return await _cache.get(url, ttl=ttl, headers=headers, timeout=timeout)


def cache_stats() -> dict:
    """Module-level shortcut for stats."""
    return _cache.get_stats()


# ── Integration example ──────────────────────────────────────────────
"""
In main.py, replace upstream calls:

OLD:
    async with httpx.AsyncClient() as client:
        resp = await client.get("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin")
        data = resp.json()

NEW:
    from upstream_cache import cached_get
    data, status, from_cache = await cached_get(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin",
        ttl=30
    )
    if from_cache:
        # Served from cache — 0ms upstream latency
        pass
"""
