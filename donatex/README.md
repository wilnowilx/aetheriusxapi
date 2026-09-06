# DonateX — Open-Source Donation Infrastructure

**Accept USDC donations on Base in 5 minutes. No KYC. No accounts. Just a wallet address.**

DonateX is a zero-config donation button for open-source projects. Add one line of HTML, and your project has a beautiful donation widget that accepts USDC on Base Network.

## Quick Start

### Option 1: CDN (Recommended)

Add this to your HTML:

```html
<script
  src="https://34-156-149-38.sslip.io/aetherapi/donatex/widget.js"
  data-wallet="0xYOUR_WALLET_ADDRESS"
  data-currency="USDC"
  data-amounts="1,5,10,25"
></script>
```

Replace `0xYOUR_WALLET_ADDRESS` with your Base wallet. Done.

### Option 2: Self-Host

```bash
git clone https://github.com/wilnowilx/aetheriusxapi.git
cp -r aetheriusxapi/donatex/widget.js ./your-project/
```

```html
<script src="widget.js" data-wallet="0xYOUR_WALLET_ADDRESS"></script>
```

## Configuration

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-wallet` | `0x000...` | Your Base wallet address (required) |
| `data-currency` | `USDC` | Token to accept |
| `data-amounts` | `1,5,10,25` | Preset donation amounts |
| `data-theme` | `dark` | Widget theme |
| `data-position` | `bottom-right` | Button position |
| `data-label` | `Donate` | Button text |
| `data-verify` | (empty) | Verification API endpoint |

## Features

- **Zero Dependencies** — Vanilla JS, no frameworks, no build tools
- **QR Code** — Scan with any mobile wallet
- **Wallet Connect** — MetaMask, Rabby, one-click payment
- **Base Network** — $0.001 gas fees, instant settlement
- **Transparent** — All donations verifiable on-chain
- **Responsive** — Works on desktop and mobile
- **Customizable** — Amounts, position, label, theme

## Verification API

Built-in endpoints to verify donations:

```bash
# Verify a transaction
GET /donatex/api/verify?tx=0x...&wallet=0x...

# Recent donations
GET /donatex/api/recent?wallet=0x...&limit=10

# Donation stats
GET /donatex/api/stats?wallet=0x...
```

## How It Works

1. **QR Code** — Generated for USDC transfer on Base
2. **Wallet Connect** — User connects MetaMask/Rabby
3. **USDC Transfer** — ERC-20 transfer to your wallet
4. **Confirmation** — Widget waits for on-chain confirmation
5. **Verification** — Optional API verifies the transaction

## Why Not Stripe/PayPal?

| Feature | DonateX | Stripe | PayPal |
|---------|---------|--------|--------|
| KYC Required | ❌ No | ✅ Yes | ✅ Yes |
| Bank Account | ❌ No | ✅ Yes | ✅ Yes |
| Fees | 0% | 2.9% + $0.30 | 3.49% + $0.49 |
| Settlement | Instant | 2-7 days | 1-3 days |
| Global | ✅ Yes | ⚠️ Limited | ⚠️ Limited |
| Minimum | $0.001 | $1.00 | $1.00 |

## Architecture

```
DonateX Widget (HTML/JS)
    ↓
    ├── QR Code (USDC on Base)
    ├── Wallet Connect (MetaMask/Rabby)
    └── Verification API (optional)
        ↓
    On-chain (Base Network)
```

## License

MIT — Free to use, modify, and distribute.

## Built By

[AETHERIUS x402 API Marketplace](https://aetheriusxapi.com) — Crypto-native API marketplace where AI agents pay per request in USDC on Base.
