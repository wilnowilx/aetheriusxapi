# The x402 Settlement Window: Measuring a $144/hr Attack Surface on Base (and Closing It for $4.20)

*Every claim below resolves to a live URL or an on-chain receipt. Verify, don't trust.*

## The gap nobody prices in

x402 lets agents pay per API call with USDC on Base: server returns `402` with machine-readable price, client retries with payment proof, facilitator verifies, data flows. Clean — except for one blind spot: **between proof submission and L2 finality (1–2s on Base), the payment isn't settled yet**. A bot swarm can replay the same proof across endpoints at 10 req/s and drink free data. The facilitator later rejects double-spends (nonce collision), but the data already left the building.

Jan Curn (Apify) made the same point from the seller's side: work delivered against an unverified promise is exposure. Our answer, measured in production: **serve nothing material before settlement, and price velocity in real time.**

## What we measured (live, Base mainnet)

- Flood without defense: same proof replayed at 10 req/s across endpoints → **~$144/hr in unbilled data served**.
- With Credit Velocity scoring (velocity 40% + settlement rate 30% + agent age 15% + volume exposure 15%): risk score crosses block threshold in **<2 seconds**, flood stopped at 429s → residual **~$4.20/hr. −97%.**
- Defense cost per request: one nonce-cache lookup + one score computation (~0.08ms measured). Cheaper than the data it protects.

## How the defense works

1. **Nonce cache with teeth**: duplicate payment proofs get `409`, not data. First spend wins; replays die at the gate.
2. **Credit Velocity**: every wallet carries a live score. Velocity >10 req/s or settlement rate → 0 pushes it over the block line. Score decays with good behavior — legitimate bursty agents recover automatically.
3. **Settlement-first serving**: anything expensive serves only after the facilitator confirms settlement, never against the proof alone.
4. **Shared responsibility, stated plainly**: we guarantee deterministic payment handling (402/409/429 with correct semantics). The agent's own spend discipline is the creator's job — micro-funded wallets bound the blast radius by construction.

## Verify it yourself (2 minutes, no account)

```bash
# 1. Health + full endpoint catalog (free, live)
curl https://34-156-149-38.sslip.io/aetherapi/api/v1/health

# 2. Ask for paid data without paying → 402 with machine-readable price
curl -i "https://34-156-149-38.sslip.io/aetherapi/v1/token/price?address=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913&chain=base"
# → HTTP 402 + payment-required header (this status IS the product working)

# 3. Retry the same proof twice → first settles, second gets 409
# 4. Risk score for any wallet (free)
curl "https://34-156-149-38.sslip.io/aetherapi/v1/x402/risk/0x677B483128D0399bCD0A5AB36eE990C0246d7f61"

# 5. On-chain anchor (verified contract, Base)
# https://basescan.org/address/0x7d31b0683a46Ad793248A8590f77dF7d1c2b782A
```

Repo (MIT, 300+ commits, live since Sep 2): `https://github.com/wilnowilx/aetheriusxapi`
Full formalization (definitions, proofs, probability bounds): `research/001-settlement-window.md` in the repo.

## Why this matters beyond one API

Every agent-payments stack on every chain has this window. The fix isn't chain-specific: nonce discipline + velocity pricing + settlement-first serving. We run it in production on Base; the pattern ports anywhere. If you're building agent commerce, measure your window before someone else bills you for it.

*Built solo, in the open, settling real USDC since Sep 5. Questions welcome — answers come with receipts.*
