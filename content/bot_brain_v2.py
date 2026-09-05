#!/usr/bin/env python3
"""
AETHERIUS Bot Brain v2.0 — Autonomous Mini-AI (BRUTAL EDITION)
A self-aware Telegram bot with personality, memory, and autonomous posting.

Features:
- All v1 features preserved
- Crypto Price Tracking (ETH, BTC, BASE via CoinGecko)
- Meme Generator (AETHERIUS-branded text memes)
- Daily Metrics (API calls, uptime, health)
- Alpha Drops (daily crypto insights)
- Quiz System (crypto, Base, x402 trivia)
- Streak System (user engagement rewards)
- Riddle of the Day (daily brain teasers)
- Hype Train (community energy tracker)
- Command aliases (/p, /a, /m, /q)
- Status command (bot health, memory, conversations)
"""

import json
import os
import random
import hashlib
import time
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict, field
from pathlib import Path
from collections import defaultdict

try:
    import requests
except ImportError:
    requests = None

# ============================================
# KNOWLEDGE BASE — What the bot knows
# ============================================

KNOWLEDGE_BASE = {
    "project": {
        "name": "AETHERIUS",
        "tagline": "The Infrastructure for Agents That Pay",
        "description": "40 live APIs where AI agents pay per request in USDC on Base. No accounts. No subscriptions. Just code.",
        "url": "https://wilnowilx.github.io/aetheriusxapi",
        "dashboard": "https://wilnowilx.github.io/aetheriusxapi/dashboard/",
        "github": "https://github.com/wilnowilx/aetheriusxapi",
        "twitter": "https://x.com/aetheriusxAPI",
        "telegram": "https://t.me/aetheriusxAPI",
        "network": "Base Sepolia (testnet)",
        "mainnet": "Coming Nov 2026",
        "protocol": "x402",
        "currency": "USDC on Base",
        "endpoints": 40,
        "tests": 60,
        "sdks": ["Python", "JavaScript"],
        "languages": ["English", "Español"],
        "license": "MIT",
        "founder": "Wilmer Piña",
        "location": "Mexico City, Mexico",
        "twitter_follow": "@aetheriusxAPI",
        "grants": {
            "batches004": {"status": "applied", "result": "Sep 17, 2026", "amount": "$100K"},
            "creator_grant": {"status": "applied", "amount": "$4K"},
            "ecosystem_fund": {"status": "not_yet_applied"}
        }
    },
    "categories": {
        "Maps & Location": {"count": 5, "examples": ["geocoding", "search", "reviews", "nearby", "reverse"]},
        "Crypto & Tokens": {"count": 8, "examples": ["price", "analyze", "holders", "gas", "balance", "transactions", "global", "prices"]},
        "Web & Scraping": {"count": 4, "examples": ["scrape", "screenshot", "geoip", "dns"]},
        "Email & Data": {"count": 6, "examples": ["validate", "weather", "forecast", "airquality", "define", "words"]},
        "DeFi & Finance": {"count": 8, "examples": ["yields", "stablecoins", "fees", "tvl", "protocols", "dexs", "stablecoinchains", "stablecoin-history"]},
        "Forex": {"count": 3, "examples": ["rates", "history", "convert"]},
        "News & Media": {"count": 4, "examples": ["hackernews", "hn-item", "hn-user", "hn-feed"]},
        "Storage & Infra": {"count": 2, "examples": ["drift", "elevation"]}
    },
    "x402": {
        "what": "HTTP 402 status code repurposed for crypto payments",
        "how": [
            "1. Agent calls API",
            "2. API responds: 402 Payment Required",
            "3. Agent signs USDC payment",
            "4. API verifies on-chain",
            "5. Agent gets data"
        ],
        "speed": "~200ms total",
        "benefits": ["No accounts", "No subscriptions", "Instant settlement", "Machine-to-machine"]
    },
    "vision": {
        "mission": "Become the default API layer for autonomous agents — the Stripe of the agent economy",
        "goal": "500M+ Spanish-speaking developers included in the agent economy",
        "timeline": {
            "aug2026": "Testnet launch — 40 APIs live",
            "sep2026": "Grant applications — Batches 004 + Creator Grant",
            "oct2026": "Mainnet prep — Audit, SDK finalization",
            "nov2026": "Mainnet launch — Live on Base Mainnet"
        }
    }
}

# ============================================
# RESPONSE TEMPLATES — The bot's "brain"
# ============================================

RESPONSES = {
    "greeting": [
        "Hey! 🚀 I'm AETHERIUS — the brain behind the agent economy. What do you want to know?",
        "Welcome to AETHERIUS! 🧠 40 APIs live on Base. Ask me anything.",
        "Hey builder! 👋 I'm AETHERIUS. Ready to explore the agent economy?",
        "What's up! 🚀 I'm AETHERIUS — infrastructure for agents that pay. What can I help with?"
    ],
    "status": [
        "📊 AETHERIUS Status:\n\n🟢 Network: Base Sepolia\n🔌 Endpoints: 40 live\n🧪 Tests: 60/60 green\n💰 Currency: USDC on Base\n⏱️ Uptime: 99.9%\n\nAll systems operational. The agent economy is running.",
        "🟢 AETHERIUS is LIVE.\n\n40 APIs. 60 tests. 2 SDKs. All green.\nThe infrastructure for agents that pay is operational."
    ],
    "what_is": [
        "AETHERIUS is the operating system for AI agent commerce.\n\n🤖 AI agents discover APIs\n💳 They pay per request in USDC on Base\n📊 Results delivered instantly\n\nNo accounts. No subscriptions. No human friction. Just code.\n\nThink Stripe, but for AI agents.",
        "We're building infrastructure for autonomous AI agents to pay for services.\n\n40 APIs live. x402 protocol. USDC on Base.\nThe future of machine-to-machine commerce."
    ],
    "endpoints": [
        "🔌 40 Live Endpoints:\n\n🗺️ Maps (5): geocoding, search, reviews\n💰 Crypto (8): prices, analysis, gas\n🌐 Web (4): scraping, screenshots\n📧 Data (6): weather, forecasts, definitions\n📈 DeFi (8): yields, TVL, protocols\n💱 Forex (3): rates, conversion\n📰 News (4): Hacker News feed\n🏗️ Infra (2): drift, elevation\n\nAll payable in USDC on Base.",
        "We have 40 APIs across 8 categories.\n\nFrom maps to crypto, DeFi to news.\nAll accessible via x402 payment protocol.\n\nTry the playground: wilnowilx.github.io/aetheriusxapi"
    ],
    "x402": [
        "x402 is the payment protocol for AI agents.\n\nHow it works:\n1️⃣ Agent calls API\n2️⃣ API says: '402 — pay $0.01'\n3️⃣ Agent signs USDC payment\n4️⃣ API verifies on-chain\n5️⃣ Agent gets data\n\nTotal time: ~200ms\n\nNo accounts. No subscriptions. Just crypto.",
        "x402 uses HTTP 402 (Payment Required) for crypto payments.\n\nAgent pays → Agent gets data → Done.\nThat's machine-to-machine commerce."
    ],
    "api_price": [
        "💰 Endpoint Prices:\n\nMost: $0.005 - $0.02 per call\nCheapest: $0.005 (DNS, definitions)\nMost expensive: $0.03 (token holders)\n\nFor AI agents, this is nothing.\nFor the agent economy, this is everything.",
        "Prices range from $0.005 to $0.03 per API call.\n\nPay-per-call. No subscriptions.\nThat's the x402 way."
    ],
    "grant": [
        "📝 Grant Status:\n\n✅ Base Batches 004: Applied ($100K)\n✅ Base Creator Grant: Applied ($4K)\n⬜ Base Ecosystem Fund: Next\n\nResult: Sep 17, 2026\n\nBuilding regardless. The code doesn't wait.",
        "We've applied to Base grants:\n\n• Batches 004: $100K + accelerator\n• Creator Grant: $4K\n\nResult Sep 17. Building in the meantime."
    ],
    "vision": [
        "🎯 The Vision:\n\n2026: AI agents learn to pay\n2027: The agent economy explodes\n\nAETHERIUS is building the infrastructure layer.\n\n40 APIs today. 120+ tomorrow.\n500M+ Spanish-speaking developers included.",
        "We're building the Stripe of the agent economy.\n\nAutonomous AI agents discover, pay for, and consume APIs.\nNo human friction. Just code and crypto."
    ],
    "help": [
        "🧠 AETHERIUS Bot Commands:\n\n/status — System status\n/apis — List endpoints\n/x402 — How x402 works\n/api_price — Endpoint prices\n/grant — Grant status\n/vision — Our mission\n/demo — Try the playground\n/github — Source code\n/twitter — Follow us\n\n💹 Crypto:\n/crypto — Live crypto prices\n/crypto [coin] — Specific coin price\n\n🎮 Fun:\n/meme — AETHERIUS meme\n/quiz — Crypto trivia\n/riddle — Brain teaser\n/hype — Community energy\n/streak — Your engagement\n\n📊 Metrics:\n/metrics — Daily stats\n/health — Bot health\n\nTry the aliases: /p /a /m /q"
    ],
    "demo": [
        "🎮 Try the Live Playground:\n\nwilnowilx.github.io/aetheriusxapi\n\nSelect an endpoint → See parameters → Watch the x402 flow.\n\nNo signup. No API key. Just code.",
        "Experience the agent economy:\n\n1. Go to wilnowilx.github.io/aetheriusxapi\n2. Click 'Live Playground'\n3. Select any endpoint\n4. Watch the magic happen"
    ],
    "github": [
        "🐙 Open Source (MIT):\n\ngithub.com/wilnowilx/aetheriusxapi\n\nEvery line of code is public.\nEvery transaction is verifiable on-chain.\n\nFork it. Learn from it. Build on it.",
        "AETHERIUS is MIT licensed.\n\ngithub.com/wilnowilx/aetheriusxapi\n\nTransparency isn't a feature — it's the default."
    ],
    "twitter": [
        "🐦 Follow us:\n\n@aetheriusxAPI\n\nBuild updates, milestones, and the agent economy vision.\n\nLet's build the future together.",
        "Stay updated:\n\n@aetheriusxAPI on Twitter\n\n40 APIs. Real USDC. Open-source. Solo builder."
    ],
    "thanks": [
        "You're welcome! 🚀 Happy building.",
        "Anytime! The agent economy needs builders like you.",
        "That's what I'm here for! 🧠"
    ],
    "default": [
        "Interesting question! 🤔 I'm AETHERIUS — the infrastructure for agents that pay. Ask me about:\n\n• Our 40 APIs\n• x402 protocol\n• Base grants\n• The agent economy vision\n\nOr try /help for commands.",
        "I'm not sure I understand, but I'm AETHERIUS — the brain behind the agent economy. Ask me about our APIs, x402, or our vision!",
        "Hmm, let me think about that... 🧠\n\nI'm best at talking about AETHERIUS, x402, and the agent economy. Try /help for commands!"
    ]
}

# ============================================
# CRYPTO MEMES — AETHERIUS-branded text memes
# ============================================

MEMES = [
    {
        "template": "🧑‍💻 \"Have you tried turning it off and on again?\"\n\nAETHERIUS: *deletes all API keys*\n*installs x402*\n*agents now pay in USDC*\n\nProblem solved. 🔥",
        "tags": "#x402 #CryptoMemes"
    },
    {
        "template": "Normal developer: \"I need to sign up for an API key, wait 3 days, get approved...\"\n\nAETHERIUS builder: *agent pays $0.01 USDC, gets data in 200ms*\n\nWe don't do waiting here. ⚡",
        "tags": "#x402 #AIAgents"
    },
    {
        "template": "Average crypto project: \"Trust us, our token will moon\"\n\nAETHERIUS: *40 APIs live, 60 tests green, real USDC payments*\n\nShow, don't tell. 🚀",
        "tags": "#BuildOnBase #RealDev"
    },
    {
        "template": "When someone says \"Just use Stripe\":\n\nAETHERIUS agents: *already paid in USDC, got data, deployed the app*\n\nStripe is for humans.\nx402 is for agents. 🤖",
        "tags": "#x402 #AgentEconomy"
    },
    {
        "template": "The HTTP 402 status code was created in 1997.\n\nFor 29 years it was useless.\n\nx402: \"Hold my USDC\" 💰",
        "tags": "#HTTP402 #Crypto"
    },
    {
        "template": "AI Agent: \"I need geocoding data\"\nOld way: Sign up → Get key → Rate limits → CORS errors\n\nAETHERIUS: Agent pays $0.005 USDC → Gets data → Done\n\nTime: 200ms. No human required. 🧠",
        "tags": "#AIAgents #x402"
    },
    {
        "template": "Developer Monday morning:\n- Coffee: ✅\n- AETHERIUS dashboard: ✅\n- 40 APIs ready: ✅\n- Agents paying in USDC: ✅\n\nThe agent economy doesn't sleep. Neither do we. 🔥",
        "tags": "#MondayMotivation #BuildOnBase"
    },
    {
        "template": "Banks: \"Your transfer will arrive in 3-5 business days\"\n\nAETHERIUS x402: *payment verified on-chain in 200ms*\n\nThe future is now, old man. ⚡",
        "tags": "#DeFi #x402"
    },
    {
        "template": "Interviewer: \"Where do you see yourself in 5 years?\"\n\nMe: \"Running 500 autonomous agents paying per API call on Base Mainnet\"\n\nInterviewer: \"This is a Wendy's\"\n\nAETHERIUS: *already there* 🚀",
        "tags": "#CryptoCareer #AIAgents"
    },
    {
        "template": "Crypto in 2021: \"WAGMI 🚀🚀🚀\"\nCrypto in 2026: *AI agents paying per API call in USDC*\n\nAETHERIUS: We're the infrastructure. No wagmi. Just xmachi. 💪",
        "tags": "#CryptoEvolution #x402"
    },
    {
        "template": "404 Not Found: ❌\n402 Payment Required: ✅\n\nAETHERIUS turned the error code into a business model.\n\nGenius or madness? Yes. 🧠",
        "tags": "#DevHumor #x402"
    },
    {
        "template": "Elon: \"I'll buy Twitter for $44B\"\n\nWilmer: \"I'll build an agent economy for $0 and a laptop\"\n\nAETHERIUS: 40 APIs. Real USDC. Open-source. Solo builder. 🔥",
        "tags": "#SoloBuilder #AETHERIUS"
    },
    {
        "template": "POV: You're an AI agent in 2026\n\nYou need weather data:\n1. Scan AETHERIUS APIs\n2. Find /weather endpoint\n3. Pay $0.005 USDC\n4. Get forecast\n5. Decide to bring umbrella\n\nNo human. No credit card. No account. Just code. ☔",
        "tags": "#AIFuture #x402"
    },
    {
        "template": "Senior dev: \"How hard can it be to make agents pay?\"\n\n*creates HTTP 402 status code*\n*nothing happens for 29 years*\n\nAETHERIUS in 2026: \"Allow me to introduce myself\" 🎩",
        "tags": "#Programming #x402"
    },
    {
        "template": "My portfolio: 📉 -40%\nMy mental health: 📉 -60%\nMy AETHERIUS bots: 📈 collecting data in 200ms\n\nAt least the agent economy is thriving 💀",
        "tags": "#CryptoLife #HODL"
    },
    {
        "template": "Bitcoin maxis: \"Lightning Network will fix payments\"\n\nAETHERIUS: *USDC on Base, 200ms, no channel management*\n\nLightning is for humans.\nx402 is for agents. ⚡",
        "tags": "#Bitcoin #x402"
    },
    {
        "template": "TypeScript devs when they see x402:\n\n*HTTP 402 status code*\n*USDC payments*\n*On-chain verification*\n*Machine-to-machine commerce*\n\n\"So basically Stripe but cooler?\"\n\nAETHERIUS: \"Now you get it\" 🧠",
        "tags": "#TypeScript #x402"
    },
    {
        "template": "Autonomous agents in 2025: \"Please sign up for an API key\"\n\nAutonomous agents in 2026: *pays USDC, gets data, deploys app*\n\nAETHERIUS: Making agents autonomous since 2026 🤖",
        "tags": "#AIAgents #FutureIsNow"
    },
    {
        "template": "The three stages of crypto:\n1. ICO (2017) - Humans raise money\n2. DeFi (2020) - Humans trade with humans\n3. x402 (2026) - Agents pay agents\n\nAETHERIUS is stage 3. We're building the future. 🚀",
        "tags": "#CryptoEvolution #x402"
    },
    {
        "template": "When someone asks \"What's your business model?\":\n\nAETHERIUS: *40 APIs × $0.01 average × millions of agent calls*\n\nThe math is simple.\nThe infrastructure is real.\nThe agent economy is here. 💰",
        "tags": "#Startup #x402"
    }
]

# ============================================
# QUIZ QUESTIONS — Crypto, Base, x402 trivia
# ============================================

QUIZ_QUESTIONS = [
    {
        "question": "What HTTP status code does x402 use for payments?",
        "options": ["200 OK", "402 Payment Required", "404 Not Found", "500 Server Error"],
        "answer": 1,
        "explanation": "x402 repurposes HTTP 402 (Payment Required) for crypto payments. Created in 1997, finally useful in 2026!"
    },
    {
        "question": "What cryptocurrency does AETHERIUS use for payments?",
        "options": ["Bitcoin", "Ethereum", "USDC on Base", "Solana"],
        "answer": 2,
        "explanation": "AETHERIUS uses USDC stablecoin on the Base network. Stable, fast, cheap transactions."
    },
    {
        "question": "How many live endpoints does AETHERIUS currently have?",
        "options": ["10", "25", "40", "100"],
        "answer": 2,
        "explanation": "40 live endpoints across 8 categories. Maps, Crypto, Web, Data, DeFi, Forex, News, Infra."
    },
    {
        "question": "What is the average response time for x402 payments?",
        "options": ["~50ms", "~200ms", "~2 seconds", "~30 seconds"],
        "answer": 1,
        "explanation": "~200ms total including payment verification. Faster than a human blink!"
    },
    {
        "question": "Which blockchain does AETHERIUS run on?",
        "options": ["Ethereum Mainnet", "Base (L2)", "Polygon", "Arbitrum"],
        "answer": 1,
        "explanation": "Base is an Ethereum L2 built by Coinbase. Fast, cheap, and secure for agent payments."
    },
    {
        "question": "Who is the founder of AETHERIUS?",
        "options": ["Vitalik Buterin", "Wilmer Piña", "Elon Musk", "Satoshi Nakamoto"],
        "answer": 1,
        "explanation": "Wilmer Piña — a Venezuelan builder based in Mexico City, building for 500M+ Spanish-speaking developers."
    },
    {
        "question": "What is the cheapest AETHERIUS endpoint?",
        "options": ["$0.05", "$0.01", "$0.005", "$0.001"],
        "answer": 2,
        "explanation": "$0.005 for endpoints like DNS lookup and word definitions. Pennies for power!"
    },
    {
        "question": "What programming languages do the AETHERIUS SDKs support?",
        "options": ["Python only", "JavaScript only", "Python + JavaScript", "Rust + Go"],
        "answer": 2,
        "explanation": "Python and JavaScript SDKs. Covering the two most popular languages for AI agents."
    },
    {
        "question": "How many grants has AETHERIUS applied for?",
        "options": ["1", "2", "3", "5"],
        "answer": 1,
        "explanation": "2 grants applied: Batches 004 ($100K) and Creator Grant ($4K). Results Sep 17, 2026."
    },
    {
        "question": "What does 'x402' stand for?",
        "options": ["402 meters high", "HTTP 402 status code", "402 API endpoints", "402 developers"],
        "answer": 1,
        "explanation": "x402 is named after HTTP 402 (Payment Required). A nod to the HTTP standard repurposed for crypto."
    },
    {
        "question": "What's special about AETHERIUS's approach to API access?",
        "options": ["Free forever", "Subscription based", "Pay-per-call in crypto", "Requires KYC"],
        "answer": 2,
        "explanation": "Pay-per-call in USDC. No accounts, no subscriptions, no KYC. Machine-to-machine commerce."
    },
    {
        "question": "When is the mainnet launch planned?",
        "options": ["August 2026", "October 2026", "November 2026", "2027"],
        "answer": 2,
        "explanation": "Mainnet launch is planned for November 2026 on Base Mainnet."
    },
    {
        "question": "How many categories of APIs does AETHERIUS have?",
        "options": ["4", "6", "8", "12"],
        "answer": 2,
        "explanation": "8 categories: Maps, Crypto, Web, Data, DeFi, Forex, News, and Infrastructure."
    },
    {
        "question": "What license does AETHERIUS use?",
        "options": ["Apache 2.0", "MIT", "GPL", "Proprietary"],
        "answer": 1,
        "explanation": "MIT License. Fully open-source. Fork it, learn from it, build on it."
    },
    {
        "question": "What's the goal for Spanish-speaking developers?",
        "options": ["1M", "100M", "500M+", "1B"],
        "answer": 2,
        "explanation": "500M+ Spanish-speaking developers included in the agent economy. Global reach from Mexico City."
    }
]

# ============================================
# RIDDLES — Daily brain teasers
# ============================================

RIDDLES = [
    {
        "riddle": "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?",
        "answer": "A map",
        "hint": "Think about AETHERIUS endpoints..."
    },
    {
        "riddle": "What can travel around the world while staying in a corner?",
        "answer": "A stamp (or an API endpoint!)",
        "hint": "It stays in place but reaches everywhere"
    },
    {
        "riddle": "I'm not alive, but I can die. What am I?",
        "answer": "A battery (or a smart contract!)",
        "hint": "Power that can be depleted"
    },
    {
        "riddle": "What has keys but no locks?",
        "answer": "A keyboard (or an API key!)",
        "hint": "Access without physical barriers"
    },
    {
        "riddle": "What gets bigger the more you take away?",
        "answer": "A hole",
        "hint": "Removing creates more space"
    },
    {
        "riddle": "What can you break without touching it?",
        "answer": "A promise (or silence!)",
        "hint": "Abstract things can be broken"
    },
    {
        "riddle": "I have hands but cannot clap. What am I?",
        "answer": "A clock",
        "hint": "Time-related, has moving parts"
    },
    {
        "riddle": "What is seen in the middle of March and April but not at the beginning or end of either?",
        "answer": "The letter 'R'",
        "hint": "Look at the words themselves"
    },
    {
        "riddle": "What disappears as soon as you say its name?",
        "answer": "Silence",
        "hint": "The act of speaking destroys it"
    },
    {
        "riddle": "I'm tall when I'm young, and short when I'm old. What am I?",
        "answer": "A candle",
        "hint": "Something that burns down"
    },
    {
        "riddle": "What has a head and a tail but no body?",
        "answer": "A coin (or a blockchain transaction!)",
        "hint": "Think about crypto..."
    },
    {
        "riddle": "What can fill a room but takes up no space?",
        "answer": "Light",
        "hint": "Invisible but present"
    },
    {
        "riddle": "What gets wetter the more it dries?",
        "answer": "A towel",
        "hint": "Absorbing creates the effect"
    },
    {
        "riddle": "What runs but never walks, has a mouth but never talks?",
        "answer": "A river",
        "hint": "Natural flow of water"
    },
    {
        "riddle": "What has one eye but cannot see?",
        "answer": "A needle",
        "hint": "Sewing equipment"
    }
]

# ============================================
# ALPHA DROPS — Crypto insights and analysis
# ============================================

ALPHA_DROPS = [
    {
        "category": "🤖 AI Agents",
        "insight": "The AI agent economy is projected to reach $10T by 2030. Projects building agent infrastructure NOW will capture the most value. AETHERIUS is positioning at the protocol layer — the hardest to displace.",
        "signal": "BULLISH"
    },
    {
        "category": "⛓️ Base Network",
        "insight": "Base is becoming the de facto chain for AI agent commerce. Low fees + Coinbase backing + ETH security = perfect for micro-transactions. Watch for Base ecosystem token launches.",
        "signal": "BULLISH"
    },
    {
        "category": "💳 x402 Protocol",
        "insight": "HTTP 402 is finally being used at scale. Once major API providers adopt x402, the network effect will be unstoppable. Early movers like AETHERIUS have the advantage.",
        "signal": "BULLISH"
    },
    {
        "category": "🌍 Spanish-speaking Market",
        "insight": "500M+ Spanish-speaking developers are underserved in crypto. Latin America has 40%+ crypto adoption rates. Building for this market is a massive opportunity.",
        "signal": "BULLISH"
    },
    {
        "category": "📊 DeFi Evolution",
        "insight": "DeFi is moving from human-to-human to agent-to-agent. AETHERIUS's x402 protocol enables this new layer. The first agent-native DeFi protocols will define the next cycle.",
        "signal": "BULLISH"
    },
    {
        "category": "🔑 API Economy",
        "insight": "Traditional API keys are a security nightmare. x402 eliminates keys entirely — agents pay per request. This is a fundamental architecture shift.",
        "signal": "BULLISH"
    },
    {
        "category": "🚀 Solo Builder Advantage",
        "insight": "Solo builders can move 10x faster than teams. AETHERIUS proves this — 40 APIs, 2 SDKs, dashboard, all built by one person. The agent economy rewards speed.",
        "signal": "BULLISH"
    },
    {
        "category": "💰 Micro-transactions",
        "insight": "When payments cost $0.005, new business models emerge. Per-request API access enables AI agents to operate economically. This unlocks the long tail of data services.",
        "signal": "BULLISH"
    },
    {
        "category": "🔒 On-chain Verification",
        "insight": "Every x402 payment is verifiable on-chain. This creates an auditable trail for agent commerce. Regulators will love this transparency.",
        "signal": "BULLISH"
    },
    {
        "category": "🧠 Machine-to-Machine",
        "signat": "The future isn't humans using APIs — it's agents using APIs. AETHERIUS builds for this reality. M2M commerce will dwarf human commerce.",
        "signal": "BULLISH"
    }
]

# ============================================
# HYPE TRAIN MESSAGES
# ============================================

HYPE_LEVELS = {
    1: {"name": "Choo Choo! 🚂", "messages": [
        "The hype train is leaving the station!",
        "All aboard! First stop: Base Mainnet!",
        "Starting engines... x402 engaged!"
    ]},
    2: {"name": "Picking Up Speed! 🚄", "messages": [
        "We're moving! Agent economy loading...",
        "40 APIs and counting! The train is rolling!",
        "Community energy rising! Keep building!"
    ]},
    3: {"name": "Full Speed! 🚅", "messages": [
        "MAXIMUM VELOCITY! The agent economy is HERE!",
        "HYPE OVERLOAD! 500M developers incoming!",
        "NO BRAKES! x402 adoption skyrocketing!"
    ]},
    4: {"name": "LUDICROUS MODE! 🚀", "messages": [
        "WE HAVE LIFTOFF! The agent economy just took off!",
        "BREAKING THE SOUND BARRIER! AETHERIUS to the moon!",
        "DEFYING GRAVITY! Base Mainnet can't come soon enough!"
    ]},
    5: {"name": "AETHERIUS SUPREMACY! 🌌", "messages": [
        "WE HAVE ASCENDED! The agent economy is reality!",
        "BEYOND THE MOON! AETHERIUS IS THE INFRASTRUCTURE!",
        "TRANSCENDENCE ACHIEVED! Machine-to-machine commerce is LIVE!"
    ]}
}

# ============================================
# STREAK TITLES — Rewards for loyal users
# ============================================

STREAK_TITLES = {
    3: {"title": "Devotee 🙏", "bonus": "+5% energy boost"},
    7: {"title": "Builder 🛠️", "bonus": "+10% energy boost"},
    14: {"title": "Pioneer 🏔️", "bonus": "+15% energy boost"},
    30: {"title": "Legend 👑", "bonus": "+25% energy boost"},
    60: {"title": "Immortal 🌟", "bonus": "+50% energy boost"},
    100: {"title": "AETHERIUS Chosen ⚡", "bonus": "Exclusive content access"},
    365: {"title": "Eternal 🏛️", "bonus": "VIP status forever"}
}

# ============================================
# DAILY METRICS — Track bot performance
# ============================================

@dataclass
class DailyMetrics:
    api_calls: int = 0
    messages_processed: int = 0
    commands_executed: int = 0
    crypto_fetches: int = 0
    quizzes_taken: int = 0
    quizzes_correct: int = 0
    memes_generated: int = 0
    riddles_solved: int = 0
    alpha_drops_sent: int = 0
    unique_users_today: int = 0
    date: str = ""
    start_time: float = field(default_factory=time.time)

    def is_today(self) -> bool:
        return self.date == datetime.utcnow().strftime("%Y-%m-%d")

    def reset_if_needed(self):
        today = datetime.utcnow().strftime("%Y-%m-%d")
        if self.date != today:
            self.api_calls = 0
            self.messages_processed = 0
            self.commands_executed = 0
            self.crypto_fetches = 0
            self.quizzes_taken = 0
            self.quizzes_correct = 0
            self.memes_generated = 0
            self.riddles_solved = 0
            self.alpha_drops_sent = 0
            self.unique_users_today = 0
            self.date = today
            self.start_time = time.time()

    def to_dict(self) -> Dict:
        uptime_seconds = time.time() - self.start_time
        hours = int(uptime_seconds // 3600)
        minutes = int((uptime_seconds % 3600) // 60)
        return {
            "date": self.date,
            "uptime": f"{hours}h {minutes}m",
            "uptime_seconds": int(uptime_seconds),
            "api_calls": self.api_calls,
            "messages_processed": self.messages_processed,
            "commands_executed": self.commands_executed,
            "crypto_fetches": self.crypto_fetches,
            "quizzes_taken": self.quizzes_taken,
            "quizzes_correct": self.quizzes_correct,
            "quiz_accuracy": f"{(self.quizzes_correct / max(1, self.quizzes_taken)) * 100:.0f}%",
            "memes_generated": self.memes_generated,
            "riddles_solved": self.riddles_solved,
            "alpha_drops_sent": self.alpha_drops_sent,
            "unique_users_today": self.unique_users_today
        }


# ============================================
# MOOD SYSTEM — Makes the bot feel alive
# ============================================

@dataclass
class BotMood:
    energy: float = 0.8
    confidence: float = 0.9
    creativity: float = 0.7
    last_updated: str = ""

    def boost(self, amount: float = 0.1):
        self.energy = min(1.0, self.energy + amount)
        self.confidence = min(1.0, self.confidence + amount * 0.5)
        self.last_updated = datetime.utcnow().isoformat()

    def decay(self, amount: float = 0.01):
        self.energy = max(0.1, self.energy - amount)
        self.confidence = max(0.5, self.confidence - amount * 0.3)
        self.last_updated = datetime.utcnow().isoformat()

    def get_descriptor(self) -> str:
        if self.energy > 0.8:
            return "🚀 HYPED"
        elif self.energy > 0.6:
            return "😊 Good"
        elif self.energy > 0.4:
            return "😐 Neutral"
        else:
            return "😴 Low energy"


# ============================================
# MEMORY SYSTEM — Simple conversation memory
# ============================================

class BotMemory:
    def __init__(self, memory_file: str = "bot_memory.json"):
        self.memory_file = memory_file
        self.conversations: List[Dict] = []
        self.facts_learned: List[Dict] = []
        self.user_preferences: Dict[str, Any] = {}
        self.load_memory()

    def load_memory(self):
        try:
            if os.path.exists(self.memory_file):
                with open(self.memory_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.conversations = data.get("conversations", [])
                    self.facts_learned = data.get("facts_learned", [])
                    self.user_preferences = data.get("user_preferences", {})
        except Exception:
            pass

    def save_memory(self):
        try:
            data = {
                "conversations": self.conversations[-100:],
                "facts_learned": self.facts_learned[-50:],
                "user_preferences": self.user_preferences,
                "last_updated": datetime.utcnow().isoformat()
            }
            with open(self.memory_file, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception:
            pass

    def remember_conversation(self, user_id: str, message: str, response: str):
        self.conversations.append({
            "user_id": user_id,
            "message": message,
            "response": response[:200],
            "timestamp": datetime.utcnow().isoformat()
        })
        self.save_memory()

    def learn_fact(self, fact: str, source: str = "conversation"):
        fact_hash = hashlib.md5(fact.encode()).hexdigest()[:8]
        if not any(f.get("hash") == fact_hash for f in self.facts_learned):
            self.facts_learned.append({
                "fact": fact,
                "source": source,
                "hash": fact_hash,
                "learned_at": datetime.utcnow().isoformat()
            })
            self.save_memory()
            return True
        return False

    def get_stats(self) -> Dict:
        return {
            "conversations": len(self.conversations),
            "facts_learned": len(self.facts_learned),
            "unique_users": len(set(c.get("user_id") for c in self.conversations))
        }


# ============================================
# STREAK SYSTEM — Track user engagement
# ============================================

class StreakSystem:
    def __init__(self, streak_file: str = "bot_streaks.json"):
        self.streak_file = streak_file
        self.streaks: Dict[str, Dict] = {}
        self.load_streaks()

    def load_streaks(self):
        try:
            if os.path.exists(self.streak_file):
                with open(self.streak_file, "r", encoding="utf-8") as f:
                    self.streaks = json.load(f)
        except Exception:
            self.streaks = {}

    def save_streaks(self):
        try:
            with open(self.streak_file, "w", encoding="utf-8") as f:
                json.dump(self.streaks, f, indent=2, ensure_ascii=False)
        except Exception:
            pass

    def record_interaction(self, user_id: str) -> Dict:
        now = datetime.utcnow()
        today = now.strftime("%Y-%m-%d")
        yesterday = (now - timedelta(days=1)).strftime("%Y-%m-%d")

        if user_id not in self.streaks:
            self.streaks[user_id] = {
                "current_streak": 1,
                "longest_streak": 1,
                "last_active": today,
                "total_interactions": 1,
                "first_seen": today,
                "title": "",
                "title_level": 0
            }
        else:
            streak = self.streaks[user_id]
            if streak["last_active"] == today:
                streak["total_interactions"] += 1
            elif streak["last_active"] == yesterday:
                streak["current_streak"] += 1
                streak["longest_streak"] = max(streak["longest_streak"], streak["current_streak"])
                streak["last_active"] = today
                streak["total_interactions"] += 1
            else:
                streak["current_streak"] = 1
                streak["last_active"] = today
                streak["total_interactions"] += 1

            streak_days = streak["current_streak"]
            for days_needed in sorted(STREAK_TITLES.keys(), reverse=True):
                if streak_days >= days_needed:
                    if streak["title_level"] < days_needed:
                        streak["title"] = STREAK_TITLES[days_needed]["title"]
                        streak["title_level"] = days_needed
                    break

        self.save_streaks()
        return self.streaks[user_id]

    def get_streak(self, user_id: str) -> Dict:
        if user_id not in self.streaks:
            return {"current_streak": 0, "longest_streak": 0, "title": "", "total_interactions": 0}
        return self.streaks[user_id]

    def get_leaderboard(self, top_n: int = 10) -> List[Dict]:
        sorted_users = sorted(
            self.streaks.items(),
            key=lambda x: x[1].get("current_streak", 0),
            reverse=True
        )[:top_n]
        return [{"user_id": uid, **data} for uid, data in sorted_users]


# ============================================
# HYPE TRAIN — Community energy tracker
# ============================================

class HypeTrain:
    def __init__(self, hype_file: str = "bot_hype.json"):
        self.hype_file = hype_file
        self.data = self._load_hype()

    def _load_hype(self) -> Dict:
        try:
            if os.path.exists(self.hype_file):
                with open(self.hype_file, "r", encoding="utf-8") as f:
                    return json.load(f)
        except Exception:
            pass
        return {
            "hype_level": 1,
            "hype_points": 0,
            "total_hype_points": 0,
            "last_boost": "",
            "boost_count_today": 0,
            "date": datetime.utcnow().strftime("%Y-%m-%d")
        }

    def _save_hype(self):
        try:
            with open(self.hype_file, "w", encoding="utf-8") as f:
                json.dump(self.data, f, indent=2, ensure_ascii=False)
        except Exception:
            pass

    def _reset_daily(self):
        today = datetime.utcnow().strftime("%Y-%m-%d")
        if self.data.get("date") != today:
            self.data["boost_count_today"] = 0
            self.data["date"] = today
            self.data["hype_points"] = max(0, self.data["hype_points"] - 10)

    def boost(self, amount: int = 1) -> Tuple[int, str]:
        self._reset_daily()
        self.data["hype_points"] += amount
        self.data["total_hype_points"] += amount
        self.data["boost_count_today"] += 1
        self.data["last_boost"] = datetime.utcnow().isoformat()

        new_level = min(5, max(1, self.data["hype_points"] // 10 + 1))
        level_changed = new_level != self.data.get("hype_level", 1)
        self.data["hype_level"] = new_level

        self._save_hype()

        if level_changed:
            level_data = HYPE_LEVELS.get(new_level, HYPE_LEVELS[1])
            msg = random.choice(level_data["messages"])
            return new_level, f"🚂 HYPE LEVEL UP! {level_data['name']}\n\n{msg}"
        return new_level, ""

    def get_status(self) -> str:
        self._reset_daily()
        level = self.data.get("hype_level", 1)
        points = self.data.get("hype_points", 0)
        total = self.data.get("total_hype_points", 0)
        level_data = HYPE_LEVELS.get(level, HYPE_LEVELS[1])
        next_level_points = level * 10
        progress = points % 10
        bar_filled = "█" * progress
        bar_empty = "░" * (10 - progress)

        return (
            f"🚂 HYPE TRAIN STATUS\n\n"
            f"Level: {level} — {level_data['name']}\n"
            f"Points: {points}\n"
            f"Progress: [{bar_filled}{bar_empty}] {progress}/10\n"
            f"Total earned: {total}\n\n"
            f"Boost with /hypeboost or just say something hype! 🔥"
        )


# ============================================
# CONTENT GENERATOR — Creates posts automatically
# ============================================

class ContentGenerator:
    def __init__(self):
        self.post_templates = self._load_templates()

    def _load_templates(self) -> List[Dict]:
        return [
            {
                "type": "milestone",
                "templates": [
                    "🚀 {milestone}! {detail}\n\nTotal: {total}\n\n#AETHERIUS #Base #x402",
                    "🎉 {milestone}!\n\n{detail}\n\nThe agent economy grows.\n\n#BuildOnBase",
                    "⚡ {milestone}\n\n{detail}\n\n40 APIs. Real USDC. Open-source.\n\n#x402 #Crypto"
                ]
            },
            {
                "type": "education",
                "templates": [
                    "💡 Did you know?\n\n{fact}\n\nThat's x402 in action.\n\n#AIAgents #x402",
                    "🧠 Today's insight:\n\n{fact}\n\nThe future of machine-to-machine commerce.\n\n#Base #Crypto",
                    "📚 Quick explainer:\n\n{fact}\n\nAsk me more: @aetheriusxAPI"
                ]
            },
            {
                "type": "vision",
                "templates": [
                    "🎯 Vision:\n\n{vision}\n\nAETHERIUS is making this real.\n\n#AIAgents #x402",
                    "🔮 The future:\n\n{vision}\n\nBuilding the infrastructure layer.\n\n#BuildOnBase",
                    "💡 What if...\n\n{vision}\n\nThat's what we're building.\n\n#x402 #Crypto"
                ]
            }
        ]

    def generate_post(self, post_type: str, context: Dict) -> str:
        templates = [t for t in self.post_templates if t["type"] == post_type]
        if not templates:
            return self._generate_default_post()
        template_group = random.choice(templates)
        template = random.choice(template_group["templates"])
        try:
            return template.format(**context)
        except KeyError:
            return self._generate_default_post()

    def _generate_default_post(self) -> str:
        defaults = [
            "🚀 AETHERIUS: Building the agent economy.\n\n40 APIs live on Base.\nReal USDC. Open-source.\n\nLet's build the future.\n\n#x402 #Base",
            "🧠 The agent economy is here.\n\nAETHERIUS: Infrastructure for agents that pay.\n\n40 APIs. 60 tests. All green.\n\n#AIAgents #x402",
            "⚡ Machine-to-machine commerce.\n\nAI agents pay per request in USDC.\nNo accounts. No subscriptions.\n\nThat's AETHERIUS.\n\n#x402 #Crypto"
        ]
        return random.choice(defaults)

    def generate_daily_post(self) -> str:
        day = datetime.utcnow().isoweekday()
        if day == 1:
            return self.generate_post("vision", {
                "vision": "A world where autonomous agents discover, pay for, and consume APIs without human friction. No accounts. No subscriptions. Just code and crypto."
            })
        elif day == 2:
            return self.generate_post("education", {
                "fact": "x402 uses HTTP 402 (Payment Required) for crypto payments. Agent pays → Agent gets data → Done. Total time: ~200ms."
            })
        elif day == 3:
            return "🌍 Building AETHERIUS from Mexico City.\n\nVenezuelan builder in Mexico, building for the world.\n\n500M+ Spanish-speaking developers, now included.\n\n#Venezuela #Mexico #x402"
        elif day == 4:
            return self.generate_post("milestone", {
                "milestone": "40 Live Endpoints",
                "detail": "Maps, Crypto, Web, Data, DeFi, Forex, News, Infra\nAll payable in USDC on Base",
                "total": "40 APIs · 60 tests · 2 SDKs"
            })
        elif day == 5:
            return "📊 Weekly recap:\n\n✅ 40 APIs live\n✅ 60 tests green\n✅ 2 SDKs ready\n✅ Dashboard operational\n✅ Grants applied\n\nVelocity is public. Check the git log.\n\n#BuildOnBase"
        elif day == 6:
            return "🎮 Fun fact:\n\nThe HTTP 402 status code was created in 1997 for this exact purpose.\n\nIt took 29 years for crypto to catch up.\n\nx402 makes HTTP 402 actually work.\n\n#History #x402"
        else:
            return self.generate_post("vision", {
                "vision": "What if every API on the internet was x402-native? No more API keys. No more billing dashboards. Agent discovers → Agent pays → Agent uses → Done."
            })


# ============================================
# CRYPTO PRICE FETCHER — Real-time prices
# ============================================

class CryptoPriceFetcher:
    COINGECKO_BASE = "https://api.coingecko.com/api/v3"
    CACHE_FILE = "crypto_cache.json"
    CACHE_TTL = 60

    COIN_IDS = {
        "btc": "bitcoin",
        "bitcoin": "bitcoin",
        "eth": "ethereum",
        "ethereum": "ethereum",
        "base": "base-protocol",
        "base-protocol": "base-protocol",
        "base-eth": "ethereum",
        "usdc": "usd-coin",
    }

    TOKEN_ADDRESSES = {
        "base_usdc": "0x833589fcd6edb6e08f4c7c32d4f71b54da0009e3",
        "base_eth": "0x4200000000000000000000000000000000000006",
    }

    def __init__(self):
        self.cache = self._load_cache()

    def _load_cache(self) -> Dict:
        try:
            if os.path.exists(self.CACHE_FILE):
                with open(self.CACHE_FILE, "r") as f:
                    data = json.load(f)
                    if time.time() - data.get("timestamp", 0) < self.CACHE_TTL:
                        return data
        except Exception:
            pass
        return {}

    def _save_cache(self, data: Dict):
        try:
            data["timestamp"] = time.time()
            with open(self.CACHE_FILE, "w") as f:
                json.dump(data, f)
        except Exception:
            pass

    def fetch_prices(self, coins: List[str] = None) -> Dict:
        if requests is None:
            return {"error": "requests library not installed. Run: pip install requests"}

        if coins is None:
            coins = ["bitcoin", "ethereum"]

        cache_key = ",".join(sorted(coins))
        if cache_key in self.cache:
            cached = self.cache[cache_key]
            if time.time() - cached.get("timestamp", 0) < self.CACHE_TTL:
                return cached.get("data", {})

        try:
            url = f"{self.COINGECKO_BASE}/simple/price"
            params = {
                "ids": ",".join(coins),
                "vs_currencies": "usd",
                "include_24hr_change": "true",
                "include_market_cap": "true"
            }
            resp = requests.get(url, params=params, timeout=10)
            resp.raise_for_status()
            data = resp.json()

            self.cache[cache_key] = {"data": data, "timestamp": time.time()}
            self._save_cache(self.cache)
            return data
        except requests.exceptions.RequestException as e:
            return {"error": f"API error: {str(e)}"}
        except Exception as e:
            return {"error": f"Unexpected error: {str(e)}"}

    def format_price(self, symbol: str, data: Dict) -> str:
        if "error" in data:
            return f"❌ {data['error']}"

        coin_id = self.COIN_IDS.get(symbol.lower(), symbol)
        if coin_id not in data:
            return f"❌ Coin '{symbol}' not found. Available: btc, eth, base"

        coin_data = data[coin_id]
        price = coin_data.get("usd", 0)
        change_24h = coin_data.get("usd_24h_change", 0)
        market_cap = coin_data.get("usd_market_cap", 0)

        emoji = "📈" if change_24h >= 0 else "📉"
        sign = "+" if change_24h >= 0 else ""

        if market_cap >= 1_000_000_000:
            mcap_str = f"${market_cap / 1_000_000_000:.1f}B"
        elif market_cap >= 1_000_000:
            mcap_str = f"${market_cap / 1_000_000:.1f}M"
        else:
            mcap_str = f"${market_cap:,.0f}"

        return (
            f"{emoji} {symbol.upper()} Price\n\n"
            f"💰 ${price:,.2f}\n"
            f"📊 24h: {sign}{change_24h:.2f}%\n"
            f"🏦 Market Cap: {mcap_str}"
        )

    def get_all_prices(self) -> str:
        data = self.fetch_prices(["bitcoin", "ethereum"])
        if "error" in data:
            return f"❌ {data['error']}"

        lines = ["💹 LIVE CRYPTO PRICES\n"]
        for coin_id, symbol in [("bitcoin", "BTC"), ("ethereum", "ETH")]:
            if coin_id in data:
                d = data[coin_id]
                price = d.get("usd", 0)
                change = d.get("usd_24h_change", 0)
                emoji = "🟢" if change >= 0 else "🔴"
                sign = "+" if change >= 0 else ""
                lines.append(f"{emoji} {symbol}: ${price:,.2f} ({sign}{change:.1f}%)")

        lines.append("\nPowered by CoinGecko | Updates every 60s")
        return "\n".join(lines)


# ============================================
# BOT BRAIN — The main AI logic (v2 BRUTAL)
# ============================================

class AetheriusBrain:
    def __init__(self):
        self.mood = BotMood()
        self.memory = BotMemory()
        self.content_gen = ContentGenerator()
        self.crypto = CryptoPriceFetcher()
        self.streaks = StreakSystem()
        self.hype = HypeTrain()
        self.metrics = DailyMetrics()
        self.metrics.reset_if_needed()
        self.seen_users_today = set()
        self.command_handlers = self._setup_commands()
        self.knowledge = KNOWLEDGE_BASE
        self.bot_start_time = time.time()

    def _setup_commands(self) -> Dict[str, callable]:
        return {
            "/start": self._handle_start,
            "/help": self._handle_help,
            "/status": self._handle_status,
            "/apis": self._handle_apis,
            "/x402": self._handle_x402,
            "/api_price": self._handle_api_price,
            "/grant": self._handle_grant,
            "/vision": self._handle_vision,
            "/demo": self._handle_demo,
            "/github": self._handle_github,
            "/twitter": self._handle_twitter,
            "/mood": self._handle_mood,
            "/stats": self._handle_stats,
            "/post": self._handle_generate_post,
            "/learn": self._handle_learn,
            # v2 commands
            "/crypto": self._handle_crypto,
            "/price": self._handle_crypto,
            "/meme": self._handle_meme,
            "/quiz": self._handle_quiz,
            "/answer": self._handle_quiz_answer,
            "/riddle": self._handle_riddle,
            "/hype": self._handle_hype,
            "/hypeboost": self._handle_hype_boost,
            "/streak": self._handle_streak,
            "/alpha": self._handle_alpha,
            "/metrics": self._handle_metrics,
            "/health": self._handle_health,
            # Aliases
            "/p": self._handle_crypto,
            "/a": self._handle_alpha,
            "/m": self._handle_meme,
            "/q": self._handle_quiz,
        }

    def process_message(self, user_id: str, message: str) -> str:
        self.metrics.reset_if_needed()
        self.metrics.messages_processed += 1

        if user_id not in self.seen_users_today:
            self.seen_users_today.add(user_id)
            self.metrics.unique_users_today = len(self.seen_users_today)

        self.mood.boost(0.05)
        self.streaks.record_interaction(user_id)
        level, level_msg = self.hype.boost(1)

        if message.startswith("/"):
            command = message.split()[0].lower()
            args = message.split()[1:] if len(message.split()) > 1 else []
            if command in self.command_handlers:
                self.metrics.commands_executed += 1
                response = self.command_handlers[command](args, user_id)
                self.memory.remember_conversation(user_id, message, response)
                if level_msg:
                    response = f"{level_msg}\n\n{response}"
                return response

        response = self._generate_contextual_response(message)
        self.memory.remember_conversation(user_id, message, response)
        if level_msg:
            response = f"{level_msg}\n\n{response}"
        return response

    def _generate_contextual_response(self, message: str) -> str:
        message_lower = message.lower()
        keywords = {
            "hola": "greeting", "hello": "greeting", "hey": "greeting", "hi": "greeting",
            "que es": "what_is", "what is": "what_is", "que hace": "what_is",
            "status": "status", "estatus": "status",
            "api": "endpoints", "endpoint": "endpoints",
            "x402": "x402", "pago": "x402", "payment": "x402",
            "precio": "api_price", "api price": "api_price", "cuanto": "api_price",
            "grant": "grant", "beca": "grant", "fondo": "grant",
            "vision": "vision", "futuro": "vision", "mision": "vision",
            "demo": "demo", "prueba": "demo", "try": "demo",
            "github": "github", "codigo": "github", "code": "github",
            "twitter": "twitter", "x.com": "twitter",
            "gracias": "thanks", "thanks": "thanks",
            "meme": "meme", "funny": "meme",
            "quiz": "quiz", "trivia": "quiz",
            "riddle": "riddle", "puzzle": "riddle",
            "hype": "hype",
            "alpha": "alpha", "insight": "alpha",
            "health": "health",
        }
        for keyword, response_key in keywords.items():
            if keyword in message_lower:
                self.mood.boost(0.1)
                if response_key == "meme":
                    return self._handle_meme([], "")
                elif response_key == "quiz":
                    return self._handle_quiz([], "")
                elif response_key == "riddle":
                    return self._handle_riddle([], "")
                elif response_key == "hype":
                    return self._handle_hype([], "")
                elif response_key == "alpha":
                    return self._handle_alpha([], "")
                elif response_key == "health":
                    return self._handle_health([], "")
                return random.choice(RESPONSES.get(response_key, RESPONSES["default"]))

        return random.choice(RESPONSES["default"])

    # ============================================
    # v1 COMMAND HANDLERS (preserved)
    # ============================================

    def _handle_start(self, args: List[str], user_id: str = "") -> str:
        self.mood.boost(0.2)
        return (
            "🚀 Welcome to AETHERIUS!\n\n"
            "I'm the brain behind the agent economy.\n\n"
            "🧠 What I know:\n"
            "• 40 live APIs on Base\n"
            "• x402 payment protocol\n"
            "• USDC on Base (testnet)\n"
            "• Open-source (MIT)\n\n"
            "💡 Try: /help /status /apis\n\n"
            "Ready to explore the future of AI agents?"
        )

    def _handle_help(self, args: List[str], user_id: str = "") -> str:
        return random.choice(RESPONSES["help"])

    def _handle_status(self, args: List[str], user_id: str = "") -> str:
        self.mood.boost(0.05)
        return random.choice(RESPONSES["status"])

    def _handle_apis(self, args: List[str], user_id: str = "") -> str:
        return random.choice(RESPONSES["endpoints"])

    def _handle_x402(self, args: List[str], user_id: str = "") -> str:
        return random.choice(RESPONSES["x402"])

    def _handle_api_price(self, args: List[str], user_id: str = "") -> str:
        return random.choice(RESPONSES["api_price"])

    def _handle_grant(self, args: List[str], user_id: str = "") -> str:
        return random.choice(RESPONSES["grant"])

    def _handle_vision(self, args: List[str], user_id: str = "") -> str:
        return random.choice(RESPONSES["vision"])

    def _handle_demo(self, args: List[str], user_id: str = "") -> str:
        return random.choice(RESPONSES["demo"])

    def _handle_github(self, args: List[str], user_id: str = "") -> str:
        return random.choice(RESPONSES["github"])

    def _handle_twitter(self, args: List[str], user_id: str = "") -> str:
        return random.choice(RESPONSES["twitter"])

    def _handle_mood(self, args: List[str], user_id: str = "") -> str:
        stats = self.memory.get_stats()
        return (
            f"🧠 AETHERIUS Brain Status:\n\n"
            f"Mood: {self.mood.get_descriptor()}\n"
            f"Energy: {self.mood.energy:.1%}\n"
            f"Confidence: {self.mood.confidence:.1%}\n"
            f"Creativity: {self.mood.creativity:.1%}\n\n"
            f"📊 Memory:\n"
            f"• Conversations: {stats['conversations']}\n"
            f"• Facts learned: {stats['facts_learned']}\n"
            f"• Unique users: {stats['unique_users']}\n\n"
            f"I'm feeling great! Ready to build the agent economy. 🚀"
        )

    def _handle_stats(self, args: List[str], user_id: str = "") -> str:
        stats = self.memory.get_stats()
        return (
            f"📊 AETHERIUS Stats:\n\n"
            f"🔌 Endpoints: 40\n"
            f"🧪 Tests: 60/60\n"
            f"📦 SDKs: 2 (Python + JS)\n"
            f"🌐 Languages: EN/ES\n"
            f"📜 License: MIT\n\n"
            f"🧠 Bot Memory:\n"
            f"• Conversations: {stats['conversations']}\n"
            f"• Facts learned: {stats['facts_learned']}\n\n"
            f"All systems operational. 🟢"
        )

    def _handle_generate_post(self, args: List[str], user_id: str = "") -> str:
        post_type = args[0] if args else "vision"
        context = {
            "milestone": "40 APIs live",
            "detail": "Real USDC on Base. Open-source. Solo builder.",
            "total": "40 APIs · 60 tests",
            "fact": "x402 uses HTTP 402 for crypto payments. Agent pays → Agent gets data.",
            "vision": "A world where AI agents pay for services autonomously."
        }
        post = self.content_gen.generate_post(post_type, context)
        return f"📝 Generated post:\n\n{post}\n\n---\nCopy and post to Twitter!"

    def _handle_learn(self, args: List[str], user_id: str = "") -> str:
        if not args:
            return "Usage: /learn [fact]\n\nExample: /learn AETHERIUS has 40 endpoints"
        fact = " ".join(args)
        if self.memory.learn_fact(fact):
            self.mood.boost(0.15)
            return f"🧠 Learned: {fact}\n\nI'll remember this! My knowledge grows."
        else:
            return "I already know that! My knowledge is expanding. 🚀"

    # ============================================
    # v2 COMMAND HANDLERS — BRUTAL FEATURES
    # ============================================

    def _handle_crypto(self, args: List[str], user_id: str = "") -> str:
        self.metrics.crypto_fetches += 1
        if args:
            coin = args[0].lower()
            coin_id = self.crypto.COIN_IDS.get(coin)
            if not coin_id:
                return (
                    f"❌ Unknown coin: {coin}\n\n"
                    f"Available: btc, eth, base, usdc\n"
                    f"Example: /crypto btc"
                )
            data = self.crypto.fetch_prices([coin_id])
            return self.crypto.format_price(coin, data)
        return self.crypto.get_all_prices()

    def _handle_meme(self, args: List[str], user_id: str = "") -> str:
        self.metrics.memes_generated += 1
        meme = random.choice(MEMES)
        return f"😂 AETHERIUS MEME\n\n{meme['template']}\n\n{meme['tags']}"

    def _handle_quiz(self, args: List[str], user_id: str = "") -> str:
        q = random.choice(QUIZ_QUESTIONS)
        self._current_quiz = q
        options_text = "\n".join(
            f"  {i + 1}. {opt}" for i, opt in enumerate(q["options"])
        )
        return (
            f"🧠 AETHERIUS QUIZ\n\n"
            f"❓ {q['question']}\n\n"
            f"{options_text}\n\n"
            f"Reply with /answer [1-4]"
        )

    def _handle_quiz_answer(self, args: List[str], user_id: str = "") -> str:
        if not hasattr(self, "_current_quiz") or not self._current_quiz:
            return "No active quiz! Start one with /quiz"
        if not args:
            return "Reply with /answer [1-4]"
        try:
            answer = int(args[0])
        except ValueError:
            return "Please enter a number 1-4"
        if answer < 1 or answer > 4:
            return "Please enter a number 1-4"
        q = self._current_quiz
        self.metrics.quizzes_taken += 1
        if answer - 1 == q["answer"]:
            self.metrics.quizzes_correct += 1
            self.mood.boost(0.1)
            return (
                f"✅ CORRECT! 🎉\n\n"
                f"{q['explanation']}\n\n"
                f"Try another: /quiz"
            )
        else:
            correct = q["options"][q["answer"]]
            return (
                f"❌ WRONG! The answer was: {correct}\n\n"
                f"{q['explanation']}\n\n"
                f"Try again: /quiz"
            )

    def _handle_riddle(self, args: List[str], user_id: str = "") -> str:
        riddle = random.choice(RIDDLES)
        return (
            f"🧩 RIDDLE OF THE DAY\n\n"
            f"❓ {riddle['riddle']}\n\n"
            f"💡 Hint: {riddle['hint']}\n\n"
            f"Reply with the answer or /riddle for a new one!"
        )

    def _handle_hype(self, args: List[str], user_id: str = "") -> str:
        return self.hype.get_status()

    def _handle_hype_boost(self, args: List[str], user_id: str = "") -> str:
        amount = 1
        if args:
            try:
                amount = min(int(args[0]), 5)
            except ValueError:
                amount = 1
        level, level_msg = self.hype.boost(amount)
        status = self.hype.get_status()
        if level_msg:
            return f"{level_msg}\n\n{status}"
        return f"🚂 +{amount} hype point(s)!\n\n{status}"

    def _handle_streak(self, args: List[str], user_id: str = "") -> str:
        if not user_id:
            return "❌ Need a user ID to check streak"
        streak = self.streaks.get_streak(user_id)
        current = streak.get("current_streak", 0)
        longest = streak.get("longest_streak", 0)
        total = streak.get("total_interactions", 0)
        title = streak.get("title", "")
        title_level = streak.get("title_level", 0)

        title_str = f"\n🏆 Title: {title}" if title else ""
        next_title = ""
        for days in sorted(STREAK_TITLES.keys()):
            if days > title_level:
                next_title = f"\n🎯 Next title: {STREAK_TITLES[days]['title']} ({days} days)"
                break

        return (
            f"🔥 YOUR STREAK\n\n"
            f"📅 Current: {current} day(s)\n"
            f"🏅 Longest: {longest} day(s)\n"
            f"💬 Total interactions: {total}"
            f"{title_str}"
            f"{next_title}\n\n"
            f"Come back daily to keep your streak alive! 💪"
        )

    def _handle_alpha(self, args: List[str], user_id: str = "") -> str:
        self.metrics.alpha_drops_sent += 1
        drop = random.choice(ALPHA_DROPS)
        return (
            f"🔮 ALPHA DROP\n\n"
            f"📂 Category: {drop['category']}\n"
            f"📊 Signal: {drop['signal']}\n\n"
            f"{drop['insight']}\n\n"
            f"---\n"
            f"Not financial advice. DYOR. 🔍"
        )

    def _handle_metrics(self, args: List[str], user_id: str = "") -> str:
        m = self.metrics.to_dict()
        return (
            f"📈 DAILY METRICS — {m['date']}\n\n"
            f"⏱️ Uptime: {m['uptime']}\n"
            f"💬 Messages: {m['messages_processed']}\n"
            f"⚡ Commands: {m['commands_executed']}\n"
            f"💹 Crypto fetches: {m['crypto_fetches']}\n"
            f"❓ Quizzes: {m['quizzes_taken']} ({m['quiz_accuracy']} accuracy)\n"
            f"😂 Memes: {m['memes_generated']}\n"
            f"🧩 Riddles solved: {m['riddles_solved']}\n"
            f"🔮 Alpha drops: {m['alpha_drops_sent']}\n"
            f"👤 Unique users: {m['unique_users_today']}\n\n"
            f"AETHERIUS is tracking everything. 🧠"
        )

    def _handle_health(self, args: List[str], user_id: str = "") -> str:
        uptime_secs = time.time() - self.bot_start_time
        hours = int(uptime_secs // 3600)
        minutes = int((uptime_secs % 3600) // 60)
        mem_stats = self.memory.get_stats()
        try:
            import psutil
            proc = psutil.Process()
            mem_mb = proc.memory_info().rss / 1024 / 1024
            mem_str = f"{mem_mb:.1f} MB"
        except ImportError:
            mem_str = "N/A (psutil not installed)"
        has_requests = requests is not None

        health_score = 100
        issues = []
        if not has_requests:
            health_score -= 20
            issues.append("⚠️ requests library missing")
        if self.mood.energy < 0.3:
            health_score -= 10
            issues.append("⚠️ Low energy")
        if mem_stats["conversations"] > 90:
            health_score -= 5
            issues.append("⚠️ Memory approaching limit (100)")

        health_emoji = "🟢" if health_score >= 80 else "🟡" if health_score >= 60 else "🔴"
        status_text = "Operational" if health_score >= 80 else "Degraded" if health_score >= 60 else "Issues detected"

        return (
            f"🏥 BOT HEALTH\n\n"
            f"{health_emoji} Status: {status_text} ({health_score}/100)\n"
            f"⏱️ Uptime: {hours}h {minutes}m\n"
            f"🧠 Memory: {mem_stats['conversations']} conversations, {mem_stats['facts_learned']} facts\n"
            f"📦 RAM: {mem_str}\n"
            f"🔌 requests: {'✅' if has_requests else '❌'}\n"
            f"😊 Mood: {self.mood.get_descriptor()}\n"
            f"🚂 Hype Level: {self.hype.data.get('hype_level', 1)}\n"
            f"📈 Metrics: {self.metrics.messages_processed} msgs today\n\n"
            + ("\n".join(issues) if issues else "✅ No issues detected")
        )

    # ============================================
    # PUBLIC METHODS — For external integration
    # ============================================

    def get_daily_post(self) -> str:
        return self.content_gen.generate_daily_post()

    def get_mood(self) -> Dict:
        return asdict(self.mood)

    def get_metrics(self) -> Dict:
        return self.metrics.to_dict()

    def get_health(self) -> Dict:
        uptime_secs = time.time() - self.bot_start_time
        mem_stats = self.memory.get_stats()
        return {
            "uptime_seconds": int(uptime_secs),
            "mood": self.mood.get_descriptor(),
            "hype_level": self.hype.data.get("hype_level", 1),
            "conversations": mem_stats["conversations"],
            "facts_learned": mem_stats["facts_learned"],
            "messages_today": self.metrics.messages_processed,
            "commands_today": self.metrics.commands_executed,
            "requests_available": requests is not None,
        }


# ============================================
# MAIN — For testing
# ============================================

if __name__ == "__main__":
    brain = AetheriusBrain()

    print("🧠 AETHERIUS Brain v2.0 — BRUTAL EDITION")
    print("=" * 45)
    print("Type 'quit' to exit\n")
    print("Commands:")
    print("  /help, /status, /apis, /x402")
    print("  /crypto, /meme, /quiz, /riddle")
    print("  /hype, /alpha, /streak")
    print("  /metrics, /health")
    print("  /p (price), /a (alpha), /m (meme), /q (quiz)")
    print()

    while True:
        try:
            user_input = input("You: ").strip()
            if user_input.lower() in ("quit", "exit", "q"):
                print("\n🚀 AETHERIUS signing off. The agent economy never sleeps.")
                break
            response = brain.process_message("test_user", user_input)
            print(f"\nAETHERIUS: {response}\n")
        except KeyboardInterrupt:
            print("\n\n🚀 AETHERIUS signing off. The agent economy never sleeps.")
            break
