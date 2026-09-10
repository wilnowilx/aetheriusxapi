// Staging-mirror build. Sets PAGES_BASE in-process (never via shell: Windows
// git-bash mangles env values that look like absolute paths, e.g.
// PAGES_BASE=/x/ becomes /Program Files/Git/x/ and the site 404s forever).
// Usage: node scripts/build-staging.mjs   (outputs frontend/dist/)
process.env.PAGES_BASE = '/aetheriusxapi-staging/';

const { build } = await import('vite');
await build();
console.log('[staging] built with base /aetheriusxapi-staging/');
