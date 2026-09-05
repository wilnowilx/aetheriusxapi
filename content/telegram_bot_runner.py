#!/usr/bin/env python3
"""
AETHERIUS Telegram Bot — The Autonomous Agent
Runs the bot_brain.py on Telegram with auto-posting capabilities.

Features:
- Responds to all messages intelligently
- Auto-posts daily content
- Has personality and mood
- Learns from conversations
- Can generate posts on demand
"""

import os
import sys
import json
import logging
import asyncio
from datetime import datetime, timedelta
from typing import Optional

# Add parent directory to path
sys.path.insert(0, os.path.dirname(__file__))

from bot_brain import AetheriusBrain, ContentGenerator

try:
    from telegram import Update, BotCommand
    from telegram.ext import (
        Application,
        CommandHandler,
        MessageHandler,
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

# Track last daily post to avoid duplicates
last_daily_post = None

# ============================================
# HANDLERS
# ============================================

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command."""
    user_id = str(update.effective_user.id)
    response = brain.process_message(user_id, "/start")
    await update.message.reply_text(response, parse_mode=None)

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /help command."""
    user_id = str(update.effective_user.id)
    response = brain.process_message(user_id, "/help")
    await update.message.reply_text(response, parse_mode=None)

async def status(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /status command."""
    user_id = str(update.effective_user.id)
    response = brain.process_message(user_id, "/status")
    await update.message.reply_text(response, parse_mode=None)

async def apis(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /apis command."""
    user_id = str(update.effective_user.id)
    response = brain.process_message(user_id, "/apis")
    await update.message.reply_text(response, parse_mode=None)

async def x402(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /x402 command."""
    user_id = str(update.effective_user.id)
    response = brain.process_message(user_id, "/x402")
    await update.message.reply_text(response, parse_mode=None)

async def price(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /price command."""
    user_id = str(update.effective_user.id)
    response = brain.process_message(user_id, "/price")
    await update.message.reply_text(response, parse_mode=None)

async def grant(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /grant command."""
    user_id = str(update.effective_user.id)
    response = brain.process_message(user_id, "/grant")
    await update.message.reply_text(response, parse_mode=None)

async def vision(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /vision command."""
    user_id = str(update.effective_user.id)
    response = brain.process_message(user_id, "/vision")
    await update.message.reply_text(response, parse_mode=None)

async def demo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /demo command."""
    user_id = str(update.effective_user.id)
    response = brain.process_message(user_id, "/demo")
    await update.message.reply_text(response, parse_mode=None)

async def github(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /github command."""
    user_id = str(update.effective_user.id)
    response = brain.process_message(user_id, "/github")
    await update.message.reply_text(response, parse_mode=None)

async def twitter(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /twitter command."""
    user_id = str(update.effective_user.id)
    response = brain.process_message(user_id, "/twitter")
    await update.message.reply_text(response, parse_mode=None)

async def mood(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /mood command."""
    user_id = str(update.effective_user.id)
    response = brain.process_message(user_id, "/mood")
    await update.message.reply_text(response, parse_mode=None)

async def stats(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /stats command."""
    user_id = str(update.effective_user.id)
    response = brain.process_message(user_id, "/stats")
    await update.message.reply_text(response, parse_mode=None)

async def post(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /post command — generate a post."""
    user_id = str(update.effective_user.id)
    args = context.args if context.args else []
    message = "/post " + " ".join(args) if args else "/post"
    response = brain.process_message(user_id, message)
    await update.message.reply_text(response, parse_mode=None)

async def learn(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /learn command — teach the bot something."""
    user_id = str(update.effective_user.id)
    args = context.args if context.args else []
    message = "/learn " + " ".join(args) if args else "/learn"
    response = brain.process_message(user_id, message)
    await update.message.reply_text(response, parse_mode=None)

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle any non-command message."""
    user_id = str(update.effective_user.id)
    message = update.message.text
    
    # Process through brain
    response = brain.process_message(user_id, message)
    
    await update.message.reply_text(response, parse_mode=None)

# ============================================
# AUTO-POSTING
# ============================================

async def auto_post_daily(context: ContextTypes.DEFAULT_TYPE):
    """Auto-post daily content to channel."""
    global last_daily_post
    
    if not CHANNEL_ID:
        logger.warning("No CHANNEL_ID set, skipping auto-post")
        return
    
    # Check if we already posted today
    today = datetime.utcnow().date()
    if last_daily_post == today:
        return
    
    # Generate post
    post_content = brain.get_daily_post()
    
    try:
        await context.bot.send_message(
            chat_id=CHANNEL_ID,
            text=post_content,
            parse_mode=None
        )
        last_daily_post = today
        logger.info(f"Auto-posted to channel: {post_content[:50]}...")
    except Exception as e:
        logger.error(f"Failed to auto-post: {e}")

async def auto_post_deploy(context: ContextTypes.DEFAULT_TYPE, commits: list, files_changed: int):
    """Auto-post deploy notification to channel."""
    if not CHANNEL_ID:
        return
    
    date = datetime.utcnow().strftime("%b %d, %Y")
    commits_text = "\n".join([f"• {c}" for c in commits[:5]]) if commits else "• Latest update"
    
    message = f"""🚀 AETHERIUS Deploy

📅 {date}
📁 {files_changed} files changed

*Latest commits:*
{commits_text}

🔗 wilnowilx.github.io/aetheriusxapi
🧪 Base Sepolia | x402 | USDC"""
    
    try:
        await context.bot.send_message(
            chat_id=CHANNEL_ID,
            text=message,
            parse_mode=None
        )
        logger.info(f"Deploy notification sent")
    except Exception as e:
        logger.error(f"Failed to send deploy notification: {e}")

# ============================================
# BOT SETUP
# ============================================

def setup_commands(app: Application):
    """Setup bot commands for the menu."""
    commands = [
        BotCommand("start", "Start the bot"),
        BotCommand("help", "Show commands"),
        BotCommand("status", "System status"),
        BotCommand("apis", "List endpoints"),
        BotCommand("x402", "How x402 works"),
        BotCommand("price", "Endpoint prices"),
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
    """Main function to run the bot."""
    print("🧠 AETHERIUS Telegram Bot v1.0")
    print("=" * 40)
    
    if not BOT_TOKEN:
        print("❌ Set TELEGRAM_TOKEN environment variable")
        sys.exit(1)
    
    # Build application
    app = Application.builder().token(BOT_TOKEN).build()
    
    # Setup commands
    post_init = setup_commands(app)
    
    # Add handlers
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
    
    # Handle non-command messages
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    
    # Setup auto-posting job (daily at 10:00 UTC)
    if CHANNEL_ID:
        app.job_queue.run_daily(
            auto_post_daily,
            time=timedelta(hours=10),  # 10:00 UTC
            name="daily_post"
        )
        print(f"✅ Auto-posting enabled for channel: {CHANNEL_ID}")
    else:
        print("⚠️  No CHANNEL_ID set, auto-posting disabled")
    
    # Run bot
    print("🚀 Bot starting...")
    print("Press Ctrl+C to stop\n")
    
    app.run_polling(
        allowed_updates=Update.ALL_TYPES,
        post_init=post_init
    )

if __name__ == "__main__":
    main()
