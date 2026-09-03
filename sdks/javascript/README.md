# AetheriusX JavaScript SDK

Small asynchronous Node.js client for discovering and calling AetheriusX APIs.

## Install

The SDK has no runtime dependencies and requires Node.js 18 or newer because it uses the built-in `fetch` API.

From the repository root, use it as a local package:

```bash
npm install ./sdks/javascript
```

Or import the module directly:

```js
import { AetheriusXClient } from './sdks/javascript/aetheriusx.mjs';
```

## Usage

```js
import { AetheriusXClient } from 'aetheriusx';

const client = new AetheriusXClient('http://127.0.0.1:4020');
const health = await client.health();
const [route, price] = await client.discoverCheapest();

const response = await client.paidGet(
  '/v1/email/validate',
  { email: 'user@example.com' },
  'anything',
);

console.log(response.status, await response.json());
```

`health()` returns the service document and endpoint catalog. `discoverCheapest()` parses prices such as `$0.005/call` and returns `[route, price]`. `paidGet()` deliberately sends the first request without payment, then retries once after `402 Payment Required` with the supplied proof.

A local `X-PAYMENT:anything` header is simulated only. Live testnet requires real x402 USDC signing; see `docs/API.md`. This client never handles private keys.

## Observed local output

With `uvicorn main:app --port 4020` running on 2026-09-03:

```text
discovered: 30 endpoints
selected: /v1/data/define at $0.005/call
challenge: HTTP 402
paid retry: HTTP 200
volume this run: $0.005 USDC
{ email: 'user@example.com', valid_syntax: true, has_mx: null, is_disposable: false, risk_score: 40, verdict: 'risky' }
```

The demo that produced the status flow was:

```js
import { AetheriusXClient } from './sdks/javascript/aetheriusx.mjs';

const client = new AetheriusXClient();
const health = await client.health();
const [route, price] = await client.discoverCheapest();
console.log(`discovered: ${Object.keys(health.endpoints).length} endpoints`);
console.log(`selected: ${route} at $${price}/call`);

const paidRoute = '/v1/email/validate';
const params = { email: 'user@example.com' };
const challenge = await fetch(`${client.baseUrl}${paidRoute}?email=user%40example.com`);
console.log(`challenge: HTTP ${challenge.status}`);
const paid = await client.paidGet(paidRoute, params, 'anything');
console.log(`paid retry: HTTP ${paid.status}`);
console.log(`volume this run: $${price.toFixed(3)} USDC`);
console.log(await paid.json());
```
