#!/usr/bin/env node

const baseUrl = process.env.AETHERIUS_LOCAL_URL || 'http://127.0.0.1:4020';
const endpoint = `${baseUrl}/v1/email/validate?email=user@example.com`;

// local X-PAYMENT:anything = simulated; live testnet requires real x402 USDC signing (see docs/API.md).
const challenge = await fetch(endpoint);
console.log(`first request: HTTP ${challenge.status}`);
console.log(await challenge.json());

const paid = await fetch(endpoint, { headers: { 'X-PAYMENT': 'anything' } });
console.log(`paid retry: HTTP ${paid.status}`);
console.log(await paid.json());
