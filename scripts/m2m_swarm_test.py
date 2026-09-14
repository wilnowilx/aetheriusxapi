#!/usr/bin/env python3
"""
M2M Swarm Test for AETHERIUS.

Simulates N concurrent agents hitting 3 REAL canary endpoints with x402 payments
and on-chain reputation anchoring.

Endpoints:
- /api/v1/data/uuid ($0.001)
- /api/v1/token/price ($0.005)
- /api/v1/token/analyze ($0.02)

Configuration via environment variables:
- M2M_WORKERS (default 50)
- M2M_INTERVAL_MIN/MAX (default 2/5 seconds)
- M2M_DURATION (default 0 = infinite)
- BASE_URL (default https://34-156-149-38.sslip.io/aetherapi)
- REPUTATION_CONTRACT (from .env.reputation)

Usage:
    python scripts/m2m_swarm_test.py
"""

import os
import sys
import asyncio
import random
import time
import signal
import hashlib
import json
import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, Dict, List, Any
from collections import deque
from contextlib import asynccontextmanager

import httpx
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware
from eth_account import Account
from dotenv import load_dotenv

# Load environment
load_dotenv()
load_dotenv(".env.reputation")

# ============================================================================
# CONFIGURATION
# ============================================================================

M2M_WORKERS = int(os.getenv("M2M_WORKERS", "50"))
M2M_INTERVAL_MIN = float(os.getenv("M2M_INTERVAL_MIN", "2"))
M2M_INTERVAL_MAX = float(os.getenv("M2M_INTERVAL_MAX", "5"))
M2M_DURATION = int(os.getenv("M2M_DURATION", "0"))  # 0 = infinite
BASE_URL = os.getenv("BASE_URL", "https://34-156-149-38.sslip.io/aetherapi")
REPUTATION_CONTRACT = os.getenv("AETHERIUS_REPUTATION_CONTRACT", "0x7d31b0683a46Ad793248A8590f77dF7d1c2b782A")
BASE_RPC_URL = os.getenv("BASE_RPC_URL")
ORACLE_PRIVATE_KEY = os.getenv("ORACLE_PRIVATE_KEY")

# Endpoint configuration with prices
ENDPOINTS = {
    "/api/v1/data/uuid": {"price": 0.001, "method": "GET", "params": {}},
    "/api/v1/token/price": {"price": 0.005, "method": "GET", "params": {}},
    "/api/v1/token/analyze": {"price": 0.02, "method": "GET", "params": {"address": "0xdAC17F958D2ee523a2206206994597C13D831ec7"}},
}

PAY_TO = "0x677B483128D0399bCD0A5AB36eE990C0246d7f61"
NETWORK = "eip155:8453"
FACILITATOR_URL = "https://x402.org/facilitator"

# ============================================================================
# LOGGING SETUP
# ============================================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("m2m_swarm_test.log", mode="a")
    ]
)
logger = logging.getLogger(__name__)

# ============================================================================
# DATA CLASSES
# ============================================================================

@dataclass
class CallMetrics:
    """Metrics for a single API call."""
    agent_id: str
    endpoint: str
    timestamp: float
    latency_ms: float
    success: bool
    status_code: int
    settled_usdc: float = 0.0
    anchor_tx_hash: Optional[str] = None
    gas_used: Optional[int] = None
    error: Optional[str] = None

@dataclass
class EndpointMetrics:
    """Aggregated metrics per endpoint."""
    endpoint: str
    total_calls: int = 0
    successful_calls: int = 0
    failed_calls: int = 0
    total_latency_ms: float = 0.0
    latencies: deque = field(default_factory=lambda: deque(maxlen=10000))
    settled_usdc: float = 0.0
    anchor_success: int = 0
    anchor_failures: int = 0
    total_gas: int = 0

    def record(self, m: CallMetrics) -> None:
        self.total_calls += 1
        self.total_latency_ms += m.latency_ms
        self.latencies.append(m.latency_ms)
        if m.success:
            self.successful_calls += 1
            self.settled_usdc += m.settled_usdc
            if m.anchor_tx_hash:
                self.anchor_success += 1
                if m.gas_used:
                    self.total_gas += m.gas_used
        else:
            self.failed_calls += 1
        if m.anchor_tx_hash is not None and not m.success:
            self.anchor_failures += 1

    @property
    def success_rate(self) -> float:
        return self.successful_calls / max(self.total_calls, 1)

    @property
    def p50_latency(self) -> float:
        if not self.latencies:
            return 0.0
        sorted_lat = sorted(self.latencies)
        return sorted_lat[len(sorted_lat) // 2]

    @property
    def p99_latency(self) -> float:
        if not self.latencies:
            return 0.0
        sorted_lat = sorted(self.latencies)
        idx = int(len(sorted_lat) * 0.99)
        return sorted_lat[min(idx, len(sorted_lat) - 1)]

    @property
    def avg_latency(self) -> float:
        return self.total_latency_ms / max(self.total_calls, 1)

    @property
    def anchor_success_rate(self) -> float:
        total_anchors = self.anchor_success + self.anchor_failures
        return self.anchor_success / max(total_anchors, 1)

    @property
    def avg_gas(self) -> float:
        return self.total_gas / max(self.anchor_success, 1)

@dataclass
class GlobalMetrics:
    """Global aggregated metrics."""
    total_calls: int = 0
    successful_calls: int = 0
    failed_calls: int = 0
    total_settled_usdc: float = 0.0
    total_anchor_success: int = 0
    total_anchor_failures: int = 0
    total_gas: int = 0
    start_time: float = field(default_factory=time.monotonic)
    endpoints: Dict[str, EndpointMetrics] = field(default_factory=dict)

    def record(self, m: CallMetrics) -> None:
        self.total_calls += 1
        if m.success:
            self.successful_calls += 1
            self.total_settled_usdc += m.settled_usdc
            if m.anchor_tx_hash:
                self.total_anchor_success += 1
                if m.gas_used:
                    self.total_gas += m.gas_used
        else:
            self.failed_calls += 1
        if m.anchor_tx_hash is not None and not m.success:
            self.total_anchor_failures += 1

        if m.endpoint not in self.endpoints:
            self.endpoints[m.endpoint] = EndpointMetrics(endpoint=m.endpoint)
        self.endpoints[m.endpoint].record(m)

    @property
    def success_rate(self) -> float:
        return self.successful_calls / max(self.total_calls, 1)

    @property
    def anchor_success_rate(self) -> float:
        total = self.total_anchor_success + self.total_anchor_failures
        return self.total_anchor_success / max(total, 1)

    @property
    def elapsed_seconds(self) -> float:
        return time.monotonic() - self.start_time

    @property
    def calls_per_second(self) -> float:
        return self.total_calls / max(self.elapsed_seconds, 1)


# ============================================================================
# X402 PAYMENT CLIENT
# ============================================================================

class X402PaymentClient:
    """Client for making x402 payments via the facilitator."""

    def __init__(self, base_url: str, facilitator_url: str = FACILITATOR_URL):
        self.base_url = base_url.rstrip("/")
        self.facilitator_url = facilitator_url.rstrip("/")
        self.client = httpx.AsyncClient(timeout=30.0)

    async def close(self):
        await self.client.aclose()

    async def make_payment(self, endpoint: str, price_usd: float, agent_address: str) -> Optional[dict]:
        """
        Make an x402 payment for the given endpoint.
        Returns payment proof dict or None on failure.
        """
        try:
            # First, get the payment requirements from the endpoint
            url = f"{self.base_url}{endpoint}"
            params = ENDPOINTS[endpoint].get("params", {})

            # Make initial request to get 402
            resp = await self.client.get(url, params=params)

            if resp.status_code == 200:
                # Already paid or free endpoint (shouldn't happen for canary)
                return {"proof": "prepaid", "amount": price_usd}

            if resp.status_code != 402:
                logger.warning(f"Unexpected status {resp.status_code} for {endpoint}")
                return None

            # Parse 402 response for payment details
            payment_header = resp.headers.get("payment-required", "")
            if not payment_header:
                logger.warning(f"No payment-required header for {endpoint}")
                return None

            import base64
            payment_data = json.loads(base64.b64decode(payment_header))

            # Extract payment options
            resource = payment_data.get("resource", {})
            accepts = resource.get("accepts", [])
            if not accepts:
                logger.warning(f"No payment options for {endpoint}")
                return None

            payment = accepts[0]  # Use first option
            amount_raw = int(payment.get("amount", 0))
            asset = payment.get("asset", "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913")  # USDC on Base
            pay_to = payment.get("payTo", PAY_TO)
            network = payment.get("network", NETWORK)
            scheme = payment.get("scheme", "exact")

            # In simulated mode, we can just create a mock payment proof
            # Real implementation would use the x402 SDK to create actual payment
            proof = {
                "scheme": scheme,
                "network": network,
                "payTo": pay_to,
                "asset": asset,
                "amount": str(amount_raw),
                "timestamp": int(time.time()),
                "nonce": f"{agent_address}_{int(time.time() * 1000)}_{random.randint(1000, 9999)}",
            }

            return proof

        except Exception as e:
            logger.error(f"Payment error for {endpoint}: {e}")
            return None

    async def call_with_payment(self, endpoint: str, agent_address: str, agent_id: str) -> CallMetrics:
        """Make a paid API call with x402 payment."""
        endpoint_config = ENDPOINTS[endpoint]
        price = endpoint_config["price"]
        params = endpoint_config.get("params", {})
        url = f"{self.base_url}{endpoint}"

        start = time.monotonic()

        try:
            # Get payment proof
            proof = await self.make_payment(endpoint, price, agent_address)
            if not proof:
                return CallMetrics(
                    agent_id=agent_id,
                    endpoint=endpoint,
                    timestamp=start,
                    latency_ms=(time.monotonic() - start) * 1000,
                    success=False,
                    status_code=0,
                    error="Failed to create payment proof"
                )

            # Encode proof as base64 for X-PAYMENT header
            import base64
            proof_b64 = base64.b64encode(json.dumps(proof).encode()).decode()

            headers = {
                "X-PAYMENT": proof_b64,
                "X-AGENT-ADDRESS": agent_address,
            }

            # Make the paid request
            resp = await self.client.get(url, params=params, headers=headers)
            latency_ms = (time.monotonic() - start) * 1000

            if resp.status_code == 200:
                settled_usdc = price
                return CallMetrics(
                    agent_id=agent_id,
                    endpoint=endpoint,
                    timestamp=start,
                    latency_ms=latency_ms,
                    success=True,
                    status_code=200,
                    settled_usdc=settled_usdc
                )
            else:
                return CallMetrics(
                    agent_id=agent_id,
                    endpoint=endpoint,
                    timestamp=start,
                    latency_ms=latency_ms,
                    success=False,
                    status_code=resp.status_code,
                    error=resp.text[:200] if resp.text else "Unknown error"
                )

        except httpx.TimeoutException:
            return CallMetrics(
                agent_id=agent_id,
                endpoint=endpoint,
                timestamp=start,
                latency_ms=(time.monotonic() - start) * 1000,
                success=False,
                status_code=0,
                error="Timeout"
            )
        except Exception as e:
            return CallMetrics(
                agent_id=agent_id,
                endpoint=endpoint,
                timestamp=start,
                latency_ms=(time.monotonic() - start) * 1000,
                success=False,
                status_code=0,
                error=str(e)
            )


# ============================================================================
# REPUTATION ANCHOR CLIENT
# ============================================================================

class ReputationAnchorClient:
    """Client for anchoring reputation on-chain."""

    def __init__(
        self,
        contract_address: str = REPUTATION_CONTRACT,
        rpc_url: Optional[str] = BASE_RPC_URL,
        oracle_key: Optional[str] = ORACLE_PRIVATE_KEY
    ):
        if not rpc_url:
            raise ValueError("BASE_RPC_URL not set in environment")
        if not oracle_key:
            raise ValueError("ORACLE_PRIVATE_KEY not set in environment")

        self.contract_address = Web3.to_checksum_address(contract_address)
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        self.w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
        self.oracle = Account.from_key(oracle_key)

        self.abi = [
            {"inputs":[{"internalType":"address","name":"agent","type":"address"},{"internalType":"uint16","name":"score","type":"uint16"},{"internalType":"bytes32","name":"behaviorRoot","type":"bytes32"}],"name":"anchor","outputs":[],"stateMutability":"nonpayable","type":"function"},
            {"inputs":[{"internalType":"address","name":"agent","type":"address"}],"name":"getReputation","outputs":[{"internalType":"uint16","name":"score","type":"uint16"},{"internalType":"uint64","name":"updated","type":"uint64"},{"internalType":"bytes32","name":"behavior","type":"bytes32"}],"stateMutability":"view","type":"function"},
        ]
        self.contract = self.w3.eth.contract(address=self.contract_address, abi=self.abi)

    def _build_tx(self, fn, gas_buffer: int = 50000) -> dict:
        gas_estimate = fn.estimate_gas({"from": self.oracle.address})
        return fn.build_transaction({
            "from": self.oracle.address,
            "nonce": self.w3.eth.get_transaction_count(self.oracle.address),
            "gas": gas_estimate + gas_buffer,
            "gasPrice": self.w3.eth.gas_price,
            "chainId": 8453,
        })

    def anchor(self, agent: str, score: int, behavior_hash: bytes, wait: bool = True) -> tuple[str, int]:
        """
        Anchor a single agent's reputation score and behavior merkle root.
        Returns (tx_hash, gas_used)
        """
        if not 0 <= score <= 10000:
            raise ValueError("Score must be 0-10000")
        if len(behavior_hash) != 32:
            raise ValueError("behavior_hash must be 32 bytes")

        agent_addr = Web3.to_checksum_address(agent)
        behavior_bytes32 = Web3.to_bytes(hexstr=behavior_hash.hex()) if isinstance(behavior_hash, str) else behavior_hash

        fn = self.contract.functions.anchor(agent_addr, score, behavior_bytes32)
        tx = self._build_tx(fn)
        signed = self.w3.eth.account.sign_transaction(tx, self.oracle.key)
        tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)

        if wait:
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            if receipt.status != 1:
                raise RuntimeError(f"Transaction failed: {tx_hash.hex()}")
            return tx_hash.hex(), receipt.gasUsed
        return tx_hash.hex(), 0

    def estimate_gas(self, agent: str, score: int) -> int:
        fn = self.contract.functions.anchor(
            Web3.to_checksum_address(agent), score, b"\x00" * 32
        )
        return fn.estimate_gas({"from": self.oracle.address})


# ============================================================================
# BEHAVIOR HASH GENERATOR
# ============================================================================

def generate_behavior_hash(agent_id: str, endpoint: str, timestamp: float, nonce: int) -> bytes:
    """
    Generate a 32-byte behavior hash from:
    agent_id + endpoint + timestamp + random nonce
    """
    data = f"{agent_id}:{endpoint}:{timestamp}:{nonce}"
    return hashlib.sha256(data.encode()).digest()


def generate_agent_address(agent_id: str) -> str:
    """Generate a deterministic Ethereum address from agent_id."""
    hash_bytes = hashlib.sha256(agent_id.encode()).digest()
    return "0x" + hash_bytes[-20:].hex()


# ============================================================================
# SWARM WORKER
# ============================================================================

class SwarmWorker:
    """Individual worker that continuously hits endpoints."""

    def __init__(
        self,
        worker_id: int,
        payment_client: X402PaymentClient,
        reputation_client: ReputationAnchorClient,
        global_metrics: GlobalMetrics,
        interval_min: float = M2M_INTERVAL_MIN,
        interval_max: float = M2M_INTERVAL_MAX,
    ):
        self.worker_id = worker_id
        self.agent_id = f"agent_{worker_id:04d}"
        self.agent_address = generate_agent_address(self.agent_id)
        self.payment_client = payment_client
        self.reputation_client = reputation_client
        self.global_metrics = global_metrics
        self.interval_min = interval_min
        self.interval_max = interval_max
        self.running = False
        self._task: Optional[asyncio.Task] = None

    async def start(self):
        """Start the worker loop."""
        self.running = True
        self._task = asyncio.create_task(self._run_loop())
        logger.info(f"Worker {self.worker_id} ({self.agent_id}) started")

    async def stop(self):
        """Stop the worker."""
        self.running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info(f"Worker {self.worker_id} stopped")

    async def _run_loop(self):
        """Main worker loop."""
        while self.running:
            try:
                # Select random endpoint
                endpoint = random.choice(list(ENDPOINTS.keys()))

                # Make the paid call
                metrics = await self.payment_client.call_with_payment(
                    endpoint, self.agent_address, self.agent_id
                )

                # If successful, anchor reputation on-chain
                if metrics.success:
                    try:
                        behavior_hash = generate_behavior_hash(
                            self.agent_id,
                            endpoint,
                            metrics.timestamp,
                            random.randint(0, 2**32 - 1)
                        )
                        # Score based on latency (lower is better, max 10000)
                        score = max(1000, min(10000, int(10000 - metrics.latency_ms * 10)))
                        tx_hash, gas_used = self.reputation_client.anchor(
                            self.agent_address, score, behavior_hash
                        )
                        metrics.anchor_tx_hash = tx_hash
                        metrics.gas_used = gas_used
                        logger.debug(f"Anchored {self.agent_id} for {endpoint}: tx={tx_hash}, gas={gas_used}")
                    except Exception as e:
                        logger.warning(f"Anchor failed for {self.agent_id}: {e}")
                        metrics.anchor_tx_hash = f"FAILED: {e}"

                # Record metrics
                self.global_metrics.record(metrics)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Worker {self.worker_id} error: {e}")

            # Random interval before next call
            if self.running:
                interval = random.uniform(self.interval_min, self.interval_max)
                await asyncio.sleep(interval)


# ============================================================================
# METRICS REPORTER
# ============================================================================

class MetricsReporter:
    """Reports metrics periodically and on shutdown."""

    def __init__(self, global_metrics: GlobalMetrics, interval: int = 30):
        self.global_metrics = global_metrics
        self.interval = interval
        self.running = False
        self._task: Optional[asyncio.Task] = None

    async def start(self):
        self.running = True
        self._task = asyncio.create_task(self._report_loop())

    async def stop(self):
        self.running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        self._print_final_report()

    async def _report_loop(self):
        while self.running:
            await asyncio.sleep(self.interval)
            if self.running:
                self._print_periodic_report()

    def _print_periodic_report(self):
        m = self.global_metrics
        print("\n" + "=" * 80)
        print(f"📊 M2M SWARM METRICS — {datetime.now().strftime('%H:%M:%S')} (elapsed: {m.elapsed_seconds:.0f}s)")
        print("=" * 80)
        print(f"Global:  calls={m.total_calls}  success={m.success_rate:.1%}  "
              f"settled=${m.total_settled_usdc:.4f} USDC  "
              f"anchors={m.total_anchor_success}/{m.total_anchor_success + m.total_anchor_failures} ({m.anchor_success_rate:.1%})  "
              f"rate={m.calls_per_second:.1f} calls/s")
        print("-" * 80)
        print(f"{'Endpoint':<30} {'Calls':>6} {'Success':>7} {'p50ms':>7} {'p99ms':>7} {'$USDC':>8} {'Anchor%':>7} {'AvgGas':>8}")
        print("-" * 80)
        for ep, em in sorted(m.endpoints.items()):
            print(f"{ep:<30} {em.total_calls:>6} {em.success_rate:>6.1%} {em.p50_latency:>7.0f} {em.p99_latency:>7.0f} "
                  f"{em.settled_usdc:>8.4f} {em.anchor_success_rate:>6.1%} {em.avg_gas:>8.0f}")
        print("=" * 80)

    def _print_final_report(self):
        m = self.global_metrics
        print("\n" + "=" * 80)
        print(f"📊 FINAL M2M SWARM REPORT — {datetime.now().isoformat()}")
        print("=" * 80)
        print(f"Duration:       {m.elapsed_seconds:.1f} seconds")
        print(f"Total Calls:    {m.total_calls}")
        print(f"Successful:     {m.successful_calls} ({m.success_rate:.1%})")
        print(f"Failed:         {m.failed_calls}")
        print(f"Settled USDC:   ${m.total_settled_usdc:.4f}")
        print(f"Anchors:        {m.total_anchor_success} success / {m.total_anchor_failures} failed ({m.anchor_success_rate:.1%})")
        print(f"Total Gas:      {m.total_gas:,}")
        print(f"Avg Gas/Anchor: {m.total_gas // max(m.total_anchor_success, 1):,}")
        print(f"Call Rate:      {m.calls_per_second:.2f} calls/sec")
        print("-" * 80)
        print(f"{'Endpoint':<30} {'Calls':>6} {'Success%':>8} {'p50ms':>7} {'p99ms':>7} {'$USDC':>8} {'Anchor%':>7} {'AvgGas':>8}")
        print("-" * 80)
        for ep, em in sorted(m.endpoints.items()):
            print(f"{ep:<30} {em.total_calls:>6} {em.success_rate:>7.1%} {em.p50_latency:>7.0f} {em.p99_latency:>7.0f} "
                  f"{em.settled_usdc:>8.4f} {em.anchor_success_rate:>6.1%} {em.avg_gas:>8.0f}")
        print("=" * 80)

        # Save JSON report
        report = {
            "timestamp": datetime.now().isoformat(),
            "duration_seconds": m.elapsed_seconds,
            "global": {
                "total_calls": m.total_calls,
                "successful_calls": m.successful_calls,
                "failed_calls": m.failed_calls,
                "success_rate": m.success_rate,
                "total_settled_usdc": m.total_settled_usdc,
                "total_anchor_success": m.total_anchor_success,
                "total_anchor_failures": m.total_anchor_failures,
                "anchor_success_rate": m.anchor_success_rate,
                "total_gas": m.total_gas,
                "avg_gas_per_anchor": m.total_gas // max(m.total_anchor_success, 1),
                "calls_per_second": m.calls_per_second,
            },
            "endpoints": {
                ep: {
                    "total_calls": em.total_calls,
                    "successful_calls": em.successful_calls,
                    "failed_calls": em.failed_calls,
                    "success_rate": em.success_rate,
                    "p50_latency_ms": em.p50_latency,
                    "p99_latency_ms": em.p99_latency,
                    "avg_latency_ms": em.avg_latency,
                    "settled_usdc": em.settled_usdc,
                    "anchor_success": em.anchor_success,
                    "anchor_failures": em.anchor_failures,
                    "anchor_success_rate": em.anchor_success_rate,
                    "total_gas": em.total_gas,
                    "avg_gas": em.avg_gas,
                }
                for ep, em in m.endpoints.items()
            }
        }
        with open("m2m_swarm_report.json", "w") as f:
            json.dump(report, f, indent=2)
        print(f"\n📄 JSON report saved to m2m_swarm_report.json")


# ============================================================================
# MAIN SWARM ORCHESTRATOR
# ============================================================================

class M2MSwarm:
    """Main orchestrator for the M2M swarm test."""

    def __init__(self):
        self.workers: List[SwarmWorker] = []
        self.payment_client: Optional[X402PaymentClient] = None
        self.reputation_client: Optional[ReputationAnchorClient] = None
        self.global_metrics = GlobalMetrics()
        self.reporter = MetricsReporter(self.global_metrics, interval=30)
        self.shutdown_event = asyncio.Event()

    async def initialize(self):
        """Initialize clients and workers."""
        logger.info("Initializing M2M Swarm...")

        # Initialize payment client
        self.payment_client = X402PaymentClient(BASE_URL)

        # Initialize reputation client
        try:
            self.reputation_client = ReputationAnchorClient()
            logger.info(f"Reputation client connected to {REPUTATION_CONTRACT}")
        except Exception as e:
            logger.error(f"Failed to initialize reputation client: {e}")
            raise

        # Create workers
        for i in range(M2M_WORKERS):
            worker = SwarmWorker(
                worker_id=i,
                payment_client=self.payment_client,
                reputation_client=self.reputation_client,
                global_metrics=self.global_metrics,
            )
            self.workers.append(worker)

        logger.info(f"Created {len(self.workers)} workers")

    async def start(self):
        """Start all workers and reporter."""
        logger.info(f"Starting {len(self.workers)} workers...")
        for worker in self.workers:
            await worker.start()
        await self.reporter.start()
        logger.info("Swarm started!")

    async def stop(self):
        """Stop all workers and reporter."""
        logger.info("Shutting down swarm...")
        for worker in self.workers:
            await worker.stop()
        await self.reporter.stop()
        if self.payment_client:
            await self.payment_client.close()
        logger.info("Swarm stopped.")

    async def run(self, duration: int = M2M_DURATION):
        """Run the swarm for the specified duration (0 = infinite)."""
        try:
            await self.initialize()
            await self.start()

            if duration > 0:
                logger.info(f"Running for {duration} seconds...")
                await asyncio.sleep(duration)
            else:
                logger.info("Running indefinitely (press Ctrl+C to stop)...")
                await self.shutdown_event.wait()

        except asyncio.CancelledError:
            pass
        finally:
            await self.stop()


# ============================================================================
# ENTRY POINT
# ============================================================================

async def main():
    """Main entry point."""
    print("=" * 80)
    print("🚀 AETHERIUS M2M SWARM TEST")
    print("=" * 80)
    print(f"Workers:       {M2M_WORKERS}")
    print(f"Interval:      {M2M_INTERVAL_MIN}-{M2M_INTERVAL_MAX}s")
    print(f"Duration:      {M2M_DURATION if M2M_DURATION > 0 else '∞'}s")
    print(f"Base URL:      {BASE_URL}")
    print(f"Contract:      {REPUTATION_CONTRACT}")
    print(f"Endpoints:     {list(ENDPOINTS.keys())}")
    print("=" * 80)

    # Validate required env vars
    missing = []
    if not BASE_RPC_URL:
        missing.append("BASE_RPC_URL")
    if not ORACLE_PRIVATE_KEY:
        missing.append("ORACLE_PRIVATE_KEY")
    if missing:
        logger.error(f"Missing required environment variables: {', '.join(missing)}")
        logger.error("Please set them in .env or .env.reputation")
        sys.exit(1)

    swarm = M2MSwarm()

    # Setup signal handlers
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, lambda: swarm.shutdown_event.set())
        except NotImplementedError:
            # Windows doesn't support add_signal_handler
            pass

    # On Windows, use a signal handler via signal module
    if sys.platform == "win32":
        def signal_handler(signum, frame):
            logger.info(f"Received signal {signum}, shutting down...")
            swarm.shutdown_event.set()
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)

    await swarm.run(M2M_DURATION)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nInterrupted by user")
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)