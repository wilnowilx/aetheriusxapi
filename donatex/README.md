# DonateX — Open-Source Donation Infrastructure

**Accept USDC donations on Base in 5 minutes. No KYC. No accounts. Just a wallet address.**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
![Widget Size](https://img.shields.io/badge/Widget-3KB-blue.svg)
![Fees](https://img.shields.io/badge/Fees-0%25-brightgreen.svg)
![Network](https://img.shields.io/badge/Network-Base-0052FF.svg)

DonateX is a zero-config donation button for open-source projects, content creators, and anyone who wants to receive crypto donations without intermediaries.

**Live Demo:** [wilnowilx.github.io/aetheriusxapi/donatex](https://wilnowilx.github.io/aetheriusxapi/donatex/)

---

## Why DonateX?

| Feature | DonateX | Stripe | PayPal |
|---------|---------|--------|--------|
| **Platform Fees** | 0% | 2.9% + $0.30 | 3.49% + $0.49 |
| **KYC Required** | ❌ No | ✅ Yes | ✅ Yes |
| **Bank Account** | ❌ No | ✅ Yes | ✅ Yes |
| **Settlement** | Instant (~2s) | 2-7 days | 1-3 days |
| **Global Access** | ✅ Everyone | ⚠️ Limited | ⚠️ Limited |
| **Minimum Donation** | $0.001 | $1.00 | $1.00 |
| **Gas Cost** | ~$0.001 | N/A | N/A |

**The key insight:** 1.7 billion adults worldwide are unbanked. They can't use Stripe or PayPal. But many have crypto wallets. DonateX makes donations accessible to everyone.

---

## Quick Start

### Option 1: CDN (Recommended)

Add this to your HTML:

```html
<script
  src="https://wilnowilx.github.io/aetheriusxapi/donatex/widget.js"
  data-wallet="0xYOUR_WALLET_ADDRESS"
  data-currency="USDC"
  data-amounts="1,5,10,25"
></script>
```

Replace `0xYOUR_WALLET_ADDRESS` with your Base wallet. Done.

### Option 2: Self-Host

```bash
git clone https://github.com/wilnowilx/aetheriusxapi.git
cp aetheriusxapi/donatex/widget.js ./your-project/
```

```html
<script src="widget.js" data-wallet="0xYOUR_WALLET_ADDRESS"></script>
```

### Option 3: NPM (Coming Soon)

```bash
npm install donatex-widget
```

---

## Configuration

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-wallet` | `0x000...` | Your Base wallet address **(required)** |
| `data-currency` | `USDC` | Token to accept (USDC) |
| `data-amounts` | `1,5,10,25` | Preset donation amounts (comma-separated) |
| `data-theme` | `dark` | Widget theme (`dark` or `light`) |
| `data-position` | `bottom-right` | Button position (`bottom-right`, `bottom-left`) |
| `data-label` | `Donate` | Button text |
| `data-verify` | (empty) | Verification API endpoint URL |

### Example: Full Configuration

```html
<script
  src="widget.js"
  data-wallet="0x677B483128D0399bCD0A5AB36eE990C0246d7f61"
  data-currency="USDC"
  data-amounts="1,5,10,25,50,100"
  data-position="bottom-right"
  data-label="Support the Project"
  data-theme="dark"
></script>
```

---

## Features

### For Maintainers

- **Zero Dependencies** — Vanilla JS, no frameworks, no build tools
- **3KB Total** — Smaller than most favicons
- **One-Line Setup** — Copy one script tag, change one address
- **Transparent** — All donations verifiable on-chain
- **No Accounts** — No sign-up, no dashboard to manage
- **Instant Settlement** — USDC arrives in ~2 seconds

### For Donors

- **QR Code** — Scan with any mobile wallet
- **Wallet Connect** — MetaMask, Rabby, one-click payment
- **Preset Amounts** — $1, $5, $10, $25 (customizable)
- **Custom Amount** — Type any amount
- **Base Network** — $0.001 gas fees
- **No KYC** — Donate anonymously

### Technical

- **EIP-681 URI Standard** — QR codes work with any Base-compatible wallet
- **ERC-20 Direct Transfer** — No intermediaries, no payment channels
- **On-Chain Confirmation** — Widget polls for receipt, confirms in ~2s
- **Responsive Design** — Works on desktop and mobile
- **Dark/Light Themes** — Matches your site's design

---

## Verification API

Built-in endpoints to verify donations and build dashboards:

```bash
# Verify a transaction
GET /donatex/api/verify?tx=0x...&wallet=0x...

# Recent donations
GET /donatex/api/recent?wallet=0x...&limit=10

# Donation stats
GET /donatex/api/stats?wallet=0x...
```

### Response Example

```json
{
  "verified": true,
  "from": "0xDonor...",
  "to": "0x677B...7f61",
  "amount_usdc": "10.00",
  "block": 12345678,
  "chain": "Base Mainnet",
  "timestamp": "2026-09-06T12:00:00Z"
}
```

### Use Cases

- **Trust Badges** — Show "Verified Donor" on your site
- **Leaderboards** — Rank top donors publicly
- **Dashboards** — Real-time donation tracking
- **Automated Thank-You** — Trigger messages on donation
- **Tax Records** — Export donation history

---

## How It Works

```
1. Visitor clicks DonateX button
2. Modal opens: QR code + "Connect Wallet"
3. Visitor connects MetaMask/Rabby
4. Visitor selects amount ($10 USDC)
5. Widget builds ERC-20 transfer calldata
6. Transaction sent on Base (~$0.001 gas)
7. Widget polls eth_getTransactionReceipt
8. Confirmation in ~2 seconds
9. Donation verified on BaseScan
```

### Technical Flow

```
DonateX Widget (3KB JS)
    ↓
    ├── QR Code (EIP-681 URI for Base USDC)
    ├── Wallet Connect (window.ethereum)
    └── Verification API (optional)
        ↓
    On-Chain (Base Network)
        ↓
    eth_getTransactionReceipt → status=0x1
        ↓
    Done. Irreversible. Transparent.
```

---

## Why Not Stripe/PayPal?

### The Problem

1.7 billion adults are unbanked. They can't open Stripe or PayPal accounts. But many have crypto wallets. Open-source maintainers in emerging markets are locked out of traditional donation platforms.

### The Solution

DonateX uses USDC on Base — a stablecoin that's 1:1 with USD, on a network with $0.001 gas fees. No bank account needed. No identity verification. Just a wallet address.

### The Math

| Scenario | Stripe | PayPal | DonateX |
|----------|--------|--------|---------|
| $5 donation | $0.45 fee (9%) | $0.66 fee (13%) | $0.001 gas (0.02%) |
| $10 donation | $0.59 fee (5.9%) | $0.84 fee (8.4%) | $0.001 gas (0.01%) |
| $25 donation | $1.03 fee (4.1%) | $1.36 fee (5.4%) | $0.001 gas (<0.01%) |

**DonateX saves 4-13% per donation.**

---

## Architecture

```
┌─────────────────────────────────────────┐
│            DonateX Widget                │
│  (3KB vanilla JavaScript)               │
├─────────────────────────────────────────┤
│  QR Code      │  Wallet Connect         │
│  (EIP-681)    │  (MetaMask/Rabby)       │
├─────────────────────────────────────────┤
│  ERC-20 Transfer (USDC on Base)         │
│  → transfer(address, uint256)           │
├─────────────────────────────────────────┤
│  Confirmation Polling                   │
│  → eth_getTransactionReceipt            │
├─────────────────────────────────────────┤
│  Verification API (optional)            │
│  → /donatex/api/verify                  │
└─────────────────────────────────────────┘
```

---

## Browser Support

| Browser | Status |
|---------|--------|
| Chrome 90+ | ✅ Full support |
| Firefox 90+ | ✅ Full support |
| Safari 15+ | ✅ Full support |
| Edge 90+ | ✅ Full support |
| Brave | ✅ Full support |
| Mobile Chrome | ✅ Full support |
| Mobile Safari | ✅ Full support |

**Requires:** `window.ethereum` (MetaMask or any injected wallet)

---

## Contributing

DonateX is open-source. Contributions welcome!

1. Fork the repo
2. Create a branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

### Ideas for Contributions

- [ ] Light theme improvements
- [ ] WalletConnect v2 integration
- [ ] Multi-token support (ETH, DAI)
- [ ] Animation library
- [ ] React/Vue components
- [ ] WordPress plugin
- [ ] Hugo/Jekyll integration

---

## License

MIT — Free to use, modify, and distribute.

See [LICENSE](../LICENSE) for details.

---

## Built By

[AETHERIUS x402 API Marketplace](https://github.com/wilnowilx/aetheriusxapi) — Crypto-native API marketplace where AI agents pay per request in USDC on Base.

**DonateX is part of the AETHERIUS ecosystem.** The same infrastructure that powers 80 API endpoints for AI agents now powers donations for open-source maintainers.

---

<div align="center">

**Accept donations without gates.**

[Get Started](https://wilnowilx.github.io/aetheriusxapi/donatex/) · [GitHub](https://github.com/wilnowilx/aetheriusxapi/tree/main/donatex) · [Telegram](https://t.me/aetherius_xAPI)

</div>
