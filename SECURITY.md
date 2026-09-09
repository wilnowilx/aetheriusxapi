# Security Policy

> **Do not file vulnerabilities as public issues.** Follow this page instead.

**Status:** Active · **Owner:** maintainers · **Review:** quarterly.

## Supported versions

| Version | Supported |
|---|---|
| 2.0.x (current, `main`) | ✅ Full review |
| < 2.0 | ❌ Upgrade first |

## How to report

1. **Preferred:** GitHub → *Security* tab → *Report a vulnerability* (private).
2. **Alternative:** DM [@aetheriusxAPI](https://x.com/aetheriusxAPI) or Telegram
   [@aetherius_xAPI](https://t.me/aetherius_xAPI) with `[SECURITY]` + affected
   version + minimal repro (no exploits against the live service).

Include: affected endpoint/file, impact (what an attacker gains), repro steps
or PoC, and whether payment/auth bypass is involved.

## Response targets

- Acknowledgement: **48h** · Triage: **5 days** · Critical fix: **7 days**.
- Reporter credited in release notes (unless anonymity requested).
- No paid bounty program (grant-funded project); critical reporters are
  considered for Founding Agents terms.

## Scope

- In: `main.py` + `x402_middleware.py` (challenge/verify/settle, nonce cache),
  facilitator verification path, telemetry accounting, dashboard XSS/CSRF,
  landing supply chain (`frontend/` deps), Actions secrets handling.
- Out: upstream data accuracy (CoinGecko/OSM/Llama), third-party wallets,
  facilitator operator policy, social-engineering of maintainers.

## Ground rules

- No live-service destructive testing (no fund draining, no DoS beyond a
  handful of requests). Use local `uvicorn` + simulated mode for PoCs.
- Never commit secrets while testing — see `.gitignore` (keys, `.env`, PATs).
