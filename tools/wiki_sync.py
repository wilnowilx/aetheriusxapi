#!/usr/bin/env python3
"""Mirror wiki/ into the repo's .wiki.git — no secrets needed, uses your login.

Usage:  python3 tools/wiki_sync.py
Requires: gh authenticated (or git credential helper) with push rights.
This is the local fallback while the wiki-publish Action waits for WIKI_TOKEN
(repo secrets need 2FA on the account — enable it before Oct 18, 2026).
"""
import shutil
import subprocess
import tempfile
from pathlib import Path

REPO = "wilnowilx/aetheriusxapi"
SRC = Path(__file__).resolve().parent.parent / "wiki"

run = lambda *a, **kw: subprocess.run(a, check=True, capture_output=True, text=True, **kw)  # noqa: E731


def main() -> None:
    tmp = Path(tempfile.mkdtemp(prefix="wiki-remote-"))
    try:
        run("git", "clone", f"https://github.com/{REPO}.wiki.git", str(tmp))
        for f in SRC.glob("*.md"):
            shutil.copy2(f, tmp / f.name)
        run("git", "-C", str(tmp), "add", "-A")
        diff = subprocess.run(["git", "-C", str(tmp), "diff", "--cached", "--quiet"])
        if diff.returncode == 0:
            print("No wiki changes to publish.")
            return
        run("git", "-C", str(tmp), "-c", "user.name=wilnowilx",
            "-c", "user.email=wilnowilx@users.noreply.github.com",
            "commit", "-m", "docs(wiki): local sync from wiki/")
        run("git", "-C", str(tmp), "push", "origin", "HEAD")
        print("Wiki published: https://github.com/%s/wiki" % REPO)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    main()
