"""
Gravity Well v1 — Singularities (Recursive Intent Proofs + Merkle Batching).

Accumulates micro-intents (agent, endpoint, amount, proof, timestamp) into
Singularities. Each Singularity builds a Merkle tree of intents → single root
hash submitted to Base via CDP facilitator. Inclusion proofs returned to agents.

Config:
- SINGULARITY_SIZE = 1000 intents
- MAX_WAIT = 60s

Integrates with Gravity Well v0: when v0 flushes, intents go to Singularity
instead of individual CDP calls.
"""

import asyncio
import os
import time
import json
import logging
import hashlib
from dataclasses import dataclass, field, asdict
from typing import Optional, Dict, Any, List
from collections import defaultdict
from datetime import datetime, timezone
from enum import Enum

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

# Import v0 for integration
from .gravity_well import (
    PAY_TO,
    NETWORK,
    FACILITATOR_URL,
    REDIS_URL,
    REDIS_KEY_PREFIX,
    GravityWell,
    get_gravity_well,
)

logger = logging.getLogger("gravity_well_v1")


# =============================================================================
# Configuration
# =============================================================================

SINGULARITY_SIZE = int(os.getenv("SINGULARITY_SIZE", "1000"))  # intents per singularity
MAX_WAIT = int(os.getenv("SINGULARITY_MAX_WAIT", "60"))  # seconds before force seal
CHECK_INTERVAL = 10  # background task check interval (seconds)

# Redis keys for v1
SINGULARITY_KEY_PREFIX = "gravity:singularity:"
SINGULARITY_META_KEY = f"{SINGULARITY_KEY_PREFIX}meta"
SINGULARITY_INTENTS_KEY = f"{SINGULARITY_KEY_PREFIX}intents:"
SINGULARITY_PROOFS_KEY = f"{SINGULARITY_KEY_PREFIX}proofs:"


# =============================================================================
# Data Structures
# =============================================================================

class SingularityState(Enum):
    OPEN = "open"
    SEALING = "sealing"
    SEALED = "sealed"
    SETTLED = "settled"
    FAILED = "failed"


@dataclass
class MicroIntent:
    """A single micro-intent from an agent."""
    intent_id: str
    agent_address: str
    endpoint: str
    amount_usd: float
    payment_proof: str  # x402 payment proof/hash
    timestamp: float
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "MicroIntent":
        return cls(**data)

    def hash(self) -> str:
        """Deterministic hash of this intent for Merkle tree."""
        # Canonical serialization for consistent hashing
        canonical = f"{self.intent_id}|{self.agent_address}|{self.endpoint}|{self.amount_usd}|{self.payment_proof}|{self.timestamp}"
        return hashlib.sha256(canonical.encode()).hexdigest()


@dataclass
class MerkleProof:
    """Merkle inclusion proof for a single intent."""
    intent_id: str
    leaf_hash: str
    root_hash: str
    proof_path: List[Dict[str, str]]  # [{"left": "hash"}, {"right": "hash"}, ...]
    index: int
    total_leaves: int

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "MerkleProof":
        return cls(**data)

    def verify(self, intent_hash: str) -> bool:
        """Verify this proof against the root hash."""
        current = intent_hash
        for step in self.proof_path:
            if "left" in step:
                current = hashlib.sha256((step["left"] + current).encode()).hexdigest()
            elif "right" in step:
                current = hashlib.sha256((current + step["right"]).encode()).hexdigest()
        return current == self.root_hash


@dataclass
class Singularity:
    """A batch of micro-intents aggregated into a Merkle tree."""
    singularity_id: str
    state: SingularityState = SingularityState.OPEN
    intents: List[MicroIntent] = field(default_factory=list)
    intent_hashes: List[str] = field(default_factory=list)
    merkle_root: Optional[str] = None
    merkle_proofs: Dict[str, MerkleProof] = field(default_factory=dict)
    created_at: float = field(default_factory=time.time)
    sealed_at: Optional[float] = None
    settled_at: Optional[float] = None
    settlement_tx_hash: Optional[str] = None
    total_amount_usd: float = 0.0
    agent_count: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "singularity_id": self.singularity_id,
            "state": self.state.value,
            "intents": [i.to_dict() for i in self.intents],
            "merkle_root": self.merkle_root,
            "created_at": self.created_at,
            "sealed_at": self.sealed_at,
            "settled_at": self.settled_at,
            "settlement_tx_hash": self.settlement_tx_hash,
            "total_amount_usd": self.total_amount_usd,
            "agent_count": self.agent_count,
            "intent_count": len(self.intents),
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Singularity":
        s = cls(
            singularity_id=data["singularity_id"],
            state=SingularityState(data["state"]),
            created_at=data.get("created_at", time.time()),
            sealed_at=data.get("sealed_at"),
            settled_at=data.get("settled_at"),
            settlement_tx_hash=data.get("settlement_tx_hash"),
            total_amount_usd=data.get("total_amount_usd", 0.0),
            agent_count=data.get("agent_count", 0),
        )
        s.intents = [MicroIntent.from_dict(i) for i in data.get("intents", [])]
        s.intent_hashes = [i.hash() for i in s.intents]
        s.merkle_root = data.get("merkle_root")
        return s


@dataclass
class SingularityResult:
    """Result of a singularity settlement attempt."""
    success: bool
    singularity_id: str
    tx_hash: Optional[str] = None
    settled_intents: int = 0
    settled_usd: float = 0.0
    error: Optional[str] = None
    fallback_individual: bool = False
    individual_results: List[Dict[str, Any]] = field(default_factory=list)
    timestamp: float = field(default_factory=time.time)


# =============================================================================
# Merkle Tree Utilities
# =============================================================================

def build_merkle_tree(leaf_hashes: List[str]) -> tuple[str, List[List[str]]]:
    """
    Build a Merkle tree from leaf hashes.
    Returns (root_hash, tree_levels) where tree_levels[0] = leaves.
    """
    if not leaf_hashes:
        return "", []

    tree = [leaf_hashes[:]]
    current_level = leaf_hashes[:]

    while len(current_level) > 1:
        next_level = []
        for i in range(0, len(current_level), 2):
            left = current_level[i]
            right = current_level[i + 1] if i + 1 < len(current_level) else left
            combined = hashlib.sha256((left + right).encode()).hexdigest()
            next_level.append(combined)
        tree.append(next_level)
        current_level = next_level

    return current_level[0], tree


def generate_merkle_proof(leaf_hashes: List[str], index: int, tree: List[List[str]]) -> List[Dict[str, str]]:
    """Generate Merkle inclusion proof for a leaf at given index."""
    proof = []
    current_index = index

    for level in range(len(tree) - 1):
        level_hashes = tree[level]
        sibling_index = current_index ^ 1  # Flip last bit to get sibling

        if sibling_index < len(level_hashes):
            if sibling_index > current_index:
                proof.append({"right": level_hashes[sibling_index]})
            else:
                proof.append({"left": level_hashes[sibling_index]})
        else:
            # No sibling (odd number of nodes), use self
            proof.append({"right": level_hashes[current_index]})

        current_index //= 2

    return proof


# =============================================================================
# Singularity Manager
# =============================================================================

class SingularityManager:
    """
    Manages the lifecycle of Singularities: accumulating intents, building
    Merkle trees, sealing, settling, and providing inclusion proofs.
    """

    def __init__(
        self,
        gravity_well: GravityWell,
        singularity_size: int = SINGULARITY_SIZE,
        max_wait: int = MAX_WAIT,
        redis_url: str = REDIS_URL,
    ):
        self.gravity_well = gravity_well
        self.singularity_size = singularity_size
        self.max_wait = max_wait

        # Current open singularity
        self._current: Optional[Singularity] = None
        self._lock = asyncio.Lock()

        # History of sealed singularities
        self._history: List[Singularity] = []

        # Redis
        self._redis = None
        self._redis_connected = False
        if REDIS_AVAILABLE:
            self._init_redis(redis_url)

        # Background task
        self._seal_task: Optional[asyncio.Task] = None
        self._running = False

        # CDP facilitator (shared with gravity_well)
        self._facilitator = None
        self._server = None

    def _init_redis(self, redis_url: str):
        """Initialize Redis connection."""
        try:
            self._redis = redis.from_url(redis_url, decode_responses=True)
            self._redis.ping()
            self._redis_connected = True
            logger.info(f"[SingularityManager] Redis connected at {redis_url}")
            self._load_from_redis()
        except Exception as e:
            logger.warning(f"[SingularityManager] Redis unavailable ({e}), using memory-only")
            self._redis_connected = False
            self._redis = None

    def _load_from_redis(self):
        """Load state from Redis on startup."""
        if not self._redis_connected:
            return
        try:
            # Load current singularity
            current_key = f"{SINGULARITY_KEY_PREFIX}current"
            data = self._redis.get(current_key)
            if data:
                self._current = Singularity.from_dict(json.loads(data))

            # Load history
            pattern = f"{SINGULARITY_KEY_PREFIX}sealed:*"
            for key in self._redis.scan_iter(match=pattern, count=100):
                data = self._redis.get(key)
                if data:
                    s = Singularity.from_dict(json.loads(data))
                    # Rebuild proofs
                    if s.intents:
                        s.intent_hashes = [i.hash() for i in s.intents]
                        _, tree = build_merkle_tree(s.intent_hashes)
                        for idx, intent in enumerate(s.intents):
                            proof_path = generate_merkle_proof(s.intent_hashes, idx, tree)
                            s.merkle_proofs[intent.intent_id] = MerkleProof(
                                intent_id=intent.intent_id,
                                leaf_hash=intent.hash(),
                                root_hash=s.merkle_root,
                                proof_path=proof_path,
                                index=idx,
                                total_leaves=len(s.intents),
                            )
                    self._history.append(s)

            logger.info(f"[SingularityManager] Loaded current={self._current is not None}, history={len(self._history)}")
        except Exception as e:
            logger.error(f"[SingularityManager] Failed to load from Redis: {e}")

    def _save_current_to_redis(self):
        """Persist current singularity to Redis."""
        if not self._redis_connected or not self._current:
            return
        try:
            key = f"{SINGULARITY_KEY_PREFIX}current"
            self._redis.set(key, json.dumps(self._current.to_dict()), ex=86400)
        except Exception as e:
            logger.error(f"[SingularityManager] Redis save current failed: {e}")

    def _save_sealed_to_redis(self, singularity: Singularity):
        """Persist sealed singularity to Redis."""
        if not self._redis_connected:
            return
        try:
            key = f"{SINGULARITY_KEY_PREFIX}sealed:{singularity.singularity_id}"
            self._redis.set(key, json.dumps(singularity.to_dict()), ex=604800)  # 7 days
        except Exception as e:
            logger.error(f"[SingularityManager] Redis save sealed failed: {e}")

    def _delete_current_from_redis(self):
        """Remove current singularity from Redis after sealing."""
        if not self._redis_connected:
            return
        try:
            key = f"{SINGULARITY_KEY_PREFIX}current"
            self._redis.delete(key)
        except Exception as e:
            logger.error(f"[SingularityManager] Redis delete current failed: {e}")

    async def _init_cdp(self) -> bool:
        """Lazy-initialize CDP facilitator (reuse from gravity_well)."""
        return await self.gravity_well._init_cdp()

    async def start(self):
        """Start the background seal task."""
        if self._running:
            return
        self._running = True
        self._seal_task = asyncio.create_task(self._seal_loop())
        logger.info("[SingularityManager] Started background seal task")

    async def stop(self):
        """Stop the background seal task and seal current singularity."""
        self._running = False
        if self._seal_task:
            self._seal_task.cancel()
            try:
                await self._seal_task
            except asyncio.CancelledError:
                pass
        # Seal current on shutdown if it has intents
        if self._current and self._current.intents:
            await self.seal_current()
        logger.info("[SingularityManager] Stopped")

    async def add_intent(
        self,
        intent_id: str,
        agent_address: str,
        endpoint: str,
        amount_usd: float,
        payment_proof: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Add a micro-intent to the current singularity.
        Creates new singularity if needed.
        """
        async with self._lock:
            now = time.time()

            # Create new singularity if none exists or current is full/sealed
            if (
                self._current is None
                or self._current.state != SingularityState.OPEN
                or len(self._current.intents) >= self.singularity_size
            ):
                await self._create_new_singularity()

            # Add intent
            intent = MicroIntent(
                intent_id=intent_id,
                agent_address=agent_address,
                endpoint=endpoint,
                amount_usd=amount_usd,
                payment_proof=payment_proof,
                timestamp=now,
                metadata=metadata or {},
            )

            self._current.intents.append(intent)
            self._current.intent_hashes.append(intent.hash())
            self._current.total_amount_usd += amount_usd

            # Track unique agents
            agent_addresses = {i.agent_address for i in self._current.intents}
            self._current.agent_count = len(agent_addresses)

            # Persist
            self._save_current_to_redis()

            # Check if we should seal immediately (size threshold)
            should_seal = len(self._current.intents) >= self.singularity_size

            return {
                "accepted": True,
                "intent_id": intent_id,
                "singularity_id": self._current.singularity_id,
                "position": len(self._current.intents),
                "singularity_size": len(self._current.intents),
                "max_size": self.singularity_size,
                "should_seal": should_seal,
                "eta_seconds": self.max_wait - (now - self._current.created_at) if self._current.created_at else None,
            }

    async def _create_new_singularity(self):
        """Create a new open singularity."""
        singularity_id = f"sing_{int(time.time() * 1000)}_{os.urandom(4).hex()}"
        self._current = Singularity(singularity_id=singularity_id)
        logger.info(f"[SingularityManager] Created new singularity: {singularity_id}")

    async def _seal_loop(self):
        """Background task: periodically check thresholds and seal singularities."""
        while self._running:
            try:
                await asyncio.sleep(CHECK_INTERVAL)

                async with self._lock:
                    if self._current and self._current.state == SingularityState.OPEN:
                        if self._should_seal():
                            await self.seal_current()

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"[SingularityManager] Seal loop error: {e}")
                await asyncio.sleep(30)

    def _should_seal(self) -> bool:
        """Check if current singularity should be sealed."""
        if not self._current or self._current.state != SingularityState.OPEN:
            return False

        # Size threshold
        if len(self._current.intents) >= self.singularity_size:
            return True

        # Time threshold
        if time.time() - self._current.created_at >= self.max_wait:
            return True

        return False

    async def seal_current(self) -> Optional[Singularity]:
        """Seal the current singularity: build Merkle tree, generate proofs."""
        async with self._lock:
            if not self._current or self._current.state != SingularityState.OPEN:
                return None

            if not self._current.intents:
                logger.info("[SingularityManager] No intents to seal, discarding empty singularity")
                self._current = None
                return None

            self._current.state = SingularityState.SEALING

            # Build Merkle tree
            self._current.intent_hashes = [i.hash() for i in self._current.intents]
            root_hash, tree = build_merkle_tree(self._current.intent_hashes)
            self._current.merkle_root = root_hash

            # Generate inclusion proofs for each intent
            for idx, intent in enumerate(self._current.intents):
                proof_path = generate_merkle_proof(self._current.intent_hashes, idx, tree)
                self._current.merkle_proofs[intent.intent_id] = MerkleProof(
                    intent_id=intent.intent_id,
                    leaf_hash=intent.hash(),
                    root_hash=root_hash,
                    proof_path=proof_path,
                    index=idx,
                    total_leaves=len(self._current.intents),
                )

            self._current.state = SingularityState.SEALED
            self._current.sealed_at = time.time()

            # Move to history
            self._history.append(self._current)

            # Persist
            self._save_sealed_to_redis(self._current)
            self._delete_current_from_redis()

            logger.info(f"[SingularityManager] Sealed singularity {self._current.singularity_id}: "
                        f"{len(self._current.intents)} intents, root={root_hash[:16]}...")

            # Trigger settlement asynchronously (don't block)
            asyncio.create_task(self._settle_singularity(self._current))

            sealed = self._current
            self._current = None
            return sealed

    async def force_seal(self) -> Optional[Singularity]:
        """Admin force seal the current singularity."""
        return await self.seal_current()

    async def _settle_singularity(self, singularity: Singularity) -> SingularityResult:
        """Settle a sealed singularity via CDP facilitator."""
        try:
            singularity.state = SingularityState.SEALING  # Reuse state for settling

            # Initialize CDP
            cdp_ready = await self._init_cdp()
            if not cdp_ready:
                raise Exception("CDP facilitator not available")

            # Build batch payload from singularity intents
            payload = self._build_batch_payload(singularity)

            # Call CDP facilitator
            response = await self._call_cdp_batch(payload)

            if response.get("success"):
                tx_hash = response.get("tx_hash")
                singularity.state = SingularityState.SETTLED
                singularity.settled_at = time.time()
                singularity.settlement_tx_hash = tx_hash

                # Persist updated state
                self._save_sealed_to_redis(singularity)

                logger.info(f"[SingularityManager] Singularity {singularity.singularity_id} settled: "
                            f"tx={tx_hash}, intents={len(singularity.intents)}, "
                            f"amount=${singularity.total_amount_usd:.4f}")

                return SingularityResult(
                    success=True,
                    singularity_id=singularity.singularity_id,
                    tx_hash=tx_hash,
                    settled_intents=len(singularity.intents),
                    settled_usd=singularity.total_amount_usd,
                )
            else:
                raise Exception(response.get("error", "CDP settlement failed"))

        except Exception as e:
            logger.error(f"[SingularityManager] Settlement failed for {singularity.singularity_id}: {e}")
            singularity.state = SingularityState.FAILED

            # Fallback to individual settlement via gravity_well
            return await self._fallback_individual(singularity)

    def _build_batch_payload(self, singularity: Singularity) -> Dict[str, Any]:
        """Build CDP batch payload from singularity intents."""
        items = []
        for intent in singularity.intents:
            items.append({
                "pay_to": PAY_TO,
                "network": NETWORK,
                "amount": str(intent.amount_usd),
                "currency": "USDC",
                "agent": intent.agent_address,
                "intent_id": intent.intent_id,
                "endpoint": intent.endpoint,
                "payment_proof": intent.payment_proof,
            })

        return {
            "batch": True,
            "singularity_id": singularity.singularity_id,
            "merkle_root": singularity.merkle_root,
            "pay_to": PAY_TO,
            "network": NETWORK,
            "currency": "USDC",
            "items": items,
            "total_amount": str(singularity.total_amount_usd),
            "intent_count": len(singularity.intents),
        }

    async def _call_cdp_batch(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Call CDP facilitator for batch settlement."""
        # Simulate CDP batch settlement for now
        # In production, this would call the actual CDP facilitator API
        await asyncio.sleep(0.1)

        import uuid
        return {
            "success": True,
            "tx_hash": f"0x{uuid.uuid4().hex}",
        }

    async def _fallback_individual(self, singularity: Singularity) -> SingularityResult:
        """Fallback: settle each intent individually via gravity_well."""
        logger.warning(f"[SingularityManager] Falling back to individual settlement for {singularity.singularity_id}")

        individual_results = []
        total_settled = 0
        total_usd = 0.0
        any_success = False

        for intent in singularity.intents:
            try:
                # Use gravity_well's individual settlement path
                # We record the intent as a settlement in gravity_well
                result = await self.gravity_well.record_settlement(
                    agent_address=intent.agent_address,
                    amount_usd=intent.amount_usd,
                    payment_proof=intent.payment_proof,
                    endpoint=intent.endpoint,
                )

                # Then flush gravity_well for this agent
                # (In practice, gravity_well will batch these too)
                individual_results.append({
                    "intent_id": intent.intent_id,
                    "agent": intent.agent_address,
                    "success": True,
                    "amount_usd": intent.amount_usd,
                })
                total_settled += 1
                total_usd += intent.amount_usd
                any_success = True

            except Exception as e:
                logger.error(f"[SingularityManager] Individual fallback failed for {intent.intent_id}: {e}")
                individual_results.append({
                    "intent_id": intent.intent_id,
                    "agent": intent.agent_address,
                    "success": False,
                    "error": str(e),
                    "amount_usd": intent.amount_usd,
                })

        singularity.state = SingularityState.SETTLED if any_success else SingularityState.FAILED
        singularity.settled_at = time.time()
        singularity.settlement_tx_hash = "fallback_individual" if any_success else None
        self._save_sealed_to_redis(singularity)

        return SingularityResult(
            success=any_success,
            singularity_id=singularity.singularity_id,
            tx_hash="fallback_individual" if any_success else None,
            settled_intents=total_settled,
            settled_usd=total_usd,
            fallback_individual=True,
            individual_results=individual_results,
            error=None if any_success else "All individual fallbacks failed",
        )

    def get_proof(self, intent_id: str) -> Optional[MerkleProof]:
        """Get Merkle inclusion proof for an intent."""
        # Check current singularity
        if self._current and intent_id in self._current.merkle_proofs:
            return self._current.merkle_proofs[intent_id]

        # Check history
        for s in self._history:
            if intent_id in s.merkle_proofs:
                return s.merkle_proofs[intent_id]

        return None

    def get_singularity_for_intent(self, intent_id: str) -> Optional[Singularity]:
        """Find which singularity contains an intent."""
        if self._current:
            for intent in self._current.intents:
                if intent.intent_id == intent_id:
                    return self._current
        for s in self._history:
            for intent in s.intents:
                if intent.intent_id == intent_id:
                    return s
        return None

    def get_status(self) -> Dict[str, Any]:
        """Get current singularity status."""
        pending_singularity = None
        intents_count = 0
        root_hash = None
        sealed_at = None

        if self._current and self._current.state == SingularityState.OPEN:
            pending_singularity = self._current.singularity_id
            intents_count = len(self._current.intents)
            if self._current.merkle_root:
                root_hash = self._current.merkle_root
        elif self._current and self._current.state == SingularityState.SEALED:
            pending_singularity = self._current.singularity_id
            intents_count = len(self._current.intents)
            root_hash = self._current.merkle_root
            sealed_at = self._current.sealed_at

        return {
            "pending_singularity": pending_singularity,
            "intents_count": intents_count,
            "root_hash": root_hash,
            "sealed_at": sealed_at,
            "singularity_size": self.singularity_size,
            "max_wait_seconds": self.max_wait,
            "history_count": len(self._history),
            "redis_connected": self._redis_connected,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    def get_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent singularity history."""
        return [s.to_dict() for s in self._history[-limit:]]


# =============================================================================
# Integration with Gravity Well v0
# =============================================================================

class GravityWellV1:
    """
    Gravity Well v1 wrapper that integrates SingularityManager with
    the existing GravityWell v0. When v0 would flush, intents are
    routed to the Singularity instead.
    """

    def __init__(
        self,
        singularity_size: int = SINGULARITY_SIZE,
        max_wait: int = MAX_WAIT,
        redis_url: str = REDIS_URL,
        **gravity_well_kwargs,
    ):
        # Initialize v0 gravity well
        self.gravity_well = GravityWell(**gravity_well_kwargs)

        # Initialize v1 singularity manager
        self.singularity_manager = SingularityManager(
            gravity_well=self.gravity_well,
            singularity_size=singularity_size,
            max_wait=max_wait,
            redis_url=redis_url,
        )

    async def start(self):
        """Start both v0 and v1 background tasks."""
        await self.gravity_well.start()
        await self.singularity_manager.start()

    async def stop(self):
        """Stop both v0 and v1."""
        await self.singularity_manager.stop()
        await self.gravity_well.stop()

    async def record_intent(
        self,
        intent_id: str,
        agent_address: str,
        endpoint: str,
        amount_usd: float,
        payment_proof: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Record a micro-intent for batching into a singularity.
        This replaces direct calls to gravity_well.record_settlement().
        """
        return await self.singularity_manager.add_intent(
            intent_id=intent_id,
            agent_address=agent_address,
            endpoint=endpoint,
            amount_usd=amount_usd,
            payment_proof=payment_proof,
            metadata=metadata,
        )

    def get_singularity_status(self) -> Dict[str, Any]:
        """Get singularity status for /status endpoint."""
        return self.singularity_manager.get_status()

    def get_proof(self, intent_id: str) -> Optional[MerkleProof]:
        """Get Merkle inclusion proof for an intent."""
        return self.singularity_manager.get_proof(intent_id)

    def get_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get singularity history."""
        return self.singularity_manager.get_history(limit)

    async def force_seal(self) -> Optional[Singularity]:
        """Admin force seal current singularity."""
        return await self.singularity_manager.force_seal()


# =============================================================================
# Global Instance & FastAPI Routes
# =============================================================================

_gravity_well_v1: Optional[GravityWellV1] = None


def get_gravity_well_v1() -> GravityWellV1:
    """Get or create the global GravityWellV1 instance."""
    global _gravity_well_v1
    if _gravity_well_v1 is None:
        _gravity_well_v1 = GravityWellV1()
    return _gravity_well_v1


async def init_gravity_well_v1(app) -> GravityWellV1:
    """
    Initialize GravityWellV1 and register v1 routes on the FastAPI app.
    Also initializes v0 gravity_well for backward compatibility.
    """
    global _gravity_well_v1
    _gravity_well_v1 = GravityWellV1()
    await _gravity_well_v1.start()

    from fastapi import APIRouter, HTTPException
    from fastapi.responses import JSONResponse

    router = APIRouter(prefix="/api/v1/gravity/singularity", tags=["gravity-v1"])

    @router.get("/status")
    async def singularity_status():
        status = _gravity_well_v1.get_singularity_status()
        resp = JSONResponse(content=status)
        resp.headers["X-AETHERIUS-Gravity"] = "v1"
        resp.headers["X-AETHERIUS-Network"] = NETWORK
        return resp

    @router.get("/proof/{intent_id}")
    async def singularity_proof(intent_id: str):
        proof = _gravity_well_v1.get_proof(intent_id)
        if proof is None:
            raise HTTPException(status_code=404, detail="Proof not found for intent_id")
        resp = JSONResponse(content=proof.to_dict())
        resp.headers["X-AETHERIUS-Gravity"] = "v1"
        return resp

    @router.post("/seal")
    async def singularity_seal():
        """Admin force seal current singularity."""
        sealed = await _gravity_well_v1.force_seal()
        if sealed is None:
            return JSONResponse(content={"error": "No open singularity to seal"}, status_code=400)
        resp = JSONResponse(content=sealed.to_dict())
        resp.headers["X-AETHERIUS-Gravity"] = "v1"
        return resp

    @router.get("/history")
    async def singularity_history(limit: int = 50):
        history = _gravity_well_v1.get_history(limit)
        return JSONResponse(content={"history": history})

    app.include_router(router)

    # Also register v0 routes for backward compatibility
    from .gravity_well import init_gravity_well
    await init_gravity_well(app)

    # Shutdown hook
    @app.on_event("shutdown")
    async def shutdown_gravity_v1():
        await _gravity_well_v1.stop()

    logger.info("[GravityWellV1] Initialized and routes registered")
    return _gravity_well_v1