# Operations Runbook

How we ship to Base mainnet without losing funds, keys, or credibility.

## 1. Deploy verification gate

A transaction receipt carrying a `contractAddress` proves nothing on its own —
the address is deterministic and exists in the receipt even when deployment fails.
Every deployment MUST pass all three checks before the address is recorded anywhere:

1. `receipt.status == 1` (not merely "mined").
2. `eth_get_code(address)` returns non-empty bytecode — retry up to 3 times,
   15 seconds apart (public RPC nodes can serve stale state right after the receipt).
3. Ownership/role check against the expected deployer (e.g. `owner()`).

If any check fails: stop, do not record the address, do not point services at it.

## 2. Secret hygiene

- No private key, mnemonic, or deployer credential is ever committed, pasted into
  issues, or stored outside the encrypted vault.
- `.env*`, `*.pem`, `*.key`, and vault files are git-ignored (see `.gitignore`).
  Verify with `git check-ignore <file>` before every commit touching config.
- The deployer key lives in exactly one canonical location plus one encrypted
  offline backup. Duplicates are a bug — remove them.
- Public material (docs, dashboards, demos) may reference pay-to addresses and
  verified on-chain contracts only. Never signers, never builders.

## 3. Commit convention

- Conventional Commits, English, imperative mood: `feat:`, `fix:`, `docs:`,
  `chore:`, `security:`, `revert:`.
- No internal codenames, no operator slang, no wallet/contract addresses in
  subjects. A grant evaluator reading `git log --oneline` should see boring,
  professional engineering history.
- Commit selectively (`git add <paths>`). Never `git add -A` — the tree often
  holds scratch files that must not ship.
- Before pushing: `git diff --cached --stat` plus a secret-pattern scan over
  staged changes.

## 4. Live-service discipline

- Every automated on-chain action is simulated first (preflight); only simulated-green
  actions are broadcast, and every broadcast is atomic (full success or full revert).
- Simulations against addresses with no deployed code always look green — the
  deploy gate above exists precisely to make that failure mode impossible.
- One instance per daemon (lockfile). Duplicates cause nonce collisions.
