/**
 * DonateX Widget v1.0
 * Open-source donation infrastructure — Accept USDC on Base in 5 minutes.
 * No KYC. No accounts. Just a wallet address.
 *
 * Usage:
 *   <script src="donate.js" data-wallet="0xYOUR_ADDRESS" data-currency="USDC"></script>
 *
 * MIT License — AETHERIUS x402 API Marketplace
 */
(function() {
  'use strict';

  // ── CONFIG ──────────────────────────────────────────────────────
  const USDC_BASE = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';
  const BASE_CHAIN_ID = 8453;
  const BASE_RPC = 'https://mainnet.base.org';
  const USDC_DECIMALS = 6;

  // Read config from script tag
  const scriptTag = document.currentScript;
  const CONFIG = {
    wallet: scriptTag?.getAttribute('data-wallet') || '0x0000000000000000000000000000000000000000',
    currency: scriptTag?.getAttribute('data-currency') || 'USDC',
    theme: scriptTag?.getAttribute('data-theme') || 'dark',
    presetAmounts: (scriptTag?.getAttribute('data-amounts') || '1,5,10,25').split(',').map(Number),
    position: scriptTag?.getAttribute('data-position') || 'bottom-right',
    label: scriptTag?.getAttribute('data-label') || 'Donate',
    VerifyEndpoint: scriptTag?.getAttribute('data-verify') || '',
  };

  // ── INJECT STYLES ───────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('donatex-styles')) return;
    const css = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

      .donatex-fab {
        position: fixed;
        ${CONFIG.position.includes('right') ? 'right: 20px' : 'left: 20px'};
        ${CONFIG.position.includes('bottom') ? 'bottom: 20px' : 'top: 20px'};
        z-index: 99999;
        background: linear-gradient(135deg, #a855f7, #d946ef);
        color: white;
        border: none;
        border-radius: 50px;
        padding: 14px 28px;
        font-family: 'Inter', sans-serif;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 24px rgba(168,85,247,0.4);
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .donatex-fab:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 32px rgba(168,85,247,0.6);
      }
      .donatex-fab svg {
        width: 18px;
        height: 18px;
        fill: currentColor;
      }

      .donatex-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.7);
        backdrop-filter: blur(8px);
        z-index: 100000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
      }
      .donatex-modal-overlay.active {
        opacity: 1;
        pointer-events: all;
      }

      .donatex-modal {
        background: #0f0f14;
        border: 1px solid rgba(168,85,247,0.3);
        border-radius: 20px;
        padding: 32px;
        width: 420px;
        max-width: 92vw;
        max-height: 90vh;
        overflow-y: auto;
        font-family: 'Inter', sans-serif;
        color: #e2e8f0;
        transform: scale(0.9) translateY(20px);
        transition: transform 0.3s ease;
      }
      .donatex-modal-overlay.active .donatex-modal {
        transform: scale(1) translateY(0);
      }

      .donatex-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 24px;
      }
      .donatex-header h3 {
        margin: 0;
        font-size: 20px;
        font-weight: 700;
        background: linear-gradient(135deg, #a855f7, #ec4899);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .donatex-close {
        background: none;
        border: none;
        color: #64748b;
        font-size: 24px;
        cursor: pointer;
        padding: 4px;
        line-height: 1;
      }
      .donatex-close:hover { color: #e2e8f0; }

      .donatex-presets {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        margin-bottom: 16px;
      }
      .donatex-preset {
        background: rgba(168,85,247,0.1);
        border: 1px solid rgba(168,85,247,0.2);
        border-radius: 12px;
        color: #e2e8f0;
        padding: 12px 8px;
        font-family: 'Inter', sans-serif;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }
      .donatex-preset:hover, .donatex-preset.active {
        background: rgba(168,85,247,0.25);
        border-color: #a855f7;
      }

      .donatex-custom {
        width: 100%;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(168,85,247,0.2);
        border-radius: 12px;
        color: #e2e8f0;
        padding: 12px 16px;
        font-family: 'Inter', sans-serif;
        font-size: 15px;
        margin-bottom: 20px;
        box-sizing: border-box;
        outline: none;
        transition: border-color 0.2s;
      }
      .donatex-custom:focus {
        border-color: #a855f7;
      }

      .donatex-qr-wrap {
        text-align: center;
        margin: 20px 0;
      }
      .donatex-qr-wrap img {
        border-radius: 12px;
        background: white;
        padding: 8px;
      }
      .donatex-qr-label {
        font-size: 12px;
        color: #64748b;
        margin-top: 8px;
      }

      .donatex-or {
        text-align: center;
        color: #475569;
        font-size: 13px;
        margin: 16px 0;
        position: relative;
      }
      .donatex-or::before,
      .donatex-or::after {
        content: '';
        position: absolute;
        top: 50%;
        width: 40%;
        height: 1px;
        background: rgba(100,116,139,0.3);
      }
      .donatex-or::before { left: 0; }
      .donatex-or::after { right: 0; }

      .donatex-btn {
        width: 100%;
        background: linear-gradient(135deg, #a855f7, #d946ef);
        color: white;
        border: none;
        border-radius: 12px;
        padding: 14px;
        font-family: 'Inter', sans-serif;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        margin-bottom: 12px;
      }
      .donatex-btn:hover {
        opacity: 0.9;
        transform: translateY(-1px);
      }
      .donatex-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }

      .donatex-status {
        text-align: center;
        padding: 12px;
        border-radius: 10px;
        font-size: 13px;
        margin-top: 12px;
      }
      .donatex-status.success {
        background: rgba(34,197,94,0.15);
        color: #22c55e;
        border: 1px solid rgba(34,197,94,0.3);
      }
      .donatex-status.pending {
        background: rgba(234,179,8,0.15);
        color: #eab308;
        border: 1px solid rgba(234,179,8,0.3);
      }
      .donatex-status.error {
        background: rgba(239,68,68,0.15);
        color: #ef4444;
        border: 1px solid rgba(239,68,68,0.3);
      }

      .donatex-recent {
        margin-top: 20px;
        border-top: 1px solid rgba(168,85,247,0.15);
        padding-top: 16px;
      }
      .donatex-recent h4 {
        margin: 0 0 10px 0;
        font-size: 13px;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .donatex-recent-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid rgba(100,116,139,0.1);
        font-size: 13px;
      }
      .donatex-recent-item .addr {
        color: #94a3b8;
        font-family: monospace;
      }
      .donatex-recent-item .amt {
        color: #a855f7;
        font-weight: 600;
      }

      .donatex-footer {
        text-align: center;
        margin-top: 16px;
        font-size: 11px;
        color: #475569;
      }
      .donatex-footer a {
        color: #a855f7;
        text-decoration: none;
      }
    `;
    const style = document.createElement('style');
    style.id = 'donatex-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ── RENDER QR ───────────────────────────────────────────────────
  function getQRUrl(address, amount) {
    // Base EIP-681 URI for USDC transfer
    const amountHex = amount ? `&value=${Math.pow(10, USDC_DECIMALS) * amount}` : '';
    const uri = `https://chart.googleapis.com/chart?chs=220x220&cht=qr&chl=ethereum:${BASE_CHAIN_ID}/${USDC_BASE}/transfer?address=${address}${amountHex}&choe=UTF-8`;
    // Fallback to goqr.me
    const fallback = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=ethereum:${BASE_CHAIN_ID}/${USDC_BASE}/transfer?address=${address}${amountHex}`;
    return fallback;
  }

  // ── SHORT ADDRESS ───────────────────────────────────────────────
  function shortAddr(addr) {
    return addr.slice(0, 6) + '...' + addr.slice(-4);
  }

  // ── BUILD MODAL ─────────────────────────────────────────────────
  function buildModal() {
    const overlay = document.createElement('div');
    overlay.className = 'donatex-modal-overlay';
    overlay.id = 'donatex-modal';

    let selectedAmount = CONFIG.presetAmounts[0];

    function render() {
      const qrUrl = getQRUrl(CONFIG.wallet, selectedAmount);
      overlay.innerHTML = `
        <div class="donatex-modal">
          <div class="donatex-header">
            <h3>💜 Donate USDC</h3>
            <button class="donatex-close" id="donatex-close">&times;</button>
          </div>

          <div class="donatex-presets">
            ${CONFIG.presetAmounts.map(a => `
              <button class="donatex-preset ${a === selectedAmount ? 'active' : ''}" data-amount="${a}">$${a}</button>
            `).join('')}
          </div>

          <input type="number" class="donatex-custom" placeholder="Or enter custom amount..."
                 id="donatex-custom-amount" min="0.01" step="0.01" value="${selectedAmount}">

          <div class="donatex-qr-wrap">
            <img src="${qrUrl}" alt="Donate USDC QR Code" width="220" height="220" id="donatex-qr">
            <div class="donatex-qr-label">Scan with any wallet on Base Network</div>
          </div>

          <div class="donatex-or">or</div>

          <button class="donatex-btn" id="donatex-connect">
            🦊 Connect Wallet & Pay
          </button>

          <div id="donatex-status"></div>

          <div class="donatex-recent" id="donatex-recent" style="display:none">
            <h4>Recent Donations</h4>
            <div id="donatex-recent-list"></div>
          </div>

          <div class="donatex-footer">
            Powered by <a href="https://aetheriusxapi.com" target="_blank">AETHERIUS x402</a> · Base Network
          </div>
        </div>
      `;

      // Event listeners
      overlay.querySelector('#donatex-close').onclick = () => closeModal();

      overlay.querySelectorAll('.donatex-preset').forEach(btn => {
        btn.onclick = () => {
          selectedAmount = parseFloat(btn.dataset.amount);
          render();
        };
      });

      const customInput = overlay.querySelector('#donatex-custom-amount');
      customInput.oninput = () => {
        selectedAmount = parseFloat(customInput.value) || 0;
        overlay.querySelectorAll('.donatex-preset').forEach(b => {
          b.classList.toggle('active', parseFloat(b.dataset.amount) === selectedAmount);
        });
        // Update QR
        overlay.querySelector('#donatex-qr').src = getQRUrl(CONFIG.wallet, selectedAmount);
      };

      overlay.querySelector('#donatex-connect').onclick = () => connectWallet(selectedAmount);
    }

    render();
    return overlay;
  }

  // ── WALLET CONNECT ──────────────────────────────────────────────
  async function connectWallet(amount) {
    if (!window.ethereum) {
      showStatus('error', 'No wallet found. Install MetaMask or Rabby.');
      return;
    }
    if (amount <= 0) {
      showStatus('error', 'Enter an amount greater than $0.');
      return;
    }

    const connectBtn = document.getElementById('donatex-connect');
    connectBtn.disabled = true;
    connectBtn.textContent = '⏳ Connecting...';

    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const from = accounts[0];

      // Switch to Base if needed
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x' + BASE_CHAIN_ID.toString(16) }],
        });
      } catch (switchError) {
        // Chain not added, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x' + BASE_CHAIN_ID.toString(16),
              chainName: 'Base',
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              rpcUrls: [BASE_RPC],
              blockExplorerUrls: ['https://basescan.org'],
            }],
          });
        }
      }

      // Build USDC transfer calldata
      const amountRaw = BigInt(Math.round(amount * Math.pow(10, USDC_DECIMALS)));
      const toNoPrefix = CONFIG.wallet.slice(2).toLowerCase().padStart(64, '0');
      const amountHex = amountRaw.toString(16).padStart(64, '0');
      const calldata = '0xa9059cbb' + toNoPrefix + amountHex;

      // Send transaction
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: from,
          to: USDC_BASE,
          data: calldata,
          chainId: '0x' + BASE_CHAIN_ID.toString(16),
        }],
      });

      showStatus('pending', `⏳ Transaction sent! ${shortAddr(txHash)}...`);
      connectBtn.textContent = '⏳ Confirming...';

      // Wait for confirmation (poll)
      let confirmed = false;
      for (let i = 0; i < 60; i++) {
        await sleep(3000);
        const receipt = await window.ethereum.request({
          method: 'eth_getTransactionReceipt',
          params: [txHash],
        });
        if (receipt && receipt.status === '0x1') {
          confirmed = true;
          showStatus('success', `✅ Donation confirmed! Tx: ${shortAddr(txHash)}`);
          connectBtn.textContent = '✅ Done!';
          loadRecentDonations();
          break;
        }
        if (receipt && receipt.status === '0x0') {
          showStatus('error', '❌ Transaction failed.');
          connectBtn.disabled = false;
          connectBtn.textContent = '🦊 Connect Wallet & Pay';
          return;
        }
      }

      if (!confirmed) {
        showStatus('success', `📤 Transaction sent. Check BaseScan for status.`);
      }

      setTimeout(() => {
        connectBtn.disabled = false;
        connectBtn.textContent = '🦊 Connect Wallet & Pay';
      }, 5000);

    } catch (err) {
      if (err.code === 4001) {
        showStatus('error', 'Transaction cancelled.');
      } else {
        showStatus('error', `Error: ${err.message || 'Unknown error'}`);
      }
      connectBtn.disabled = false;
      connectBtn.textContent = '🦊 Connect Wallet & Pay';
    }
  }

  // ── STATUS ──────────────────────────────────────────────────────
  function showStatus(type, msg) {
    const el = document.getElementById('donatex-status');
    if (el) {
      el.className = `donatex-status ${type}`;
      el.textContent = msg;
    }
  }

  // ── RECENT DONATIONS ────────────────────────────────────────────
  async function loadRecentDonations() {
    try {
      const url = `https://apibasescan.org/api?module=account&action=tokentx&contractaddress=${USDC_BASE}&address=${CONFIG.wallet}&page=1&offset=5&sort=desc`;
      const resp = await fetch(url);
      const data = await resp.json();
      if (data.status === '1' && data.result?.length > 0) {
        const recentDiv = document.getElementById('donatex-recent');
        const listDiv = document.getElementById('donatex-recent-list');
        if (!recentDiv || !listDiv) return;

        listDiv.innerHTML = data.result.slice(0, 5).map(tx => {
          const amt = (parseFloat(tx.value) / Math.pow(10, tx.tokenDecimal || 6)).toFixed(2);
          const addr = tx.from.toLowerCase() === CONFIG.wallet.toLowerCase() ? tx.to : tx.from;
          return `<div class="donatex-recent-item">
            <span class="addr">${shortAddr(addr)}</span>
            <span class="amt">$${amt}</span>
          </div>`;
        }).join('');
        recentDiv.style.display = 'block';
      }
    } catch (e) {
      // Silently fail — recent donations are optional
    }
  }

  // ── MODAL OPEN/CLOSE ────────────────────────────────────────────
  function openModal() {
    document.getElementById('donatex-modal')?.classList.add('active');
    loadRecentDonations();
  }

  function closeModal() {
    document.getElementById('donatex-modal')?.classList.remove('active');
  }

  // ── HELPERS ─────────────────────────────────────────────────────
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  // ── INIT ────────────────────────────────────────────────────────
  function init() {
    injectStyles();

    // FAB button
    const fab = document.createElement('button');
    fab.className = 'donatex-fab';
    fab.innerHTML = `
      <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
      ${CONFIG.label}
    `;
    fab.onclick = openModal;
    document.body.appendChild(fab);

    // Modal
    document.body.appendChild(buildModal());

    // ESC to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    // Click overlay to close
    document.getElementById('donatex-modal')?.addEventListener('click', (e) => {
      if (e.target.classList.contains('donatex-modal-overlay')) closeModal();
    });
  }

  // Run
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
