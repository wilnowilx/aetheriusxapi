/**
 * AetheriusX JavaScript Client
 *
 * Discover and call AetheriusX endpoints over HTTP.
 * Payment is supplied by the caller — this client never handles private keys.
 * Local mode: X-PAYMENT:anything is accepted (simulated).
 * Live testnet: requires real x402 USDC payment proof.
 */

export class AetheriusXClient {
  /**
   * @param {string} baseUrl - API base URL (default: http://127.0.0.1:4020)
   * @param {object} opts - Options
   * @param {number} opts.timeout - Request timeout in ms (default: 10000)
   */
  constructor(baseUrl = "http://127.0.0.1:4020", opts = {}) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.timeout = opts.timeout || 10000;
  }

  /**
   * GET request helper with timeout.
   * @param {string} path
   * @param {object} [params]
   * @param {object} [headers]
   * @returns {Promise<{status: number, headers: object, data: any}>}
   */
  async _get(path, params = {}, headers = {}) {
    const base = this.baseUrl.endsWith("/") ? this.baseUrl : this.baseUrl + "/";
    const rel = path.startsWith("/") ? path.slice(1) : path;
    const url = new URL(rel, base);
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, v);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch(url.toString(), {
        method: "GET",
        headers,
        signal: controller.signal,
      });
      clearTimeout(timer);

      const contentType = res.headers.get("content-type") || "";
      let data;
      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      return { status: res.status, headers: Object.fromEntries(res.headers), data };
    } catch (err) {
      clearTimeout(timer);
      if (err.name === "AbortError") {
        throw new Error(`Request timed out after ${this.timeout}ms: ${path}`);
      }
      throw err;
    }
  }

  /**
   * Return the service health document, including its endpoint catalog.
   * @returns {Promise<object>}
   */
  async health() {
    const res = await this._get("/health");
    if (res.status !== 200) {
      throw new Error(`Health check failed: HTTP ${res.status}`);
    }
    return res.data;
  }

  /**
   * Return the cheapest catalogued paid route and its USD price.
   * @returns {Promise<{route: string, price: number}>}
   */
  async discoverCheapest() {
    const health = await this.health();
    const endpoints = health.endpoints || {};
    const candidates = [];

    for (const [route, description] of Object.entries(endpoints)) {
      const match = String(description).match(/\$(\d+(?:\.\d+)?)\/call/);
      if (match) {
        candidates.push({ price: parseFloat(match[1]), route });
      }
    }

    if (candidates.length === 0) {
      throw new Error("No paid endpoints found in health response");
    }

    candidates.sort((a, b) => a.price - b.price);
    return candidates[0];
  }

  /**
   * Request a route, retrying its 402 challenge with payment.
   *
   * @param {string} route - API route (e.g., "/v1/token/price")
   * @param {object} [params] - Query parameters
   * @param {string} [payment] - Payment proof (use "anything" for local simulation)
   * @returns {Promise<{status: number, data: any}>}
   */
  async paidGet(route, params = {}, payment = null) {
    if (!route.startsWith("/")) {
      throw new Error("Route must start with '/'");
    }

    // First request — no payment
    const first = await this._get(route, params);
    if (first.status !== 402) {
      return { status: first.status, data: first.data };
    }

    // 402 challenge — need payment
    if (!payment) {
      throw new Error(
        `Got 402 Payment Required. Provide a payment proof. ` +
        `Route: ${route}, Amount: ${JSON.stringify(first.data)}`
      );
    }

    // Retry with payment header
    const second = await this._get(route, params, { "X-PAYMENT": payment });
    return { status: second.status, data: second.data };
  }

  /**
   * List all endpoints from the health catalog.
   * @returns {Promise<Array<{route: string, description: string, price: string|null}>>}
   */
  async listEndpoints() {
    const health = await this.health();
    const endpoints = health.endpoints || {};
    return Object.entries(endpoints).map(([route, description]) => {
      const priceMatch = String(description).match(/\$(\d+(?:\.\d+)?)\/call/);
      return {
        route,
        description: String(description),
        price: priceMatch ? `$${priceMatch[1]}` : null,
      };
    });
  }

  /**
   * Get telemetry data.
   * @returns {Promise<object>}
   */
  async telemetry() {
    const res = await this._get("/v1/telemetry");
    return res.data;
  }
}

export default AetheriusXClient;
