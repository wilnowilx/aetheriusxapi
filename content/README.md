# AETHERIUS Content Automation System

## 🧠 Overview

This is the **AETHERIUS Bot Brain** — a self-aware Telegram bot with personality, memory, and autonomous posting capabilities.

**Not just an auto-poster. A mini-AI with a brain.**

## 🚀 Features

### Bot Brain (`bot_brain.py`)
- **Personality System** — mood, energy, confidence levels
- **Memory System** — remembers conversations and learns facts
- **Knowledge Base** — knows everything about AETHERIUS
- **Response Templates** — contextual, varied responses
- **Content Generator** — creates posts automatically
- **Command System** — 15+ commands for different topics

### Telegram Bot (`telegram_bot_runner.py`)
- **Responds to messages** intelligently
- **Auto-posts daily** content to channel
- **Command menu** for easy navigation
- **Deploy notifications** on git push
- **Learning system** — can be taught new facts

### Content Calendar (`calendar.json`)
- **30 pre-written tweets** for daily rotation
- **Varied topics** — vision, education, features, milestones
- **Copy-paste ready** for Twitter/Typefully

## 📦 Installation

```bash
# Install dependencies
pip install -r requirements_telegram.txt

# Set environment variables
export TELEGRAM_TOKEN="your_bot_token"
export TELEGRAM_CHANNEL_ID="your_channel_id"

# Run the bot
python content/telegram_bot_runner.py
```

## 🤖 Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message |
| `/help` | List all commands |
| `/status` | System status |
| `/apis` | List 40 endpoints |
| `/x402` | How x402 works |
| `/price` | Endpoint prices |
| `/grant` | Grant status |
| `/vision` | Our mission |
| `/demo` | Try the playground |
| `/github` | Source code |
| `/twitter` | Follow us |
| `/mood` | Bot mood status |
| `/stats` | Bot statistics |
| `/post` | Generate a post |
| `/learn` | Teach the bot something |

## 🧠 Brain Features

### Mood System
The bot has energy, confidence, and creativity levels that change based on interactions:
- More conversations → Higher energy
- Positive messages → Boost confidence
- Time decay → Natural mood fluctuation

### Memory System
- **Conversations** — remembers last 100 interactions
- **Facts** — learns and stores new information
- **User Preferences** — tracks what users like

### Content Generator
Generates posts based on:
- **Type** — milestone, education, vision
- **Context** — uses knowledge base
- **Day of week** — different themes per day

## 🔄 Auto-Posting

### Daily Posts
- Runs at 10:00 UTC (5:00 AM Mexico)
- Different theme per day of week
- Uses content generator for variety

### Deploy Notifications
- Triggers on git push to main
- Shows commit messages
- Shows file count changed

## 📱 Telegram Setup

### 1. Create Bot
```
1. Open Telegram
2. Go to @BotFather
3. Send /newbot
4. Name: AETHERIUS Bot
5. Username: aetheriusxAPI_bot
6. Save the token
```

### 2. Create Channel
```
1. Telegram → New Channel
2. Name: AETHERIUS API Updates
3. Username: @aetheriusxAPI_updates
4. Type: Public
```

### 3. Add Bot to Channel
```
1. Open your channel
2. Tap channel name → Administrators
3. Add administrator → @aetheriusxAPI_bot
4. Grant "Send Messages" permission
5. Save
```

### 4. Get Channel ID
```
1. Send a test message to channel
2. Open: https://api.telegram.org/bot<TOKEN>/getUpdates
3. Find: "chat": {"id": -1001234567890}
4. That's your channel ID
```

### 5. Set Environment Variables
```bash
export TELEGRAM_TOKEN="8885939094:AAEq6Sz0JYWyCnV1ERc1ScXhuy6VdtEHe-g"
export TELEGRAM_CHANNEL_ID="-1001234567890"
```

## 🐦 Twitter/Typefully Integration

### Content Calendar
The `calendar.json` file contains 30 pre-written tweets:
- **Monday** — Vision posts
- **Tuesday** — Education posts
- **Wednesday** — Community posts
- **Thursday** — Feature posts
- **Friday** — Milestone posts
- **Saturday** — Fun facts
- **Sunday** — Vision posts

### Using with Typefully
1. Open Typefully
2. Copy tweets from `calendar.json`
3. Schedule for daily posting
4. Let it run automatically

## 🧪 Testing

```bash
# Test the brain
python content/bot_brain.py

# Test Telegram connection
python content/get_channel_id.py

# Test bot locally
python content/telegram_bot_runner.py
```

## 📊 Memory Management

The bot stores memory in `bot_memory.json`:
- **conversations** — last 100 interactions
- **facts_learned** — facts the bot has learned
- **user_preferences** — what users like

Memory is automatically:
- Loaded on startup
- Saved after each interaction
- Pruned to keep size manageable

## 🔧 Customization

### Add New Commands
Edit `bot_brain.py`:
```python
def _handle_custom(self, args: List[str]) -> str:
    return "Custom response!"

# Add to command_handlers
"/custom": self._handle_custom,
```

### Add New Knowledge
Edit `KNOWLEDGE_BASE` in `bot_brain.py`:
```python
KNOWLEDGE_BASE["new_topic"] = {
    "key": "value"
}
```

### Add New Response Templates
Edit `RESPONSES` in `bot_brain.py`:
```python
RESPONSES["new_category"] = [
    "Response 1",
    "Response 2"
]
```

## 🚨 Troubleshooting

### Bot not responding
- Check `TELEGRAM_TOKEN` is set
- Verify bot is added to channel
- Check bot is admin in channel

### Auto-post not working
- Verify `TELEGRAM_CHANNEL_ID` is set
- Check channel exists and is public
- Verify bot has permission to post

### Memory not saving
- Check write permissions
- Verify `bot_memory.json` path
- Check disk space

## 📈 Metrics

The bot tracks:
- **Conversations** — total interactions
- **Facts learned** — knowledge growth
- **Unique users** — reach
- **Mood history** — emotional state over time

## 🎯 Next Steps

- [ ] Add more response templates
- [ ] Implement sentiment analysis
- [ ] Add multi-language support
- [ ] Create admin dashboard
- [ ] Add analytics tracking
- [ ] Implement A/B testing for responses

---

Built with 🧠 by AETHERIUS
