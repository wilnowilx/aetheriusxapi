# AetheriusX JavaScript SDK

JavaScript client for the [AetheriusX API](https://github.com/wilnowilx/aetheriusxapi) — AI agents pay per request in USDC on Base via x402.

## Install

```bash
npm install aetheriusx
```

Or use directly from the repo:

```bash
git clone https://github.com/wilnowilx/aetheriusxapi.git
cd aetheriusxapi/sdks/js
npm install
```

## Quick Start

```javascript
import { AetheriusXClient } from "aetheriusx";

const client = new AetheriusXClient("http://34.156.149.38/aetherapi");

// Health check + discover endpoints
const health = await client.health();
console.log(`Endpoints: ${Object.keys(health.endpoints).length}`);

// Find cheapest paid endpoint
const cheapest = await client.discoverCheapest();
console.log(`Cheapest: ${cheapest.route} at $${cheapest.price}/call`);

// Make a paid request (local simulation)
const result = await client.paidGet(
  "/v1/email/validate",
  { email: "user@example.com" },
  "anything" // X-PAYMENT header — "anything" works in local mode
);
console.log(result.data);
```

## API

### `new AetheriusXClient(baseUrl?, opts?)`

Create a client. Default base URL: `http://127.0.0.1:4020`.

### `await client.health()`

Returns the service health document including the endpoint catalog.

### `await client.discoverCheapest()`

Returns `{ route, price }` for the cheapest paid endpoint.

### `await client.paidGet(route, params?, payment?)`

Request a route. If the server responds with 402, retries with `X-PAYMENT` header.

- `route` — API route (e.g., `"/v1/token/price"`)
- `params` — Query parameters object
- `payment` — Payment proof string. Use `"anything"` for local simulation. Live testnet requires real x402 USDC signing.

### `await client.listEndpoints()`

Returns an array of all endpoints with route, description, and price.

### `await client.telemetry()`

Returns telemetry data (total calls, paid calls, revenue, etc.).

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `AETHERIUS_API` | `http://127.0.0.1:4020` | API base URL |

## License

MIT
