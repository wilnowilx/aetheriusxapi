# tools/mcp — AETHERIUS MCP bridge

> Stdio MCP server exposing the **FREE** x402 Intelligence layer as agent tools.
> Dogfooding the MCP × x402 intersection: agents discover data tools here,
> pay for premium routes via the HTTP API when they need more.

**Status:** Active · **Secrets:** none (free routes only — paid routes are
deliberately NOT exposed).

## Tools (9)

`base_stats` · `gas` · `market_pulse` · `sentiment` · `network` · `whales`
· `stablecoins` · `analytics` · `telemetry` — all live, all fingerprinted
(`X-AETHERIUS-Fingerprint` echoed as `_fingerprint`).

## Run

```bash
python3 tools/mcp/aetherius_bridge.py   # stdio, mcp>=2.x
```

Smoke test (lists tools + calls `gas`):

```bash
python3 - <<'EOF'
import asyncio
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
async def main():
    p = StdioServerParameters(command="python3", args=["tools/mcp/aetherius_bridge.py"])
    async with stdio_client(p) as (r, w):
        async with ClientSession(r, w) as s:
            await s.initialize()
            print([t.name for t in (await s.list_tools()).tools])
asyncio.run(main())
EOF
```

## Opencode desktop wiring

`~/.config/opencode/opencode.json` → `mcp.aetherius`:

```json
"aetherius": {
  "type": "local",
  "command": ["python3", "<REPO>/tools/mcp/aetherius_bridge.py"],
  "enabled": true
}
```

## Why only free routes

Paid routes need wallet signing per call — wrong for an unattended bridge.
The bridge is the funnel: free intel here, premium data via `X-PAYMENT` on
the HTTP API. A paying variant (with spend caps in code, never prompts alone)
is a later, separate server.
