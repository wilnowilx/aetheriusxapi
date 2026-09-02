# AetheriusX API

Crypto-native API marketplace where AI agents pay per request in USDC on Base.

## Features

- **x402 Protocol**: HTTP 402 with crypto payments
- **USDC on Base**: Low fees, fast settlement
- **No KYC**: Connect wallet, pay, use
- **AI Agent Ready**: Machine-to-machine commerce

## Endpoints

| Endpoint | Price |
|----------|-------|
| `GET /api/v1/maps/search` | $0.01/call |
| `GET /api/v1/maps/reviews` | $0.02/call |
| `GET /api/v1/token/analyze` | $0.02/call |
| `GET /api/v1/web/scrape` | $0.01/call |
| `GET /api/v1/email/validate` | $0.005/call |

## Tech Stack

- FastAPI
- x402 Protocol
- Base L2
- USDC
- Python
- Coinbase CDP

## How It Works

1. Connect your crypto wallet with USDC on Base
2. Make API request (x402 handles payment automatically)
3. Receive instant JSON response

## License

MIT
