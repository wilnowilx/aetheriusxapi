"""Typefully tweet loader - loads calendar.json into Typefully for scheduling.

Usage:
    python content/typefully_loader.py

Requires:
    - Typefully API key in env or hardcoded
    - content/calendar.json with tweets
"""
import json, urllib.request, time, os
from datetime import datetime, timedelta, timezone

API_KEY = os.environ.get("TYPEFULLY_API_KEY", "T2MWF2ygcQXPYgPCXlvBuw16c0JZBBbh")
SOCIAL_SET_ID = 330342
BASE = "https://api.typefully.com/v2"


def load_tweets(calendar_path="content/calendar.json", days_ahead=1):
    """Load all tweets from calendar.json into Typefully."""
    with open(calendar_path, encoding="utf-8") as f:
        data = json.load(f)

    tweets = data["tweets"]
    start = datetime.now(timezone.utc).replace(
        hour=14, minute=0, second=0, microsecond=0
    ) + timedelta(days=days_ahead)

    created = 0
    for i, tweet in enumerate(tweets):
        text = tweet["content"]
        sched_date = (start + timedelta(days=i // 2, hours=(i % 2) * 6)).isoformat()

        payload = json.dumps({
            "platforms": {"x": {"enabled": True, "posts": [{"text": text}]}},
            "draft_title": f"AETHERIUS Day {i+1}",
            "publish_at": sched_date,
        }).encode("utf-8")

        req = urllib.request.Request(
            f"{BASE}/social-sets/{SOCIAL_SET_ID}/drafts",
            data=payload,
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json"
            }
        )

        try:
            resp = urllib.request.urlopen(req)
            result = json.loads(resp.read())
            created += 1
            print(f"  [{created:2d}/{len(tweets)}] ID:{result.get('id')} | {sched_date[:10]}")
            time.sleep(0.5)
        except Exception as e:
            err = e.read().decode() if hasattr(e, 'read') else str(e)
            if "rate" in err.lower() or "429" in err:
                print(f"  Rate limited, waiting 60s...")
                time.sleep(60)
                continue
            print(f"  FAIL #{i+1}: {err[:150]}")
            break

    print(f"\n{created}/{len(tweets)} tweets scheduled!")
    return created


if __name__ == "__main__":
    load_tweets()
