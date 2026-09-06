"""Premium tweets v3.0 — upload to Typefully.
5 tweets/day, 7 days. Mega-corp marketing level.

Usage:
    python content/upload_premium_tweets.py
"""
import json, urllib.request, time, os
from datetime import datetime, timedelta, timezone

API_KEY = os.environ.get("TYPEFULLY_API_KEY", "T2MWF2ygcQXPYgPCXlvBuw16c0JZBBbh")
SID = 330342
BASE = "https://api.typefully.com/v2"
HOURS = [14, 17, 21, 0, 3]  # 5 slots: 9am, noon, 3pm, 6pm, 9pm Mexico (CDT = UTC-5)


def get_existing_titles():
    """Get all existing draft titles from Typefully."""
    titles = set()
    offset = 0
    while True:
        req = urllib.request.Request(
            f"{BASE}/social-sets/{SID}/drafts?limit=50&offset={offset}",
            headers={"Authorization": f"Bearer {API_KEY}"}
        )
        try:
            resp = urllib.request.urlopen(req)
            data = json.loads(resp.read())
            for d in data.get("results", []):
                if d.get("draft_title"):
                    titles.add(d["draft_title"])
            if not data.get("next"):
                break
            offset += 50
        except Exception as e:
            print(f"Error fetching existing: {e}")
            break
    return titles


def upload():
    """Upload premium tweets to Typefully."""
    with open("content/premium_tweets_v3.json", encoding="utf-8") as f:
        data = json.load(f)

    tweets = data["tweets"]
    existing = get_existing_titles()
    print(f"Found {len(existing)} existing drafts in Typefully")

    # Start from tomorrow
    start = datetime.now(timezone.utc).replace(
        hour=14, minute=0, second=0, microsecond=0
    ) + timedelta(days=1)

    created = 0
    skipped = 0
    failed = 0

    for tweet in tweets:
        title = f"AETHERIUS v3 D{tweet['day']} S{tweet['slot']} [{tweet['category']}]"

        # Skip if already loaded
        if title in existing:
            skipped += 1
            continue

        # Calculate schedule: day 1 = start, day 2 = start + 1, etc.
        # Slot maps to hour: slot 1=14, 2=17, 3=21, 4=0, 5=3
        sched = (start + timedelta(days=tweet["day"] - 1)).replace(
            hour=HOURS[tweet["slot"] - 1], minute=0, second=0, microsecond=0
        )

        payload = json.dumps({
            "platforms": {
                "x": {
                    "enabled": True,
                    "posts": [{"text": tweet["content"]}]
                }
            },
            "draft_title": title,
            "publish_at": sched.isoformat(),
        }).encode("utf-8")

        req = urllib.request.Request(
            f"{BASE}/social-sets/{SID}/drafts",
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
            print(f"  [{created:2d}] {title} | {sched.strftime('%Y-%m-%d %H:%M')} UTC")
            time.sleep(0.6)
        except Exception as e:
            err = e.read().decode() if hasattr(e, 'read') else str(e)
            if "rate" in err.lower() or "429" in err:
                print(f"\n  Rate limited at {created}. Stop here and run again tomorrow.")
                break
            print(f"  FAIL [{tweet['id']}]: {err[:200]}")
            failed += 1

    total = len(tweets)
    print(f"\n{'='*50}")
    print(f"  PREMIUM TWEETS v3.0 UPLOAD")
    print(f"{'='*50}")
    print(f"  Already existed: {skipped}")
    print(f"  Newly created:   {created}")
    print(f"  Failed:          {failed}")
    print(f"  Total in file:   {total}")
    print(f"  Uploaded total:  {skipped + created}/{total}")
    print(f"  Remaining:       {total - skipped - created}")
    print(f"{'='*50}")


if __name__ == "__main__":
    upload()
