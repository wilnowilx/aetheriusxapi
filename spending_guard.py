"""
Spending Guard — Wallet-balance-aware payment gating for AETHERIUS.

Solves the problem Martin Casais identified in x402:
  "maxAmountPerPayment is per-request, not cumulative. An agent in a loop
   can drain thousands of dollars without anyone stopping it because the
   protocol is stateless — it doesn't add."

Solution: Check the wallet's actual USDC balance BEFORE processing payment.
When balance drops below a threshold, reject the request with a clear message.
The wallet IS the spending limit. No patches, no flags, no accumulation bugs.

Usage:
  from spending_guard import SpendingGuard

  guard = SpendingGuard(
      wallet="0x677B483128D0399bCD0A5AB36eE990C0246d7f61",
      min_balance_usd=1.0,      # Reject if balance < $1
      daily_limit_usd=50.0,     # Hard daily cap
      alert_balance_usd=5.0,    # Warning threshold
  )

  # In middleware:
  ok, reason = await guard.check(expected_cost_usd=0.008)
  if not ok:
      return JSONResponse(status_code=402, content={"error": reason})

  # After successful payment:
  guard.record_spend(amount_usd=0.008)
"""

import time
import logging
from dataclasses import dataclass, field
from typing import Optional

import httpx

logger = logging.getLogger("spending_guard")


@dataclass
class DailySpend:
    """Tracks spending within a 24-hour window."""
    total_usd: float = 0.0
    window_start: float = field(default_factory=time.time)
    request_count: int = 0

    def is_expired(self, window_seconds: float = 86400) -> bool:
        return (time.time() - self.window_start) > window_seconds

    def reset(self):
        self.total_usd = 0.0
        self.window_start = time.time()
        self.request_count = 0


@dataclass
class SpendingGuard:
    """
    Wallet-balance-aware payment gating.

    The core insight: x402's maxAmountPerPayment is per-request.
    The only real spending limit is the wallet balance itself.
    This guard checks it before every payment.
    """
    wallet: str
    min_balance_usd: float = 1.0        # Minimum USDC balance to allow payments
    daily_limit_usd: float = 50.0        # Hard daily cap (cumulative)
    alert_balance_usd: float = 5.0       # Warning threshold
    check_balance: bool = True           # Whether to query on-chain balance
    rpc_url: str = "https://mainnet.base.org"

    # Internal state
    _daily: DailySpend = field(default_factory=DailySpend)
    _last_balance_check: float = 0.0
    _cached_balance: Optional[float] = None
    _balance_cache_ttl: float = 30.0     # Cache balance for 30 seconds

    async def get_usdc_balance(self) -> float:
        """
        Query USDC balance on Base Mainnet via free RPC.
        Uses Base public RPC — no API key needed.
        """
        now = time.time()

        # Return cached balance if fresh
        if self._cached_balance is not None and (now - self._last_balance_check) < self._balance_cache_ttl:
            return self._cached_balance

        # USDC contract on Base Mainnet
        usdc_contract = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"

        # balanceOf(address) selector
        padded_wallet = self.wallet.lower().replace("0x", "").zfill(64)
        data = f"0x70a08231{padded_wallet}"

        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "eth_call",
            "params": [
                {"to": usdc_contract, "data": data},
                "latest"
            ]
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(self.rpc_url, json=payload)
                result = resp.json()

                if "result" in result:
                    # USDC has 6 decimals
                    raw_balance = int(result["result"], 16)
                    balance_usd = raw_balance / 1_000_000

                    self._cached_balance = balance_usd
                    self._last_balance_check = now

                    logger.info(f"Wallet {self.wallet[:10]}... balance: ${balance_usd:.2f} USDC")
                    return balance_usd
                else:
                    logger.warning(f"RPC error: {result.get('error', 'unknown')}")
                    return self._cached_balance or 0.0

        except Exception as e:
            logger.error(f"Balance check failed: {e}")
            return self._cached_balance or 0.0

    async def check(self, expected_cost_usd: float = 0.0) -> tuple[bool, str]:
        """
        Pre-payment check: should we allow this payment?

        Returns (allowed, reason):
          (True, "") — payment allowed
          (False, "reason") — payment rejected
        """
        # 1. Reset daily window if expired
        if self._daily.is_expired():
            logger.info(f"Daily window reset. Previous: ${self._daily.total_usd:.2f} ({self._daily.request_count} requests)")
            self._daily.reset()

        # 2. Check daily limit (cumulative)
        if self._daily.total_usd + expected_cost_usd > self.daily_limit_usd:
            remaining = max(0, self.daily_limit_usd - self._daily.total_usd)
            reason = (
                f"Daily spending limit reached. "
                f"Spent: ${self._daily.total_usd:.2f}/{self.daily_limit_usd:.2f} today. "
                f"Remaining: ${remaining:.2f}. "
                f"This limit exists because x402's maxAmountPerPayment is per-request, "
                f"not cumulative. The wallet IS the spending limit."
            )
            logger.warning(reason)
            return False, reason

        # 3. Check on-chain wallet balance
        if self.check_balance:
            balance = await self.get_usdc_balance()

            if balance < self.min_balance_usd:
                reason = (
                    f"Wallet balance too low. "
                    f"Balance: ${balance:.2f} USDC. "
                    f"Minimum: ${self.min_balance_usd:.2f}. "
                    f"The wallet IS the spending limit — when funds run out, the loop stops."
                )
                logger.warning(reason)
                return False, reason

            if balance < self.alert_balance_usd:
                logger.warning(
                    f"Low balance alert: ${balance:.2f} USDC "
                    f"(threshold: ${self.alert_balance_usd:.2f})"
                )

            if balance < expected_cost_usd:
                reason = (
                    f"Insufficient balance for this request. "
                    f"Balance: ${balance:.2f}. Cost: ${expected_cost_usd:.2f}. "
                    f"The wallet IS the spending limit."
                )
                logger.warning(reason)
                return False, reason

        # 4. All checks passed
        return True, ""

    def record_spend(self, amount_usd: float):
        """Record a successful spend against the daily window."""
        self._daily.total_usd += amount_usd
        self._daily.request_count += 1

        logger.info(
            f"Spend recorded: ${amount_usd:.4f}. "
            f"Daily total: ${self._daily.total_usd:.4f}/{self.daily_limit_usd:.2f}. "
            f"Requests today: {self._daily.request_count}"
        )

    def get_status(self) -> dict:
        """Get current spending status (for dashboard/telemetry)."""
        return {
            "wallet": self.wallet,
            "daily_spent_usd": round(self._daily.total_usd, 4),
            "daily_limit_usd": self.daily_limit_usd,
            "daily_remaining_usd": round(max(0, self.daily_limit_usd - self._daily.total_usd), 4),
            "daily_requests": self._daily.request_count,
            "min_balance_usd": self.min_balance_usd,
            "alert_balance_usd": self.alert_balance_usd,
            "cached_balance_usd": round(self._cached_balance, 2) if self._cached_balance is not None else None,
        }


# ── Integration example ──────────────────────────────────────────────
# In main.py, wrap the x402 middleware:

"""
from spending_guard import SpendingGuard

# Initialize guard
guard = SpendingGuard(
    wallet="0x677B483128D0399bCD0A5AB36eE990C0246d7f61",
    min_balance_usd=1.0,
    daily_limit_usd=50.0,
    alert_balance_usd=5.0,
)

# Before x402 payment processing:
@app.middleware("http")
async def spending_guard_middleware(request: Request, call_next):
    # Only guard paid routes
    if request.url.path in X402_ROUTES:
        expected_cost = PRICES.get(request.url.path, 0)
        allowed, reason = await guard.check(expected_cost_usd=expected_cost)

        if not allowed:
            return JSONResponse(
                status_code=402,
                content={
                    "error": "Spending limit",
                    "reason": reason,
                    "wallet": guard.wallet,
                    "daily_remaining": guard.get_status()["daily_remaining_usd"],
                }
            )

    response = await call_next(request)

    # Record spend on successful 200
    if response.status_code == 200 and request.url.path in X402_ROUTES:
        guard.record_spend(PRICES.get(request.url.path, 0))

    return response
"""
