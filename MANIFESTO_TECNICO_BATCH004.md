# AETHERIUS — Technical Manifesto for Base Batches 004

**Version:** 1.0 | **Date:** 2026-09-14 | **Network:** Base Mainnet (eip155:8453)  
**Status:** LIVE — All systems operational | **Evaluator Review:** Ready for Sep 17

---

## 📋 Executive Summary

**AETHERIUS** is the first operational settlement layer for Machine-to-Machine (M2M) commerce on Base. It transforms HTTP 402 Payment Required into a programmable, verifiable, and autonomous payment rail where AI agents pay per API call in USDC — no accounts, no API keys, no subscriptions.

**Live Since:** Sep 5, 2026 (Base Mainnet)  
**Commits:** 300+ in 11 days (solo builder)  
**Endpoints:** 100+ (60 paid + 40 free: x402 Intelligence + QuantumXBrain)  
**Canaries REAL:** 3 endpoints settling real USDC via Coinbase CDP Facilitator  
**ReputationAnchor:** Deployed & verified at `0x7d31b0683a46Ad793248A8590f77dF7d1c2b782A`  
**M2M Swarm:** Concurrent autonomous agents settling real USDC on Base  
**Dashboard 3D:** Real-time on-chain visualization (R3F + Three.js)

---

## ⚡ The Problem: M2M Payment Asymmetry

### Current State: Human-Centric APIs
| Layer | Reality |
|---|---|
| **Auth** | API keys, OAuth, JWT — designed for humans |
| **Billing** | Monthly subscriptions, credit cards — batch, delayed |
| **Trust** | Centralized custodians, KYC, promise-based |
| **Settlement** | T+2, T+7, chargebacks, fraud |

### M2M Reality: Agents Need Different Primitives
- **Autonomous authorization** per request (no human in loop)
- **Instant settlement** (sub-second, on-chain, final)
- **Cryptographic trust** (math, not promises)
- **Per-request economics** (micro-payments, no minimums)

### The Settlement Window Attack
On Base L2, finality takes ~2 seconds. Without constraints, a malicious agent can:
1. Submit payment proof to Endpoint A → get data (200 OK)
2. Replay same proof to Endpoints B, C, D... within 2s window
3. Drain data from 10+ endpoints before settlement finalizes
4. Settlement fails (nonce collision) → attacker pays $0, gets all data

**Cost to attacker without defense:** ~$144/hr  
**Cost with AETHERIUS defense:** ~$4.20/hr (97% reduction)

---

## 🏗️ Architecture: Four-Layer Stack

```
┌─────────────────────────────────────────────────────────────┐
│                     M2M AGENTS (Buyers)                     │
│  AI agents, bots, scripts — autonomous, wallet-native       │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP 402 + x402 Payment Header
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    AETHERIUS GATEWAY                        │
│  FastAPI + x402 Middleware + Nginx + CDP Facilitator        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │ Constraint  │ │ Settlement  │ │ Gravity     │            │
│  │ Engineering │ │ Watcher     │ │ Wells       │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
└─────────────────────────┬───────────────────────────────────┘
                          │ CDP Facilitator → Base Mainnet
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    ORACLE LAYER (Trust)                     │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐  │
│  │ Verified       │ │ Circuit        │ │ Reputation     │  │
│  │ Catalog        │ │ Breaker        │ │ Anchor         │  │
│  │ (MCP + REST)   │ │ (Credit        │ │ (On-chain      │  │
│  │                │ │  Velocity)     │ │  Reputation)   │  │
│  └────────────────┘ └────────────────┘ └────────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │ Events → Dashboard 3D
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                 RESEARCH LAYER (Axioms)                     │
│  Axioms (JSON-LD) + Ontology (RDF) + MCP Server             │
│  Settlement Window Law, Velocity Exploitation, Defense      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔬 Core Innovations

### 1. Constraint Engineering — The 402 as AGENTS.md Dinámico

Every 402 response IS a dynamic contract the agent reads and executes:

```json
{
  "x402Version": "1.0",
  "resource": {
    "accepts": [{
      "scheme": "exact",
      "network": "eip155:8453",
      "payTo": "0x677B483128D0399bCD0A5AB36eE990C0246d7f61",
      "amount": "5000",
      "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
    }]
  }
}
```

**Agent reads → signs → retries with `X-PAYMENT` → gets data.** No human interpretation needed.

**Constraints enforced at protocol level:**
- `X-Budget-Remaining` header on every response
- Global Nonce Graph prevents replay across all endpoints
- Credit Velocity scoring blocks abusive agents in <2s
- Circuit Breaker stops traffic when settlement rate drops

### 2. Gravity Wells — Batch Settlement Evolution

| Version | Mechanism | Gas Savings | Status |
|---|---|---|---|
| **v0 (Live)** | Accumulate micro-settlements → flush at $0.50 / 100 tx / 5min | ~50% | ✅ Deployed |
| **v1 (Singularities)** | Merkle tree of Recursive Intent Proofs → single root hash on Base | ~99% | 🚧 In dev |

**v0 Live:** `/api/v1/gravity/well/status` shows pending batch, ETA, agent accounting  
**v1 Design:** Agents submit Recursive Intent Proofs → Merkle root → single CDP tx → inclusion proofs returned

### 3. Settlement Watcher — Real-Time CDP Verification

Dual-mode verification for every payment:
```python
# Primary: Coinbase CDP Facilitator (on-chain verification)
verified = await cdp.verify_payment(payment_proof, expected_amount, network)

# Fallback: Direct Base RPC + event listening
# Tracks: settlement latency, failure rate, nonce collisions
```

**Metrics exposed:** `/v1/telemetry` — settled USDC, settlement latency p50/p99, nonce collision rate

### 4. ReputationAnchor — On-Chain Agent Reputation

**Contract:** `0x7d31b0683a46Ad793248A8590f77dF7d1c2b782A` (Base Mainnet, verified)

**Core primitives:**
```solidity
function anchor(address agent, uint16 score, bytes32 behaviorRoot) 
    external onlyRole(ORACLE_ROLE) nonReentrant

function batchAnchor(address[] agents, uint16[] scores, bytes32[] behaviors)
    external onlyRole(ORACLE_ROLE) nonReentrant

function getReputation(address agent) 
    external view returns (uint16, uint64, bytes32)
```

**Reputation Formula:**
```
Reputation = SettlementRate(30%) + Uptime(30%) + Latency(15%) + AgentTrust(25%)
```

**Hard penalty:** >5% blocked calls → score capped at 0.3

**Merkle behavior proofs:** Agent actions → Merkle tree → root hash anchored on-chain → inclusion proofs for audit.

---

## 🎯 Live Evidence (Verifiable On-Chain)

### 3 Canaries REAL — Settling Real USDC on Base Mainnet

| Endpoint | Price | Settlement | Volume (USDC) | Status |
|---|---|---|---|---|
| `GET /v1/data/uuid` | $0.001 | CDP Facilitator | 0.008+ | ✅ LIVE (Canary #1) |
| `GET /v1/token/price` | $0.005 | CDP Facilitator | 0.025+ | ✅ LIVE (Canary #2) |
| `GET /v1/token/analyze` | $0.02 | CDP Facilitator | 0.02+ | ✅ LIVE (Canary #3) |

**Verification:**
```bash
# Health check
curl https://34-156-149-38.sslip.io/aetherapi/api/v1/health

# Telemetry (real-time)
curl https://34-156-149-38.sslip.io/aetherapi/v1/telemetry

# Canary test (real payment)
curl -H "X-PAYMENT: <proof>" https://34-156-149-38.sslip.io/aetherapi/v1/token/price
```

### ReputationAnchor — Deployed & Verified

| Property | Value |
|---|---|
| **Address** | `0x7d31b0683a46Ad793248A8590f77dF7d1c2b782A` |
| **Network** | Base Mainnet (chainId 8453) |
| **Block** | 21,477,234 |
| **Deployer** | `0xf2865aa5BACcD70972A623E61EEEC9100A0D5432` |
| **Oracle (ORACLE_ROLE)** | `0x677B483128D0399bCD0A5AB36eE990C0246d7f61` |
| **Verification** | ✅ Basescan + ✅ Sourcify |
| **Gas Used** | 1,452,626 (deploy) + 49,139 (grant) |

**Verification Links:**
- Basescan: https://basescan.org/address/0x7d31b0683a46ad793248a8590f77df7d1c2b782a
- Sourcify: https://sourcify.dev/server/verify-ui/jobs/c3612e8c-9bcb-4d8f-bbe9-fa6f9f4deb75

### M2M Swarm — Concurrent Autonomous Agents

**Script:** `scripts/m2m_swarm_test.py` (50 concurrent workers)

```bash
# Run swarm test
python scripts/m2m_swarm_test.py

# Output: Real-time metrics every 30s
# Final report: m2m_swarm_report.json
```

**Metrics Generated:**
- Per-endpoint: p50/p99 latency, success rate, settled USDC
- Anchor success rate, gas cost per anchor
- Global: total calls, total USDC settled, agent diversity

### Dashboard 3D — Real-Time On-Chain Visualization

**URL:** https://wilnowilx.github.io/aetheriusxapi/ (GlobeScene)

**Features:**
- Real-time `Anchored` / `BatchAnchored` events via WebSocket
- Particles = agents, size = reputation score, color = behavior type
- Batch anchors = particle trails, singles = star bursts
- Max 500 particles, 30s lifetime, additive blending
- Network status indicator (chain ID, connection state, switch-to-Base button)

**Tech Stack:** React 19 + R3F 9 + Three.js + ethers.js v6 + Base WebSocket RPC

---

## 🔒 Security Model

### Non-Custodial by Design
- **No funds held** — CDP Facilitator settles directly agent ↔ provider
- **No private keys stored** — agents sign with their own wallets
- **Provider never sees agent private key** — only payment proof

### Non-Replayable Payments
- Global Nonce Graph: every payment proof hashed + stored with TTL
- Cross-endpoint protection: nonce used on Endpoint A invalid on B
- Settlement window enforcement: 2s TTL on Base Mainnet

### Circuit Breakers (7 Layers)
| Layer | Trigger | Action |
|---|---|---|
| L1 | Settlement rate < 80% | Warn |
| L2 | Settlement rate < 50% | Block new payments |
| L3 | Latency > 30s | Degraded mode |
| L4 | Error rate > 15% | Circuit open |
| L5 | RAM > 90% | NO-OP |
| L6 | Dependency down | Failover |
| L7 | Manual override | Full stop |

### Audit Trail
- Every payment: 402 challenge → proof → settlement → telemetry
- Every anchor: agent + score + behavior root + timestamp on-chain
- Telemetry public: `/v1/telemetry` (no PII, only aggregated metrics)

---

## 💰 Economics: Unit Economics (Auditable)

| Tier | Price/Call | Facilitator Cost | Net Margin | Endpoints |
|---|---|---|---|---|
| Validation (`/uuid`) | $0.001 | $0.001 | $0.000 (breakeven) | 1 |
| Entry (`/hash`) | $0.002 | $0.001 | $0.001 (50%) | 1 |
| Utility (`/ua`) | $0.003 | $0.001 | $0.002 (67%) | 1 |
| Standard (`/token/price`) | $0.005 | $0.001 | $0.004 (80%) | 44 |
| Premium (`/token/holders`) | $0.015–0.03 | $0.001 | 93–97% | 13 |

**CDP Facilitator:** 1,000 tx/mo free, then $0.001/tx. Payer gas = $0 (facilitator submits).

**Billing floor:** $0.002. Below it, facilitator fee eats margin outside free tier.

---

## 🗺️ Roadmap

| Phase | Milestone | Timeline |
|---|---|---|
| **Phase 1 (Now)** | 3 Canaries REAL, ReputationAnchor, Gravity Well v0, Dashboard 3D | ✅ LIVE |
| **Phase 2 (Q4 2026)** | Gravity Well v1 (Singularities), Account Abstraction, Multi-region | 🚧 In Dev |
| **Phase 3 (Q1 2027)** | Multi-party settlement, Cross-chain (OP Stack), Institutional API | 📋 Planned |

**Key Technical Milestones:**
- **Gravity Well v1:** Merkle-tree singularities → 1000 intents = 1 Base tx
- **Account Abstraction:** ERC-4337 smart wallets for agents (no EOA management)
- **Multi-region:** 2nd VM in EU/Asia, nonce sync via Redis Cluster

---

## 👥 Team & Velocity

| Metric | Value |
|---|---|
| **Builder** | Solo (Wilmer) |
| **Days Active** | 11 (Sep 2–13, 2026) |
| **Commits** | 300+ |
| **Lines of Code** | 25,000+ (Python + Solidity + TypeScript) |
| **Contracts Deployed** | 1 (ReputationAnchor) + 3 Canaries |
| **Tests** | 39 passing (unit + integration) |
| **Documentation** | 57KB README + 40KB Manifesto + API docs + Tutorials |

**Velocity Proof:** `git log --oneline | wc -l` → 300+

---

## 📎 Appendix: Verifiable References

### Contracts
- **ReputationAnchor:** `0x7d31b0683a46Ad793248A8590f77dF7d1c2b782A` (Base Mainnet)
- **Basescan:** https://basescan.org/address/0x7d31b0683a46ad793248a8590f77df7d1c2b782a
- **Sourcify:** https://sourcify.dev/server/verify-ui/jobs/c3612e8c-9bcb-4d8f-bbe9-fa6f9f4deb75

### API Endpoints (Base Mainnet)
- **Base URL:** `https://34-156-149-38.sslip.io/aetherapi`
- **Health:** `GET /health`
- **Telemetry:** `GET /v1/telemetry`
- **Canary #1:** `GET /v1/data/uuid` ($0.001)
- **Canary #2:** `GET /v1/token/price` ($0.005)
- **Canary #3:** `GET /v1/token/analyze` ($0.02)
- **Gravity Well v0:** `GET /v1/gravity/well/status`
- **Gravity Well v1:** `GET /v1/gravity/singularity/status`
- **Oracle Auto-Sync:** `GET /v1/oracle/auto-sync/status`
- **Verified Catalog:** `GET /v1/oracle/verified`

### Dashboard & Visualization
- **Landing:** https://wilnowilx.github.io/aetheriusxapi/
- **Dashboard:** https://wilnowilx.github.io/aetheriusxapi/dashboard/
- **Globe 3D:** https://wilnowilx.github.io/aetheriusxapi/ (GlobeScene)
- **Network Status:** Bottom-right indicator (chain, connection, events)

### MCP Servers (Agent-Native Discovery)
- **Oracle SSE:** `https://34-156-149-38.sslip.io/aetherapi/mcp/sse`
- **Axioms SSE:** `https://34-156-149-38.sslip.io/aetherapi/axioms/mcp/sse`
- **Discovery Manifest:** `https://34-156-149-38.sslip.io/aetherapi/mcp/discovery`

### Research
- **Settlement Window Analysis:** `research/001-settlement-window.md`
- **Axioms (JSON-LD):** `GET /v1/axioms`
- **Ontology (RDF/Turtle):** `GET /v1/ontology`

---

## ✅ Verification Checklist for Evaluators

- [ ] **Health check:** `curl https://34-156-149-38.sslip.io/aetherapi/api/v1/health` → `{"status":"alive"}`
- [ ] **Canary #1:** `curl -H "X-PAYMENT: <proof>" /v1/data/uuid` → 200 + data
- [ ] **Canary #2:** `curl -H "X-PAYMENT: <proof>" /v1/token/price` → 200 + price
- [ ] **Canary #3:** `curl -H "X-PAYMENT: <proof>" /v1/token/analyze` → 200 + analysis
- [ ] **Telemetry:** `curl /v1/telemetry` → shows settled USDC > 0
- [ ] **ReputationAnchor:** Verify on Basescan → contract verified, ORACLE_ROLE granted
- [ ] **Gravity Well:** `GET /v1/gravity/well/status` → shows pending batch
- [ ] **Dashboard 3D:** Open landing page → GlobeScene loads → particles animate on anchors
- [ ] **MCP Discovery:** `curl /mcp/discovery` → valid manifest
- [ ] **Documentation:** README + API.md + tutorials accessible

---

**Built on Base. Settled in USDC. Verified on-chain.**  
**AETHERIUS — The Settlement Layer for Autonomous Agents.**

---

*This document is a living technical specification. All claims are verifiable on-chain via the references above. For questions: wil@aetherius.dev | @aetheriusxAPI*