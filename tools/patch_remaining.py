#!/usr/bin/env python3
"""Bulk soften remaining components: thinner SVGs, softer borders, better contrast."""
import pathlib
p = pathlib.Path(r"C:\Users\wil\Documents\pagina web\aetheriusxapi\frontend\src\App.jsx")
t = p.read_text(encoding="utf-8")
orig = t

# 1. Thinner strokes globally (2 -> 1.5) for smoother look
t = t.replace('strokeWidth="2"', 'strokeWidth="1.5"')
t = t.replace("strokeWidth={2}", "strokeWidth={1.5}")

# 2. Soften hard purple borders
t = t.replace("1px solid rgba(168,85,247,0.3)", "1px solid rgba(168,85,247,0.16)")
t = t.replace("1px solid rgba(168,85,247,0.35)", "1px solid rgba(168,85,247,0.18)")
t = t.replace("1px solid rgba(168,85,247,0.25)", "1px solid rgba(168,85,247,0.14)")
t = t.replace("rgba(168,85,247,0.15)", "rgba(168,85,247,0.08)")
t = t.replace("rgba(168,85,247,0.1)", "rgba(168,85,247,0.06)")
t = t.replace("rgba(168,85,247,0.12)", "rgba(168,85,247,0.07)")

# 3. Soften black input backgrounds
t = t.replace("rgba(0,0,0,0.3)", "rgba(0,0,0,0.25)")
t = t.replace("rgba(0,0,0,0.15)", "rgba(0,0,0,0.12)")

# 4. Soften white borders via var -> explicit soft value is already handled in CSS,
#    but ensure backdrop blur on cards using var(--bg-card)
t = t.replace(
    "background: 'var(--bg-card)', border: '1px solid var(--border)'",
    "background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)'"
)

# 5. Code terminal: softer + glow
t = t.replace(
    "background: '#0c0c14', border: '1px solid rgba(168,85,247,0.3)'",
    "background: 'rgba(8,8,16,0.85)', border: '1px solid rgba(168,85,247,0.16)', boxShadow: '0 0 40px rgba(168,85,247,0.08)'"
)
# in case already patched to 0.16, ensure glow present
if "rgba(8,8,16,0.85)" in t and "boxShadow: '0 0 40px" not in t:
    t = t.replace(
        "background: 'rgba(8,8,16,0.85)'",
        "background: 'rgba(8,8,16,0.85)', boxShadow: '0 0 40px rgba(168,85,247,0.08)'"
    )

# 6. Add round linejoins to SVGs that lack them (only where fill="none" stroke present and no strokeLinejoin yet)
# We do this carefully: replace 'fill="none" stroke=' with 'fill="none" strokeLinejoin="round" strokeLinecap="round" stroke='
# but skip if already has strokeLinejoin in same tag (within next 200 chars). Simple approach: split.
import re
def add_round(m):
    tag = m.group(0)
    if "strokeLinejoin" in tag:
        return tag
    return tag.replace('fill="none" stroke=', 'fill="none" strokeLinejoin="round" strokeLinecap="round" stroke=')
t = re.sub(r'<svg[^>]*fill="none" stroke=[^>]*>', add_round, t)
t = re.sub(r'<path d=', '<path strokeLinejoin="round" strokeLinecap="round" d=', t)
# fix double-added on paths that already had it
t = t.replace('strokeLinejoin="round" strokeLinecap="round" strokeLinejoin="round" strokeLinecap="round"', 'strokeLinejoin="round" strokeLinecap="round"')

# 7. Softer section-label icons already done; ensure polyline points also get round (handled by svg parent in most browsers)

# 8. Heartbeat endpoint rows: soften
t = t.replace(
    "background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid var(--border)'",
    "background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)'"
)

# 9. CTA box border soften
t = t.replace(
    "border: '1px solid rgba(168,85,247,0.2)'",
    "border: '1px solid rgba(168,85,247,0.14)'"
)

# 10. DonateX box
t = t.replace(
    "border: '1px solid rgba(168,85,247,0.15)'",
    "border: '1px solid rgba(168,85,247,0.12)'"
)

if t != orig:
    p.write_text(t, encoding="utf-8")
    print("patched OK")
    # count
    print("strokeWidth 1.5 count:", t.count('strokeWidth="1.5"'))
    print("glass blur count:", t.count("blur(16px)"))
else:
    print("no changes")
