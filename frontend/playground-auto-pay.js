// AUTO-X-PAYMENT: Automatic x402 payment handling for fetch/axios
// When a 402 Payment Required is received, this module automatically:
// 1. Decodes the payment-required header
// 2. Signs a USDC micro-transaction (simulated for demo)
// 3. Retries the request with the X-Payment header
//
// Usage in frontend:
//   import { autoXPayment } from './playground-auto-pay'
//   const res = await autoXPayment(fetch, '/api/v1/token/price', { params })

const X_PAY_TO = "0x677B483128D0399bCD0A5AB36eE990C0246d7f61"
const X_NETWORK = "eip155:8453"  // Base Mainnet
const X_PRICE = "$0.005"

// Simulated wallet - in production this would use the user's actual wallet
const SIMULATED_WALLET = {
  address: X_PAY_TO,
  signMessage: async (message) => {
    // In production: use ethers.js or similar to sign
    // For demo: return a fake proof
    return `0x${Buffer.from(message).toString('hex').padEnd(128, '0').slice(0, 128)}`
  }
}

/**
 * Automatically handles 402 Payment Required by signing and retrying.
 * @param {fetch|axios} fetchInstance - The fetch/axios instance to use
 * @param {string} url - The URL to call
 * @param {object} options - Fetch options (method, params, etc.)
 * @returns {Promise<Response>} The final response (either 200 or still 402)
 */
export async function autoXPayment(fetchInstance, url, options = {}) {
  let res = await fetchInstance(url, options)

  if (res.status === 402) {
    try {
      // Decode the payment-required header
      const paymentHeader = res.headers.get('payment-required') || ''
      const paymentData = decodePaymentHeader(paymentHeader)
      
      if (!paymentData || !paymentData.resource) {
        console.warn('No x402 payment data found', paymentData)
        return res
      }
      
      const resource = paymentData.resource
      const accepts = resource.accepts || []
      if (!accepts.length) {
        console.warn('No accepts in payment resource')
        return res
      }
      
      const payment = accepts[0]  // Take the first accepted payment option
      const amountRaw = int(payment.amount || 0)
      const amountUsd = String(amountRaw / 10**6)  // USDC has 6 decimals
      
      // Get the pay_to address
      const payTo = payment.payTo || X_PAY_TO
      
      // Sign the USDC transfer (simulated)
      const price = payment.amount ? String(int(payment.amount) / 10**6) : X_PRICE
      const network = payment.network || X_NETWORK
      
      // Create a proof - in production this would be a real on-chain tx proof
      const proof = await signUSDCTransfer(payTo, price, network)
      
      // Retry the request with X-Payment header
      const headers = {
        ...(res.headers || {}),
        'X-Payment': proof,
        'Content-Type': 'application/json'
      }
      
      // Build retry options - remove params from URL if they were part of the original 402
      const retryOptions = {
        ...options,
        headers: headers
      }
      
      // Remove params from URL if they caused the 402 (they usually don't, but x402
      #es el cuerpo de la petición what matters)
      const cleanUrl = stripParamsFromUrl(url)
      
      res = await fetchInstance(cleanUrl, retryOptions)
      
    } catch (err) {
      console.error('auto-x-payment failed:', err)
      // Don't re-throw - just return the original 402 response
    }
  }

  return res
}

/**
 * Decodes a base64-encoded payment-required header into a JSON object.
 * @param {string} headerB64 - The base64-encoded payment-required header value
 * @returns {object|undefined} The decoded payment data, or undefined if invalid
 */
function decodePaymentHeader(headerB64) {
  try {
    const decoded = Buffer.from(headerB64, 'base64').toString('utf-8')
    return JSON.parse(decoded)
  } catch (e) {
    console.warn('Failed to decode payment header', e)
    return undefined
  }
}

/**
 * Signs a USDC transfer for x402 payment.
 * In production, this would use the user's wallet (ethers.js, viem, etc.)
 * For demo purposes, returns a simulated proof.
 * @param {string} payTo - The payee address
 * @param {string} price - The price in USD (e.g., "$0.005")
 * @param {string} network - The network (e.g., "eip155:8453")
 * @returns {Promise<string>} The payment proof (base64-encoded)
 */
export async function signUSDCTransfer(payTo, price, network) {
  // IMPORTANT: In a real production app, you would use:
  // - ethers.js: wallet.signTransaction({from: payer, to: payTo, value: ...})
  // - viem: wallet.writeValue({to: payTo, amount: ...})
  // - The user's wallet must be connected (MetaMask, etc.)
  
  const timestamp = Math.floor(Date.now() / 1000)
  const data = `${payTo}:${price}:${network}:${timestamp}`
  
  // Simulated signature - in production this would be a real ECDSA signature
  const simulatedSig = SIMULATED_WALLET.signMessage(data)
  
  // Construct the x402 payment proof
  const proof = {
    x402Version: "1.0",
    payTo: payTo,
    amount: price,
    network: network,
    signature: simulatedSig,
    timestamp: timestamp
  }
  
  return btoa(JSON.stringify(proof))
}

/**
 * Strips query parameters from a URL (keeps the base path).
 * x402 payments are in headers, not query params, but this helps keep URLs clean.
 * @param {string} url - The URL to strip params from
 * @returns {string} The base URL without query parameters
 */
function stripParamsFromUrl(url) {
  try {
    const u = new URL(url)
    u.searchParams = ''
    return u.toString()
  } catch (e) {
    return url
  }
}

// Export for Node.js / CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { autoXPayment, signUSDCTransfer, decodePaymentHeader }
}