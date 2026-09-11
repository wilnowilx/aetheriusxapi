#!/usr/bin/env python3
"""Patch the runPlayground function to handle free endpoints properly."""

import sys

with open("/opt/aetherapi/index.html", "r") as f:
    html = f.read()

# Check if already patched
if "isFreeEndpoint" in html:
    print("Already patched. Skipping.")
    sys.exit(0)

old_func = """    async function runPlayground() {
        if (!selectedEndpoint) {
            document.getElementById('pgResponse').innerHTML = '<span style="color:var(--orange);">Select an endpoint from the sidebar first</span>';
            return;
        }

        const btn = document.getElementById('pgRun');
        const responseEl = document.getElementById('pgResponse');
        const statusEl = document.getElementById('pgStatus');
        const timeEl = document.getElementById('pgTime');

        btn.disabled = true;
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><circle cx="12" cy="12" r="10"/></svg> Sending...';
        responseEl.innerHTML = '<span class="playground-loading">Processing x402 payment...</span>';

        const startTime = Date.now();

        try {
            // Try to hit the real API
            const apiBase = 'https://34-156-149-38.sslip.io/aetherapi';
            const params = JSON.parse(document.getElementById('pgParams').textContent || '{}');
            const queryString = new URLSearchParams(params).toString();
            const url = `${apiBase}${selectedEndpoint}${queryString ? '?' + queryString : ''}`;

            // First, get the 402 challenge
            const challengeResp = await fetch(url);
            const time1 = Date.now() - startTime;

            if (challengeResp.status === 402) {
                const challenge = await challengeResp.json();
                responseEl.innerHTML = `<span style="color:var(--orange);">// 402 Payment Required</span>\\n` +
                    JSON.stringify(challenge, null, 2).split('\\n').map(line =>
                        line.replace(/"([^"]+)":/g, '<span style="color:var(--purple-light);">"$1"</span>:')
                            .replace(/: "([^"]+)"/g, ': <span style="color:var(--magenta-light);">"$1"</span>')
                            .replace(/: (\\d+)/g, ': <span style="color:var(--orange);">$1</span>')
                    ).join('\\n') +
                    `\\n\\n<span style="color:var(--text-muted);">// Agent would sign x402 payment here</span>`;
                statusEl.textContent = '402 Payment Required';
                statusEl.style.background = 'rgba(245, 158, 11, 0.15)';
                statusEl.style.color = 'var(--orange)';
                timeEl.textContent = `~${time1}ms`;
            } else if (challengeResp.ok) {
                const data = await challengeResp.json();
                responseEl.innerHTML = `<span style="color:var(--green);">// 200 OK — Payment settled</span>\\n` +
                    JSON.stringify(data, null, 2).split('\\n').map(line =>
                        line.replace(/"([^"]+)":/g, '<span style="color:var(--purple-light);">"$1"</span>:')
                            .replace(/: "([^"]+)"/g, ': <span style="color:var(--magenta-light);">"$1"</span>')
                            .replace(/: (\\d+)/g, ': <span style="color:var(--orange);">$1</span>')
                    ).join('\\n');
                statusEl.textContent = '200 OK';
                statusEl.style.background = 'rgba(16, 185, 129, 0.15)';
                statusEl.style.color = 'var(--green)';
                timeEl.textContent = `~${time1}ms`;
            } else {
                throw new Error(`HTTP ${challengeResp.status}`);
            }
        } catch (err) {
            const time2 = Date.now() - startTime;
            // Show demo response when API is offline
            const demoResponses = {
                '/v1/token/price': { price: 2384.50, change_24h: 2.3, token: 'ETH', source: 'CoinGecko' },
                '/v1/maps/search': { results: [{ name: 'Café Aetherius', address: 'Mexico City', rating: 4.8 }], count: 1 },
                '/v1/data/weather': { temp_c: 22, condition: 'Partly cloudy', humidity: 65, city: 'Mexico City' },
                '/v1/email/validate': { email: 'test@example.com', valid: true, disposable: false, domain: 'example.com' }
            };
            const demo = demoResponses[selectedEndpoint] || { message: 'Demo response — API will return real data on mainnet', endpoint: selectedEndpoint };

            responseEl.innerHTML = `<span style="color:var(--cyan);">// Demo response (mainnet live)</span>\\n` +
                JSON.stringify(demo, null, 2).split('\\n').map(line =>
                    line.replace(/"([^"]+)":/g, '<span style="color:var(--purple-light);">"$1"</span>:')
                        .replace(/: "([^"]+)"/g, ': <span style="color:var(--magenta-light);">"$1"</span>')
                        .replace(/: (\\d+)/g, ': <span style="color:var(--orange);">$1</span>')
                        .replace(/: (true|false)/g, ': <span style="color:var(--cyan);">$1</span>')
                ).join('\\n') +
                `\\n\\n<span style="color:var(--text-muted);">// ⚠️ Mainnet is currently offline</span>\\n<span style="color:var(--text-muted);">// On mainnet, this returns live data + settles USDC</span>`;
            statusEl.textContent = 'Demo Mode';
            statusEl.style.background = 'rgba(6, 182, 212, 0.15)';
            statusEl.style.color = 'var(--cyan)';
            timeEl.textContent = '~0ms';
        }

        btn.disabled = false;
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Send';
    }"""

new_func = """    // Check if endpoint is free (x402 intelligence endpoints)
    function isFreeEndpoint(path) {
        return path.startsWith('/v1/x402/');
    }

    // Format JSON with syntax highlighting
    function formatJSON(data) {
        return JSON.stringify(data, null, 2).split('\\n').map(line =>
            line.replace(/"([^"]+)":/g, '<span style="color:var(--purple-light);">"$1"</span>:')
                .replace(/: "([^"]+)"/g, ': <span style="color:var(--magenta-light);">"$1"</span>')
                .replace(/: (\\d+\\.?\\d*)/g, ': <span style="color:var(--orange);">$1</span>')
                .replace(/: (true|false)/g, ': <span style="color:var(--cyan);">$1</span>')
                .replace(/: (null)/g, ': <span style="color:var(--text-muted);">$1</span>')
        ).join('\\n');
    }

    async function runPlayground() {
        if (!selectedEndpoint) {
            document.getElementById('pgResponse').innerHTML = '<span style="color:var(--orange);">Select an endpoint from the sidebar first</span>';
            return;
        }

        const btn = document.getElementById('pgRun');
        const responseEl = document.getElementById('pgResponse');
        const statusEl = document.getElementById('pgStatus');
        const timeEl = document.getElementById('pgTime');
        const free = isFreeEndpoint(selectedEndpoint);

        btn.disabled = true;
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><circle cx="12" cy="12" r="10"/></svg> Sending...';
        responseEl.innerHTML = free
            ? '<span class="playground-loading">Fetching live data from Base Mainnet...</span>'
            : '<span class="playground-loading">Processing x402 payment...</span>';

        const startTime = Date.now();

        try {
            const apiBase = 'https://34-156-149-38.sslip.io/aetherapi';
            const params = JSON.parse(document.getElementById('pgParams').textContent || '{}');
            const queryString = new URLSearchParams(params).toString();
            const url = `${apiBase}${selectedEndpoint}${queryString ? '?' + queryString : ''}`;

            const resp = await fetch(url);
            const elapsed = Date.now() - startTime;

            if (resp.ok) {
                const data = await resp.json();
                const prefix = free
                    ? '<span style="color:var(--green);">// 200 OK — Live data from Base Mainnet (FREE)</span>'
                    : '<span style="color:var(--green);">// 200 OK — Payment settled via x402</span>';
                responseEl.innerHTML = prefix + '\\n' + formatJSON(data);
                statusEl.textContent = '200 OK';
                statusEl.style.background = 'rgba(16, 185, 129, 0.15)';
                statusEl.style.color = 'var(--green)';
                timeEl.textContent = `~${elapsed}ms`;
            } else if (resp.status === 402) {
                const challenge = await resp.json();
                responseEl.innerHTML = '<span style="color:var(--orange);">// 402 Payment Required</span>\\n' +
                    formatJSON(challenge) +
                    '\\n\\n<span style="color:var(--text-muted);">// Agent signs x402 payment → USDC settles on Base</span>\\n' +
                    '<span style="color:var(--text-muted);">// Retry with header: X-PAYMENT: &lt;proof&gt;</span>';
                statusEl.textContent = '402 Payment Required';
                statusEl.style.background = 'rgba(245, 158, 11, 0.15)';
                statusEl.style.color = 'var(--orange)';
                timeEl.textContent = `~${elapsed}ms`;
            } else {
                const text = await resp.text();
                responseEl.innerHTML = `<span style="color:var(--pink);">// Error: HTTP ${resp.status}</span>\\n` + text;
                statusEl.textContent = `${resp.status} Error`;
                statusEl.style.background = 'rgba(236, 72, 153, 0.15)';
                statusEl.style.color = 'var(--pink)';
                timeEl.textContent = `~${elapsed}ms`;
            }
        } catch (err) {
            const elapsed = Date.now() - startTime;
            responseEl.innerHTML = `<span style="color:var(--pink);">// Network error: ${err.message}</span>\\n` +
                '<span style="color:var(--text-muted);">// The API might be temporarily unreachable.</span>\\n' +
                '<span style="color:var(--text-muted);">// Try: curl https://34-156-149-38.sslip.io/aetherapi' + selectedEndpoint + '</span>';
            statusEl.textContent = 'Error';
            statusEl.style.background = 'rgba(236, 72, 153, 0.15)';
            statusEl.style.color = 'var(--pink)';
            timeEl.textContent = `~${elapsed}ms`;
        }

        btn.disabled = false;
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Send';
    }"""

if old_func in html:
    html = html.replace(old_func, new_func)
    with open("/opt/aetherapi/index.html", "w") as f:
        f.write(html)
    print("runPlayground patched successfully!")
    print("  - Free endpoints (x402/*) work without payment")
    print("  - Paid endpoints show 402 challenge")
    print("  - No more demo responses - everything is real")
    print("  - Better error handling")
else:
    print("ERROR: Could not find old runPlayground function")
    # Try partial match
    if "runPlayground" in html:
        print("  runPlayground exists but format differs. Manual patch needed.")
    else:
        print("  runPlayground not found at all.")
    sys.exit(1)
