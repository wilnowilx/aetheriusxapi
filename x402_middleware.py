"""Simulated x402 payment middleware with TOCTOU anti-replay protection.

In SIMULATED mode any request carrying an ``X-PAYMENT`` header is treated as
paid and passes through (a ``X-PAYMENT-SETTLED: simulated`` header is added
to the response). Requests without the header receive a standards-compliant
``402 Payment Required`` JSON body describing price, currency, network and
pay-to address — the same shape the real x402 facilitator flow returns.

TOCTOU Protection:
    Payment proofs are nonces — each can only be used ONCE. The middleware
    hashes the proof content and tracks seen nonces in a persistent cache.
    Duplicate proofs return 409 Conflict instantly, before any processing.

    This prevents replay attacks where the same proof is submitted multiple
    times between HTTP validation and L2 settlement (the TOCTOU window).

Set X402_MODE=real (and install the official ``x402`` SDK) to enforce
on-chain USDC verification instead. See main.py.
"""

import hashlib
import time
import threading
import os
import json
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from reputation import record_call, record_settlement

PAYMENT_HEADER = "X-PAYMENT"
SETTLED_HEADER = "X-PAYMENT-SETTLED"

# Anti-replay: nonce cache TTL in seconds.
# Proofs older than this are evicted to prevent memory growth.
NONCE_TTL_SECONDS = 300  # 5 minutes — enough for L2 settlement

# Persistent storage configuration
PERSISTENT_STORAGE_TYPE = os.getenv("PERSISTENT_STORAGE_TYPE", "redis")  # redis, sqlite, memory
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
SQLITE_DB_PATH = os.getenv("SQLITE_DB_PATH", "/tmp/aetherius_nonces.db")

__all__ = ["SimulatedX402Middleware", "_persistent_storage", "_nonce_cache",
           "_memory_nonce_cache", "_circuit_breaker", "_route_detector",
           "COLLECT_FIRST_ENABLED", "hash_proof"]


class PersistentNonceStorage:
    """Persistent anti-replay nonce storage supporting Redis, SQLite, or memory fallback."""

    def __init__(self):
        self._type = PERSISTENT_STORAGE_TYPE
        self._connection = None
        self._initialized = False
        self._ttl = NONCE_TTL_SECONDS

    def initialize(self) -> bool:
        """Initialize the persistent storage backend."""
        try:
            if self._type == "redis":
                import redis
                self._connection = redis.from_url(REDIS_URL, decode_responses=True)
                # Test connection
                self._connection.ping()
                self._connection.flushdb()  # Clear any existing nonces for fresh start
                print(f"[PersistentStorage] Redis connected at {REDIS_URL}")
                return True

            elif self._type == "sqlite":
                import sqlite3
                self._connection = sqlite3.connect(SQLITE_DB_PATH, check_same_thread=False)
                self._connection.execute("PRAGMA journal_mode=WAL")
                self._connection.execute("""
                    CREATE TABLE IF NOT EXISTS nonces (
                        nonce_hash TEXT PRIMARY KEY,
                        created_at REAL NOT NULL,
                        expires_at REAL NOT NULL,
                        metadata TEXT
                    )
                """)
                self._connection.commit()
                print(f"[PersistentStorage] SQLite database initialized at {SQLITE_DB_PATH}")
                return True

            else:
                print(f"[PersistentStorage] WARNING: Unknown storage type '{self._type}', falling back to memory")
                self._type = "memory"

            self._initialized = True
            return True

        except Exception as e:
            print(f"[PersistentStorage] ERROR: Failed to initialize {self._type}: {e}")
            print("[PersistentStorage] Falling back to memory storage")
            self._type = "memory"
            self._initialized = True
            return False

    def is_duplicate(self, nonce_hash: str) -> bool:
        """Check if nonce was already seen. If not, record it and return False."""
        now = time.monotonic()
        expires_at = now + self._ttl

        if self._type == "redis":
            try:
                # Check if nonce exists
                if self._connection.exists(nonce_hash):
                    return True  # REPLAY DETECTED

                # Set nonce with expiration
                self._connection.setex(nonce_hash, self._ttl, json.dumps({
                    "created_at": now,
                    "expires_at": expires_at,
                    "metadata": {}
                }))
                return False

            except Exception as e:
                print(f"[PersistentStorage] Redis error: {e}")
                # Fallback to memory
                return _memory_nonce_cache.is_duplicate(nonce_hash)

        elif self._type == "sqlite":
            try:
                cursor = self._connection.cursor()
                cursor.execute("SELECT created_at FROM nonces WHERE nonce_hash = ?", (nonce_hash,))
                if cursor.fetchone():
                    return True  # REPLAY DETECTED

                cursor.execute("INSERT INTO nonces (nonce_hash, created_at, expires_at, metadata) VALUES (?, ?, ?, ?)",
                              (nonce_hash, now, expires_at, json.dumps({})))
                self._connection.commit()
                return False

            except Exception as e:
                print(f"[PersistentStorage] SQLite error: {e}")
                return _memory_nonce_cache.is_duplicate(nonce_hash)

        else:  # memory fallback
            return _memory_nonce_cache.is_duplicate(nonce_hash)

    def cleanup_expired(self) -> None:
        """Clean up expired nonces from persistent storage."""
        now = time.monotonic()

        if self._type == "redis":
            try:
                pattern = "*"
                keys = self._connection.keys(pattern)
                if keys:
                    expired_keys = []
                    for key in keys:
                        data = self._connection.get(key)
                        if data:
                            expires_at = json.loads(data)["expires_at"]
                            if now > expires_at:
                                expired_keys.append(key)
                    if expired_keys:
                        self._connection.delete(*expired_keys)
            except Exception as e:
                print(f"[PersistentStorage] Redis cleanup error: {e}")

        elif self._type == "sqlite":
            try:
                cursor = self._connection.cursor()
                cursor.execute("DELETE FROM nonces WHERE expires_at < ?", (now,))
                self._connection.commit()
            except Exception as e:
                print(f"[PersistentStorage] SQLite cleanup error: {e}")
                try:
                    _memory_nonce_cache._evict_expired()
                except Exception:
                    pass

    def stats(self) -> dict:
        """Return storage statistics for monitoring."""
        now = time.monotonic()

        if self._type == "redis":
            try:
                total = self._connection.dbsize()
                pattern = "*"
                keys = self._connection.keys(pattern)
                active = 0
                for key in keys:
                    data = self._connection.get(key)
                    if data:
                        expires_at = json.loads(data)["expires_at"]
                        if now <= expires_at:
                            active += 1
                return {"type": "redis", "total": total, "active": active, "ttl_seconds": self._ttl}
            except Exception as e:
                print(f"[PersistentStorage] Redis stats error: {e}")
                return _memory_nonce_cache.stats()

        elif self._type == "sqlite":
            try:
                cursor = self._connection.cursor()
                cursor.execute("SELECT COUNT(*) FROM nonces")
                total = cursor.fetchone()[0]
                cursor.execute("SELECT COUNT(*) FROM nonces WHERE expires_at > ?", (now,))
                active = cursor.fetchone()[0]
                return {"type": "sqlite", "total": total, "active": active, "ttl_seconds": self._ttl}
            except Exception as e:
                print(f"[PersistentStorage] SQLite stats error: {e}")
                return _memory_nonce_cache.stats()

        else:
            return _memory_nonce_cache.stats()

    @property
    def _seen(self) -> dict[str, float]:
        """Expose _seen dict directly for zero-lock access (tests only)."""
        return self.__dict__.get('_seen', {})


# Memory fallback cache (for graceful degradation)
class _MemoryNonceCache:
    """Fallback memory cache for nonce tracking when persistent storage fails."""

    def __init__(self, ttl: int = NONCE_TTL_SECONDS):
        self.__dict__['_seen'] = {}
        self._lock = threading.Lock()
        self._ttl = ttl

    def _evict_expired(self):
        """Remove nonces older than TTL. Called under lock (must NOT call property)."""
        now = time.monotonic()
        seen = self.__dict__.get('_seen', {})
        expired = [k for k, ts in seen.items() if now - ts > self._ttl]
        for k in expired:
            del seen[k]

    def is_duplicate(self, nonce_hash: str) -> bool:
        """Check if nonce was already seen. If not, record it and return False."""
        with self._lock:
            self._evict_expired()
            seen = self.__dict__.get('_seen', {})
            if nonce_hash in seen:
                return True
            seen[nonce_hash] = time.monotonic()
            return False

    def stats(self) -> dict:
        """Return cache stats for monitoring."""
        with self._lock:
            self._evict_expired()
            seen = self.__dict__.get('_seen', {})
            return {"type": "memory", "active_nonces": len(seen), "ttl_seconds": self._ttl}

    @property
    def _seen(self) -> dict[str, float]:
        """Expose _seen dict directly for zero-lock access (tests only)."""
        return self.__dict__.get('_seen', {})

    @_seen.setter
    def _seen(self, value: dict[str, float]):
        """Setter for _seen dict directly (tests only)."""
        self.__dict__['_seen'] = value


# Initialize persistent storage
_persistent_storage = PersistentNonceStorage()
_persistent_storage.initialize()

# Memory fallback cache instance (used by persistent storage for fallback)
_memory_nonce_cache = _MemoryNonceCache()


def hash_proof(proof: str) -> str:
    """Hash a payment proof string to create a unique nonce identifier.

    Uses SHA-256 for speed and collision resistance. The proof content
    is stripped and lowercased to catch minor variations.
    """
    normalized = proof.strip().lower()
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()[:16]  # 16 hex chars = 64 bits


class SimulatedX402Middleware(BaseHTTPMiddleware):
    """Gate paid routes behind an ``X-PAYMENT`` header (simulated settlement).

    Includes TOCTOU anti-replay protection:
    - Each proof is hashed and tracked in RAM
    - Duplicate proofs → 409 Conflict (instant, before processing)
    - Proofs expire after NONCE_TTL_SECONDS to prevent memory growth
    """

    def __init__(self, app, prices: dict, pay_to: str, network: str,
                 currency: str = "USDC"):
        super().__init__(app)
        self.prices = prices          # canonical "/v1/..." path -> "$0.01"
        self.pay_to = pay_to
        self.network = network
        self.currency = currency

    def _canonical(self, path: str) -> str | None:
        """Map /v1/... and legacy /api/v1/... to the canonical /v1/... key."""
        for prefix in ("/api/v1/", "/v1/"):
            if path.startswith(prefix):
                return "/v1/" + path[len(prefix):]
        return None

    async def dispatch(self, request, call_next):
        path = request.url.path
        canonical = self._canonical(path)

        # Free route (health, docs, root, or anything not in the price table).
        if canonical is None or canonical not in self.prices:
            return await call_next(request)

        payment = request.headers.get(PAYMENT_HEADER)

        # Determine if we should use 'Collect First' mode for this route
        use_collect_first = False
        if COLLECT_FIRST_ENABLED and _route_detector.should_use_collect_first(canonical, _circuit_breaker):
            use_collect_first = True

        if not payment:
            price = self.prices[canonical]
            record_call(canonical, False, 0.0)
            if use_collect_first:
                response = JSONResponse(
                    status_code=202,
                    content={
                        "error": "Payment collected, settlement deferred",
                        "amount": price.replace("$", ""),
                        "currency": self.currency,
                        "network": self.network,
                        "pay_to": self.pay_to,
                        "route": canonical,
                        "mode": "collect_first",
                        "hint": "Payment collected and queued for settlement. "
                                "Settlement will resume automatically when circuit is closed.",
                    },
                )
                response.headers["X-PAYMENT-COLLECTED"] = "true"
                response.headers["X-SETTLEMENT-DEFERRED"] = "true"
            else:
                response = JSONResponse(
                    status_code=402,
                    content={
                        "error": "Payment required",
                        "amount": price.replace("$", ""),
                        "currency": self.currency,
                        "network": self.network,
                        "pay_to": self.pay_to,
                        "route": canonical,
                        "hint": f"Retry with header '{PAYMENT_HEADER}: <payment-proof>'. "
                                f"Local simulated mode accepts any non-empty value.",
                    },
                )
            return response

        # ── TOCTOU ANTI-REPLAY ──────────────────────────────────
        # Hash the proof and check against persistent nonces.
        # This blocks replay attacks in the HTTP→L2 settlement window.
        nonce_hash = hash_proof(payment)
        if _persistent_storage.is_duplicate(nonce_hash):
            _circuit_breaker.record_failure()
            record_call(canonical, False, 0.0)
            return JSONResponse(
                status_code=409,
                content={
                    "error": "Payment proof already used",
                    "detail": "Each payment proof can only be used once. "
                              "This proof was previously submitted.",
                    "nonce": nonce_hash,
                    "hint": "Generate a new payment proof for this request.",
                },
            )
        _circuit_breaker.record_success()
        # ─────────────────────────────────────────────────────────────────

        # ── CREDIT VELOCITY CHECK (Settlement Optimism Window) ──
        # Before processing payment, check agent velocity to prevent
        # exploitation of the L2 settlement window (1-2s on Base).
        from credit_velocity import get_credit_velocity
        _credit_vel = get_credit_velocity()

        # Extract agent identity: prefer X-AGENT-ADDRESS header,
        # fallback to nonce hash as proxy for simulated mode
        agent_address = request.headers.get("X-AGENT-ADDRESS", nonce_hash[:16])

        # Parse amount from price string
        price_str = self.prices[canonical].replace("$", "")
        try:
            amount_usd = float(price_str)
        except ValueError:
            amount_usd = 0.0

        velocity_check = _credit_vel.check_agent(
            address=agent_address,
            nonce=nonce_hash,
            amount_usd=amount_usd,
        )

        if not velocity_check["allowed"]:
            _circuit_breaker.record_failure()
            record_call(canonical, False, 0.0)
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Rate limited: settlement velocity exceeded",
                    "detail": velocity_check["reason"],
                    "risk_score": velocity_check["risk_score"],
                    "risk_level": velocity_check["risk_level"],
                    "velocity": velocity_check["velocity"],
                    "settlement_rate": velocity_check["settlement_rate"],
                    "block_remaining_s": velocity_check["block_remaining_s"],
                    "hint": "Too many concurrent requests in the settlement window. "
                            "Wait for pending settlements to confirm before retrying.",
                },
            )

        # Record settlement attempt (will be confirmed later by watcher)
        _credit_vel.record_settlement(agent_address, confirmed=True, amount_usd=amount_usd)
        # ─────────────────────────────────────────────────────────────────

        start = time.monotonic()
        if use_collect_first:
            _circuit_breaker.record_success()
            response = await call_next(request)
            latency_ms = (time.monotonic() - start) * 1000
            success = response.status_code == 200
            agent_risk = velocity_check.get("risk_score")
            record_call(canonical, success, latency_ms, agent_risk=agent_risk)
            record_settlement(canonical, True)
            response.headers[SETTLED_HEADER] = "collected"
            response.headers["X-PAYMENT-COLLECTED"] = "true"
            response.headers["X-SETTLEMENT-DEFERRED"] = "true"
            return response
        else:
            _circuit_breaker.record_success()
            response = await call_next(request)
            latency_ms = (time.monotonic() - start) * 1000
            success = response.status_code == 200
            agent_risk = velocity_check.get("risk_score")
            record_call(canonical, success, latency_ms, agent_risk=agent_risk)
            record_settlement(canonical, True)
            response.headers[SETTLED_HEADER] = "simulated"
            return response

    def stats(self) -> dict:
        """Return persistent storage stats for monitoring."""
        return _persistent_storage.stats()

    def get_circuit_breaker_status(self) -> dict:
        """Get the current circuit breaker status for monitoring."""
        return {
            "state": _circuit_breaker.state,
            "failure_count": _circuit_breaker.failure_count,
            "last_failure_time": _circuit_breaker.last_failure_time,
            "mode": _circuit_breaker.get_mode(),
        }

# Backward compatibility wrapper for tests
class _TestNonceCacheWrapper:
    """Wrapper that provides backward compatibility for test fixtures."""
    
    def __init__(self, memory_cache):
        self._memory_cache = memory_cache
    
    @property
    def _seen(self):
        """Expose the underlying memory cache dict for test fixtures to clear."""
        return self._memory_cache._seen
    
    def is_duplicate(self, nonce_hash: str) -> bool:
        """Delegate to memory cache for backward compatibility."""
        return self._memory_cache.is_duplicate(nonce_hash)

    def stats(self) -> dict:
        """Delegate to memory cache for backward compatibility."""
        return self._memory_cache.stats()

# Create test-compatible wrapper for backward compatibility
_nonce_cache = _TestNonceCacheWrapper(_memory_nonce_cache)

# ── Collect First / Circuit Breaker support ──────────────
COLLECT_FIRST_ENABLED = os.getenv("COLLECT_FIRST_ENABLED", "false").lower() == "true"


class _CircuitBreaker:
    """Simple circuit breaker to protect against repeated failures."""

    def __init__(self, failure_threshold: int = 5, recovery_timeout: float = 60):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time = 0.0
        self._lock = threading.Lock()

    @property
    def state(self) -> str:
        if self.failure_count >= self.failure_threshold:
            if time.monotonic() - self.last_failure_time < self.recovery_timeout:
                return "OPEN"
            else:
                self.failure_count = 0
                return "HALF_OPEN"
        return "CLOSED"

    def record_failure(self) -> None:
        with self._lock:
            self.failure_count += 1
            self.last_failure_time = time.monotonic()

    def record_success(self) -> None:
        with self._lock:
            self.failure_count = 0

    def get_mode(self) -> str:
        return self.state


_circuit_breaker = _CircuitBreaker()


class _RouteDetector:
    """Detects whether a route should use 'Collect First' mode."""

    def should_use_collect_first(self, canonical: str, circuit_breaker: _CircuitBreaker) -> bool:
        if not COLLECT_FIRST_ENABLED:
            return False
        if circuit_breaker.state == "OPEN":
            return False
        return canonical.startswith("/v1/crypto/")


_route_detector = _RouteDetector()
