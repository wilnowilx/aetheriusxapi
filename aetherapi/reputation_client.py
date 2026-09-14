"""
ReputationClient for Aetherius Agent Reputation On-Chain.

Provides anchor() and batch_anchor() methods for the Oracle auto-sync
to write agent reputation scores and behavior merkle roots to the ReputationAnchor contract.
"""

import os
import hashlib
from typing import List, Optional, Tuple
from dataclasses import dataclass
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware
from eth_account import Account
from dotenv import load_dotenv

load_dotenv()
load_dotenv(".env.reputation")

CONTRACT_ADDRESS = os.getenv("AETHERIUS_REPUTATION_CONTRACT")
BASE_RPC_URL = os.getenv("BASE_RPC_URL")
ORACLE_PRIVATE_KEY = os.getenv("ORACLE_PRIVATE_KEY")

if not CONTRACT_ADDRESS:
    raise ValueError("AETHERIUS_REPUTATION_CONTRACT not set in environment")
if not BASE_RPC_URL:
    raise ValueError("BASE_RPC_URL not set in environment")
if not ORACLE_PRIVATE_KEY:
    raise ValueError("ORACLE_PRIVATE_KEY not set in environment")

ABI = [
    {"inputs":[{"internalType":"address","name":"agent","type":"address"},{"internalType":"uint16","name":"score","type":"uint16"},{"internalType":"bytes32","name":"behaviorRoot","type":"bytes32"}],"name":"anchor","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"address[]","name":"agents","type":"address[]"},{"internalType":"uint16[]","name":"scores","type":"uint16[]"},{"internalType":"bytes32[]","name":"behaviors","type":"bytes32[]"}],"name":"batchAnchor","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"address","name":"agent","type":"address"}],"name":"getReputation","outputs":[{"internalType":"uint16","name":"score","type":"uint16"},{"internalType":"uint64","name":"updated","type":"uint64"},{"internalType":"bytes32","name":"behavior","type":"bytes32"}],"stateMutability":"view","type":"function"},
    {"anonymous":False,"inputs":[{"indexed":True,"internalType":"address","name":"agent","type":"address"},{"indexed":False,"internalType":"uint16","name":"score","type":"uint16"},{"indexed":False,"internalType":"bytes32","name":"behaviorRoot","type":"bytes32"},{"indexed":False,"internalType":"uint64","name":"timestamp","type":"uint64"}],"name":"Anchored","type":"event"},
    {"anonymous":False,"inputs":[{"indexed":False,"internalType":"address[]","name":"agents","type":"address[]"},{"indexed":False,"internalType":"uint16[]","name":"scores","type":"uint16[]"},{"indexed":False,"internalType":"bytes32[]","name":"behaviors","type":"bytes32[]"},{"indexed":False,"internalType":"uint64","name":"timestamp","type":"uint64"}],"name":"BatchAnchored","type":"event"},
]

w3 = Web3(Web3.HTTPProvider(BASE_RPC_URL))
w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
contract = w3.eth.contract(address=Web3.to_checksum_address(CONTRACT_ADDRESS), abi=ABI)
oracle = Account.from_key(ORACLE_PRIVATE_KEY)


@dataclass
class AgentBehavior:
    agent: str
    score: int
    actions: List[dict]

    def compute_merkle_root(self) -> bytes:
        """Compute merkle root of agent's behavioral actions."""
        leaves = [hashlib.sha256(str(action).encode()).digest() for action in self.actions]
        if not leaves:
            return b"\x00" * 32
        while len(leaves) > 1:
            if len(leaves) % 2 == 1:
                leaves.append(leaves[-1])
            leaves = [hashlib.sha256(leaves[i] + leaves[i + 1]).digest() for i in range(0, len(leaves), 2)]
        return leaves[0]


class ReputationClient:
    """Client for anchoring agent reputation scores on-chain."""

    def __init__(
        self,
        contract_address: Optional[str] = None,
        rpc_url: Optional[str] = None,
        oracle_key: Optional[str] = None,
    ):
        self.contract_address = Web3.to_checksum_address(contract_address or CONTRACT_ADDRESS)
        self.w3 = Web3(Web3.HTTPProvider(rpc_url or BASE_RPC_URL))
        self.w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
        self.contract = self.w3.eth.contract(address=self.contract_address, abi=ABI)
        self.oracle = Account.from_key(oracle_key or ORACLE_PRIVATE_KEY)

    def _build_tx(self, fn, gas_buffer: int = 50000):
        gas_estimate = fn.estimate_gas({"from": self.oracle.address})
        return fn.build_transaction({
            "from": self.oracle.address,
            "nonce": self.w3.eth.get_transaction_count(self.oracle.address),
            "gas": gas_estimate + gas_buffer,
            "gasPrice": self.w3.eth.gas_price,
            "chainId": 8453,
        })

    def anchor(
        self,
        agent: str,
        score: int,
        behavior_hash: bytes,
        wait: bool = True,
    ) -> str:
        """
        Anchor a single agent's reputation score and behavior merkle root.

        Args:
            agent: Agent address (0x...)
            score: Reputation score 0-10000
            behavior_hash: 32-byte merkle root of agent's behavioral actions
            wait: Wait for transaction receipt

        Returns:
            Transaction hash as hex string
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
            print(f"Anchored {agent_addr}: score={score}, tx={tx_hash.hex()}")
        return tx_hash.hex()

    def batch_anchor(
        self,
        agents: List[str],
        scores: List[int],
        behavior_hashes: List[bytes],
        wait: bool = True,
    ) -> str:
        """
        Batch anchor multiple agents' reputation in a single transaction.

        Args:
            agents: List of agent addresses
            scores: List of reputation scores (0-10000)
            behavior_hashes: List of 32-byte merkle roots
            wait: Wait for transaction receipt

        Returns:
            Transaction hash as hex string
        """
        if not (len(agents) == len(scores) == len(behavior_hashes)):
            raise ValueError("All arrays must have same length")
        if len(agents) == 0:
            raise ValueError("Empty batch")

        agent_addrs = [Web3.to_checksum_address(a) for a in agents]
        for s in scores:
            if not 0 <= s <= 10000:
                raise ValueError("All scores must be 0-10000")
        behavior_bytes = [
            Web3.to_bytes(hexstr=bh.hex()) if isinstance(bh, str) else bh
            for bh in behavior_hashes
        ]
        for bh in behavior_bytes:
            if len(bh) != 32:
                raise ValueError("All behavior_hashes must be 32 bytes")

        fn = self.contract.functions.batchAnchor(agent_addrs, scores, behavior_bytes)
        tx = self._build_tx(fn, gas_buffer=100000)
        signed = self.w3.eth.account.sign_transaction(tx, self.oracle.key)
        tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)

        if wait:
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            if receipt.status != 1:
                raise RuntimeError(f"Batch transaction failed: {tx_hash.hex()}")
            print(f"Batch anchored {len(agents)} agents: tx={tx_hash.hex()}")
        return tx_hash.hex()

    def batch_anchor_from_behaviors(
        self,
        behaviors: List[AgentBehavior],
        wait: bool = True,
    ) -> str:
        """
        Batch anchor from AgentBehavior objects (computes merkle roots internally).

        Args:
            behaviors: List of AgentBehavior with agent, score, actions
            wait: Wait for transaction receipt

        Returns:
            Transaction hash as hex string
        """
        agents = [b.agent for b in behaviors]
        scores = [b.score for b in behaviors]
        hashes = [b.compute_merkle_root() for b in behaviors]
        return self.batch_anchor(agents, scores, hashes, wait)

    def get_reputation(self, agent: str) -> Tuple[int, int, bytes]:
        """
        Read an agent's current on-chain reputation.

        Returns:
            (score, lastUpdateTimestamp, behaviorHash)
        """
        agent_addr = Web3.to_checksum_address(agent)
        score, updated, behavior = self.contract.functions.getReputation(agent_addr).call()
        return score, updated, behavior

    def estimate_gas_anchor(self, agent: str, score: int) -> int:
        """Estimate gas for single anchor."""
        fn = self.contract.functions.anchor(
            Web3.to_checksum_address(agent), score, b"\x00" * 32
        )
        return fn.estimate_gas({"from": self.oracle.address})

    def estimate_gas_batch(self, count: int) -> int:
        """Estimate gas for batch anchor of N agents."""
        agents = [Web3.to_checksum_address("0x" + "1" * 40)] * count
        scores = [5000] * count
        behaviors = [b"\x00" * 32] * count
        fn = self.contract.functions.batchAnchor(agents, scores, behaviors)
        return fn.estimate_gas({"from": self.oracle.address})


def create_client() -> ReputationClient:
    """Factory function to create client from environment."""
    return ReputationClient()


if __name__ == "__main__":
    import sys
    client = create_client()

    if len(sys.argv) < 2:
        print("Usage: python -m aetherapi.reputation_client <command> [args]")
        print("Commands:")
        print("  anchor <agent> <score> <behavior_hash_hex>")
        print("  batch <agents.json>")
        print("  get <agent>")
        print("  estimate <count>")
        sys.exit(1)

    cmd = sys.argv[1]

    if cmd == "anchor":
        if len(sys.argv) != 5:
            print("Usage: anchor <agent> <score> <behavior_hash_hex>")
            sys.exit(1)
        agent, score, bh = sys.argv[2], int(sys.argv[3]), bytes.fromhex(sys.argv[4])
        tx = client.anchor(agent, score, bh)
        print(f"Tx: {tx}")

    elif cmd == "batch":
        if len(sys.argv) != 3:
            print("Usage: batch <agents.json>")
            sys.exit(1)
        import json
        with open(sys.argv[2]) as f:
            data = json.load(f)
        behaviors = [AgentBehavior(**b) for b in data]
        tx = client.batch_anchor_from_behaviors(behaviors)
        print(f"Tx: {tx}")

    elif cmd == "get":
        if len(sys.argv) != 3:
            print("Usage: get <agent>")
            sys.exit(1)
        score, updated, behavior = client.get_reputation(sys.argv[2])
        print(f"Agent: {sys.argv[2]}")
        print(f"Score: {score}")
        print(f"Last Update: {updated}")
        print(f"Behavior Hash: {behavior.hex()}")

    elif cmd == "estimate":
        count = int(sys.argv[2]) if len(sys.argv) > 2 else 10
        single = client.estimate_gas_anchor("0x" + "1" * 40, 5000)
        batch = client.estimate_gas_batch(count)
        print(f"Single anchor gas: {single:,}")
        print(f"Batch {count} agents gas: {batch:,}")
        print(f"Gas per agent (batch): {batch // count:,}")
        print(f"Savings vs single: {(single * count - batch) / (single * count) * 100:.1f}%")

    else:
        print(f"Unknown command: {cmd}")
        sys.exit(1)