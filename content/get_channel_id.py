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
            print("1. Added the bot to your channel as admin")
            print("2. Sent a test message to the channel")
            print("3. Wait 10 seconds, then run this again")
            return
        
        print(f"✅ Found {len(updates)} update(s)\n")
        
        channels_seen = set()
        
        for update in updates:
            msg = update.get("message") or update.get("channel_post")
            if msg:
                chat = msg.get("chat", {})
                chat_id = chat.get("id")
                chat_title = chat.get("title", "Unknown")
                chat_type = chat.get("type", "unknown")
                
                if chat_type == "channel" and chat_id not in channels_seen:
                    channels_seen.add(chat_id)
                    print(f"📢 Channel found!")
                    print(f"   Title: {chat_title}")
                    print(f"   Type: {chat_type}")
                    print(f"   Channel ID: {chat_id}")
                    print()
                    print(f"   👆 Copy this ID and add it as GitHub Secret:")
                    print(f"      Secret name: TELEGRAM_CHANNEL_ID")
                    print(f"      Secret value: {chat_id}")
                    print()
        
        if not channels_seen:
            print("❌ No channels found in updates")
            print("Make sure the bot is in a CHANNEL (not a group)")
            
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    get_channel_id()
