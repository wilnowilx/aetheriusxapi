# Quoter-Trust Audit Methodology (research/004)

Field methodology distilled from live arbitrage operations on Base (2026-09).
Use: audit any DEX aggregator, router, or oracle that quotes prices it does not settle.

## Principle

**Never trust the venue where you buy. Derive every minimum from the venue
that provably executes.** A quote is a promise; only execution is a fact.

## Failure classes (all observed live, all with on-chain receipts)

1. **Quoter-router divergence.** A quoter lens quotes pool math that the
   paired router cannot fill (measured >=5% gap, persistent). Root causes:
   stale quoter version, different pool registry, phantom liquidity.
   *Test:* flashloan preflight with minOut at 95/90/80/70% of quote; binary-search
   the true executable discount. If nothing clears at 70%, the venue is mirage.
2. **Phantom preflights.** `eth_call`/`estimate_gas` against an address with no
   deployed code always succeeds. Every preflight must assert `get_code > 0`
   on every target *before* simulating.
3. **Dead-pool dust.** Empty pools return 1 wei instead of reverting, producing
   million-bps fake dislocations. Ceiling: any cross-venue deviation >2000bps
   on majors is data garbage, not alpha. Log as BAD_QUOTE, never signal.
4. **Decimal traps.** 6-decimal vs 18-decimal amounts silently scale quotes by
   1e12. Every amount constructor must carry explicit decimals; every scanner
   self-validates token addresses (length + checksum + on-chain code check).
5. **Stale-RPC quotes.** Public RPCs lag and rate-limit (429). Rotate 5+
   endpoints; treat any quote older than one block as suspect during volatility.
6. **Mismatched targets.** Multicall-style execution must pair each calldata
   with its contract (approve->token, swap->router). Misaligned targets revert
   the whole bundle; always assert pairing in builders.

## Auditor checklist (per venue pair)

- [ ] Both quoters return sane values at probe size (3 sizes: base/2x/5x)?
- [ ] Executable discount measured via descending-minOut preflights?
- [ ] Targets carry deployed code (checked this block, not last week)?
- [ ] Decimals explicit on every amount on both sides?
- [ ] Deviation sane (<2000bps majors) or flagged BAD_QUOTE?
- [ ] Min-outs derived from the *executing* venue, never the promising one?
- [ ] Full roundtrip preflight green before any live fire?

## Status

Living document. Versioned with each new failure class the field teaches us.
