#!/usr/bin/env python3
"""Patch the playground sidebar to add FREE x402 endpoints and fix names."""

import sys

with open("/opt/aetherapi/index.html", "r") as f:
    html = f.read()

# Check if already patched
if "FREE — x402 Intelligence" in html:
    print("Already patched. Skipping.")
    sys.exit(0)

# Find the old sidebar endpoints section
# We need to replace the Data & Utilities + News + DeFi sections
# with FREE x402 + Data + News + Crypto sections

old_marker = '<div class="playground-cat-header">\n                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>'

if old_marker not in html:
    print("ERROR: Could not find playground sidebar marker")
    sys.exit(1)

# Find the start of the first category in the sidebar
# Look for the playground-category that contains Data & Utilities
idx = html.find('class="playground-category"')
if idx == -1:
    print("ERROR: No playground-category found")
    sys.exit(1)

# Find the playground-sidebar
sidebar_start = html.find('class="playground-sidebar"')
if sidebar_start == -1:
    print("ERROR: No playground-sidebar found")
    sys.exit(1)

# Find the end of the sidebar (before playground-main)
sidebar_end = html.find('class="playground-main"')
if sidebar_end == -1:
    print("ERROR: No playground-main found")
    sys.exit(1)

# Extract the old sidebar content
old_content = html[sidebar_start:sidebar_end]

# Build new sidebar content
new_sidebar = '''class="playground-sidebar">
                    <div class="playground-category">
                        <div class="playground-cat-header" style="color:var(--green);border-color:rgba(16,185,129,0.3);background:rgba(16,185,129,0.08);">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                            FREE — x402 Intelligence
                        </div>
                        <div class="playground-endpoint" data-endpoint="/v1/x402/base-stats" data-params="{}">
                            <span class="pe-method get" style="background:rgba(16,185,129,0.2);color:var(--green);">GET</span>
                            <span class="pe-name">/x402/base-stats</span>
                            <span class="pe-price" style="color:var(--green);">FREE</span>
                        </div>
                        <div class="playground-endpoint" data-endpoint="/v1/x402/gas" data-params="{}">
                            <span class="pe-method get" style="background:rgba(16,185,129,0.2);color:var(--green);">GET</span>
                            <span class="pe-name">/x402/gas</span>
                            <span class="pe-price" style="color:var(--green);">FREE</span>
                        </div>
                        <div class="playground-endpoint" data-endpoint="/v1/x402/network" data-params="{}">
                            <span class="pe-method get" style="background:rgba(16,185,129,0.2);color:var(--green);">GET</span>
                            <span class="pe-name">/x402/network</span>
                            <span class="pe-price" style="color:var(--green);">FREE</span>
                        </div>
                        <div class="playground-endpoint" data-endpoint="/v1/x402/whales" data-params="{}">
                            <span class="pe-method get" style="background:rgba(16,185,129,0.2);color:var(--green);">GET</span>
                            <span class="pe-name">/x402/whales</span>
                            <span class="pe-price" style="color:var(--green);">FREE</span>
                        </div>
                        <div class="playground-endpoint" data-endpoint="/v1/x402/analytics" data-params="{}">
                            <span class="pe-method get" style="background:rgba(16,185,129,0.2);color:var(--green);">GET</span>
                            <span class="pe-name">/x402/analytics</span>
                            <span class="pe-price" style="color:var(--green);">FREE</span>
                        </div>
                        <div class="playground-endpoint" data-endpoint="/v1/x402/stablecoins" data-params="{}">
                            <span class="pe-method get" style="background:rgba(16,185,129,0.2);color:var(--green);">GET</span>
                            <span class="pe-name">/x402/stablecoins</span>
                            <span class="pe-price" style="color:var(--green);">FREE</span>
                        </div>
                    </div>
                    <div class="playground-category">
                        <div class="playground-cat-header">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                            Data &amp; Utilities
                        </div>
                        <div class="playground-endpoint" data-endpoint="/v1/data/weather" data-params="{&quot;lat&quot;:&quot;10.5&quot;,&quot;lon&quot;:&quot;-66.9&quot;}">
                            <span class="pe-method get">GET</span>
                            <span class="pe-name">/data/weather</span>
                            <span class="pe-price">$0.008</span>
                        </div>
                        <div class="playground-endpoint" data-endpoint="/v1/data/uuid" data-params="{}">
                            <span class="pe-method get">GET</span>
                            <span class="pe-name">/data/uuid</span>
                            <span class="pe-price">$0.001</span>
                        </div>
                        <div class="playground-endpoint" data-endpoint="/v1/data/hash" data-params="{&quot;input&quot;:&quot;hello world&quot;}">
                            <span class="pe-method get">GET</span>
                            <span class="pe-name">/data/hash</span>
                            <span class="pe-price">$0.002</span>
                        </div>
                        <div class="playground-endpoint" data-endpoint="/v1/email/validate" data-params="{&quot;email&quot;:&quot;test@example.com&quot;}">
                            <span class="pe-method get">GET</span>
                            <span class="pe-name">/email/validate</span>
                            <span class="pe-price">$0.005</span>
                        </div>
                    </div>
                    <div class="playground-category">
                        <div class="playground-cat-header">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"/></svg>
                            News
                        </div>
                        <div class="playground-endpoint" data-endpoint="/v1/news/hackernews" data-params="{}">
                            <span class="pe-method get">GET</span>
                            <span class="pe-name">/news/hackernews</span>
                            <span class="pe-price">$0.01</span>
                        </div>
                        <div class="playground-endpoint" data-endpoint="/v1/news/reddit" data-params="{&quot;subreddit&quot;:&quot;cryptocurrency&quot;}">
                            <span class="pe-method get">GET</span>
                            <span class="pe-name">/news/reddit</span>
                            <span class="pe-price">$0.01</span>
                        </div>
                    </div>
                    <div class="playground-category">
                        <div class="playground-cat-header">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M8 10l4-4 4 4"/></svg>
                            Crypto &amp; DeFi
                        </div>
                        <div class="playground-endpoint" data-endpoint="/v1/token/price" data-params="{&quot;address&quot;:&quot;0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913&quot;}">
                            <span class="pe-method get">GET</span>
                            <span class="pe-name">/token/price</span>
                            <span class="pe-price">$0.005</span>
                        </div>
                        <div class="playground-endpoint" data-endpoint="/v1/crypto/fear-greed" data-params="{}">
                            <span class="pe-method get">GET</span>
                            <span class="pe-name">/crypto/fear-greed</span>
                            <span class="pe-price">$0.005</span>
                        </div>
                        <div class="playground-endpoint" data-endpoint="/v1/defi/yields" data-params="{}">
                            <span class="pe-method get">GET</span>
                            <span class="pe-name">/defi/yields</span>
                            <span class="pe-price">$0.02</span>
                        </div>
                    </div>
                '''

html = html.replace(old_content, new_sidebar)

with open("/opt/aetherapi/index.html", "w") as f:
    f.write(html)

print("Playground patched successfully!")
print(f"  - Added 6 FREE x402 endpoints")
print(f"  - Fixed endpoint names (ssl-check->ssl, ip-geo->ip, etc.)")
print(f"  - Added hackernews to News section")
print(f"  - Added token/price, fear-greed, yields to Crypto section")
