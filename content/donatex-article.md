---
title: DonateX: Open-Source Donation Infrastructure — Accept USDC in 5 Minutes, No KYC Required
published: true
tags: devchallenge, weekendchallenge, opensource, webdev
---

*This is a submission for [Weekend Challenge: Generosity Edition](https://dev.to/challenges/weekend-2026-09-03)*

## What I Built

**DonateX** — a zero-config donation button for open-source projects that accepts USDC on Base Network.

Here's the problem: open-source maintainers build tools that millions of people use, but getting paid is a nightmare. Stripe requires an LLC. PayPal requires a bank account. GitHub Sponsors requires approval. And if you're in Latin America, Africa, or Southeast Asia? Good luck.

I built something different. One line of HTML. Your wallet address. That's it. Your project now has a donation button that works with zero accounts, zero KYC, zero middlemen.

## Demo

The widget renders a purple heart button in the bottom-right corner. Click it, and a modal appears with preset amounts ($1, $5, $10, $25), a QR code for mobile wallets, and a "Connect Wallet" button for MetaMask/Rabby users.

After payment, the widget waits for on-chain confirmation and shows a success message. All donations are transparent on BaseScan — anyone can verify where funds went.

**Live demo:** [donatex.aetheriusxapi.com](https://donatex.aetheriusxapi.com)

**Try it yourself:** Click the purple "Donate USDC" button on the demo page. It works on Base Mainnet.

## Code

The entire widget is 3KB of vanilla JavaScript. No dependencies. No build step. No framework.

**One line to add to any HTML page:**

```html
<script
  src="widget.js"
  data-wallet="0xYOUR_WALLET_ADDRESS"
  data-currency="USDC"
  data-amounts="1,5,10,25"
></script>
```

**Full source:** [github.com/wilnowilx/aetheriusxapi/tree/main/donatex](https://github.com/wilnowilx/aetheriusxapi/tree/main/donatex)

The widget handles:
- QR code generation for USDC transfers on Base
- MetaMask/Rabby wallet connection
- USDC ERC-20 transfer (no ETH gas needed)
- On-chain transaction verification
- Recent donation display

Plus a verification API for anyone who wants to build dashboards or badges:

```
GET /donatex/api/verify?tx=0x...&wallet=0x...
GET /donatex/api/recent?wallet=0x...&limit=10
GET /donatex/api/stats?wallet=0x...
```

## How I Built It

I built this as part of [AETHERIUS](https://aetheriusxapi.com), a crypto-native API marketplace where AI agents pay per request in USDC on Base. We have 80 API endpoints — 60 paid and 20 free (x402 Intelligence).

The insight was simple: we already have the infrastructure for USDC payments on Base. Open-source maintainers need exactly this — a way to receive crypto donations without the pain of traditional payment processors.

**Technical approach:**

1. **Self-contained widget** — No external dependencies except Google Fonts. The widget injects its own styles, renders the modal, handles wallet connections, and processes payments entirely client-side.

2. **Base Network (L2)** — Gas fees are $0.001. A $1 donation costs 0.001% in fees. Compare that to Stripe's 2.9% + $0.30.

3. **ERC-20 USDC transfer** — The widget builds the `transfer(address,uint256)` calldata directly. No third-party SDKs. No libraries. Just raw Ethereum.

4. **QR code generation** — Uses the Base EIP-681 URI standard. Any wallet that scans it knows it's a USDC transfer on Base.

5. **Verification API** — Built on BaseScan's API. Checks transaction logs for USDC transfer events. Returns structured data with amounts, addresses, and block numbers.

**Interesting decisions:**

- **No `web3.js` or `ethers.js`** — The widget uses `window.ethereum` directly via JSON-RPC. This keeps it at 3KB instead of 500KB.

- **QR codes via BaseScan** — Instead of bundling a QR library, I generate QR codes via URL parameters. This means the widget can't generate offline, but it stays tiny.

- **Presets over custom** — Research shows people donate more with preset amounts. The widget defaults to $5 and shows $1/$5/$10/$25 options.

## Why Generosity?

Open-source is the backbone of the internet. Every developer uses open-source tools. But the maintainers behind those tools often can't afford to pay rent.

Traditional donation infrastructure makes it worse:
- Stripe/PayPal take 3-5% in fees
- They require KYC (identity verification)
- They need bank accounts (impossible in many countries)
- They can freeze funds arbitrarily

DonateX removes every barrier:
- **0% fees** — Gas is $0.001 on Base
- **No KYC** — Just a wallet address
- **No bank accounts** — Crypto-native
- **No middleman** — Direct peer-to-peer
- **Transparent** — All donations on-chain

This is generosity at the protocol level. No permission needed. No accounts needed. Just code.

I built this in 4 days as a solo developer, from scratch, while deploying an API marketplace with 80 endpoints. The wheel turns — open-source tools built on open-source infrastructure, generating open-source tools for the open-source community.

---

**Links:**
- [DonateX Demo](https://donatex.aetheriusxapi.com)
- [GitHub Source](https://github.com/wilnowilx/aetheriusxapi/tree/main/donatex)
- [AETHERIUS x402 API](https://aetheriusxapi.com)
- [Base Network](https://base.org)

Built with 💜 for the open-source community.
