# aetheriusxAPI — Terms of Service

> Plain-language terms for an experimental open API. Code is MIT (`LICENSE`);
> this page governs *use of the live service*. Last updated: 2026-09-10.

**Status:** Active · **Owner:** maintainers · **Review:** on pricing/mode change.

## 1. The service, as-is

aetheriusxAPI is experimental infrastructure in **infrastructure-validation
phase**. No uptime SLA, no latency guarantees, no support SLA. Single-VM
deployment; maintenance windows happen without notice. If you build on it,
design for retries and fallbacks — like you would with any early network.

## 2. Settlement honesty

- Paid routes issue an x402 `402 Payment Required` challenge with price,
  currency, network, and payee. What you see in the challenge is what settles.
- Check the live mode anytime: `GET /health` → `mode`. Telemetry
  (`GET /v1/telemetry`) reports settled volume counters; methodology is stated
  in-repo, never implied.
- Prices are per-request micropayments ($0.001–$0.03). Prices may change with
  7 days notice via `CHANGELOG.md`. Completed payments are final (they settle
  on-chain to the merchant wallet, not to us as custodian).

## 3. Non-custodial, by design

We never hold your funds. USDC moves directly payer → merchant wallet via the
x402 facilitator flow. We cannot freeze, reverse, or recover payments. If you
pay the wrong route, the chain — not support — is the source of truth.

## 4. Acceptable use

- Respect rate limits (see README → Rate Limits). Aggressive polling,
  credential stuffing, or DDoS gets null-routed at the edge without warning.
- No illegal use, no laundering flows, no sanctioned addresses. The CDP
  facilitator runs KYT screening; flagged payments are declined automatically.
- Free-tier intelligence endpoints are a public good: cache aggressively,
  don't scrape them at machine-gun cadence.

## 5. Privacy

We log request counts, latencies, routes, and on-chain payment metadata
(public by nature). No accounts, no emails, no tracking cookies. Aggregates
are published live in `/v1/telemetry`. Contact channels (X, Telegram,
Discussions) follow those platforms' own policies.

## 6. Changes & contact

Terms change via PR like everything else here (`CHANGELOG.md` records it).
Questions: [@aetheriusxAPI](https://x.com/aetheriusxAPI) ·
[Telegram](https://t.me/aetherius_xAPI) ·
[Discussions](https://github.com/wilnowilx/aetheriusxapi/discussions).

*Nothing here is legal advice or an investment contract. No tokens, no equity,
no profit promises — just an API with prices on the door.*
