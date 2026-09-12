"""Agent Credit Velocity — predictive solvency scoring for x402 micro-payment fraud detection.

The core insight: between payment proof submission and on-chain settlement
(L2 finality ~1-2s on Base), there's a Settlement Optimism Window where
an agent can submit multiple requests with the same deferred payment.

This module tracks per-agent velocity patterns and predicts settlement risk
BEFORE authorizing the x402 handshake. It becomes the mandatory anti-fraud
layer that API providers cannot afford to skip.

Architecture:
- Per-agent sliding window of nonce submissions
- Velocity calculation: nonces/second, nonces/block
- Settlement confirmation tracking: proof → confirmed ratio
- Risk score: 0 (trusted) → 100 (suspicious/blocked)
- Circuit breaker integration: auto-block agents exceeding velocity threshold
"""

from __future__ import annotations

import time
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Dict, List, Optional


# === Configuration ===

# Maximum nonces per agent within the settlement window before flagging
MAX_NONCES_PER_WINDOW = 5

# Settlement window duration (seconds) — how long between proof and L2 finality
SETTLEMENT_WINDOW_S = 3.0

# Velocity thresholds (nonces per second)
VELOCITY_WARN = 2.0       # >2 req/s = warn, start tracking
VELOCITY_DANGER = 5.0     # >5 req/s = danger, reduce trust score
VELOCITY_BLOCK = 10.0     # >10 req/s = block, too aggressive

# Settlement confirmation tracking
SETTLEMENT_HISTORY_SIZE = 100  # last N settlements to track

# Risk score weights
WEIGHT_VELOCITY = 0.4     # how much velocity contributes to risk
WEIGHT_SETTLEMENT = 0.3   # how much failed settlements contribute
WEIGHT_AGE = 0.15         # how much agent age contributes
WEIGHT_VOLUME = 0.15      # how much total volume contributes

# Time-based decay for old observations (seconds)
VELOCITY_DECAY_WINDOW = 30.0


@dataclass
class AgentState:
    """Per-agent tracking state."""
    address: str
    first_seen: float = field(default_factory=time.time)
    last_seen: float = 0.0
    total_requests: int = 0
    total_settled: int = 0
    total_failed: int = 0
    total_volume_usd: float = 0.0

    # Sliding window of nonce timestamps
    nonce_timestamps: List[float] = field(default_factory=list)

    # Settlement tracking: (proof_time, confirmed, amount)
    settlement_history: List[tuple] = field(default_factory=list)

    # Current risk score (0-100)
    risk_score: float = 0.0
    risk_level: str = "unknown"  # trusted, normal, watch, danger, blocked

    # Block state
    blocked: bool = False
    blocked_until: float = 0.0
    block_reason: str = ""

    def _settlement_rate(self) -> float:
        """Settlement success rate (0.0 - 1.0). Returns 1.0 if no data yet."""
        total = self.total_settled + self.total_failed
        if total == 0:
            return 1.0
        return self.total_settled / total


class CreditVelocity:
    """Predictive solvency scoring engine for x402 agents.

    Tracks per-agent velocity patterns, settlement confirmation rates,
    and calculates real-time risk scores to prevent settlement window abuse.
    """

    def __init__(self):
        self._agents: Dict[str, AgentState] = {}
        self._global_stats = {
            "total_agents_tracked": 0,
            "total_blocks_issued": 0,
            "total_velocity_flags": 0,
            "avg_risk_score": 0.0,
        }

    def check_agent(
        self,
        address: str,
        nonce: Optional[str] = None,
        amount_usd: float = 0.0,
    ) -> dict:
        """Check if an agent is within acceptable velocity limits.

        Called BEFORE processing the x402 payment to predict fraud risk.

        Returns:
            {
                "allowed": bool,
                "risk_score": float (0-100),
                "risk_level": str,
                "velocity": float (nonces/s),
                "settlement_rate": float (0-1),
                "reason": str,
                "block_remaining_s": float (0 if not blocked),
            }
        """
        now = time.time()
        agent = self._get_or_create(address, now)

        # Check if currently blocked
        if agent.blocked and now < agent.blocked_until:
            remaining = agent.blocked_until - now
            return {
                "allowed": False,
                "risk_score": 100.0,
                "risk_level": "blocked",
                "velocity": 0.0,
                "settlement_rate": agent._settlement_rate(),
                "reason": agent.block_reason,
                "block_remaining_s": round(remaining, 1),
            }

        # Unblock if window expired
        if agent.blocked and now >= agent.blocked_until:
            agent.blocked = False
            agent.block_reason = ""

        # Update tracking
        agent.last_seen = now
        agent.total_requests += 1
        agent.total_volume_usd += amount_usd

        # Add nonce to sliding window
        if nonce:
            agent.nonce_timestamps.append(now)

        # Prune old timestamps outside decay window
        cutoff = now - VELOCITY_DECAY_WINDOW
        agent.nonce_timestamps = [t for t in agent.nonce_timestamps if t > cutoff]

        # Calculate velocity (nonces per second)
        velocity = self._calculate_velocity(agent, now)

        # Calculate risk score
        risk_score = self._calculate_risk(agent, velocity, now)
        risk_level = self._score_to_level(risk_score)

        agent.risk_score = risk_score
        agent.risk_level = risk_level

        # Apply velocity-based blocking
        allowed = True
        reason = "ok"

        if velocity >= VELOCITY_BLOCK:
            allowed = False
            reason = f"velocity_exceeded: {velocity:.1f} nonces/s > {VELOCITY_BLOCK} threshold"
            self._block_agent(agent, now, reason)
            self._global_stats["total_blocks_issued"] += 1

        elif velocity >= VELOCITY_DANGER:
            reason = f"velocity_warning: {velocity:.1f} nonces/s approaching block threshold"

        elif velocity >= VELOCITY_WARN:
            reason = f"velocity_tracking: {velocity:.1f} nonces/s — monitoring"

        # Check nonce count in settlement window
        nonces_in_window = self._nonces_in_settlement_window(agent, now)
        if nonces_in_window > MAX_NONCES_PER_WINDOW:
            allowed = False
            reason = f"nonce_flood: {nonces_in_window} nonces in {SETTLEMENT_WINDOW_S}s window > {MAX_NONCES_PER_WINDOW} limit"
            self._block_agent(agent, now, reason)
            self._global_stats["total_blocks_issued"] += 1

        # Update global stats
        self._update_global_stats()

        return {
            "allowed": allowed,
            "risk_score": round(risk_score, 2),
            "risk_level": risk_level,
            "velocity": round(velocity, 3),
            "settlement_rate": agent._settlement_rate(),
            "reason": reason,
            "block_remaining_s": round(max(0, agent.blocked_until - now), 1),
        }

    def record_settlement(
        self,
        address: str,
        confirmed: bool,
        amount_usd: float = 0.0,
    ) -> None:
        """Record whether a payment actually settled on-chain.

        Called by the settlement watcher when L2 finality is reached.
        This updates the agent's settlement success rate.
        """
        now = time.time()
        agent = self._get_or_create(address, now)

        agent.settlement_history.append((now, confirmed, amount_usd))
        if len(agent.settlement_history) > SETTLEMENT_HISTORY_SIZE:
            agent.settlement_history = agent.settlement_history[-SETTLEMENT_HISTORY_SIZE:]

        if confirmed:
            agent.total_settled += 1
        else:
            agent.total_failed += 1

        # If settlement failed, increase risk
        rate = agent._settlement_rate()
        if rate < 0.5 and agent.total_settled + agent.total_failed >= 5:
            # Agent has <50% settlement rate with enough data
            self._block_agent(
                agent, now,
                f"low_settlement: {rate:.0%} success rate over {agent.total_settled + agent.total_failed} attempts"
            )

    def get_agent_risk(self, address: str) -> dict:
        """Get the current risk profile for an agent."""
        now = time.time()
        agent = self._agents.get(address)

        if not agent:
            return {
                "address": address,
                "risk_score": 0.0,
                "risk_level": "unknown",
                "status": "no_data",
                "message": "Agent not yet tracked",
            }

        velocity = self._calculate_velocity(agent, now)
        return {
            "address": address,
            "risk_score": round(agent.risk_score, 2),
            "risk_level": agent.risk_level,
            "velocity": round(velocity, 3),
            "settlement_rate": agent._settlement_rate(),
            "total_requests": agent.total_requests,
            "total_settled": agent.total_settled,
            "total_failed": agent.total_failed,
            "total_volume_usd": round(agent.total_volume_usd, 6),
            "first_seen": agent.first_seen,
            "last_seen": agent.last_seen,
            "blocked": agent.blocked,
            "blocked_until": agent.blocked_until if agent.blocked else None,
            "block_reason": agent.block_reason or None,
        }

    def get_global_stats(self) -> dict:
        """Get global velocity and risk statistics."""
        return dict(self._global_stats)

    def get_top_risky(self, limit: int = 10) -> List[dict]:
        """Get the top N riskiest agents."""
        now = time.time()
        agents = sorted(
            self._agents.values(),
            key=lambda a: a.risk_score,
            reverse=True,
        )
        return [
            {
                "address": a.address,
                "risk_score": round(a.risk_score, 2),
                "risk_level": a.risk_level,
                "velocity": round(self._calculate_velocity(a, now), 3),
                "settlement_rate": a._settlement_rate(),
                "total_requests": a.total_requests,
            }
            for a in agents[:limit]
            if a.risk_score > 0
        ]

    # === Internal ===

    def _get_or_create(self, address: str, now: float) -> AgentState:
        if address not in self._agents:
            self._agents[address] = AgentState(address=address, first_seen=now)
        return self._agents[address]

    def _calculate_velocity(self, agent: AgentState, now: float) -> float:
        """Nonces per second over the decay window."""
        cutoff = now - VELOCITY_DECAY_WINDOW
        recent = [t for t in agent.nonce_timestamps if t > cutoff]
        if len(recent) < 2:
            return 0.0
        span = recent[-1] - recent[0]
        if span <= 0:
            return len(recent)
        return len(recent) / span

    def _nonces_in_settlement_window(self, agent: AgentState, now: float) -> int:
        """Count nonces within the settlement optimism window."""
        cutoff = now - SETTLEMENT_WINDOW_S
        return sum(1 for t in agent.nonce_timestamps if t > cutoff)

    def _calculate_risk(self, agent: AgentState, velocity: float, now: float) -> float:
        """Composite risk score (0-100) from multiple signals."""
        score = 0.0

        # 1. Velocity risk (0-100)
        if velocity >= VELOCITY_BLOCK:
            vel_risk = 100.0
        elif velocity >= VELOCITY_DANGER:
            vel_risk = 60 + (velocity - VELOCITY_DANGER) / (VELOCITY_BLOCK - VELOCITY_DANGER) * 40
        elif velocity >= VELOCITY_WARN:
            vel_risk = 20 + (velocity - VELOCITY_WARN) / (VELOCITY_DANGER - VELOCITY_WARN) * 40
        else:
            vel_risk = velocity / VELOCITY_WARN * 20 if velocity > 0 else 0
        score += vel_risk * WEIGHT_VELOCITY

        # 2. Settlement failure risk (0-100)
        rate = agent._settlement_rate()
        total = agent.total_settled + agent.total_failed
        if total >= 5:
            # More failures = higher risk
            settlement_risk = (1.0 - rate) * 100
        elif total > 0:
            # Not enough data — moderate risk
            settlement_risk = 30.0
        else:
            # No settlement data — unknown, slight risk for new agents
            age_s = now - agent.first_seen
            settlement_risk = 50.0 if age_s > 60 else 20.0  # new agents get benefit of doubt
        score += settlement_risk * WEIGHT_SETTLEMENT

        # 3. Agent age risk (0-100) — newer agents are slightly riskier
        age_s = now - agent.first_seen
        if age_s < 60:       # < 1 min
            age_risk = 40.0
        elif age_s < 3600:   # < 1 hour
            age_risk = 20.0
        elif age_s < 86400:  # < 1 day
            age_risk = 10.0
        else:
            age_risk = 5.0
        score += age_risk * WEIGHT_AGE

        # 4. Volume risk (0-100) — very high volume from unknown agent = risk
        if agent.total_volume_usd > 100:
            vol_risk = 10.0
        elif agent.total_volume_usd > 10:
            vol_risk = 5.0
        else:
            vol_risk = 0.0
        score += vol_risk * WEIGHT_VOLUME

        return min(100.0, max(0.0, score))

    def _score_to_level(self, score: float) -> str:
        if score >= 80:
            return "blocked"
        elif score >= 60:
            return "danger"
        elif score >= 30:
            return "watch"
        elif score >= 10:
            return "normal"
        else:
            return "trusted"

    def _block_agent(self, agent: AgentState, now: float, reason: str) -> None:
        agent.blocked = True
        agent.blocked_until = now + SETTLEMENT_WINDOW_S * 5  # block for 5 settlement windows
        agent.block_reason = reason

    def _update_global_stats(self) -> None:
        self._global_stats["total_agents_tracked"] = len(self._agents)
        if self._agents:
            scores = [a.risk_score for a in self._agents.values()]
            self._global_stats["avg_risk_score"] = round(sum(scores) / len(scores), 2)
            self._global_stats["total_velocity_flags"] = sum(
                1 for a in self._agents.values()
                if a.risk_level in ("danger", "blocked")
            )


# === Singleton ===

_credit_velocity: Optional[CreditVelocity] = None


def get_credit_velocity() -> CreditVelocity:
    global _credit_velocity
    if _credit_velocity is None:
        _credit_velocity = CreditVelocity()
    return _credit_velocity
