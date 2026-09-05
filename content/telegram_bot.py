#!/usr/bin/env python3
"""
AETHERIUS Telegram Auto-Poster
Sends messages to Telegram channel via Bot API.
Can be run locally or via GitHub Actions.
"""

import json
import os
import sys
import requests
from datetime import datetime

# Config
BOT_TOKEN = os.environ.get("TELEGRAM_TOKEN", "8885939094:AAEq6Sz0JYWyCnV1ERc1ScXhuy6VdtEHe-g")
CHANNEL_ID = os.environ.get("TELEGRAM_CHANNEL_ID", "")  # Set this!
CALENDAR_PATH = os.path.join(os.path.dirname(__file__), "..", "content", "calendar.json")


def load_calendar():
    """Load content calendar."""
    with open(CALENDAR_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def send_telegram(message: str, parse_mode: str = "Markdown") -> bool:
    """Send message to Telegram channel."""
    if not CHANNEL_ID:
        print("❌ TELEGRAM_CHANNEL_ID not set!")
        print("Set it in GitHub Secrets or as environment variable.")
        return False

    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": CHANNEL_ID,
        "text": message,
        "parse_mode": parse_mode,
        "disable_web_page_preview": True
    }

    try:
        resp = requests.post(url, json=payload, timeout=10)
        if resp.status_code == 200:
            print(f"✅ Sent to Telegram: {message[:50]}...")
            return True
        else:
            print(f"❌ Error {resp.status_code}: {resp.text}")
            return False
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return False


def post_deploy(commits: list = None, files_changed: int = 0):
    """Post deploy notification."""
    date = datetime.utcnow().strftime("%b %d, %Y")
    commits_text = ""
    if commits:
        commits_text = "\n".join([f"• {c}" for c in commits[:5]])
    else:
        commits_text = "• Latest update"

    message = f"""🚀 *AETHERIUS Deploy*

📅 {date}
📁 {files_changed} files changed

*Latest commits:*
{commits_text}

🔗 wilnowilx.github.io/aetheriusxapi
🧪 Base Sepolia | x402 | USDC

#aetheriusxAPI #Base #x402"""
    
    return send_telegram(message)


def post_daily():
    """Post daily content from calendar."""
    calendar = load_calendar()
    day_of_week = datetime.utcnow().isoweekday()  # 1=Monday, 7=Sunday
    
    if day_of_week <= len(calendar["tweets"]):
        tweet = calendar["tweets"][day_of_week - 1]
        content = tweet["content"]
        # Telegram has 4096 char limit
        if len(content) > 4000:
            content = content[:4000] + "..."
        return send_telegram(content)
    else:
        return send_telegram("🚀 AETHERIUS: Building the agent economy. 40 APIs live on Base.")


def post_custom(message: str):
    """Post custom message."""
    return send_telegram(message)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python telegram_bot.py deploy [commit1, commit2] [files_changed]")
        print("  python telegram_bot.py daily")
        print("  python telegram_bot.py custom 'Your message here'")
        print("  python telegram_bot.py test 'Test message'")
        sys.exit(1)

    command = sys.argv[1]

    if command == "deploy":
        commits = sys.argv[2].split(",") if len(sys.argv) > 2 else []
        files = int(sys.argv[3]) if len(sys.argv) > 3 else 0
        post_deploy(commits, files)

    elif command == "daily":
        post_daily()

    elif command == "custom":
        message = " ".join(sys.argv[2:])
        post_custom(message)

    elif command == "test":
        message = " ".join(sys.argv[2:]) if len(sys.argv) > 2 else "🧪 Test from AETHERIUS"
        send_telegram(message)

    else:
        print(f"Unknown command: {command}")
        sys.exit(1)
