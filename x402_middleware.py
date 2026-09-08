"""Simulated x402 payment middleware with TOCTOU anti-replay protection.

In SIMULATED mode any request carrying an ``X-PAYMENT`` header is treated as
paid and passes through (a ``X-PAYMENT-SETTLED: simulated`` header is added
to the response). Requests without the header receive a standards-compliant
``402 Payment Required`` JSON body describing price, currency, network and
pay-to address — the same shape the real x402 facilitator flow returns.

TOCTOU Protection:
    Payment proofs are nonces — each can only be used ONCE. The middleware
    hashes the proof content and tracks seen nonces in a RAM-based cache.
    Duplicate proofs return 409 Conflict instantly, before any processing.

    This prevents replay attacks where the same proof is submitted multiple
    times between HTTP validation and L2 settlement (the TOCTOU window).

Set X402_MODE=real (and install the official ``x402`` SDK) to enforce
on-chain USDC verification instead. See main.py.
"""

import hashlib
import time
import threading
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

PAYMENT_HEADER = "X-PAYMENT"
SETTLED_HEADER = "X-PAYMENT-SETTLED"

# Anti-replay: nonce cache TTL in seconds.
# Proofs older than this are evicted to prevent memory growth.
NONCE_TTL_SECONDS = 300  # 5 minutes — enough for L2 settlement


class NonceCache:
    """Thread-safe RAM cache for tracking seen payment nonces.

    Each nonce (hash of proof content) is stored with a timestamp.
    Eviction: nonces older than NONCE_TTL_SECONDS are purged on access.
    """

    def __init__(self, ttl: int = NONCE_TTL_SECONDS):
        self._seen: dict[str, float] = {}  # nonce_hash -> timestamp
        self._lock = threading.Lock()
        self._ttl = ttl

    def _evict_expired(self):
        """Remove nonces older than TTL. Called under lock."""
        now = time.monotonic()
        expired = [k for k, ts in self._seen.items() if now - ts > self._ttl]
        for k in expired:
            del self._seen[k]

    def is_duplicate(self, nonce_hash: str) -> bool:
        """Check if nonce was already seen. If not, record it and return False."""
        with self._lock:
            self._evict_expired()
            if nonce_hash in self._seen:
                return True  # REPLAY DETECTED
            self._seen[nonce_hash] = time.monotonic()
            return False

    def stats(self) -> dict:
        """Return cache stats for monitoring."""
        with self._lock:
            self._evict_expired()
            return {"active_nonces": len(self._seen), "ttl_seconds": self._ttl}


# Global singleton — survives across requests in same process
_nonce_cache = NonceCache()


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
        if not payment:
            price = self.prices[canonical]
            return JSONResponse(
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

        # ── TOCTOU ANTI-REPLAY ──────────────────────────────────────────
        # Hash the proof and check against seen nonces.
        # This blocks replay attacks in the HTTP→L2 settlement window.
        nonce_hash = hash_proof(payment)
        if _nonce_cache.is_duplicate(nonce_hash):
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
        # ─────────────────────────────────────────────────────────────────

        response = await call_next(request)
        response.headers[SETTLED_HEADER] = "simulated"
        return response
