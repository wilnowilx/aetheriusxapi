---
title: "I Built a Donation Button That Needs No Stripe, No PayPal, and No Bank Account"
published: true
tags: devchallenge, weekendchallenge, opensource, webdev, crypto
---

*This is a submission for [Weekend Challenge: Generosity Edition](https://dev.to/challenges/weekend-2026-09-03)*

## The Problem Nobody Talks About

You maintain an open-source project. Thousands of people use your code every day. You add a "Donate" button to your README.

It links to PayPal. Your contributor in Nigeria can't use it — PayPal requires a bank account. Your contributor in Venezuela can't use it — PayPal froze their account. Your contributor in Bangladesh can't use it — PayPal doesn't exist there.

Stripe? LLC required. GitHub Sponsors? Application-only. Buy Me a Coffee? Credit card required.

**The open-source community is global. The donation infrastructure is not.**

## What I Built

**DonateX** — a donation button that works with one line of HTML and zero accounts.

```html
<script src="widget.js" data-wallet="0xYOUR_ADDRESS"></script>
```

That's it. Your project now has a purple heart button that:
- Shows preset amounts ($1, $5, $10, $25)
- Generates a QR code for mobile wallets
- Connects to MetaMask/Rabby for one-click payment
- Accepts USDC on Base Network ($0.001 gas fees)
- Waits for on-chain confirmation
- Shows recent donations from your community

No accounts. No KYC. No bank. No middleman. Just a wallet address and code.

## How It Works

The widget is 3KB of vanilla JavaScript. Zero dependencies. Zero build step.

**Step 1:** Copy `widget.js` into your project (or use the CDN).

**Step 2:** Add this to your HTML:

```html
<script
  src="widget.js"
  data-wallet="0xYOUR_WALLET_ADDRESS"
  data-currency="USDC"
  data-amounts="1,5,10,25"
></script>
```

**Step 3:** That's it. Your project accepts donations.

The widget injects its own styles, renders a modal with QR code, handles wallet connections, builds the ERC-20 transfer calldata, sends the transaction, waits for confirmation, and displays the result. All client-side. All in 3KB.

## The Technical Decisions

**Why no `web3.js` or `ethers.js`?**

Those libraries are 500KB+. The widget uses `window.ethereum` directly via JSON-RPC. One `eth_sendTransaction` call with raw calldata. The entire widget is 3KB.

**Why Base Network?**

Gas fees on Ethereum mainnet: $2-20. Gas fees on Base: $0.001. A $1 donation costs 0.001% in fees. Compare that to Stripe's 2.9% + $0.30. On Stripe, a $1 donation becomes $0.67. On DonateX, it becomes $0.999.

**Why USDC specifically?**

USDC is the most widely held stablecoin. It's pegged to $1, so donors know exactly what they're giving and recipients know exactly what they're getting. No volatility. No speculation. Just value transfer.

**Why QR codes?**

60% of crypto donations come from mobile wallets. A QR code is the fastest path from "I want to donate" to "donation confirmed." The widget generates QR codes using the Base EIP-681 URI standard — any wallet that scans it knows it's a USDC transfer on Base.

**The verification API:**

For projects that want transparency, DonateX includes a verification API:

```
GET /api/verify?tx=0x...&wallet=0x...   → Verify a specific donation
GET /api/recent?wallet=0x...&limit=10   → Recent donations
GET /api/stats?wallet=0x...             → Total received, unique donors
```

Build a "Recent Donations" section in your README. Build a transparency dashboard. Build badges. The data is on-chain and verifiable.

## Why This Is Generosity

Traditional donation infrastructure extracts value:
- Stripe takes 2.9% + $0.30 per transaction
- PayPal takes 3.49% + $0.49
- They require identity verification
- They can freeze funds without notice
- They don't work in many countries

DonateX gives value:
- **0% platform fees** — Gas is $0.001
- **No identity verification** — Just a wallet
- **No bank accounts** — Crypto-native
- **No geographic restrictions** — Works everywhere
- **Fully transparent** — All donations on-chain

This is generosity at the protocol level. No permission needed. No application process. No approval. Just code.

## The Bigger Picture

I built DonateX as part of [AETHERIUS](https://aetheriusxapi.com), a crypto-native API marketplace with 80 endpoints (60 paid, 20 free). The free endpoints track on-chain activity — USDC transfers, gas prices, whale movements.

The connection: open-source maintainers receive donations via DonateX. Those donations are USDC on Base. Our free x402 Intelligence endpoints can verify, track, and analyze those donations. The wheel turns — open-source tools built on open-source infrastructure, generating open-source tools for the open-source community.

## What's Next

- **Multi-token support** — Accept ETH, DAI, or any ERC-20
- **Recurring donations** — Subscription-style support
- **GitHub integration** — Auto-update README with donation stats
- **Dashboard** — Real-time transparency for your community

---

**Get the code:** [github.com/wilnowilx/aetheriusxapi/tree/main/donatex](https://github.com/wilnowilx/aetheriusxapi/tree/main/donatex)

**Built by:** [AETHERIUS x402](https://aetheriusxapi.com) — Crypto-native API marketplace

**License:** MIT — Free to use, modify, and distribute.

Built with 💜 for the global open-source community.
