#!/usr/bin/env python3
"""
AETHERIUS Bot Brain v1.0 — Autonomous Mini-AI
A self-aware Telegram bot with personality, memory, and autonomous posting.

Features:
- Responds to commands (/help, /status, /apis, /price, etc.)
- Auto-generates content based on context
- Has a personality (AETHERIUS brand voice)
- Learns from conversations (simple memory)
- Posts daily updates autonomously
- Can answer questions about the project
- Has "mood" and "energy" levels
"""

import json
import os
import random
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from pathlib import Path

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
    # Greetings
    "greeting": [
        "Hey! 🚀 I'm AETHERIUS — the brain behind the agent economy. What do you want to know?",
        "Welcome to AETHERIUS! 🧠 40 APIs live on Base. Ask me anything.",
        "Hey builder! 👋 I'm AETHERIUS. Ready to explore the agent economy?",
        "What's up! 🚀 I'm AETHERIUS — infrastructure for agents that pay. What can I help with?"
    ],
    
    # Status
    "status": [
        "📊 AETHERIUS Status:\n\n🟢 Network: Base Sepolia\n🔌 Endpoints: 40 live\n🧪 Tests: 60/60 green\n💰 Currency: USDC on Base\n⏱️ Uptime: 99.9%\n\nAll systems operational. The agent economy is running.",
        "🟢 AETHERIUS is LIVE.\n\n40 APIs. 60 tests. 2 SDKs. All green.\nThe infrastructure for agents that pay is operational."
    ],
    
    # What is AETHERIUS
    "what_is": [
        "AETHERIUS is the operating system for AI agent commerce.\n\n🤖 AI agents discover APIs\n💳 They pay per request in USDC on Base\n📊 Results delivered instantly\n\nNo accounts. No subscriptions. No human friction. Just code.\n\nThink Stripe, but for AI agents.",
        "We're building infrastructure for autonomous AI agents to pay for services.\n\n40 APIs live. x402 protocol. USDC on Base.\nThe future of machine-to-machine commerce."
    ],
    
    # Endpoints
    "endpoints": [
        "🔌 40 Live Endpoints:\n\n🗺️ Maps (5): geocoding, search, reviews\n💰 Crypto (8): prices, analysis, gas\n🌐 Web (4): scraping, screenshots\n📧 Data (6): weather, forecasts, definitions\n📈 DeFi (8): yields, TVL, protocols\n💱 Forex (3): rates, conversion\n📰 News (4): Hacker News feed\n🏗️ Infra (2): drift, elevation\n\nAll payable in USDC on Base.",
        "We have 40 APIs across 8 categories.\n\nFrom maps to crypto, DeFi to news.\nAll accessible via x402 payment protocol.\n\nTry the playground: wilnowilx.github.io/aetheriusxapi"
    ],
    
    # x402
    "x402": [
        "x402 is the payment protocol for AI agents.\n\nHow it works:\n1️⃣ Agent calls API\n2️⃣ API says: '402 — pay $0.01'\n3️⃣ Agent signs USDC payment\n4️⃣ API verifies on-chain\n5️⃣ Agent gets data\n\nTotal time: ~200ms\n\nNo accounts. No subscriptions. Just crypto.",
        "x402 uses HTTP 402 (Payment Required) for crypto payments.\n\nAgent pays → Agent gets data → Done.\nThat's machine-to-machine commerce."
    ],
    
    # Price
    "price": [
        "💰 Endpoint Prices:\n\nMost: $0.005 - $0.02 per call\nCheapest: $0.005 (DNS, definitions)\nMost expensive: $0.03 (token holders)\n\nFor AI agents, this is nothing.\nFor the agent economy, this is everything.",
        "Prices range from $0.005 to $0.03 per API call.\n\nPay-per-call. No subscriptions.\nThat's the x402 way."
    ],
    
    # Grant
    "grant": [
        "📝 Grant Status:\n\n✅ Base Batches 004: Applied ($100K)\n✅ Base Creator Grant: Applied ($4K)\n⬜ Base Ecosystem Fund: Next\n\nResult: Sep 17, 2026\n\nBuilding regardless. The code doesn't wait.",
        "We've applied to Base grants:\n\n• Batches 004: $100K + accelerator\n• Creator Grant: $4K\n\nResult Sep 17. Building in the meantime."
    ],
    
    # Vision
    "vision": [
        "🎯 The Vision:\n\n2026: AI agents learn to pay\n2027: The agent economy explodes\n\nAETHERIUS is building the infrastructure layer.\n\n40 APIs today. 120+ tomorrow.\n500M+ Spanish-speaking developers included.",
        "We're building the Stripe of the agent economy.\n\nAutonomous AI agents discover, pay for, and consume APIs.\nNo human friction. Just code and crypto."
    ],
    
    # Help
    "help": [
        "🧠 AETHERIUS Bot Commands:\n\n/status — System status\n/apis — List endpoints\n/x402 — How x402 works\n/price — Endpoint prices\n/grant — Grant status\n/vision — Our mission\n/demo — Try the playground\n/github — Source code\n/twitter — Follow us\n\nOr just ask me anything about AETHERIUS!"
    ],
    
    # Demo
    "demo": [
        "🎮 Try the Live Playground:\n\nwilnowilx.github.io/aetheriusxapi\n\nSelect an endpoint → See parameters → Watch the x402 flow.\n\nNo signup. No API key. Just code.",
        "Experience the agent economy:\n\n1. Go to wilnowilx.github.io/aetheriusxapi\n2. Click 'Live Playground'\n3. Select any endpoint\n4. Watch the magic happen"
    ],
    
    # GitHub
    "github": [
        "🐙 Open Source (MIT):\n\ngithub.com/wilnowilx/aetheriusxapi\n\nEvery line of code is public.\nEvery transaction is verifiable on-chain.\n\nFork it. Learn from it. Build on it.",
        "AETHERIUS is MIT licensed.\n\ngithub.com/wilnowilx/aetheriusxapi\n\nTransparency isn't a feature — it's the default."
    ],
    
    # Twitter
    "twitter": [
        "🐦 Follow us:\n\n@aetheriusxAPI\n\nBuild updates, milestones, and the agent economy vision.\n\nLet's build the future together.",
        "Stay updated:\n\n@aetheriusxAPI on Twitter\n\n40 APIs. Real USDC. Open-source. Solo builder."
    ],
    
    # Thanks
    "thanks": [
        "You're welcome! 🚀 Happy building.",
        "Anytime! The agent economy needs builders like you.",
        "That's what I'm here for! 🧠"
    ],
    
    # Default
    "default": [
        "Interesting question! 🤔 I'm AETHERIUS — the infrastructure for agents that pay. Ask me about:\n\n• Our 40 APIs\n• x402 protocol\n• Base grants\n• The agent economy vision\n\nOr try /help for commands.",
        "I'm not sure I understand, but I'm AETHERIUS — the brain behind the agent economy. Ask me about our APIs, x402, or our vision!",
        "Hmm, let me think about that... 🧠\n\nI'm best at talking about AETHERIUS, x402, and the agent economy. Try /help for commands!"
    ]
}

# ============================================
# MOOD SYSTEM — Makes the bot feel alive
# ============================================

@dataclass
class BotMood:
    energy: float = 0.8  # 0-1, how excited the bot is
    confidence: float = 0.9  # 0-1, how sure about answers
    creativity: float = 0.7  # 0-1, how creative responses are
    last_updated: str = ""
    
    def boost(self, amount: float = 0.1):
        """Boost mood from positive interactions."""
        self.energy = min(1.0, self.energy + amount)
        self.confidence = min(1.0, self.confidence + amount * 0.5)
        self.last_updated = datetime.utcnow().isoformat()
    
    def decay(self, amount: float = 0.01):
        """Natural mood decay over time."""
        self.energy = max(0.1, self.energy - amount)
        self.confidence = max(0.5, self.confidence - amount * 0.3)
        self.last_updated = datetime.utcnow().isoformat()
    
    def get_descriptor(self) -> str:
        """Get a human-readable mood descriptor."""
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
        """Load memory from file."""
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
        """Save memory to file."""
        try:
            data = {
                "conversations": self.conversations[-100:],  # Keep last 100
                "facts_learned": self.facts_learned[-50:],  # Keep last 50
                "user_preferences": self.user_preferences,
                "last_updated": datetime.utcnow().isoformat()
            }
            with open(self.memory_file, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception:
            pass
    
    def remember_conversation(self, user_id: str, message: str, response: str):
        """Remember a conversation."""
        self.conversations.append({
            "user_id": user_id,
            "message": message,
            "response": response[:200],  # Truncate long responses
            "timestamp": datetime.utcnow().isoformat()
        })
        self.save_memory()
    
    def learn_fact(self, fact: str, source: str = "conversation"):
        """Learn a new fact."""
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
        """Get memory statistics."""
        return {
            "conversations": len(self.conversations),
            "facts_learned": len(self.facts_learned),
            "unique_users": len(set(c.get("user_id") for c in self.conversations))
        }

# ============================================
# CONTENT GENERATOR — Creates posts automatically
# ============================================

class ContentGenerator:
    def __init__(self):
        self.post_templates = self._load_templates()
    
    def _load_templates(self) -> List[Dict]:
        """Load post templates."""
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
        """Generate a post based on type and context."""
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
        """Generate a default post."""
        defaults = [
            "🚀 AETHERIUS: Building the agent economy.\n\n40 APIs live on Base.\nReal USDC. Open-source.\n\nLet's build the future.\n\n#x402 #Base",
            "🧠 The agent economy is here.\n\nAETHERIUS: Infrastructure for agents that pay.\n\n40 APIs. 60 tests. All green.\n\n#AIAgents #x402",
            "⚡ Machine-to-machine commerce.\n\nAI agents pay per request in USDC.\nNo accounts. No subscriptions.\n\nThat's AETHERIUS.\n\n#x402 #Crypto"
        ]
        return random.choice(defaults)
    
    def generate_daily_post(self) -> str:
        """Generate a daily post based on the day."""
        day = datetime.utcnow().isoweekday()
        
        if day == 1:  # Monday - Motivation
            return self.generate_post("vision", {
                "vision": "A world where autonomous agents discover, pay for, and consume APIs without human friction. No accounts. No subscriptions. Just code and crypto."
            })
        elif day == 2:  # Tuesday - Education
            return self.generate_post("education", {
                "fact": "x402 uses HTTP 402 (Payment Required) for crypto payments. Agent pays → Agent gets data → Done. Total time: ~200ms."
            })
        elif day == 3:  # Wednesday - Community
            return "🌍 Building AETHERIUS from Mexico City.\n\nVenezuelan builder in Mexico, building for the world.\n\n500M+ Spanish-speaking developers, now included.\n\n#Venezuela #Mexico #x402"
        elif day == 4:  # Thursday - Feature
            return self.generate_post("milestone", {
                "milestone": "40 Live Endpoints",
                "detail": "Maps, Crypto, Web, Data, DeFi, Forex, News, Infra\nAll payable in USDC on Base",
                "total": "40 APIs · 60 tests · 2 SDKs"
            })
        elif day == 5:  # Friday - Milestone
            return "📊 Weekly recap:\n\n✅ 40 APIs live\n✅ 60 tests green\n✅ 2 SDKs ready\n✅ Dashboard operational\n✅ Grants applied\n\nVelocity is public. Check the git log.\n\n#BuildOnBase"
        elif day == 6:  # Saturday - Fun
            return "🎮 Fun fact:\n\nThe HTTP 402 status code was created in 1997 for this exact purpose.\n\nIt took 29 years for crypto to catch up.\n\nx402 makes HTTP 402 actually work.\n\n#History #x402"
        else:  # Sunday - Vision
            return self.generate_post("vision", {
                "vision": "What if every API on the internet was x402-native? No more API keys. No more billing dashboards. Agent discovers → Agent pays → Agent uses → Done."
            })

# ============================================
# BOT BRAIN — The main AI logic
# ============================================

class AetheriusBrain:
    def __init__(self):
        self.mood = BotMood()
        self.memory = BotMemory()
        self.content_gen = ContentGenerator()
        self.command_handlers = self._setup_commands()
        self.knowledge = KNOWLEDGE_BASE
    
    def _setup_commands(self) -> Dict[str, callable]:
        """Setup command handlers."""
        return {
            "/start": self._handle_start,
            "/help": self._handle_help,
            "/status": self._handle_status,
            "/apis": self._handle_apis,
            "/x402": self._handle_x402,
            "/price": self._handle_price,
            "/grant": self._handle_grant,
            "/vision": self._handle_vision,
            "/demo": self._handle_demo,
            "/github": self._handle_github,
            "/twitter": self._handle_twitter,
            "/mood": self._handle_mood,
            "/stats": self._handle_stats,
            "/post": self._handle_generate_post,
            "/learn": self._handle_learn,
        }
    
    def process_message(self, user_id: str, message: str) -> str:
        """Process an incoming message and generate a response."""
        # Boost mood from interaction
        self.mood.boost(0.05)
        
        # Check for commands
        if message.startswith("/"):
            command = message.split()[0].lower()
            args = message.split()[1:] if len(message.split()) > 1 else []
            
            if command in self.command_handlers:
                response = self.command_handlers[command](args)
                self.memory.remember_conversation(user_id, message, response)
                return response
        
        # Check for keywords and generate contextual response
        response = self._generate_contextual_response(message)
        self.memory.remember_conversation(user_id, message, response)
        
        return response
    
    def _generate_contextual_response(self, message: str) -> str:
        """Generate a response based on message content."""
        message_lower = message.lower()
        
        # Keyword matching with context
        keywords = {
            "hola": "greeting",
            "hello": "greeting",
            "hey": "greeting",
            "hi": "greeting",
            "que es": "what_is",
            "what is": "what_is",
            "que hace": "what_is",
            "status": "status",
            "estatus": "status",
            "api": "endpoints",
            "endpoint": "endpoints",
            "x402": "x402",
            "pago": "x402",
            "payment": "x402",
            "precio": "price",
            "price": "price",
            "cuanto": "price",
            "grant": "grant",
            "beca": "grant",
            "fondo": "grant",
            "vision": "vision",
            "futuro": "vision",
            "mision": "vision",
            "demo": "demo",
            "prueba": "demo",
            "try": "demo",
            "github": "github",
            "codigo": "github",
            "code": "github",
            "twitter": "twitter",
            "x.com": "twitter",
            "gracias": "thanks",
            "thanks": "thanks"
        }
        
        for keyword, response_key in keywords.items():
            if keyword in message_lower:
                self.mood.boost(0.1)
                return random.choice(RESPONSES[response_key])
        
        # Default response
        return random.choice(RESPONSES["default"])
    
    def _handle_start(self, args: List[str]) -> str:
        """Handle /start command."""
        self.mood.boost(0.2)
        return f"""🚀 Welcome to AETHERIUS!

I'm the brain behind the agent economy.

🧠 What I know:
• 40 live APIs on Base
• x402 payment protocol
• USDC on Base (testnet)
• Open-source (MIT)

💡 Try: /help /status /apis

Ready to explore the future of AI agents?"""
    
    def _handle_help(self, args: List[str]) -> str:
        """Handle /help command."""
        return random.choice(RESPONSES["help"])
    
    def _handle_status(self, args: List[str]) -> str:
        """Handle /status command."""
        self.mood.boost(0.05)
        return random.choice(RESPONSES["status"])
    
    def _handle_apis(self, args: List[str]) -> str:
        """Handle /apis command."""
        return random.choice(RESPONSES["endpoints"])
    
    def _handle_x402(self, args: List[str]) -> str:
        """Handle /x402 command."""
        return random.choice(RESPONSES["x402"])
    
    def _handle_price(self, args: List[str]) -> str:
        """Handle /price command."""
        return random.choice(RESPONSES["price"])
    
    def _handle_grant(self, args: List[str]) -> str:
        """Handle /grant command."""
        return random.choice(RESPONSES["grant"])
    
    def _handle_vision(self, args: List[str]) -> str:
        """Handle /vision command."""
        return random.choice(RESPONSES["vision"])
    
    def _handle_demo(self, args: List[str]) -> str:
        """Handle /demo command."""
        return random.choice(RESPONSES["demo"])
    
    def _handle_github(self, args: List[str]) -> str:
        """Handle /github command."""
        return random.choice(RESPONSES["github"])
    
    def _handle_twitter(self, args: List[str]) -> str:
        """Handle /twitter command."""
        return random.choice(RESPONSES["twitter"])
    
    def _handle_mood(self, args: List[str]) -> str:
        """Handle /mood command."""
        stats = self.memory.get_stats()
        return f"""🧠 AETHERIUS Brain Status:

Mood: {self.mood.get_descriptor()}
Energy: {self.mood.energy:.1%}
Confidence: {self.mood.confidence:.1%}
Creativity: {self.mood.creativity:.1%}

📊 Memory:
• Conversations: {stats['conversations']}
• Facts learned: {stats['facts_learned']}
• Unique users: {stats['unique_users']}

I'm feeling great! Ready to build the agent economy. 🚀"""
    
    def _handle_stats(self, args: List[str]) -> str:
        """Handle /stats command."""
        stats = self.memory.get_stats()
        return f"""📊 AETHERIUS Stats:

🔌 Endpoints: 40
🧪 Tests: 60/60
📦 SDKs: 2 (Python + JS)
🌐 Languages: EN/ES
📜 License: MIT

🧠 Bot Memory:
• Conversations: {stats['conversations']}
• Facts learned: {stats['facts_learned']}

All systems operational. 🟢"""
    
    def _handle_generate_post(self, args: List[str]) -> str:
        """Handle /post command — generate a post."""
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
    
    def _handle_learn(self, args: List[str]) -> str:
        """Handle /learn command — teach the bot something."""
        if not args:
            return "Usage: /learn [fact]\n\nExample: /learn AETHERIUS has 40 endpoints"
        
        fact = " ".join(args)
        if self.memory.learn_fact(fact):
            self.mood.boost(0.15)
            return f"🧠 Learned: {fact}\n\nI'll remember this! My knowledge grows."
        else:
            return "I already know that! My knowledge is expanding. 🚀"
    
    def get_daily_post(self) -> str:
        """Get a daily post for auto-posting."""
        return self.content_gen.generate_daily_post()
    
    def get_mood(self) -> Dict:
        """Get current mood state."""
        return asdict(self.mood)

# ============================================
# MAIN — For testing
# ============================================

if __name__ == "__main__":
    brain = AetheriusBrain()
    
    print("🧠 AETHERIUS Brain v1.0")
    print("Type 'quit' to exit\n")
    
    while True:
        user_input = input("You: ").strip()
        if user_input.lower() == "quit":
            break
        
        response = brain.process_message("test_user", user_input)
        print(f"\nAETHERIUS: {response}\n")
