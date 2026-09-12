# aether-oracle

The oracle layer for x402 agent commerce on Base.

## Installation

```bash
pip install aether-oracle
```

## Usage

```python
from aether_oracle import AetherMiddleware, VerifiedCatalog, discover, get_oracle_status

# Middleware for FastAPI/Starlette apps
middleware = AetherMiddleware(
    prices={"ETH": 3500.0},
    pay_to="0x...",
    network="base",
    currency="USDC",
)

# Discover verified endpoints
catalog = VerifiedCatalog(base_url="https://oracle.example.com")
endpoints = await catalog.discover()

# Check oracle health
status = await catalog.get_status()
```

## CLI

```bash
python -m aether_oracle
```
