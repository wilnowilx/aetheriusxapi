"""Endpoint catalog — all 80 endpoints with prices, descriptions, and categories."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class Endpoint:
    """A single API endpoint."""
    route: str
    price: str  # "$0.01" or "FREE"
    description: str
    category: str
    params: Optional[list[str]] = None

    @property
    def cost_usd(self) -> float:
        """Parse price to float. Returns 0.0 for FREE endpoints."""
        if self.price == "FREE":
            return 0.0
        try:
            return float(self.price.replace("$", ""))
        except (ValueError, AttributeError):
            return 0.0

    @property
    def is_free(self) -> bool:
        return self.price == "FREE"


# ─── CATEGORIES ───────────────────────────────────────────────────────────────

# Paid endpoints (60 total)
PAID_ENDPOINTS: list[Endpoint] = [
    # Maps & Geospatial
    Endpoint("/v1/maps/search", "$0.01", "Business search via OpenStreetMap", "maps", ["q", "limit"]),
    Endpoint("/v1/maps/reviews", "$0.02", "Place lookup via OpenStreetMap", "maps", ["place_id"]),
    Endpoint("/v1/maps/nearby", "$0.015", "Nearby places by coordinates", "maps", ["lat", "lon", "radius"]),
    Endpoint("/v1/maps/reverse", "$0.01", "Coords to address via Nominatim", "maps", ["lat", "lon"]),
    Endpoint("/v1/maps/geocode", "$0.01", "Forward geocode via Photon", "maps", ["address"]),

    # Token & Crypto
    Endpoint("/v1/token/analyze", "$0.02", "Token contract analysis", "token", ["address"]),
    Endpoint("/v1/token/holders", "$0.03", "Token holder distribution", "token", ["address"]),
    Endpoint("/v1/token/price", "$0.005", "Real-time token price via CoinGecko", "token", ["token"]),
    Endpoint("/v1/token/prices", "$0.01", "Batch token prices in one call", "token", ["tokens"]),
    Endpoint("/v1/token/gas", "$0.01", "Ethereum gas oracle via Etherscan", "token"),
    Endpoint("/v1/token/global", "$0.01", "Global crypto stats via CoinGecko", "token"),
    Endpoint("/v1/token/balance", "$0.01", "ETH balance via Etherscan", "token", ["address"]),
    Endpoint("/v1/token/transactions", "$0.02", "Wallet tx history via Etherscan", "token", ["address"]),
    Endpoint("/v1/token/nft", "$0.02", "NFT metadata fetcher", "token", ["contract", "token_id"]),

    # Web
    Endpoint("/v1/web/scrape", "$0.01", "Web scraper — structured content as JSON", "web", ["url"]),
    Endpoint("/v1/web/screenshot", "$0.025", "Website screenshot URL", "web", ["url"]),
    Endpoint("/v1/web/dns", "$0.005", "DNS over HTTPS via Google", "web", ["domain"]),
    Endpoint("/v1/web/whois", "$0.01", "Domain WHOIS lookup", "web", ["domain"]),
    Endpoint("/v1/web/headers", "$0.005", "HTTP headers checker", "web", ["url"]),
    Endpoint("/v1/web/ssl", "$0.008", "SSL certificate info", "web", ["domain"]),
    Endpoint("/v1/web/geoip", "$0.008", "IP geolocation and ISP", "web", ["ip"]),

    # Email
    Endpoint("/v1/email/validate", "$0.005", "Email validation — syntax, MX, disposable", "email", ["email"]),

    # Data
    Endpoint("/v1/data/weather", "$0.008", "Current weather by coordinates", "data", ["lat", "lon"]),
    Endpoint("/v1/data/forecast", "$0.008", "7-day forecast via Open-Meteo", "data", ["lat", "lon"]),
    Endpoint("/v1/data/airquality", "$0.008", "Air quality via Open-Meteo", "data", ["lat", "lon"]),
    Endpoint("/v1/data/define", "$0.005", "Dictionary definitions", "data", ["word"]),
    Endpoint("/v1/data/elevation", "$0.005", "Ground elevation via Open-Meteo", "data", ["lat", "lon"]),
    Endpoint("/v1/data/words", "$0.005", "Synonyms/antonyms/rhymes via Datamuse", "data", ["word"]),
    Endpoint("/v1/data/ip", "$0.005", "IP address geolocation", "data", ["ip"]),
    Endpoint("/v1/data/ua", "$0.003", "User-Agent parser", "data", ["ua"]),
    Endpoint("/v1/data/hash", "$0.002", "Hash generator — MD5, SHA1, SHA256, SHA512", "data", ["text"]),
    Endpoint("/v1/data/uuid", "$0.001", "UUID v4 generator", "data"),
    Endpoint("/v1/data/qrcode", "$0.005", "QR code generator as data URL", "data", ["text"]),
    Endpoint("/v1/data/translate", "$0.01", "Text translation via free API", "data", ["text", "target"]),
    Endpoint("/v1/data/summarize", "$0.015", "Text summarizer — extract key sentences", "data", ["text"]),

    # Storage
    Endpoint("/v1/storage/drift", "$0.02", "Cross-RPC slot drift", "storage", ["chain", "layers"]),

    # DeFi
    Endpoint("/v1/defi/yields", "$0.02", "Top DeFi yield pools by TVL", "defi"),
    Endpoint("/v1/defi/stablecoins", "$0.01", "Stablecoin list with prices", "defi"),
    Endpoint("/v1/defi/fees", "$0.015", "Protocol fees and revenue", "defi"),
    Endpoint("/v1/defi/tvl", "$0.01", "Chain TVLs via Llama", "defi"),
    Endpoint("/v1/defi/protocols", "$0.01", "DeFi protocols by TVL", "defi"),
    Endpoint("/v1/defi/dexs", "$0.015", "DEX volume leaders", "defi"),
    Endpoint("/v1/defi/stablecoinchains", "$0.01", "Stable distribution by chain", "defi"),
    Endpoint("/v1/defi/stablecoin-history", "$0.01", "Stable circulation history", "defi"),
    Endpoint("/v1/defi/impermanent-loss", "$0.01", "Impermanent loss calculator", "defi", ["entry_price", "current_price"]),
    Endpoint("/v1/defi/staking-apy", "$0.01", "Staking APY tracker", "defi"),

    # Forex
    Endpoint("/v1/forex/rates", "$0.008", "Fiat exchange rates via Frankfurter", "forex"),
    Endpoint("/v1/forex/convert", "$0.008", "Currency conversion via Frankfurter", "forex", ["from", "to", "amount"]),
    Endpoint("/v1/forex/history", "$0.01", "Historical FX ranges via Frankfurter", "forex", ["from", "to"]),

    # News
    Endpoint("/v1/news/hackernews", "$0.01", "Hacker News top stories", "news", ["limit"]),
    Endpoint("/v1/news/hn-item", "$0.005", "Single HN item by id", "news", ["id"]),
    Endpoint("/v1/news/hn-user", "$0.005", "HN user profile and karma", "news", ["id"]),
    Endpoint("/v1/news/hn-feed", "$0.01", "HN Ask/Show/Jobs feeds", "news", ["feed"]),
    Endpoint("/v1/news/reddit", "$0.01", "Reddit posts from any subreddit", "news", ["subreddit"]),
    Endpoint("/v1/news/devto", "$0.008", "Dev.to articles — latest tech posts", "news"),

    # Crypto
    Endpoint("/v1/crypto/market", "$0.01", "Global crypto market data", "crypto"),
    Endpoint("/v1/crypto/fear-greed", "$0.005", "Fear and Greed Index", "crypto"),
    Endpoint("/v1/crypto/trending", "$0.01", "Trending coins on CoinGecko", "crypto"),
    Endpoint("/v1/crypto/ohlcv", "$0.015", "OHLCV candlestick data", "crypto", ["coin_id"]),
    Endpoint("/v1/crypto/dominance", "$0.008", "Crypto dominance indices", "crypto"),
]

# FREE x402 Intelligence endpoints (20 total)
FREE_ENDPOINTS: list[Endpoint] = [
    # Core
    Endpoint("/v1/x402/payments/recent", "FREE", "Recent USDC transfers on Base Mainnet", "x402-core"),
    Endpoint("/v1/x402/agent/{address}", "FREE", "Wallet spending intelligence", "x402-core", ["address"]),
    Endpoint("/v1/x402/analytics", "FREE", "Network health & USDC transfer trends", "x402-core"),
    Endpoint("/v1/x402/top-agents", "FREE", "Top USDC spenders leaderboard", "x402-core"),

    # Chain & Gas
    Endpoint("/v1/x402/base-stats", "FREE", "Chain health snapshot (block, gas, chain ID)", "x402-chain"),
    Endpoint("/v1/x402/gas", "FREE", "Gas price analysis & cost estimates", "x402-chain"),
    Endpoint("/v1/x402/network", "FREE", "Full network health dashboard", "x402-chain"),

    # Activity
    Endpoint("/v1/x402/whales", "FREE", "Large USDC transfer tracker (>$10K)", "x402-activity"),
    Endpoint("/v1/x402/velocity", "FREE", "Transfer frequency per hour (24h)", "x402-activity"),
    Endpoint("/v1/x402/hourly", "FREE", "Hourly volume breakdown", "x402-activity"),
    Endpoint("/v1/x402/mint-burn", "FREE", "USDC supply changes (mint/burn)", "x402-activity"),
    Endpoint("/v1/x402/bridge", "FREE", "Cross-chain bridge activity", "x402-activity"),

    # Wallet
    Endpoint("/v1/x402/search", "FREE", "Address or transaction lookup", "x402-wallet", ["q"]),
    Endpoint("/v1/x402/history/{address}", "FREE", "Transfer history for any wallet", "x402-wallet", ["address"]),
    Endpoint("/v1/x402/compare", "FREE", "Compare two wallets side-by-side", "x402-wallet", ["a", "b"]),
    Endpoint("/v1/x402/risk/{address}", "FREE", "Wallet risk score (0-100)", "x402-wallet", ["address"]),

    # Market
    Endpoint("/v1/x402/token/{address}", "FREE", "ERC-20 token metadata (any token)", "x402-market", ["address"]),
    Endpoint("/v1/x402/contracts", "FREE", "Top USDC-receiving contracts", "x402-market"),
    Endpoint("/v1/x402/stablecoins", "FREE", "All stablecoin activity (USDC/USDT/DAI)", "x402-market"),
    Endpoint("/v1/x402/defi-pulse", "FREE", "DeFi protocol activity on Base", "x402-market"),
]

# All endpoints combined
ALL_ENDPOINTS = PAID_ENDPOINTS + FREE_ENDPOINTS

# Category display names
CATEGORY_NAMES = {
    "maps": "Maps & Geospatial",
    "token": "Token & Crypto",
    "web": "Web",
    "email": "Email",
    "data": "Data",
    "storage": "Storage",
    "defi": "DeFi",
    "forex": "Forex",
    "news": "News",
    "crypto": "Crypto",
    "x402-core": "x402 Intelligence — Core",
    "x402-chain": "x402 Intelligence — Chain & Gas",
    "x402-activity": "x402 Intelligence — Activity",
    "x402-wallet": "x402 Intelligence — Wallet",
    "x402-market": "x402 Intelligence — Market",
}


class Catalog:
    """Browse and query the AetheriusX endpoint catalog."""

    def __init__(self) -> None:
        self.endpoints = ALL_ENDPOINTS
        self.paid = PAID_ENDPOINTS
        self.free = FREE_ENDPOINTS
        self._by_route = {e.route: e for e in ALL_ENDPOINTS}

    def by_category(self, category: str) -> list[Endpoint]:
        return [e for e in self.endpoints if e.category == category]

    def categories(self) -> list[str]:
        """Return unique categories in order."""
        seen: set[str] = set()
        result: list[str] = []
        for e in self.endpoints:
            if e.category not in seen:
                seen.add(e.category)
                result.append(e.category)
        return result

    def find(self, route: str) -> Endpoint | None:
        return self._by_route.get(route)

    def search(self, query: str) -> list[Endpoint]:
        """Search endpoints by name or description."""
        q = query.lower()
        return [e for e in self.endpoints if q in e.route.lower() or q in e.description.lower()]

    def cheapest(self, n: int = 5) -> list[Endpoint]:
        """Return the N cheapest paid endpoints."""
        return sorted(self.paid, key=lambda e: e.cost_usd)[:n]

    def most_expensive(self, n: int = 5) -> list[Endpoint]:
        """Return the N most expensive paid endpoints."""
        return sorted(self.paid, key=lambda e: e.cost_usd, reverse=True)[:n]

    def summary(self) -> str:
        """Human-readable catalog summary."""
        lines = [f"AetheriusX Catalog — {len(self.endpoints)} endpoints"]
        lines.append(f"  {len(self.paid)} paid | {len(self.free)} free (x402 Intelligence)")
        lines.append("")
        for cat in self.categories():
            eps = self.by_category(cat)
            name = CATEGORY_NAMES.get(cat, cat)
            lines.append(f"  {name} ({len(eps)})")
            for e in eps:
                lines.append(f"    {e.route} — {e.price} — {e.description}")
        return "\n".join(lines)
