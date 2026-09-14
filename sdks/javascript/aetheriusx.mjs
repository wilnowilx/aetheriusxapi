/**
 * Small asynchronous client for the AetheriusX HTTP API.
 *
 * The caller supplies payment proofs. This client never handles private keys.
 * A local X-PAYMENT value such as "anything" is accepted only in simulated
 * mode; live testnet requires a real x402 USDC payment proof.
 */
export class AetheriusXClient {
  constructor(baseUrl = 'http://127.0.0.1:4020', { timeout = 10000 } = {}) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.timeout = timeout;
  }

  async request(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  async health() {
    const response = await this.request(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error(`Health request failed: HTTP ${response.status}`);
    }
    return response.json();
  }

  async discoverCheapest() {
    const catalog = (await this.health()).endpoints ?? {};
    const candidates = Object.entries(catalog).flatMap(([route, description]) => {
      const match = String(description).match(/\$(\d+(?:\.\d+)?)\/call/);
      return match ? [[Number(match[1]), route]] : [];
    });
    if (!candidates.length) {
      throw new Error('The health response advertises no paid endpoints');
    }
    candidates.sort(([priceA, routeA], [priceB, routeB]) => priceA - priceB || routeA.localeCompare(routeB));
    const [price, route] = candidates[0];
    return [route, price];
  }

  async paidGet(route, params = {}, payment = null) {
    if (!route.startsWith('/')) {
      throw new Error("route must start with '/'");
    }
    const url = new URL(`${this.baseUrl}${route}`);
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }

    const firstResponse = await this.request(url);
    if (firstResponse.status !== 402) {
      return firstResponse;
    }
    if (!payment) {
      throw new Error('payment is required after the 402 challenge');
    }
    // Local X-PAYMENT:anything = simulated; live testnet requires real x402 USDC signing (see docs/API.md).
    return this.request(url, { headers: { 'X-PAYMENT': payment } });
  }
}

export default AetheriusXClient;
