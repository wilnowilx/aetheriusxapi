---
title: "I Built a Donation Button That Needs No Stripe, No PayPal, and No Bank Account"
published: false
description: "DonateX is a 3KB open-source widget that accepts USDC donations on Base. Zero fees. Zero KYC. One line of code. Built for the weekend challenge."
tags: devchallenge, weekendchallenge, opensource, web3
series: "Weekend Challenge: Generosity Edition"
cover_image: https://raw.githubusercontent.com/wilnowilx/aetheriusxapi/main/donatex/cover.png
---

*This is a submission for [Weekend Challenge: Generosity Edition](https://dev.to/challenges/weekend-2026-09-03)*

---

## What I Built

**DonateX** — an open-source, 3KB donation button that accepts USDC on Base Network. Zero platform fees. Zero KYC. Zero bank accounts required. One line of HTML.

The problem: open-source maintainers rely on Stripe/PayPal for donations, but both require identity verification, bank accounts, and charge 2.9-3.49% fees. For developers in emerging markets (like Venezuela, where I'm from), these platforms are inaccessible.

DonateX solves this with crypto-native donations. A maintainer adds one script tag, and a beautiful donation widget appears on their site. Supporters pay with MetaMask or any Base wallet. Gas costs ~$0.001. Settlement is instant. The maintainer receives USDC directly to their wallet.

**No middleman. No fees. No identity verification. Just code and crypto.**

## Demo

**Live demo:** [wilnowilx.github.io/aetheriusxapi/donatex/](https://wilnowilx.github.io/aetheriusxapi/donatex/)

The demo includes an interactive terminal that shows the entire flow — from adding the widget to receiving a donation to verifying it on-chain. Click "Play" to watch the full sequence.

**Try the verification API live:**

```bash
# Verify a donation on-chain
curl "https://34-156-149-38.sslip.io/aetherapi/donatex/api/verify?tx=0x..."

# Get recent donations
curl "https://34-156-149-38.sslip.io/aetherapi/donatex/api/recent?wallet=0x..."

# Get donation stats
curl "https://34-156-149-38.sslip.io/aetherapi/donatex/api/stats?wallet=0x..."
```

## Code

The entire widget is 3KB of vanilla JavaScript. No dependencies. No build step.

**One line to integrate:**

```html
<script
  src="https://wilnowilx.github.io/aetheriusxapi/donatex/widget.js"
  data-wallet="0xYOUR_WALLET_ADDRESS"
  data-currency="USDC"
  data-amounts="1,5,10,25"
></script>
```

**Self-host option:**

```bash
git clone https://github.com/wilnowilx/aetheriusxapi.git
cp aetheriusxapi/donatex/widget.js ./your-project/
```

**Full configuration:**

```html
<script
  src="widget.js"
  data-wallet="0x677B483128D0399bCD0A5AB36eE990C0246d7f61"
  data-currency="USDC"
  data-amounts="1,5,10,25,50,100"
  data-position="bottom-right"
  data-label="Donate"
  data-theme="dark"
></script>
```

**GitHub:** [github.com/wilnowilx/aetheriusxapi/tree/main/donatex](https://github.com/wilnowilx/aetheriusxapi/tree/main/donatex)

## How I Built It

### The Tech Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| Widget | Vanilla JavaScript | Zero dependencies, works everywhere |
| QR Code | EIP-681 URI standard | Universal wallet compatibility |
| Payments | USDC on Base | $0.001 gas, instant settlement |
| Verification | Coinbase CDP API | On-chain transaction verification |
| Hosting | GitHub Pages + GCP | Free static hosting + API backend |

### Key Technical Decisions

1. **Vanilla JS over React/Vue** — The widget needs to work on any website, including static HTML sites with no build tools. A single 3KB file is easier to integrate than a framework dependency.

2. **Base Network over Ethereum** — Gas fees on Ethereum are $1-5. On Base, they're $0.001. For micro-donations ($1-25), this makes the difference between viable and impossible.

3. **ERC-20 direct transfer over payment channels** — The widget builds `transfer(address, uint256)` calldata directly. No web3.js, no ethers.js, no dependencies. Just raw JSON-RPC to `window.ethereum`.

4. **QR code with EIP-681** — The QR code encodes a Base USDC transfer URI that any mobile wallet can scan and execute. This covers MetaMask, Coinbase Wallet, Rainbow, Trust Wallet, and more.

5. **On-chain verification** — Every donation is publicly verifiable on BaseScan. The verification API makes this accessible to dashboards, leaderboards, and trust badges.

### The Flow

1. Maintainer adds one script tag to their HTML
2. Widget injects a donation button (bottom-right)
3. Visitor clicks → modal opens with QR code + wallet connect
4. Visitor connects MetaMask → selects amount → confirms
5. Widget sends ERC-20 USDC transfer on Base
6. Widget polls for confirmation (~2 seconds)
7. Donation verified on-chain, visible on BaseScan

### What I Learned

- **Crypto-native donations are viable.** The UX gap between "connect wallet" and "enter credit card" is closing fast.
- **Gas fees matter.** At $0.001 per transaction, micro-donations ($1-5) make economic sense. On Ethereum mainnet, they don't.
- **Open source builds trust.** Every donation is verifiable because the code is public. No black boxes.
- **The 3KB constraint was liberating.** Forcing the widget into 3KB meant every line had to earn its place.

## Prize Categories

**Best Use of Open Source** — DonateX is fully open-source (MIT). The widget, the verification API, the landing page, the terminal replay — all public. Every donation is verifiable on-chain because the code is transparent.

---

## Why This Matters

Open-source is the backbone of the internet, but maintainers struggle to receive funding. Stripe and PayPal require identity verification that excludes millions of developers in emerging markets. DonateX removes that barrier.

A maintainer in Nigeria, Venezuela, or Bangladesh can now receive donations without a bank account. A student can fund their open-source project without a credit card. A DAO can receive contributions without KYC.

**This is generosity without gates.**

---

*Built by a solo developer from Venezuela 🇻🇪. No bank account. No PayPal. No LinkedIn. Only a crypto wallet. The limit is not money. The limit is imagination.*

**If this resonates:**
- ⭐ [Star the repo](https://github.com/wilnowilx/aetheriusxapi)
- 🔗 [Share with someone building open source](https://x.com/intent/tweet?text=I%20just%20tried%20DonateX%20%E2%80%94%20a%203KB%20donation%20button%20with%20zero%20fees%2C%20no%20KYC%2C%20and%20USDC%20on%20Base.%20%40aetheriusxAPI%20%23opensource%20%23web3)
- 💬 [Join the Telegram](https://t.me/aetherius_xAPI)
