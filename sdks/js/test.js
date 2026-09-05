/**
 * AetheriusX JS SDK — Quick test
 * Run: node test.js
 */

import { AetheriusXClient } from "./src/index.js";

const API = process.env.AETHERIUS_API || "http://34.156.149.38/aetherapi";

async function main() {
  const client = new AetheriusXClient(API);

  console.log("=== AetheriusX JS SDK Test ===\n");

  // 1. Health
  console.log("1. Health check...");
  const health = await client.health();
  console.log(`   Version: ${health.version}`);
  console.log(`   Endpoints: ${Object.keys(health.endpoints || {}).length}`);

  // 2. List endpoints
  console.log("\n2. Listing endpoints...");
  const endpoints = await client.listEndpoints();
  console.log(`   Found ${endpoints.length} endpoints`);
  const paid = endpoints.filter((e) => e.price);
  console.log(`   Paid: ${paid.length} | Free: ${endpoints.length - paid.length}`);

  // 3. Discover cheapest
  console.log("\n3. Cheapest paid endpoint...");
  const cheapest = await client.discoverCheapest();
  console.log(`   Route: ${cheapest.route}`);
  console.log(`   Price: $${cheapest.price}/call`);

  // 4. Paid request (local simulated)
  console.log("\n4. Paid request (simulated)...");
  const result = await client.paidGet(
    "/v1/email/validate",
    { email: "user@example.com" },
    "anything"
  );
  console.log(`   Status: ${result.status}`);
  console.log(`   Data:`, JSON.stringify(result.data).slice(0, 120));

  // 5. Telemetry
  console.log("\n5. Telemetry...");
  const telemetry = await client.telemetry();
  console.log(`   Total calls: ${telemetry.total_calls || 0}`);
  console.log(`   Paid calls: ${telemetry.paid_calls || 0}`);

  console.log("\n=== All tests passed ===");
}

main().catch((err) => {
  console.error("Test failed:", err.message);
  process.exit(1);
});
