# Dynamic Escrow Collateral (research/003)

**Rule:** for any routed value `V`, the attester's free collateral must satisfy
`stake - locked >= V * factor / 10000` with `factor >= 10000` (STAKE > VALUE, always).

## Why static stakes fail at macro scale

A fixed slash prices a breach but does not settle it: if an agent misroutes
$10K and the attester's stake is $500, the harmed side stays $9,500 short.
Deterrent, not settlement. (Raised in public debate; accepted as correct.)

## Why static stakes suffice at micro scale

x402 agent commerce streams value in atomic micro-requests (cents). The daemon
halts on the first invariant break, so maximum exposure is one micro-payment.
A fixed stake over-collateralizes that loss by orders of magnitude: settlement,
not just deterrent. The boundary is the thermodynamics of the transaction.

## Implementation (live reference)

`contracts/ReputationAnchorV2.sol` (compiled, solc 0.8.20):
- `requiredCollateral(V)` — view, returns `V * factor / 10000` (default factor 120%).
- `authorizes(agent, V)` — view gate routers query before sending value.
- `openEscrow / releaseEscrow` (oracle-only) — locks and frees collateral per route.
- `slash(agent, amount, evidence)` (oracle-only) — capped at stake, never beyond.
- `depositStake / withdrawStake` — withdrawals only from free (unlocked) collateral.

## Status

Code complete and compiling. Deployment + `ORACLE_ROLE` grant pending operator order.
V1 (`ReputationAnchor`, scores only) remains deployed and untouched for backward compatibility.
