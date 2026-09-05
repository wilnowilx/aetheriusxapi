#!/usr/bin/env python3
"""
Get your Telegram Channel ID from Bot API.
Run this after sending a test message to your channel.
"""

import requests
import json

BOT_TOKEN = "8885939094:AAEq6Sz0JYWyCnV1ERc1ScXhuy6VdtEHe-g"

def get_channel_id():
    """Fetch channel ID from getUpdates."""
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/getUpdates"
    
    try:
        resp = requests.get(url, timeout=10)
        data = resp.json()
        
        if not data.get("ok"):
            print("❌ Error fetching updates")
            print(f"Response: {json.dumps(data, indent=2)}")
            return
        
        updates = data.get("result", [])
        
        if not updates:
            print("❌ No updates found!")
            print("\nMake sure you:")
            print("1. Created a channel (not a group)")
            print("2. Added the bot as admin")
            print("3. Sent a test message to the channel")
            print("4. Wait 10 seconds, then run this again")
            return
        
        print(f"✅ Found {len(updates)} update(s)\n")
        
        channels_seen = set()
        groups_seen = set()
        
        for update in updates:
            # Check for channel posts
            msg = update.get("message") or update.get("channel_post")
            if msg:
                chat = msg.get("chat", {})
                chat_id = chat.get("id")
                chat_title = chat.get("title", "Unknown")
                chat_type = chat.get("type", "unknown")
                chat_username = chat.get("username", "")
                
                if chat_type == "channel" and chat_id not in channels_seen:
                    channels_seen.add(chat_id)
                    print(f"📢 CHANNEL FOUND!")
                    print(f"   Title: {chat_title}")
                    print(f"   Type: {chat_type}")
                    print(f"   Username: @{chat_username}" if chat_username else "   Username: None")
                    print(f"   Channel ID: {chat_id}")
                    print()
                    print(f"   👆 Copy this ID and add it as GitHub Secret:")
                    print(f"      Secret name: TELEGRAM_CHANNEL_ID")
                    print(f"      Secret value: {chat_id}")
                    print()
                
                elif chat_type in ["group", "supergroup"] and chat_id not in groups_seen:
                    groups_seen.add(chat_id)
                    print(f"👥 GROUP/SUPERGROUP FOUND:")
                    print(f"   Title: {chat_title}")
                    print(f"   Type: {chat_type}")
                    print(f"   Username: @{chat_username}" if chat_username else "   Username: None")
                    print(f"   Chat ID: {chat_id}")
                    print()
        
        if not channels_seen and not groups_seen:
            print("❌ No channels or groups found in updates")
            print("\nTroubleshooting:")
            print("1. Make sure you created a CHANNEL (not just a group)")
            print("2. Make sure the bot is ADMIN in the channel")
            print("3. Send a test message DIRECTLY to the channel")
            print("4. Wait 10 seconds and run this again")
        
        if channels_seen:
            print("=" * 50)
            print("🎯 NEXT STEPS:")
            print("1. Copy the Channel ID above")
            print("2. Go to your GitHub repo")
            print("3. Settings → Secrets and variables → Actions")
            print("4. Add new secret: TELEGRAM_CHANNEL_ID")
            print("5. Paste the Channel ID as value")
            print("=" * 50)
            
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    print("🔍 AETHERIUS Channel ID Finder")
    print("=" * 40)
    print()
    get_channel_id()
