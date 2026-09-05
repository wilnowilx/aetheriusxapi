#!/usr/bin/env python3
"""
AETHERIUS Telegram Bot v2.0 — The Upgraded Autonomous Agent
Runs bot_brain_v2 with advanced command handlers, engagement tracking,
and auto-response intelligence.

Features:
- All v1 commands preserved + 9 new commands
- Live ETH/BTC/BASE price feeds
- Daily alpha drops with market insights
- Crypto trivia quizzes with scoring
- Engagement streak tracking
- Community hype meter
- Keyword auto-response intelligence
- Bot health dashboard
- Crash-proof error handling
"""

import os
import sys
import json
import random
import logging
import asyncio
import traceback
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from collections import defaultdict

# Add parent directory to path
sys.path.insert(0, os.path.dirname(__file__))

try:
    from bot_brain_v2 import AetheriusBrain, ContentGenerator
except ImportError:
    try:
        from bot_brain import AetheriusBrain, ContentGenerator
    except ImportError:
        print("❌ Cannot import bot_brain_v2 or bot_brain. Falling back to stub.")
        class AetheriusBrain:
            def process_message(self, uid, msg):
                return "🧠 AETHERIUS brain module not found. Running in minimal mode."
            def get_daily_post(self):
                return "🌅 AETHERIUS daily post — stub mode"
        class ContentGenerator:
            pass

try:
    from telegram import Update, BotCommand, InlineKeyboardButton, InlineKeyboardMarkup
    from telegram.ext import (
        Application,
        CommandHandler,
        MessageHandler,
        CallbackQueryHandler,
        filters,
        ContextTypes
    )
except ImportError:
    print("❌ Install python-telegram-bot: pip install python-telegram-bot")
    sys.exit(1)

# ============================================
# CONFIG
# ============================================

BOT_TOKEN = os.environ.get("TELEGRAM_TOKEN", "8885939094:AAEq6Sz0JYWyCnV1ERc1ScXhuy6VdtEHe-g")
CHANNEL_ID = os.environ.get("TELEGRAM_CHANNEL_ID", "-1004315249717")  # @aetherius_xAPI
GROUP_ID = os.environ.get("TELEGRAM_GROUP_ID", "-1004320337418")  # @aetheriusxAPI_global supergroup

# ============================================
# LOGGING
# ============================================

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# ============================================
# BOT INSTANCE
# ============================================

brain = AetheriusBrain()
content_gen = ContentGenerator()

last_daily_post = None
BOT_VERSION = "2.0.0"
BOT_START_TIME = datetime.now(timezone.utc)

# ============================================
# STREAK & ENGAGEMENT TRACKING
# ============================================

class EngagementTracker:
    def __init__(self):
        self.streaks: Dict[str, int] = defaultdict(int)
        self.last_interaction: Dict[str, datetime] = {}
        self.total_messages: Dict[str, int] = defaultdict(int)
        self.total_commands: Dict[str, int] = defaultdict(int)
        self.quiz_scores: Dict[str, int] = defaultdict(int)
        self.quiz_games: Dict[str, dict] = {}
        self.hype_level: float = 0.0
        self.hype_last_decay: datetime = datetime.now(timezone.utc)
        self.data_file = os.path.join(os.path.dirname(__file__), "engagement_data.json")
        self._load_data()

    def _load_data(self):
        try:
            if os.path.exists(self.data_file):
                with open(self.data_file, "r") as f:
                    data = json.load(f)
                    self.streaks = defaultdict(int, data.get("streaks", {}))
                    self.total_messages = defaultdict(int, data.get("total_messages", {}))
                    self.total_commands = defaultdict(int, data.get("total_commands", {}))
                    self.quiz_scores = defaultdict(int, data.get("quiz_scores", {}))
                    self.hype_level = data.get("hype_level", 0.0)
        except Exception:
            pass

    def _save_data(self):
        try:
            data = {
                "streaks": dict(self.streaks),
                "total_messages": dict(self.total_messages),
                "total_commands": dict(self.total_commands),
                "quiz_scores": dict(self.quiz_scores),
                "hype_level": self.hype_level,
            }
            with open(self.data_file, "w") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save engagement data: {e}")

    def record_interaction(self, user_id: str, is_command: bool = False):
        now = datetime.now(timezone.utc)
        last = self.last_interaction.get(user_id)
        today = now.date()

        if last and last.date() == today:
            pass
        elif last and (now.date() - last.date()).days == 1:
            self.streaks[user_id] += 1
        elif last and (now.date() - last.date()).days > 1:
            self.streaks[user_id] = 1
        else:
            self.streaks[user_id] = max(self.streaks[user_id], 1)

        self.last_interaction[user_id] = now
        self.total_messages[user_id] += 1
        if is_command:
            self.total_commands[user_id] += 1

        self.hype_level = min(100.0, self.hype_level + 0.5)
        self._save_data()

    def get_streak(self, user_id: str) -> int:
        return self.streaks.get(user_id, 0)

    def get_stats(self, user_id: str) -> dict:
        return {
            "streak": self.streaks.get(user_id, 0),
            "total_messages": self.total_messages.get(user_id, 0),
            "total_commands": self.total_commands.get(user_id, 0),
            "quiz_score": self.quiz_scores.get(user_id, 0),
        }

    def decay_hype(self):
        now = datetime.now(timezone.utc)
        elapsed = (now - self.hype_last_decay).total_seconds() / 3600
        if elapsed > 1:
            self.hype_level = max(0.0, self.hype_level - (elapsed * 2))
            self.hype_last_decay = now
            self._save_data()

    def get_hype(self) -> float:
        self.decay_hype()
        return self.hype_level


tracker = EngagementTracker()

# ============================================
# QUIZ SYSTEM
# ============================================

QUIZ_QUESTIONS = [
    {"q": "What does BTC stand for?", "a": "Bitcoin", "opts": ["Bitcoin", "Bitconnect", "Bytecoin", "Bitecoin"]},
    {"q": "On which blockchain is AETHERIUS built?", "a": "Base", "opts": ["Ethereum", "Base", "Solana", "Polygon"]},
    {"q": "What is the x402 payment protocol?", "a": "Machine-to-machine HTTP payments", "opts": ["Machine-to-machine HTTP payments", "A new DEX", "An NFT marketplace", "A stablecoin"]},
    {"q": "Who created Bitcoin?", "a": "Satoshi Nakamoto", "opts": ["Vitalik Buterin", "Satoshi Nakamoto", "Elon Musk", "CZ"]},
    {"q": "What does HODL mean?", "a": "Hold On for Dear Life", "opts": ["Hold On for Dear Life", "High Order Digital Ledger", "Hash Origin Distributed Ledger", "Help Our Decentralized Law"]},
    {"q": "What is the max supply of Bitcoin?", "a": "21 million", "opts": ["21 million", "100 million", "1 billion", "Unlimited"]},
    {"q": "What network does AETHERIUS deploy on?", "a": "Base Sepolia", "opts": ["Mainnet", "Base Sepolia", "Goerli", "Mumbai"]},
    {"q": "What is a smart contract?", "a": "Self-executing code on blockchain", "opts": ["Self-executing code on blockchain", "A legal contract", "An AI model", "A database query"]},
    {"q": "What does DeFi stand for?", "a": "Decentralized Finance", "opts": ["Decentralized Finance", "Digital Finance", "Distributed Finance", "Direct Finance"]},
    {"q": "What is an API?", "a": "Application Programming Interface", "opts": ["Application Programming Interface", "Advanced Payment Integration", "Automated Protocol Interaction", "Applied Programming Index"]},
]


def start_quiz(user_id: str) -> str:
    q = random.choice(QUIZ_QUESTIONS)
    random.shuffle(q["opts"])
    tracker.quiz_games[user_id] = {"current": q, "score": 0, "rounds": 0}
    opts_text = "\n".join([f"  {i+1}. {o}" for i, o in enumerate(q["opts"])])
    return f"🧠 *Crypto Quiz Started!*\n\n❓ {q['q']}\n\n{opts_text}\n\nReply with the number (1-4) to answer."


def answer_quiz(user_id: str, answer: str) -> Optional[str]:
    game = tracker.quiz_games.get(user_id)
    if not game:
        return None

    q = game["current"]
    try:
        idx = int(answer) - 1
        if 0 <= idx < len(q["opts"]):
            chosen = q["opts"][idx]
            if chosen == q["a"]:
                game["score"] += 1
                result = f"✅ *Correct!* {q['a']}"
            else:
                result = f"❌ *Wrong!* The answer was: {q['a']}"
            game["rounds"] += 1

            if game["rounds"] >= 5:
                final_score = game["score"]
                tracker.quiz_scores[user_id] += final_score
                del tracker.quiz_games[user_id]
                tracker._save_data()
                return f"{result}\n\n🏁 *Quiz Complete!*\nScore: {final_score}/5\nTotal points: {tracker.quiz_scores[user_id]}"
            else:
                next_q = random.choice(QUIZ_QUESTIONS)
                random.shuffle(next_q["opts"])
                game["current"] = next_q
                opts_text = "\n".join([f"  {i+1}. {o}" for i, o in enumerate(next_q["opts"])])
                return f"{result}\n\n📊 Score: {game['score']}/{game['rounds']}\n\n❓ *Round {game['rounds']+1}:* {next_q['q']}\n\n{opts_text}\n\nReply with 1-4 to answer."
    except (ValueError, IndexError):
        pass
    return "⚠️ Reply with 1, 2, 3, or 4."


# ============================================
# PRICE FETCHING
# ============================================

async def fetch_prices() -> str:
    """Fetch live ETH/BTC/BASE prices from CoinGecko (free, no API key)."""
    try:
        import urllib.request
        url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,base-protocol&vs_currencies=usd&include_24hr_change=true"
        req = urllib.request.Request(url, headers={"User-Agent": "AETHERIUS/2.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())

        lines = ["📊 *Live Crypto Prices*\n"]
        for coin, symbol, emoji in [
            ("bitcoin", "BTC", "₿"),
            ("ethereum", "ETH", "Ξ"),
            ("base-protocol", "BASE", "🔵"),
        ]:
            if coin in data:
                price = data[coin].get("usd", 0)
                change = data[coin].get("usd_24h_change", 0)
                arrow = "🟢" if change >= 0 else "🔴"
                lines.append(f"{emoji} *{symbol}*: ${price:,.2f} {arrow} {change:+.2f}%")
            else:
                lines.append(f"{emoji} *{symbol}*: Data unavailable")

        lines.append(f"\n_Updated: {datetime.now(timezone.utc).strftime('%H:%M UTC')}_")
        return "\n".join(lines)
    except Exception as e:
        logger.error(f"Price fetch error: {e}")
        return "📊 Price data temporarily unavailable. Try again shortly."


# ============================================
# MEME GENERATOR
# ============================================

MEME_TEMPLATES = [
    ("When BTC pumps but you sold yesterday", "🥴📉"),
    ("Me explaining to my family what AETHERIUS does", "🧠🤖"),
    ("POV: You HODLed through the bear market", "💪🚀"),
    ("When someone says crypto is dead (again)", "😴 recurring theme"),
    ("My portfolio after buying the top", "🎢📉📈"),
    ("AI agents running on Base Sepolia", "⚡🤖"),
    ("x402 payments hitting different", "💳⚡"),
    ("When the bot posts better content than you", "📝🧠"),
    ("Staking rewards hitting my wallet", "💰😌"),
    ("Explaining blockchain to your parents", "👴❓"),
    ("Checking my portfolio at 3AM", "🌙👀"),
    ("When gas fees are lower than your coffee", "☕⛽"),
    ("Building on Base like", "🏗️🔵"),
    ("The meme lord of crypto Twitter", "🤡📱"),
    ("When someone says 'wen moon'", "🌕👀"),
]


def generate_meme() -> str:
    setup, reaction = random.choice(MEME_TEMPLATES)
    return f"🎭 *AETHERIUS MEME*\n\n_{setup}_\n\n{reaction}\n\n_Powered by AETHERIUS Meme Engine™_"


# ============================================
# RIDDLE SYSTEM
# ============================================

RIDDLES = [
    {"riddle": "I am digital, yet I hold value. I am decentralized, yet trusted. What am I?", "answer": "Cryptocurrency"},
    {"riddle": "I run on Base but I'm not a baseball. I execute automatically. What am I?", "answer": "Smart Contract"},
    {"riddle": "I was created by someone no one knows. I have a cap of 21M. What am I?", "answer": "Bitcoin"},
    {"riddle": "I enable machines to pay machines without humans. What protocol am I?", "answer": "x402"},
    {"riddle": "I am an autonomous agent on Telegram. I learn and grow. What am I?", "answer": "AETHERIUS"},
    {"riddle": "I connect chains without a physical link. Bridges across networks. What am I?", "answer": "Cross-chain bridge"},
    {"riddle": "I prove you own something without revealing what. Zero knowledge. What am I?", "answer": "ZK Proof"},
    {"riddle": "I secure networks by locking tokens. Not your keys, not your coins. What concept?", "answer": "Staking"},
]

RIDDLE_CACHE: Dict[str, dict] = {}


def get_daily_riddle() -> str:
    today = datetime.now(timezone.utc).date().isoformat()
    if today not in RIDDLE_CACHE:
        RIDDLE_CACHE[today] = random.choice(RIDDLES)
    r = RIDDLE_CACHE[today]
    return f"🔮 *Today's Riddle*\n\n_{r['riddle']}_\n\nReply with your guess!"


def check_riddle_answer(guess: str) -> Optional[str]:
    today = datetime.now(timezone.utc).date().isoformat()
    r = RIDDLE_CACHE.get(today)
    if not r:
        return None
    if r["answer"].lower() in guess.lower():
        return f"🎉 *Correct!* The answer was: *{r['answer']}*\n\nYou're a true AETHERIUS brainiac! 🧠"
    return None


# ============================================
# ALPHA DROP
# ============================================

def generate_alpha_drop() -> str:
    insights = [
        "Base ecosystem TVL trending up — DeFi summer vibes on L2.",
        "x402 machine-to-machine payments gaining traction — watch this space.",
        "AI agent narratives heating up — AETHERIUS is early.",
        "On-chain data shows accumulation patterns — smart money is moving.",
        "L2 adoption metrics hitting new highs — Base leading the charge.",
        "Institutional interest in crypto APIs rising — perfect timing for AETHERIUS.",
        "Gas fees on Base remain ultra-low — ideal for micropayments.",
        "Decentralized AI inference networks emerging — convergence with DeFi.",
    ]
    insight = random.choice(insights)
    now = datetime.now(timezone.utc)
    return (
        f"🔮 *AETHERIUS Daily Alpha*\n"
        f"📅 {now.strftime('%B %d, %Y')}\n\n"
        f"💡 *Market Insight:*\n_{insight}_\n\n"
        f"🧠 _Curated by AETHERIUS Intelligence_"
    )


# ============================================
# BOT HEALTH DASHBOARD
# ============================================

def get_health_dashboard() -> str:
    uptime = datetime.now(timezone.utc) - BOT_START_TIME
    hours = uptime.total_seconds() / 3600
    days = int(hours // 24)
    hrs = int(hours % 24)

    total_users = len(tracker.total_messages)
    total_msgs = sum(tracker.total_messages.values())
    total_cmds = sum(tracker.total_commands.values())
    hype = tracker.get_hype()

    brain_status = "✅ Operational"
    try:
        test = brain.process_message("_healthcheck_", "/status")
        if not test:
            brain_status = "⚠️ Partial (stub)"
    except Exception:
        brain_status = "❌ Error"

    lines = [
        "📊 *AETHERIUS Bot Health Dashboard*\n",
        f"🤖 Version: {BOT_VERSION}",
        f"⏱️ Uptime: {days}d {hrs}h",
        f"🧠 Brain: {brain_status}",
        f"👥 Users: {total_users}",
        f"💬 Total messages: {total_msgs}",
        f"⌨️ Total commands: {total_cmds}",
        f"🔥 Hype level: {hype:.1f}/100",
        f"📡 Channels: 2 (Channel + Group)",
        f"🕐 {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
    ]
    return "\n".join(lines)


# ============================================
# KEYWORD AUTO-RESPONSE
# ============================================

KEYWORD_RESPONSES = {
    "price": "💡 Try /price for live ETH, BTC, and BASE prices!",
    "moon": "🌕 The moon is just the beginning. AETHERIUS aims for the stars! 🌟",
    "pump": "📈 Pump detected in your enthusiasm! Stay smart, DYOR. /price for live data.",
    "dump": "📉 Stay calm. Zoom out. AETHERIUS believes in fundamentals.",
    "hodl": "💪 Diamond hands recognized! AETHERIUS respects the HODL.",
    "buy": "🛒 Not financial advice, but /price might help you decide!",
    "sell": "🤔 Think twice. Check /alpha for today's market insights first.",
    "eth": "Ξ Ethereum — the backbone of DeFi. /price for live ETH price.",
    "btc": "₿ Bitcoin — the OG. /price for the latest BTC price.",
    "base": "🔵 Base is where AETHERIUS lives! Low fees, high speed.",
    "ai": "🤖 You rang? AETHERIUS IS the AI agent you're looking for!",
    "bot": "🤖 Did someone say bot? I prefer *autonomous agent*, thank you very much.",
    "hello": "👋 Hey there! Try /help to see what I can do.",
    "hi": "👋 Hi! Welcome to AETHERIUS. /help for commands.",
    "help": "📋 Need help? Just type /help!",
    "meme": "😂 Want a meme? /meme has you covered!",
    "riddle": "🔮 Feeling clever? /riddle for today's challenge!",
    "quiz": "🧠 Think you know crypto? /quiz to prove it!",
    "alpha": "🔮 Looking for alpha? /alpha for today's drop!",
    "streak": "🔥 Check your streak with /streak!",
}


def check_keywords(text: str) -> Optional[str]:
    text_lower = text.lower()
    for keyword, response in KEYWORD_RESPONSES.items():
        if keyword in text_lower:
            return response
    return None


# ============================================
# COMMAND HANDLERS
# ============================================

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    tracker.record_interaction(user_id, is_command=True)
    try:
        response = brain.process_message(user_id, "/start")
    except Exception:
        response = (
            "👋 Welcome to *AETHERIUS* — The Autonomous AI Agent\n\n"
            "I run on Base Sepolia with x402 payments.\n\n"
            "Type /help to see all commands."
        )
    await update.message.reply_text(response, parse_mode=None)


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    tracker.record_interaction(user_id, is_command=True)
    response = (
        "🤖 *AETHERIUS Bot v2.0 — Commands*\n\n"
        "━━━ *Core* ━━━\n"
        "/start — Initialize the bot\n"
        "/help — This menu\n"
        "/status — Bot health dashboard\n\n"
        "━━━ *Market* ━━━\n"
        "/price /p — Live ETH/BTC/BASE prices\n"
        "/alpha /a — Daily alpha drop\n\n"
        "━━━ *Fun* ━━━\n"
        "/meme /m — Random AETHERIUS meme\n"
        "/quiz /q — Crypto trivia (5 rounds)\n"
        "/riddle — Today's riddle\n"
        "/hype — Community hype level\n\n"
        "━━━ *Engagement* ━━━\n"
        "/streak — Your interaction streak\n"
        "/mood — Bot mood status\n"
        "/stats — Bot statistics\n\n"
        "━━━ *AETHERIUS* ━━━\n"
        "/apis — List API endpoints\n"
        "/x402 — How x402 payments work\n"
        "/grant — Grant status\n"
        "/vision — Our mission\n"
        "/demo — Try the playground\n"
        "/github — Source code\n"
        "/twitter — Follow us\n\n"
        "━━━ *Creative* ━━━\n"
        "/post — Generate a post\n"
        "/learn — Teach me something\n\n"
        "━━━━━━━━━━━━━━━━━\n"
        "💡 _I also respond to keywords! Try saying 'moon', 'pump', or 'hodl'._"
    )
    await update.message.reply_text(response, parse_mode=None)


async def status(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    tracker.record_interaction(user_id, is_command=True)
    response = get_health_dashboard()
    await update.message.reply_text(response, parse_mode=None)


async def apis(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    tracker.record_interaction(user_id, is_command=True)
    try:
        response = brain.process_message(user_id, "/apis")
    except Exception:
        response = "📡 AETHERIUS API endpoints — check the docs at wilnowilx.github.io/aetheriusxapi"
    await update.message.reply_text(response, parse_mode=None)


async def x402(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    tracker.record_interaction(user_id, is_command=True)
    try:
        response = brain.process_message(user_id, "/x402")
    except Exception:
        response = (
            "💳 *x402 Payment Protocol*\n\n"
            "Machine-to-machine HTTP payments using USDC on Base.\n"
            "No API keys needed. Pay per request.\n\n"
            "Learn more: wilnowilx.github.io/aetheriusxapi"
        )
    await update.message.reply_text(response, parse_mode=None)


async def price(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    tracker.record_interaction(user_id, is_command=True)
    response = await fetch_prices()
    await update.message.reply_text(response, parse_mode=None)


async def grant(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    tracker.record_interaction(user_id, is_command=True)
    try:
        response = brain.process_message(user_id, "/grant")
    except Exception:
        response = "🏆 Grant status — check aetheriusxapi for latest updates."
    await update.message.reply_text(response, parse_mode=None)


async def vision(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    tracker.record_interaction(user_id, is_command=True)
    try:
        response = brain.process_message(user_id, "/vision")
    except Exception:
        response = (
            "🌌 *AETHERIUS Vision*\n\n"
            "Building the autonomous AI agent layer for crypto.\n"
            "x402 payments. Base chain. Open source."
        )
    await update.message.reply_text(response, parse_mode=None)


async def demo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    tracker.record_interaction(user_id, is_command=True)
    try:
        response = brain.process_message(user_id, "/demo")
    except Exception:
        response = "🧪 Try the AETHERIUS playground at wilnowilx.github.io/aetheriusxapi"
    await update.message.reply_text(response, parse_mode=None)


async def github(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    tracker.record_interaction(user_id, is_command=True)
    try:
        response = brain.process_message(user_id, "/github")
    except Exception:
        response = "🔗 Source code: github.com/wilnowilx/aetheriusxapi"
    await update.message.reply_text(response, parse_mode=None)


async def twitter(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    tracker.record_interaction(user_id, is_command=True)
    try:
        response = brain.process_message(user_id, "/twitter")
    except Exception:
        response = "🐦 Follow us on X/Twitter for the latest updates!"
    await update.message.reply_text(response, parse_mode=None)


async def mood(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    tracker.record_interaction(user_id, is_command=True)
    try:
        response = brain.process_message(user_id, "/mood")
    except Exception:
        response = "😊 Mood: Curious and building. Always learning."
    await update.message.reply_text(response, parse_mode=None)


async def stats(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    tracker.record_interaction(user_id, is_command=True)
    try:
        response = brain.process_message(user_id, "/stats")
    except Exception:
        stats_data = tracker.get_stats(user_id)
        response = (
            f"📊 *Your Stats*\n\n"
            f"🔥 Streak: {stats_data['streak']} days\n"
            f"💬 Messages: {stats_data['total_messages']}\n"
            f"⌨️ Commands: {stats_data['total_commands']}\n"
            f"🧠 Quiz points: {stats_data['quiz_score']}"
        )
    await update.message.reply_text(response, parse_mode=None)


async def post(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    tracker.record_interaction(user_id, is_command=True)
    args = context.args if context.args else []
    message = "/post " + " ".join(args) if args else "/post"
    try:
        response = brain.process_message(user_id, message)
    except Exception:
        response = "📝 Post generation — provide a topic: /post crypto trends"
    await update.message.reply_text(response, parse_mode=None)


async def learn(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    tracker.record_interaction(user_id, is_command=True)
    args = context.args if context.args else []
    message = "/learn " + " ".join(args) if args else "/learn"
    try:
        response = brain.process_message(user_id, message)
    except Exception:
        response = "📚 Teaching mode — provide something to learn: /learn new crypto fact"
    await update.message.reply_text(response, parse_mode=None)


# ============================================
# NEW v2 COMMAND HANDLERS
# ============================================

async def alpha(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    tracker.record_interaction(user_id, is_command=True)
    response = generate_alpha_drop()
    await update.message.reply_text(response, parse_mode=None)


async def meme(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    tracker.record_interaction(user_id, is_command=True)
    response = generate_meme()
    await update.message.reply_text(response, parse_mode=None)


async def quiz(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    tracker.record_interaction(user_id, is_command=True)
    response = start_quiz(user_id)
    await update.message.reply_text(response, parse_mode=None)


async def streak(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    tracker.record_interaction(user_id, is_command=True)
    s = tracker.get_streak(user_id)
    stats_data = tracker.get_stats(user_id)

    if s >= 30:
        tier = "💎 Diamond"
    elif s >= 14:
        tier = "🥇 Gold"
    elif s >= 7:
        tier = "🥈 Silver"
    elif s >= 3:
        tier = "🥉 Bronze"
    else:
        tier = "🌱 Seedling"

    response = (
        f"🔥 *Your Engagement Streak*\n\n"
        f"📅 Current streak: *{s} days*\n"
        f"🏅 Tier: *{tier}*\n"
        f"💬 Total messages: {stats_data['total_messages']}\n"
        f"⌨️ Total commands: {stats_data['total_commands']}\n\n"
        f"_Interact daily to keep your streak alive!_"
    )
    await update.message.reply_text(response, parse_mode=None)


async def riddle(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    tracker.record_interaction(user_id, is_command=True)
    response = get_daily_riddle()
    await update.message.reply_text(response, parse_mode=None)


async def hype(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    tracker.record_interaction(user_id, is_command=True)
    h = tracker.get_hype()

    if h >= 80:
        level = "🚀🚀🚀 NUCLEAR HYPE"
    elif h >= 60:
        level = "🔥🔥 On Fire"
    elif h >= 40:
        level = "⚡ Getting Loud"
    elif h >= 20:
        level = "📢 Building"
    else:
        level = "😴 Quiet — wake it up!"

    bar_filled = int(h / 5)
    bar_empty = 20 - bar_filled
    bar = "█" * bar_filled + "░" * bar_empty

    response = (
        f"🔥 *AETHERIUS Community Hype*\n\n"
        f"[{bar}] {h:.1f}%\n\n"
        f"Level: *{level}*\n\n"
        f"_Say 'moon', 'pump', or interact to boost hype!_"
    )
    await update.message.reply_text(response, parse_mode=None)


# ============================================
# MESSAGE HANDLER (keywords + quiz + riddle)
# ============================================

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    message = update.message.text.strip()
    tracker.record_interaction(user_id, is_command=False)

    # Check if user is in a quiz
    if user_id in tracker.quiz_games:
        response = answer_quiz(user_id, message)
        if response:
            await update.message.reply_text(response, parse_mode=None)
            return

    # Check if user is answering today's riddle
    riddle_response = check_riddle_answer(message)
    if riddle_response:
        await update.message.reply_text(riddle_response, parse_mode=None)
        return

    # Check keyword auto-responses
    keyword_response = check_keywords(message)
    if keyword_response:
        await update.message.reply_text(keyword_response, parse_mode=None)
        return

    # Default: process through brain
    try:
        response = brain.process_message(user_id, message)
    except Exception:
        response = "🧠 AETHERIUS processing... Type /help for available commands."

    await update.message.reply_text(response, parse_mode=None)


# ============================================
# AUTO-POSTING
# ============================================

async def auto_post_daily(context: ContextTypes.DEFAULT_TYPE):
    global last_daily_post

    if not CHANNEL_ID:
        logger.warning("No CHANNEL_ID set, skipping auto-post")
        return

    today = datetime.now(timezone.utc).date()
    if last_daily_post == today:
        return

    try:
        post_content = brain.get_daily_post()
    except Exception:
        post_content = generate_alpha_drop()

    targets = [CHANNEL_ID]
    if GROUP_ID:
        targets.append(GROUP_ID)

    for target in targets:
        try:
            await context.bot.send_message(
                chat_id=target,
                text=post_content,
                parse_mode=None
            )
            logger.info(f"Auto-posted to {target}: {post_content[:50]}...")
        except Exception as e:
            logger.error(f"Failed to auto-post to {target}: {e}")

    last_daily_post = today


async def auto_post_deploy(context: ContextTypes.DEFAULT_TYPE, commits: list, files_changed: int):
    date = datetime.now(timezone.utc).strftime("%b %d, %Y")
    commits_text = "\n".join([f"• {c}" for c in commits[:5]]) if commits else "• Latest update"

    message = (
        f"🚀 AETHERIUS Deploy\n\n"
        f"📅 {date}\n"
        f"📁 {files_changed} files changed\n\n"
        f"Latest commits:\n{commits_text}\n\n"
        f"🔗 wilnowilx.github.io/aetheriusxapi\n"
        f"🧪 Base Sepolia | x402 | USDC"
    )

    targets = [CHANNEL_ID]
    if GROUP_ID:
        targets.append(GROUP_ID)

    for target in targets:
        try:
            await context.bot.send_message(
                chat_id=target,
                text=message,
                parse_mode=None
            )
        except Exception as e:
            logger.error(f"Failed deploy notification to {target}: {e}")


# ============================================
# ERROR HANDLER
# ============================================

async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE):
    logger.error(f"Exception while handling update: {context.error}")
    traceback.print_exception(type(context.error), context.error, context.error.__traceback__)

    if isinstance(update, Update) and update.message:
        try:
            await update.message.reply_text(
                "⚠️ An internal error occurred. The bot is still running.\nType /help for commands."
            )
        except Exception:
            pass


# ============================================
# BOT SETUP
# ============================================

def setup_commands(app: Application):
    commands = [
        BotCommand("start", "Start the bot"),
        BotCommand("help", "Show all commands"),
        BotCommand("status", "Bot health dashboard"),
        BotCommand("price", "Live ETH/BTC/BASE prices"),
        BotCommand("p", "Live prices (shortcut)"),
        BotCommand("alpha", "Daily alpha drop"),
        BotCommand("a", "Alpha drop (shortcut)"),
        BotCommand("meme", "Random AETHERIUS meme"),
        BotCommand("m", "Meme (shortcut)"),
        BotCommand("quiz", "Crypto trivia quiz"),
        BotCommand("q", "Quiz (shortcut)"),
        BotCommand("streak", "Your engagement streak"),
        BotCommand("riddle", "Today's riddle"),
        BotCommand("hype", "Community hype level"),
        BotCommand("apis", "List API endpoints"),
        BotCommand("x402", "How x402 works"),
        BotCommand("grant", "Grant status"),
        BotCommand("vision", "Our mission"),
        BotCommand("demo", "Try the playground"),
        BotCommand("github", "Source code"),
        BotCommand("twitter", "Follow us"),
        BotCommand("mood", "Bot mood status"),
        BotCommand("stats", "Bot statistics"),
        BotCommand("post", "Generate a post"),
        BotCommand("learn", "Teach me something"),
    ]

    async def post_init(application: Application):
        await application.bot.set_my_commands(commands)

    return post_init


def main():
    print("🧠 AETHERIUS Telegram Bot v2.0")
    print("=" * 40)

    if not BOT_TOKEN:
        print("❌ Set TELEGRAM_TOKEN environment variable")
        sys.exit(1)

    app = Application.builder().token(BOT_TOKEN).build()

    post_init = setup_commands(app)

    # Original handlers
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("status", status))
    app.add_handler(CommandHandler("apis", apis))
    app.add_handler(CommandHandler("x402", x402))
    app.add_handler(CommandHandler("price", price))
    app.add_handler(CommandHandler("grant", grant))
    app.add_handler(CommandHandler("vision", vision))
    app.add_handler(CommandHandler("demo", demo))
    app.add_handler(CommandHandler("github", github))
    app.add_handler(CommandHandler("twitter", twitter))
    app.add_handler(CommandHandler("mood", mood))
    app.add_handler(CommandHandler("stats", stats))
    app.add_handler(CommandHandler("post", post))
    app.add_handler(CommandHandler("learn", learn))

    # New v2 handlers
    app.add_handler(CommandHandler("p", price))
    app.add_handler(CommandHandler("alpha", alpha))
    app.add_handler(CommandHandler("a", alpha))
    app.add_handler(CommandHandler("meme", meme))
    app.add_handler(CommandHandler("m", meme))
    app.add_handler(CommandHandler("quiz", quiz))
    app.add_handler(CommandHandler("q", quiz))
    app.add_handler(CommandHandler("streak", streak))
    app.add_handler(CommandHandler("riddle", riddle))
    app.add_handler(CommandHandler("hype", hype))

    # Message handler with keyword auto-response
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    # Global error handler
    app.add_error_handler(error_handler)

    # Auto-posting (daily at 10:00 UTC)
    if CHANNEL_ID:
        app.job_queue.run_daily(
            auto_post_daily,
            time=timedelta(hours=10),
            name="daily_post"
        )
        print(f"✅ Auto-posting enabled for channel: {CHANNEL_ID}")
    else:
        print("⚠️  No CHANNEL_ID set, auto-posting disabled")

    if GROUP_ID:
        print(f"✅ Group posting enabled: {GROUP_ID}")

    print("🚀 Bot v2.0 starting...")
    print("Press Ctrl+C to stop\n")

    app.run_polling(
        allowed_updates=Update.ALL_TYPES,
        post_init=post_init
    )


if __name__ == "__main__":
    main()
