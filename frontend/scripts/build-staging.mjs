// Build script. PAGES_BASE can be set via env (CI) or defaults to staging.
// Usage:
//   node scripts/build-staging.mjs                          -> /aetheriusxapi-staging/
//   PAGES_BASE=/aetheriusxapi/ node scripts/build-staging.mjs  -> /aetheriusxapi/
if (!process.env.PAGES_BASE) {
  process.env.PAGES_BASE = '/aetheriusxapi-staging/';
}

const { build } = await import('vite');
await build();
console.log('[build] built with base', process.env.PAGES_BASE);
