# Reading Storage Slot Drift

Slot drift is the difference between the block number (slot) independently observed by several RPC layers at nearly the same time. It is not automatically an error: it is a measurement of whether the observers see the same chain state, together with the latency and failure information needed to judge the result.

## Contract

```text
GET /v1/storage/drift?chain=base&layers=3
```

- `chain`: chain identifier; use `base` for the Base RPC set.
- `layers`: number of independent RPC layers to compare. The current implementation defaults to `2` and caps the value at the available RPC count.
- Price: `$0.02` per call.
- A payment challenge uses USDC on Base Sepolia (`eip155:84532`) in the live service.

A successful response has this shape:

```json
{
  "chain": "base",
  "layers": [
    {"name": "rpc-a", "slot": 50811753, "observed_at": "...", "latency_ms": 186.4, "error": null}
  ],
  "drift": {
    "slot_delta": 0,
    "min_slot": 50811753,
    "max_slot": 50811753,
    "status": "degraded",
    "reporting_layers": 2,
    "failed_layers": ["rpc-c"]
  },
  "data_source": "public-rpc",
  "fetched_at": "..."
}
```

The shape above is based on the local response reproduced below; values with `...` are intentionally abbreviated in this structural example.

## Live challenge: HTTP 402

Without a payment proof, the live testnet returned this response on 2026-09-03:

```text
HTTP/1.1 402 Payment Required
Content-Type: application/json
payment-required: eyJ4NDAyVmVyc2lvbiI6MiwiZXJyb3IiOiJQYXltZW50IHJlcXVpcmVkIiwicmVzb3VyY2UiOnsidXJsIjoiaHR0cDovLzM0LjE1Ni4xNDkuMzgvdjEvc3RvcmFnZS9kcmlmdD9sYXllcnM9MyIsImRlc2NyaXB0aW9uIjoiQ3Jvc3MtUlBDIHNsb3QgZHJpZnQgLSB3aGljaCBibG9jayBudW1iZXIgZWFjaCBsYXllciBzZWVzIiwibWltZVR5cGUiOiJhcHBsaWNhdGlvbi9qc29uIn0sImFjY2VwdHMiOlt7InNjaGVtZSI6ImV4YWN0IiwibmV0d29yayI6ImVpcDE1NTo4NDUzMiIsImFtb3VudCI6IjIwMDAwIiwicGF5VG8iOiIweDY3N0I0ODMxMjhEMDM5OWJDRDBBNUFCMzZlRTk5MEMwMjQ2ZDdmNjEiLCJtYXhUaW1lb3V0U2Vjb25kcyI6MzAwLCJleHRyYSI6eyJuYW1lIjoiVVNEQyIsInZlcnNpb24iOiIyIn19XX0=

{}
```

The live response is a real x402 challenge. It is not a paid result. A client must decode the payment requirements, sign the exact authorization, and retry with the resulting proof.

## Complete local flow

The local server accepts any non-empty `X-PAYMENT` value in simulated mode. This is not an onchain payment.

```bash
curl -i "http://127.0.0.1:4020/v1/storage/drift?chain=base&layers=3"
curl -H "X-PAYMENT: anything" "http://127.0.0.1:4020/v1/storage/drift?chain=base&layers=3"
```

Observed local challenge:

```text
HTTP/1.1 402 Payment Required
{"error":"Payment required","amount":"0.02","currency":"USDC","network":"eip155:84532","pay_to":"0x677B483128D0399bCD0A5AB36eE990C0246d7f61","route":"/v1/storage/drift","hint":"Retry with header 'X-PAYMENT: <payment-proof>'. Local simulated mode accepts any non-empty value."}
```

Observed local paid response:

```json
{
  "chain": "base",
  "layers": [
    {"name":"mainnet.base.org","slot":50811753,"latency_ms":186.4,"error":null},
    {"name":"base-mainnet.public.blastapi.io","slot":50811753,"latency_ms":169.8,"error":null},
    {"name":"base.llamarpc.com","slot":null,"latency_ms":136.0,"error":"HTTP 403"}
  ],
  "drift": {
    "slot_delta": 0,
    "min_slot": 50811753,
    "max_slot": 50811753,
    "status": "degraded",
    "reporting_layers": 2,
    "failed_layers": ["base.llamarpc.com"]
  },
  "data_source":"public-rpc"
}
```

## Reading the status

The reproduced response is `degraded`: two layers reported the same slot, but one configured layer failed with HTTP 403. The valid observations are still useful, but the result is incomplete and should not be treated as a full three-layer comparison.

This run did not reproduce `converged` or `diverged`, so this tutorial does not provide fabricated outputs for either state. In production, use the `status`, `slot_delta`, `reporting_layers`, and `failed_layers` fields together; do not infer health from `slot_delta` alone.

The public API contract and standard error conventions remain documented in `docs/API.md`.
