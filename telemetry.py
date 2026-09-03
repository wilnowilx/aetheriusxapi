"""Real request telemetry for aetheriusxAPI (in-memory, no dependencies).

Every API response flows through :class:`TelemetryMiddleware`, which records
route, final status, latency, price-volume and optional wallet identity into
a process-global :class:`Tracker`. ``GET /v1/telemetry`` serves the snapshot
for free — it is the public proof layer (status page, dashboards, grants).

Design notes:
  - The telemetry middleware must be added AFTER the x402 middleware:
    Starlette's add_middleware() inserts at position 0, so last-added sits
    outermost and observes the final status (200 paid vs 402 challenge).
  - ``/v1/telemetry`` itself is never recorded (dashboard polls would inflate
    the counters). Non-API paths (dashboard assets, docs) are ignored too.
  - Volume counts only settled 200s on priced routes: sum(price) in USDC.
  - Wallet identity comes from the optional ``X-Wallet`` header (see API.md).
    The set is capped to bound memory.
"""

import time
from collections import deque
from datetime import datetime, timezone

from starlette.middleware.base import BaseHTTPMiddleware

MAX_EVENTS = 50
MAX_LAT_SAMPLES = 24
MAX_WALLETS = 10000


def canonical_route(path: str) -> str | None:
    """Map /v1/... and legacy /api/v1/... to the canonical /v1/... key."""
    for prefix in ("/api/v1/", "/v1/"):
        if path.startswith(prefix):
            return "/v1/" + path[len(prefix):]
    return None


class Tracker:
    def __init__(self, prices: dict):
        self.started_at = time.time()
        self.prices = prices  # canonical route -> "$0.01"
        self.total = 0
        self.ok = 0
        self.n402 = 0
        self.err = 0
        self.lat_sum = 0.0
        self.volume = 0.0
        self.per: dict[str, dict] = {}
        self.lat = deque(maxlen=MAX_LAT_SAMPLES)
        self.events = deque(maxlen=MAX_EVENTS)
        self.wallets = set()

    def price_of(self, canonical: str) -> float:
        try:
            return float(self.prices.get(canonical, "$0").replace("$", ""))
        except Exception:
            return 0.0

    def record(self, path: str, status: int, latency_ms: float,
               wallet: str | None = None) -> None:
        canon = canonical_route(path)
        if canon is None:
            return  # not an API route (dashboard assets, docs, …)
        if canon in ("/v1/telemetry",):
            return  # never count the telemetry probe itself
        key = canon if canon in self.prices else path
        priced = key in self.prices

        self.total += 1
        if status == 402:
            self.n402 += 1
            cat = "n402"
        elif 200 <= status < 400:
            self.ok += 1
            cat = "ok"
        else:
            self.err += 1
            cat = "err"

        self.lat_sum += latency_ms
        self.lat.append(round(latency_ms, 1))

        entry = self.per.setdefault(
            key, {"calls": 0, "ok_200": 0, "n402": 0, "errors": 0,
                  "lat_ms": 0.0, "volume_usdc": 0.0})
        entry["calls"] += 1
        entry["lat_ms"] += latency_ms
        if cat == "ok" and status == 200:
            entry["ok_200"] += 1
            if priced:
                amount = self.price_of(key)
                entry["volume_usdc"] += amount
                self.volume += amount
        elif cat == "n402":
            entry["n402"] += 1
        else:
            entry["errors"] += 1

        if wallet and len(self.wallets) < MAX_WALLETS:
            self.wallets.add(wallet)

        self.events.appendleft({
            "t": datetime.now(timezone.utc).strftime("%H:%M:%S"),
            "route": key,
            "status": status,
            "latency_ms": round(latency_ms, 1),
        })

    def snapshot(self, **meta) -> dict:
        per = {}
        for route, e in self.per.items():
            per[route] = {
                "calls": e["calls"],
                "ok_200": e["ok_200"],
                "n402": e["n402"],
                "errors": e["errors"],
                "avg_latency_ms": round(e["lat_ms"] / e["calls"], 1) if e["calls"] else 0,
                "volume_usdc": round(e["volume_usdc"], 4),
            }
        return {
            "service": "aetheriusxAPI",
            "uptime_s": round(time.time() - self.started_at, 1),
            "started_at": datetime.fromtimestamp(
                self.started_at, tz=timezone.utc).isoformat(),
            "totals": {
                "calls": self.total,
                "ok_200": self.ok,
                "challenges_402": self.n402,
                "errors": self.err,
                "avg_latency_ms": round(self.lat_sum / self.total, 1) if self.total else 0,
                "volume_usdc": round(self.volume, 4),
            },
            "wallets_seen": len(self.wallets),
            "recent_latency_ms": list(self.lat),
            "per_endpoint": per,
            "recent_events": list(self.events),
            **meta,
        }


class TelemetryMiddleware(BaseHTTPMiddleware):
    """Outermost middleware: record final status + latency of every API call."""

    def __init__(self, app, tracker: Tracker):
        super().__init__(app)
        self.tracker = tracker

    async def dispatch(self, request, call_next):
        t0 = time.perf_counter()
        try:
            response = await call_next(request)
            status = response.status_code
        except Exception:
            self.tracker.record(request.url.path, 500,
                                (time.perf_counter() - t0) * 1000,
                                request.headers.get("X-Wallet"))
            raise
        self.tracker.record(request.url.path, status,
                            (time.perf_counter() - t0) * 1000,
                            request.headers.get("X-Wallet"))
        return response
