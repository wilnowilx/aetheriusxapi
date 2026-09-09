# Changelog

> Format: Keep a Changelog. Dates are deploy dates (UTC-6). Every entry must be
> verifiable (`git log`, live probes, `/v1/telemetry`).

## [Unreleased]

- Security audit response: SSRF guard on `/v1/web/scrape` (public-IP only +
  re-validated redirects), route-coverage test (deny-by-default: every /v1
  route priced or explicitly free), Dockerfile non-root user, `security.yml`
  CI (bandit + pip-audit), Sepolia replay E2E PASS (same proof → 402, single
  $0.001 settlement). Suite: 141 passed.
- **First MAINNET settlement:** official 402 → EIP-3009 sign → 200, $0.001
  USDC on Base mainnet (test 0.48612→0.48512, merchant 0→0.001), volume
  tracked. Proof: probe `--pay --mainnet` v2 PASS via CDP facilitator.
- README "Unit economics" block from real `PRICES` (60 paid counted by tier;
  billing floor $0.002; uuid $0.001 is a loss-leader outside free tier).
- `TERMS.md`: plain-language API terms (as-is, non-custodial, no SLA,
  settlement honesty) — closes the ToS gap for grant evaluators.
- **First real settlement (Sepolia staging):** official 402 → EIP-3009 sign →
  200, $0.001 USDC settled on-chain (payer 20→19.999), volume tracked in
  telemetry. Proof: `tools/real_payment_probe.py --pay` v2 PASS.
- Interactive Instruments landing section (cost calculator from live `/health`
  prices, wallet-intel explorer, staged live 402→200 loop visualizer).
- Wiki as source of truth (`wiki/` + sync Action, ADRs, runbooks).
- Institutional governance: `SECURITY.md`, `CODEOWNERS`, issue/PR templates,
  docs lint CI, `CITATION.md`.

## [2.0.0] — 2026-09-05 — Mainnet

- 100 live endpoints on Base Mainnet: 60 paid (x402) + 40 free
  (20 x402 Intelligence + 20 QuantumXBrain).
- TOCTOU anti-replay: nonce cache, 409 on duplicate proofs (Sep 7).
- Python SDK v2.0 (typed sub-clients) + JavaScript SDK.
- Dashboard (vanilla JS, served by backend) + R3F landing + playground.
- 39 tests green. Telemetry persisted (SQLite) and public.

## [1.x] — 2026-09-02 → 2026-09-04 — Build-up

- Sep 2: repo born — landing, docs, Python SDK, persistent telemetry.
- Sep 3: dashboard OS mode, HTTPS, CORS, JS SDK, demo player, 10+ tutorials EN/ES.
- Sep 4: interactive playground, waitlist, Docker, YouTube demo.
- Sep 6: QuantumXBrain (20 enhanced free endpoints, fingerprinted responses).
- Sep 7: full R3F rebuild (React 19 + Three Fiber globe + GSAP + Lenis + DonateX).
- Sep 8: glass-morphism landing redesign (contrast, branded SVGs, real-route
  playground) + VM hardening (fail2ban, TLS 1.2+, nginx headers, iptables).
