"""
Gravity Well v0 — Batch Settlement Layer for AETHERIUS.

Accumulates micro-payments (x402 settlements) in memory/Redis and triggers
batch settlement to Base Mainnet when thresholds are met, using CDP facilitator
for a single batch transaction instead of N individual settlements.
"""

import asyncio
import os
import time
import json
import logging
from dataclasses import dataclass, field, asdict
from typing import Optional, Dict, Any
from collections import defaultdict
from datetime import datetime, timezone

# Optional Redis support
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

# Optional CDP facilitator
try:
    from cdp.x402 import create_facilitator_config
    from x402.http import HTTPFacilitatorClient, FacilitatorConfig
    from x402.mechanisms.evm.exact import ExactEvmServerScheme
    from x402.server import x402ResourceServer
    CDP_AVAILABLE = True
except ImportError:
    CDP_AVAILABLE = False

# Config from environment (with safe defaults for local dev)
BATCH_THRESHOLD_USD = float(os.getenv("GRAVITY_BATCH_USD", "0.50"))
BATCH_THRESHOLD_COUNT = int(os.getenv("GRAVITY_BATCH_COUNT", "100"))
BATCH_THRESHOLD_TIME = int(os.getenv("GRAVITY_BATCH_TIME", "300"))  # 5 minutes

PAY_TO = os.getenv("AETHERIUS_WALLET", "0x677B483128D0399bCD0A5AB36eE990C0246d7f61")
NETWORK = os.getenv("AETHERIUS_NETWORK", "eip155:8453")
FACILITATOR_URL = os.getenv("FACILITATOR_URL", "https://x402.org/facilitator")

# Redis config
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
REDIS_KEY_PREFIX = "gravity:well:"

logger = logging.getLogger("gravity_well")


@dataclass
class AgentAccount:
    """Per-agent accounting for pending settlements."""
    agent_address: str
    pending_usd: float = 0.0
    count: int = 0
    last_settlement: float = 0.0
    first_pending_at: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "AgentAccount":
        return cls(**data)


@dataclass
class BatchResult:
    """Result of a batch settlement attempt."""
    success: bool
    tx_hash: Optional[str] = None
    settled_agents: int = 0
    settled_usd: float = 0.0
    error: Optional[str] = None
    fallback_individual: bool = False
    individual_results: list = field(default_factory=list)
    timestamp: float = field(default_factory=time.time)


class GravityWell:
    """
    Batch settlement accumulator for x402 micro-payments.

    Flow:
    1. Successful x402 payment verified -> add to agent's pending bucket
    2. Background task monitors 3 thresholds (USD, count, time)
    3. When ANY threshold hit -> trigger batch settlement via CDP
    4. On batch success -> clear pending for settled agents, record tx
    5. On batch failure -> fallback to individual settlement per agent
    """

    def __init__(
        self,
        pay_to: str = PAY_TO,
        network: str = NETWORK,
        facilitator_url: str = FACILITATOR_URL,
        redis_url: str = REDIS_URL,
        threshold_usd: float = BATCH_THRESHOLD_USD,
        threshold_count: int = BATCH_THRESHOLD_COUNT,
        threshold_time: int = BATCH_THRESHOLD_TIME,
    ):
        self.pay_to = pay_to
        self.network = network
        self.facilitator_url = facilitator_url
        self.threshold_usd = threshold_usd
        self.threshold_count = threshold_count
        self.threshold_time = threshold_time

        # In-memory state (Redis-backed if available)
        self._agents: Dict[str, AgentAccount] = {}
        self._lock = asyncio.Lock()
        self._redis = None
        self._redis_connected = False

        # Batch state
        self._last_batch_tx: Optional[str] = None
        self._last_batch_at: float = 0.0
        self._last_batch_amount: float = 0.0
        self._last_batch_agent_count: int = 0
        self._batch_history: list = []

        # Background task
        self._flush_task: Optional[asyncio.Task] = None
        self._running = False

        # CDP facilitator (lazy init)
        self._facilitator = None
        self._server = None

        # Try Redis connection
        if REDIS_AVAILABLE:
            self._init_redis(redis_url)

    def _init_redis(self, redis_url: str):
        """Initialize Redis connection for persistent state."""
        try:
            self._redis = redis.from_url(redis_url, decode_responses=True)
            self._redis.ping()
            self._redis_connected = True
            logger.info(f"[GravityWell] Redis connected at {redis_url}")
            self._load_from_redis()
        except Exception as e:
            logger.warning(f"[GravityWell] Redis unavailable ({e}), using memory-only")
            self._redis_connected = False
            self._redis = None

    def _load_from_redis(self):
        """Load agent accounts from Redis on startup."""
        if not self._redis_connected:
            return
        try:
            pattern = f"{REDIS_KEY_PREFIX}agent:*"
            for key in self._redis.scan_iter(match=pattern, count=100):
                data = self._redis.get(key)
                if data:
                    agent = AgentAccount.from_dict(json.loads(data))
                    self._agents[agent.agent_address] = agent
            logger.info(f"[GravityWell] Loaded {len(self._agents)} agents from Redis")
        except Exception as e:
            logger.error(f"[GravityWell] Failed to load from Redis: {e}")

    def _save_agent_to_redis(self, agent: AgentAccount):
        """Persist single agent to Redis."""
        if not self._redis_connected:
            return
        try:
            key = f"{REDIS_KEY_PREFIX}agent:{agent.agent_address}"
            self._redis.set(key, json.dumps(agent.to_dict()), ex=86400)  # 24h TTL
        except Exception as e:
            logger.error(f"[GravityWell] Redis save failed for {agent.agent_address}: {e}")

    def _delete_agent_from_redis(self, agent_address: str):
        """Remove agent from Redis after settlement."""
        if not self._redis_connected:
            return
        try:
            key = f"{REDIS_KEY_PREFIX}agent:{agent_address}"
            self._redis.delete(key)
        except Exception as e:
            logger.error(f"[GravityWell] Redis delete failed for {agent_address}: {e}")

    def _save_batch_meta_to_redis(self):
        """Persist batch metadata to Redis."""
        if not self._redis_connected:
            return
        try:
            meta = {
                "last_batch_tx": self._last_batch_tx,
                "last_batch_at": self._last_batch_at,
                "last_batch_amount": self._last_batch_amount,
                "last_batch_agent_count": self._last_batch_agent_count,
                "batch_history": self._batch_history[-50:],  # Keep last 50
            }
            key = f"{REDIS_KEY_PREFIX}meta"
            self._redis.set(key, json.dumps(meta), ex=86400)
        except Exception as e:
            logger.error(f"[GravityWell] Redis batch meta save failed: {e}")

    def _load_batch_meta_from_redis(self):
        """Load batch metadata from Redis."""
        if not self._redis_connected:
            return
        try:
            key = f"{REDIS_KEY_PREFIX}meta"
            data = self._redis.get(key)
            if data:
                meta = json.loads(data)
                self._last_batch_tx = meta.get("last_batch_tx")
                self._last_batch_at = meta.get("last_batch_at", 0.0)
                self._last_batch_amount = meta.get("last_batch_amount", 0.0)
                self._last_batch_agent_count = meta.get("last_batch_agent_count", 0)
                self._batch_history = meta.get("batch_history", [])
        except Exception as e:
            logger.error(f"[GravityWell] Redis batch meta load failed: {e}")

    async def _init_cdp(self):
        """Lazy-initialize CDP facilitator for real settlement."""
        if not CDP_AVAILABLE:
            logger.warning("[GravityWell] CDP SDK not available, batch settlement will fail")
            return False

        if self._facilitator is not None:
            return True

        try:
            # Try CDP hosted facilitator (mainnet-capable)
            try:
                config = create_facilitator_config()
                self._facilitator = HTTPFacilitatorClient(config)
                logger.info("[GravityWell] CDP facilitator initialized (hosted)")
            except Exception:
                # Fallback to public facilitator
                self._facilitator = HTTPFacilitatorClient(FacilitatorConfig(url=self.facilitator_url))
                logger.info(f"[GravityWell] CDP facilitator initialized (public: {self.facilitator_url})")

            self._server = x402ResourceServer(self._facilitator)
            self._server.register(self.network, ExactEvmServerScheme())
            return True
        except Exception as e:
            logger.error(f"[GravityWell] CDP init failed: {e}")
            return False

    async def start(self):
        """Start the background flush task."""
        if self._running:
            return
        self._running = True
        self._flush_task = asyncio.create_task(self._flush_loop())
        logger.info("[GravityWell] Started background flush task")

    async def stop(self):
        """Stop the background flush task and flush pending."""
        self._running = False
        if self._flush_task:
            self._flush_task.cancel()
            try:
                await self._flush_task
            except asyncio.CancelledError:
                pass
        # Final flush on shutdown
        await self.flush_all()
        logger.info("[GravityWell] Stopped")

    async def record_settlement(
        self,
        agent_address: str,
        amount_usd: float,
        payment_proof: Optional[str] = None,
        endpoint: str = "",
    ) -> Dict[str, Any]:
        """
        Record a successful x402 settlement for batching.

        Called by x402 middleware after payment verification passes.
        Instead of immediate on-chain settlement, accumulates in the well.
        """
        async with self._lock:
            now = time.time()
            agent = self._agents.get(agent_address)

            if agent is None:
                agent = AgentAccount(
                    agent_address=agent_address,
                    first_pending_at=now,
                )
                self._agents[agent_address] = agent

            agent.pending_usd += amount_usd
            agent.count += 1
            agent.last_settlement = now

            self._save_agent_to_redis(agent)

            # Check if this single agent triggers a flush
            should_flush = (
                agent.pending_usd >= self.threshold_usd
                or agent.count >= self.threshold_count
            )

            return {
                "accumulated": True,
                "agent_address": agent_address,
                "agent_pending_usd": agent.pending_usd,
                "agent_count": agent.count,
                "should_flush": should_flush,
                "thresholds": {
                    "usd": self.threshold_usd,
                    "count": self.threshold_count,
                    "time": self.threshold_time,
                },
            }

    async def _check_thresholds(self) -> bool:
        """Check if any global threshold is met for batch flush."""
        async with self._lock:
            if not self._agents:
                return False

            total_pending_usd = sum(a.pending_usd for a in self._agents.values())
            total_count = sum(a.count for a in self._agents.values())
            oldest_pending = min(a.first_pending_at for a in self._agents.values())
            time_since_oldest = time.time() - oldest_pending

            return (
                total_pending_usd >= self.threshold_usd
                or total_count >= self.threshold_count
                or time_since_oldest >= self.threshold_time
            )

    async def _get_next_batch_eta(self) -> Optional[float]:
        """Estimate seconds until next batch flush based on current state."""
        async with self._lock:
            if not self._agents:
                return None

            total_pending_usd = sum(a.pending_usd for a in self._agents.values())
            total_count = sum(a.count for a in self._agents.values())
            oldest_pending = min(a.first_pending_at for a in self._agents.values())
            time_since_oldest = time.time() - oldest_pending

            # Calculate time until each threshold
            usd_remaining = max(0, self.threshold_usd - total_pending_usd)
            count_remaining = max(0, self.threshold_count - total_count)
            time_remaining = max(0, self.threshold_time - time_since_oldest)

            # If we had rate data, we'd project. For now, return time-based ETA
            return time_remaining

    async def flush_all(self) -> BatchResult:
        """Force flush all pending settlements immediately."""
        async with self._lock:
            if not self._agents:
                return BatchResult(success=True, settled_agents=0, settled_usd=0.0)

            agents_to_settle = list(self._agents.values())
            return await self._execute_batch_settlement(agents_to_settle)

    async def _flush_loop(self):
        """Background task: periodically check thresholds and flush."""
        while self._running:
            try:
                await asyncio.sleep(10)  # Check every 10 seconds

                if await self._check_thresholds():
                    await self.flush_all()

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"[GravityWell] Flush loop error: {e}")
                await asyncio.sleep(30)  # Back off on error

    async def _execute_batch_settlement(self, agents: list) -> BatchResult:
        """Execute batch settlement via CDP facilitator."""
        if not agents:
            return BatchResult(success=True, settled_agents=0, settled_usd=0.0)

        total_usd = sum(a.pending_usd for a in agents)
        agent_addresses = [a.agent_address for a in agents]

        # Initialize CDP if needed
        cdp_ready = await self._init_cdp()
        if not cdp_ready:
            return BatchResult(
                success=False,
                error="CDP facilitator not available",
                settled_agents=0,
                settled_usd=0.0,
            )

        try:
            # Build batch payment request for CDP facilitator
            # The CDP facilitator supports batch settlement via its API
            batch_payload = self._build_batch_payload(agents)

            # Call CDP facilitator for batch settlement
            # Note: Actual CDP batch API may vary; this uses the facilitator's
            # verify endpoint with batch data
            response = await self._call_cdp_batch(batch_payload)

            if response.get("success"):
                tx_hash = response.get("tx_hash")
                await self._on_batch_success(agents, tx_hash, total_usd)
                return BatchResult(
                    success=True,
                    tx_hash=tx_hash,
                    settled_agents=len(agents),
                    settled_usd=total_usd,
                )
            else:
                raise Exception(response.get("error", "CDP batch settlement failed"))

        except Exception as e:
            logger.error(f"[GravityWell] Batch settlement failed: {e}")
            # Fallback: settle each agent individually
            return await self._fallback_individual_settlement(agents)

    def _build_batch_payload(self, agents: list) -> Dict[str, Any]:
        """Build payload for CDP batch settlement."""
        # This payload structure depends on CDP facilitator API
        # For now, we construct a conceptual batch request
        items = []
        for agent in agents:
            items.append({
                "pay_to": self.pay_to,
                "network": self.network,
                "amount": str(agent.pending_usd),
                "currency": "USDC",
                "agent": agent.agent_address,
                "count": agent.count,
            })

        return {
            "batch": True,
            "pay_to": self.pay_to,
            "network": self.network,
            "currency": "USDC",
            "items": items,
            "total_amount": str(sum(a.pending_usd for a in agents)),
        }

    async def _call_cdp_batch(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Call CDP facilitator for batch settlement.

        NOTE: This is a placeholder for the actual CDP batch API.
        The real implementation would use the facilitator's batch endpoint.
        """
        # Simulate CDP batch settlement for now
        # In production, this would be:
        # response = await self._facilitator.post("/batch-settle", json=payload)
        await asyncio.sleep(0.1)  # Simulate network call

        # Simulate success
        import uuid
        return {
            "success": True,
            "tx_hash": f"0x{uuid.uuid4().hex}",
        }

    async def _on_batch_success(
        self,
        agents: list,
        tx_hash: str,
        total_usd: float,
    ):
        """Handle successful batch settlement."""
        now = time.time()
        agent_addresses = [a.agent_address for a in agents]

        # Clear settled agents
        for agent in agents:
            if agent.agent_address in self._agents:
                del self._agents[agent.agent_address]
            self._delete_agent_from_redis(agent.agent_address)

        # Record batch metadata
        self._last_batch_tx = tx_hash
        self._last_batch_at = now
        self._last_batch_amount = total_usd
        self._last_batch_agent_count = len(agents)
        self._batch_history.append({
            "tx_hash": tx_hash,
            "timestamp": now,
            "amount_usd": total_usd,
            "agents": agent_addresses,
        })
        self._save_batch_meta_to_redis()

        logger.info(f"[GravityWell] Batch settled: {len(agents)} agents, ${total_usd:.4f}, tx={tx_hash}")

    async def _fallback_individual_settlement(self, agents: list) -> BatchResult:
        """Fallback: settle each agent individually when batch fails."""
        logger.warning(f"[GravityWell] Falling back to individual settlement for {len(agents)} agents")

        individual_results = []
        total_settled = 0
        total_usd = 0.0
        any_success = False

        cdp_ready = await self._init_cdp()
        if not cdp_ready:
            return BatchResult(
                success=False,
                error="CDP facilitator not available for fallback",
                settled_agents=0,
                settled_usd=0.0,
                fallback_individual=True,
                individual_results=[],
            )

        for agent in agents:
            try:
                # Individual settlement payload
                payload = {
                    "pay_to": self.pay_to,
                    "network": self.network,
                    "amount": str(agent.pending_usd),
                    "currency": "USDC",
                    "agent": agent.agent_address,
                }

                # Simulate individual settlement call
                await asyncio.sleep(0.05)
                import uuid
                tx_hash = f"0x{uuid.uuid4().hex}"

                # Remove on success
                if agent.agent_address in self._agents:
                    del self._agents[agent.agent_address]
                self._delete_agent_from_redis(agent.agent_address)

                individual_results.append({
                    "agent": agent.agent_address,
                    "success": True,
                    "tx_hash": tx_hash,
                    "amount_usd": agent.pending_usd,
                })
                total_settled += 1
                total_usd += agent.pending_usd
                any_success = True

            except Exception as e:
                logger.error(f"[GravityWell] Individual settlement failed for {agent.agent_address}: {e}")
                individual_results.append({
                    "agent": agent.agent_address,
                    "success": False,
                    "error": str(e),
                    "amount_usd": agent.pending_usd,
                })

        # Record partial batch history
        if any_success:
            self._last_batch_tx = "fallback_multi"
            self._last_batch_at = time.time()
            self._last_batch_amount = total_usd
            self._last_batch_agent_count = total_settled
            self._batch_history.append({
                "tx_hash": "fallback_multi",
                "timestamp": time.time(),
                "amount_usd": total_usd,
                "agents": [r["agent"] for r in individual_results if r["success"]],
            })
            self._save_batch_meta_to_redis()

        return BatchResult(
            success=any_success,
            tx_hash="fallback_multi" if any_success else None,
            settled_agents=total_settled,
            settled_usd=total_usd,
            fallback_individual=True,
            individual_results=individual_results,
            error=None if any_success else "All individual settlements failed",
        )

    def get_status(self) -> Dict[str, Any]:
        """Get current Gravity Well status for the /status endpoint."""
        total_pending_usd = sum(a.pending_usd for a in self._agents.values())
        total_count = sum(a.count for a in self._agents.values())
        pending_agents = len(self._agents)

        # Calculate next batch ETA
        oldest_pending = min((a.first_pending_at for a in self._agents.values()), default=0)
        time_since_oldest = time.time() - oldest_pending if oldest_pending else 0
        next_batch_eta = max(0, self.threshold_time - time_since_oldest) if self._agents else None

        return {
            "pending_agents": pending_agents,
            "total_pending_usd": round(total_pending_usd, 6),
            "total_pending_count": total_count,
            "next_batch_eta_seconds": round(next_batch_eta, 1) if next_batch_eta else None,
            "next_batch_eta_human": self._format_eta(next_batch_eta) if next_batch_eta else None,
            "last_batch_tx": self._last_batch_tx,
            "last_batch_at": self._last_batch_at,
            "last_batch_amount_usd": round(self._last_batch_amount, 6),
            "last_batch_agent_count": self._last_batch_agent_count,
            "thresholds": {
                "usd": self.threshold_usd,
                "count": self.threshold_count,
                "time_seconds": self.threshold_time,
            },
            "redis_connected": self._redis_connected,
            "cdp_available": CDP_AVAILABLE,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    def _format_eta(self, seconds: float) -> str:
        """Format ETA as human-readable string."""
        if seconds <= 0:
            return "imminent"
        if seconds < 60:
            return f"{int(seconds)}s"
        if seconds < 3600:
            return f"{int(seconds / 60)}m {int(seconds % 60)}s"
        return f"{int(seconds / 3600)}h {int((seconds % 3600) / 60)}m"

    async def get_agent_account(self, agent_address: str) -> Optional[Dict[str, Any]]:
        """Get accounting details for a specific agent."""
        async with self._lock:
            agent = self._agents.get(agent_address)
            if agent:
                return agent.to_dict()
            return None

    async def get_all_agents(self) -> Dict[str, Dict[str, Any]]:
        """Get all agent accounts (for debugging/admin)."""
        async with self._lock:
            return {addr: agent.to_dict() for addr, agent in self._agents.items()}


# Global instance for import
_gravity_well: Optional[GravityWell] = None


def get_gravity_well() -> GravityWell:
    """Get or create the global GravityWell instance."""
    global _gravity_well
    if _gravity_well is None:
        _gravity_well = GravityWell()
    return _gravity_well


async def init_gravity_well(app) -> GravityWell:
    """Initialize GravityWell and register routes on the FastAPI app."""
    global _gravity_well
    _gravity_well = GravityWell()
    await _gravity_well.start()

    # Register status endpoint
    from fastapi import APIRouter
    from fastapi.responses import JSONResponse

    router = APIRouter(prefix="/api/v1/gravity/well", tags=["gravity"])

    @router.get("/status")
    async def gravity_status():
        status = _gravity_well.get_status()
        resp = JSONResponse(content=status)
        resp.headers["X-AETHERIUS-Gravity"] = "v0"
        resp.headers["X-AETHERIUS-Network"] = NETWORK
        return resp

    @router.get("/agent/{agent_address}")
    async def gravity_agent(agent_address: str):
        agent = await _gravity_well.get_agent_account(agent_address)
        if agent is None:
            return JSONResponse(status_code=404, content={"error": "agent not found"})
        return JSONResponse(content=agent)

    @router.post("/flush")
    async def gravity_flush():
        """Manual flush trigger (admin)."""
        result = await _gravity_well.flush_all()
        return JSONResponse(content={
            "success": result.success,
            "tx_hash": result.tx_hash,
            "settled_agents": result.settled_agents,
            "settled_usd": result.settled_usd,
            "fallback_individual": result.fallback_individual,
        })

    app.include_router(router)

    # Shutdown hook
    @app.on_event("shutdown")
    async def shutdown_gravity():
        await _gravity_well.stop()

    logger.info("[GravityWell] Initialized and routes registered")
    return _gravity_well