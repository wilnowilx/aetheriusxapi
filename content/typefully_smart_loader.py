"""Smart Typefully loader — auto-detects existing drafts, skips duplicates,
loads remaining tweets in batches of 48/day.

Usage:
    python content/typefully_smart_loader.py
    
Features:
    - Checks what's already loaded (by title pattern)
    - Skips duplicates
    - Loads up to 48 per run (under 50/day limit)
    - Reports remaining count
"""
import json, urllib.request, time, os
from datetime import datetime, timedelta, timezone

API_KEY = os.environ.get("TYPEFULLY_API_KEY", "T2MWF2ygcQXPYgPCXlvBuw16c0JZBBbh")
SID = 330342
BASE = "https://api.typefully.com/v2"
BATCH_SIZE = 48  # Under 50/day limit with buffer
HOURS = [14, 17, 21]  # UTC = 9am, noon, 4pm Mexico


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
            for d in data["results"]:
                if d.get("draft_title"):
                    titles.add(d["draft_title"])
            if not data.get("next"):
                break
            offset += 50
        except Exception as e:
            print(f"Error fetching existing drafts: {e}")
            break
    return titles


def load_remaining():
    """Load tweets from calendar.json that aren't already in Typefully."""
    with open("content/calendar.json", encoding="utf-8") as f:
        data = json.load(f)

    tweets = data["tweets"]
    existing = get_existing_titles()
    print(f"Found {len(existing)} existing drafts in Typefully")

    # Calculate start date (tomorrow)
    start = datetime.now(timezone.utc).replace(
        hour=14, minute=0, second=0, microsecond=0
    ) + timedelta(days=1)

    created = 0
    skipped = 0
    per_day = 3

    for i, tweet in enumerate(tweets):
        if created >= BATCH_SIZE:
            print(f"\nBatch limit reached ({BATCH_SIZE}). Run again tomorrow for remaining.")
            break

        day_num = i // per_day
        slot = i % per_day
        text = tweet["content"]
        cat = tweet.get("category", "general")
        title = f"AETHERIUS D{day_num+1} [{cat}]"

        # Skip if already loaded
        if title in existing:
            skipped += 1
            continue

        sched = (start + timedelta(days=day_num)).replace(
            hour=HOURS[slot], minute=0, second=0, microsecond=0
        )

        payload = json.dumps({
            "platforms": {"x": {"enabled": True, "posts": [{"text": text}]}},
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
                print(f"\n  Rate limited at {created}. Remaining to load: {len(tweets) - created - skipped}")
                break
            print(f"  FAIL: {err[:150]}")
            break

    total = len(tweets)
    loaded = skipped + created
    remaining = total - loaded
    print(f"\n=== SUMMARY ===")
    print(f"  Already existed: {skipped}")
    print(f"  Newly created:   {created}")
    print(f"  Total loaded:    {loaded}/{total}")
    print(f"  Remaining:       {remaining}")
    print(f"  Days to finish:  {-(-remaining // BATCH_SIZE)} more run(s)")


if __name__ == "__main__":
    load_remaining()
