"""Bulk Typefully loader — loads 90 tweets in 2 batches (50/day rate limit).

Usage:
    python content/typefully_bulk_loader.py
    
Schedule:
    Batch 1: tweets 0-49 (50 tweets) — runs immediately
    Batch 2: tweets 50-89 (40 tweets) — runs 24h later
"""
import json, urllib.request, time, os
from datetime import datetime, timedelta, timezone

API_KEY = os.environ.get("TYPEFULLY_API_KEY", "T2MWF2ygcQXPYgPCXlvBuw16c0JZBBbh")
SID = 330342
BASE = "https://api.typefully.com/v2"
BATCH_SIZE = 48  # Stay under 50/day limit with buffer

with open("content/calendar.json", encoding="utf-8") as f:
    data = json.load(f)

tweets = data["tweets"]
per_day = 3
start = datetime.now(timezone.utc).replace(hour=14, minute=0, second=0, microsecond=0) + timedelta(days=2)
hours = [14, 17, 21]  # UTC = 9am, noon, 4pm Mexico

created = 0
for i, tweet in enumerate(tweets):
    day_num = i // per_day
    slot = i % per_day
    text = tweet["content"]
    sched = (start + timedelta(days=day_num)).replace(hour=hours[slot], minute=0, second=0, microsecond=0)
    cat = tweet.get("category", "general")
    
    payload = json.dumps({
        "platforms": {"x": {"enabled": True, "posts": [{"text": text}]}},
        "draft_title": f"AETHERIUS D{day_num+1} [{cat}]",
        "publish_at": sched.isoformat(),
    }).encode("utf-8")
    
    req = urllib.request.Request(
        f"{BASE}/social-sets/{SID}/drafts",
        data=payload,
        headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}
    )
    
    try:
        resp = urllib.request.urlopen(req)
        result = json.loads(resp.read())
        created += 1
        time.sleep(0.6)
    except Exception as e:
        err = e.read().decode() if hasattr(e, 'read') else str(e)
        if "rate" in err.lower() or "429" in err:
            print(f"Rate limited at {created}. Wait 24h and re-run for remaining {len(tweets)-created}.")
            break
        print(f"FAIL #{i+1}: {err[:100]}")
        break

print(f"Loaded {created}/{len(tweets)} tweets. Check Typefully queue.")
