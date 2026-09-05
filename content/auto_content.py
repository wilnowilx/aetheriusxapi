#!/usr/bin/env python3
"""
AETHERIUS Auto-Content Generator v1.0

Generates daily unique content for Telegram channels, supergroups, and Twitter/X
by combining calendar templates, live crypto prices, random facts, and engagement hooks.

Usage:
    # Standalone
    python auto_content.py

    # GitHub Actions (returns JSON)
    python auto_content.py --json

    # Generate deploy message
    python auto_content.py --deploy "3 commits" "src/api.py, src/utils.py"
"""

import json
import os
import sys
import random
import hashlib
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
from pathlib import Path

try:
    import requests
except ImportError:
    requests = None  # Fallback: skip live prices if requests unavailable

# ============================================
# CONSTANTS
# ============================================

SCRIPT_DIR = Path(__file__).parent.resolve()
CALENDAR_PATH = SCRIPT_DIR / "calendar.json"

COINGECKO_API = "https://api.coingecko.com/api/v3/simple/price"
CRYPTO_IDS = ["bitcoin", "ethereum"]
CRYPTO_SYMBOLS = {"bitcoin": "BTC", "ethereum": "ETH"}

AETHERIUS_FACTS = [
    "AETHERIUS has 40 live APIs across 8 categories — Maps, Crypto, Web, Data, DeFi, Forex, News, and Infra.",
    "Every AETHERIUS API call costs between $0.005 and $0.03 in USDC on Base.",
    "The x402 protocol completes payments in ~200ms end-to-end.",
    "AETHERIUS is MIT licensed — every line of code is public.",
    "The Python SDK is 3 lines: import, initialize, call. Payment is handled automatically.",
    "AETHERIUS was built solo from Mexico City in under 60 hours.",
    "The HTTP 402 status code was created in 1997 — it took 29 years for crypto to catch up.",
    "AETHERIUS supports 500M+ Spanish-speaking developers with bilingual docs (EN/ES).",
    "60/60 tests pass on every AETHERIUS endpoint. Zero tolerance for errors.",
    "AETHERIUS has two SDKs: Python (pip install aetheriusx) and JavaScript (npm install aetheriusx).",
    "AETHERIUS settled 100% of testnet payments in USDC on Base — real crypto, not test tokens.",
    "The AETHERIUS dashboard tracks uptime, latency, volume, and errors in real time.",
    "x402 means payment IS authorization — no API keys, no accounts, no subscriptions.",
    "AETHERIUS applied to Base Batches 004 ($100K) and Base Creator Grant ($4K).",
    "AETHERIUS covers DeFi data: yields, TVL, stablecoins, protocols, and DEX analytics.",
    "The AETHERIUS playground lets you try any endpoint live — no signup required.",
]

ENGAGEMENT_HOOKS = {
    "questions": [
        "What would YOUR AI agent buy first?",
        "If your agent had $1 in USDC, which API would it call?",
        "What's the first thing you'd automate with an agent that pays for itself?",
        "Which API category matters most to your project?",
        "How much would you pay per API call for real-time data?",
        "What data does your AI agent need that it can't get today?",
        "If you could add one API to AETHERIUS, what would it be?",
        "Would you build an agent that trades autonomously? Why or why not?",
        "What's stopping AI agents from paying for services today?",
        "Which is more important: speed or cost for agent payments?",
    ],
    "polls": [
        "Quick poll: What matters more for AI agent payments?\n\n⚡ Speed\n💰 Cost\n🔒 Security\n📊 Transparency",
        "Which category should we expand next?\n\n🗺️ Maps\n💰 Crypto\n🌐 Web\n📧 Data",
        "What's your preferred language for agent SDKs?\n\n🐍 Python\n🟨 JavaScript\n🦀 Rust\n🔵 Go",
        "Agent payment preference?\n\n💵 USDC on Base\n🔷 ETH\n🟢 SOL\n⬜ Fiat",
    ],
    "challenges": [
        "Build challenge: Create an AI agent that calls 3 AETHERIUS APIs in one flow. Share your code!",
        "Speed challenge: How fast can your agent complete an x402 payment? Beat 200ms!",
        "创意 challenge: What's the most creative use case for agent-to-agent payments?",
        "Open source challenge: Fork AETHERIUS, add an endpoint, submit a PR. Let's grow to 50!",
    ],
}


# ============================================
# CALENDAR LOADER
# ============================================

def load_calendar() -> Dict:
    """Load the content calendar from calendar.json."""
    if not CALENDAR_PATH.exists():
        raise FileNotFoundError(f"Calendar not found at {CALENDAR_PATH}")

    with open(CALENDAR_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def get_day_tweet(cal: Dict, target_day: Optional[str] = None) -> Dict:
    """
    Get a tweet for the specified day (or today).

    Args:
        cal: Calendar data dict with 'tweets' list.
        target_day: Three-letter day abbreviation (Mon, Tue, etc.). None = today.

    Returns:
        Dict with 'id', 'day', 'category', 'content', 'type' keys.
    """
    if target_day is None:
        target_day = datetime.now(timezone.utc).strftime("%a")

    day_tweets = [t for t in cal.get("tweets", []) if t.get("day") == target_day]

    if not day_tweets:
        # Fallback: pick any tweet
        day_tweets = cal.get("tweets", [])
        if not day_tweets:
            raise ValueError("No tweets found in calendar")

    # Use day-of-year to deterministically rotate through tweets for the same day
    day_of_year = datetime.now(timezone.utc).timetuple().tm_yday
    idx = day_of_year % len(day_tweets)
    return day_tweets[idx]


# ============================================
# CRYPTO PRICE FETCHER
# ============================================

def fetch_crypto_prices() -> Dict[str, Dict[str, float]]:
    """
    Fetch live BTC and ETH prices from CoinGecko.

    Returns:
        {
            "BTC": {"usd": 65000.0, "usd_24h_change": 2.5},
            "ETH": {"usd": 3500.0, "usd_24h_change": -1.2}
        }

    Falls back to placeholder values if the API is unreachable.
    """
    fallback = {
        "BTC": {"usd": 0.0, "usd_24h_change": 0.0},
        "ETH": {"usd": 0.0, "usd_24h_change": 0.0},
    }

    if requests is None:
        return fallback

    try:
        resp = requests.get(
            COINGECKO_API,
            params={
                "ids": ",".join(CRYPTO_IDS),
                "vs_currencies": "usd",
                "include_24hr_change": "true",
            },
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()

        result = {}
        for cg_id, symbol in CRYPTO_SYMBOLS.items():
            if cg_id in data:
                result[symbol] = {
                    "usd": data[cg_id].get("usd", 0.0),
                    "usd_24h_change": data[cg_id].get("usd_24h_change", 0.0),
                }
            else:
                result[symbol] = fallback[symbol]
        return result

    except Exception:
        return fallback


def format_price_line(symbol: str, price_data: Dict[str, float]) -> str:
    """Format a single crypto price line."""
    price = price_data["usd"]
    change = price_data["usd_24h_change"]

    if price == 0:
        return f"{symbol}: price unavailable"

    price_str = f"${price:,.2f}"
    if change != 0:
        arrow = "+" if change > 0 else ""
        return f"{symbol}: {price_str} ({arrow}{change:.1f}%)"
    return f"{symbol}: {price_str}"


def format_crypto_section(prices: Dict[str, Dict[str, float]]) -> str:
    """Format all crypto prices into a section string."""
    lines = [format_price_line(sym, data) for sym, data in prices.items()]
    return " | ".join(lines)


# ============================================
# CONTENT GENERATOR
# ============================================

def _hash_seed(text: str) -> int:
    """Deterministic seed from text for daily consistency."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return int(hashlib.sha256(f"{text}:{today}".encode()).hexdigest(), 16)


def pick_random_fact(seed: Optional[str] = None) -> str:
    """Pick a random AETHERIUS fact, optionally seeded for daily consistency."""
    if seed:
        rng = random.Random(_hash_seed(seed))
    else:
        rng = random.Random()
    return rng.choice(AETHERIUS_FACTS)


def pick_engagement_hook(
    hook_type: Optional[str] = None, seed: Optional[str] = None
) -> Tuple[str, str]:
    """
    Pick a random engagement hook.

    Returns:
        (hook_type, hook_text) e.g. ("question", "What would YOUR AI agent buy first?")
    """
    if seed:
        rng = random.Random(_hash_seed(seed))
    else:
        rng = random.Random()

    if hook_type and hook_type in ENGAGEMENT_HOOKS:
        return hook_type, rng.choice(ENGAGEMENT_HOOKS[hook_type])

    chosen_type = rng.choice(list(ENGAGEMENT_HOOKS.keys()))
    return chosen_type, rng.choice(ENGAGEMENT_HOOKS[chosen_type])


def format_change_emoji(change: float) -> str:
    """Return an emoji for price change direction."""
    if change > 3:
        return "🚀"
    elif change > 0:
        return "📈"
    elif change < -3:
        return "📉"
    elif change < 0:
        return "📊"
    return "➡️"


# ============================================
# POST FORMATTERS
# ============================================

def _build_channel_post(
    tweet: Dict, prices: Dict[str, Dict[str, float]], fact: str, hook: str
) -> str:
    """
    Format for @aetherius_xAPI channel.
    Professional, structured, with crypto context.
    """
    crypto_line = format_crypto_section(prices)
    btc_emoji = format_change_emoji(prices.get("BTC", {}).get("usd_24h_change", 0))
    eth_emoji = format_change_emoji(prices.get("ETH", {}).get("usd_24h_change", 0))

    parts = [
        f"{btc_emoji} Market Update",
        f"{crypto_line}",
        "",
        tweet["content"],
        "",
        f"💡 {fact}",
        "",
        f"💬 {hook}",
        "",
        "#AETHERIUS #x402 #Base #AIAgents",
    ]
    return "\n".join(parts)


def _build_group_post(
    tweet: Dict, prices: Dict[str, Dict[str, float]], fact: str, hook: str
) -> str:
    """
    Format for @aetheriusxAPI_global supergroup.
    More casual, community-oriented, conversational.
    """
    crypto_line = format_crypto_section(prices)
    hour = datetime.now(timezone.utc).hour

    if hour < 12:
        greeting = "GM"
    elif hour < 18:
        greeting = "Afternoon"
    else:
        greeting = "GM"  # Crypto never sleeps

    parts = [
        f"{greeting} builders! 👋",
        "",
        f"Markets: {crypto_line}",
        "",
        tweet["content"],
        "",
        f"Fun fact: {fact}",
        "",
        hook,
        "",
        "Building the agent economy together 🚀",
    ]
    return "\n".join(parts)


def _build_twitter_post(
    tweet: Dict, prices: Dict[str, Dict[str, float]], fact: str
) -> str:
    """
    Format for Twitter/X (280 chars max).
    Prioritizes the calendar tweet, appends prices if space allows.
    """
    base = tweet["content"]

    # Build crypto mini-line
    btc = prices.get("BTC", {}).get("usd", 0)
    eth = prices.get("ETH", {}).get("usd", 0)
    if btc > 0 and eth > 0:
        crypto_tag = f"\n\nBTC ${btc:,.0f} | ETH ${eth:,.0f}"
    else:
        crypto_tag = ""

    # Add hashtags if they fit
    hashtags = "\n\n#AETHERIUS #x402 #Base"

    # Truncate to fit 280 chars
    max_content = 280 - len(hashtags) - len(crypto_tag)
    if len(base) > max_content:
        base = base[: max_content - 3].rsplit(" ", 1)[0] + "..."

    return f"{base}{crypto_tag}{hashtags}"


# ============================================
# PUBLIC API
# ============================================

def generate_daily_content(
    target_day: Optional[str] = None,
    override_prices: Optional[Dict[str, Dict[str, float]]] = None,
) -> Dict[str, str]:
    """
    Generate daily content for all platforms.

    Args:
        target_day: Override day (Mon, Tue, etc.). None = today.
        override_prices: Skip API call and use these prices instead.

    Returns:
        {
            "channel_post": str,   # @aetherius_xAPI channel
            "group_post": str,     # @aetheriusxAPI_global supergroup
            "twitter_post": str,   # Twitter/X (280 chars max)
            "metadata": {
                "tweet_id": int,
                "category": str,
                "prices": dict,
                "generated_at": str,
            }
        }
    """
    # Load calendar and pick tweet
    cal = load_calendar()
    tweet = get_day_tweet(cal, target_day)

    # Fetch live prices (or use overrides)
    prices = override_prices if override_prices else fetch_crypto_prices()

    # Pick fact and hook (seeded by date for daily consistency)
    seed = target_day or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    fact = pick_random_fact(seed)
    _, hook = pick_engagement_hook(seed=seed)

    # Build posts
    channel_post = _build_channel_post(tweet, prices, fact, hook)
    group_post = _build_group_post(tweet, prices, fact, hook)
    twitter_post = _build_twitter_post(tweet, prices, fact)

    return {
        "channel_post": channel_post,
        "group_post": group_post,
        "twitter_post": twitter_post,
        "metadata": {
            "tweet_id": tweet["id"],
            "category": tweet.get("category", "unknown"),
            "day": tweet.get("day", "unknown"),
            "prices": prices,
            "generated_at": datetime.now(timezone.utc).isoformat(),
        },
    }


def generate_deploy_message(
    commits: str = "latest changes",
    files_changed: str = "",
) -> Dict[str, str]:
    """
    Generate a deploy notification message.

    Args:
        commits: Summary of commits (e.g. "3 commits", "feat: new endpoint").
        files_changed: Comma-separated list of changed files.

    Returns:
        {"channel_post": str, "group_post": str, "twitter_post": str}
    """
    now = datetime.now(timezone.utc)
    time_str = now.strftime("%H:%M UTC")
    date_str = now.strftime("%b %d, %Y")

    # Parse files changed into readable list
    file_list = ""
    if files_changed:
        files = [f.strip() for f in files_changed.split(",") if f.strip()]
        if files:
            file_lines = "\n".join(f"  → {f}" for f in files[:8])  # Cap at 8
            file_list = f"\n\nChanged files:\n{file_lines}"
            if len(files) > 8:
                file_list += f"\n  ... and {len(files) - 8} more"

    channel_post = (
        f"🚀 Deploy Complete\n"
        f"📅 {date_str} at {time_str}\n\n"
        f"📦 {commits}{file_list}\n\n"
        f"All systems operational. The agent economy keeps building.\n\n"
        f"#AETHERIUS #Deploy #Base"
    )

    group_post = (
        f"Deploy just landed! 🎉\n\n"
        f"📦 {commits}{file_list}\n\n"
        f"Pushed at {time_str}. Everything's live.\n"
        f"Let's keep building 💪"
    )

    # Twitter: keep it short
    short_commits = commits[:80] if len(commits) > 80 else commits
    twitter_post = (
        f"🚀 Deployed: {short_commits}\n\n"
        f"The agent economy never sleeps.\n\n"
        f"#AETHERIUS #BuildOnBase"
    )

    # Enforce 280 char limit on Twitter
    if len(twitter_post) > 280:
        twitter_post = twitter_post[: 277] + "..."

    return {
        "channel_post": channel_post,
        "group_post": group_post,
        "twitter_post": twitter_post,
    }


# ============================================
# CLI ENTRY POINT
# ============================================

def main():
    """CLI entry point."""
    # Fix Windows console encoding for emoji output
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass

    args = sys.argv[1:]

    if "--deploy" in args:
        # Generate deploy message
        idx = args.index("--deploy")
        commits = args[idx + 1] if idx + 1 < len(args) else "latest changes"
        files = args[idx + 2] if idx + 2 < len(args) else ""
        result = generate_deploy_message(commits, files)
    elif "--day" in args:
        # Override day
        idx = args.index("--day")
        day = args[idx + 1] if idx + 1 < len(args) else None
        result = generate_daily_content(target_day=day)
    else:
        result = generate_daily_content()

    if "--json" in args:
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print("=" * 60)
        print("📡 CHANNEL POST (@aetherius_xAPI)")
        print("=" * 60)
        print(result["channel_post"])
        print()
        print("=" * 60)
        print("💬 GROUP POST (@aetheriusxAPI_global)")
        print("=" * 60)
        print(result["group_post"])
        print()
        print("=" * 60)
        print("🐦 TWITTER POST (280 chars max)")
        print("=" * 60)
        print(result["twitter_post"])

        if "metadata" in result:
            print()
            print("-" * 40)
            meta = result["metadata"]
            print(f"Tweet ID: {meta['tweet_id']} | Category: {meta['category']} | Day: {meta['day']}")
            print(f"Generated: {meta['generated_at']}")


if __name__ == "__main__":
    main()
