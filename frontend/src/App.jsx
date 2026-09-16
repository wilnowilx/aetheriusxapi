import React, { useEffect, useRef, useState, useCallback } from 'react'
import Hero from './components/Hero'
import AetheriusOS from './components/os/AetheriusOS'
import NetworkStatus from './components/NetworkStatus'
import { useScrollAnimations } from './hooks/useScrollAnimations'
import { useSmoothScroll } from './hooks/useSmoothScroll'

const API_BASE = 'https://34-156-149-38.sslip.io/aetherapi'

// === NAV ===
function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [pastHero, setPastHero] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handler = () => {
      setScrolled(window.scrollY > 50)
      setPastHero(window.scrollY > window.innerHeight * 0.55)
    }
    handler()
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // When in OS, hide nav completely — OS has its own topbar
  if (pastHero) return null

  return (
    <>
      <nav style={{ background: scrolled ? 'rgba(5,2,15,0.88)' : 'rgba(3,1,8,0.06)', backdropFilter: 'blur(12px)', borderBottom: scrolled ? '1px solid rgba(168,85,247,0.18)' : '1px solid rgba(168,85,247,0.05)', transition: 'background 0.4s ease, border-color 0.4s ease' }} className={scrolled ? 'scrolled' : ''}>
        <div className="nav-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {/* Mainnet badge — left */}
          <span style={{ position: 'absolute', left: 0, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', fontWeight: 600, color: 'var(--green)', padding: '6px 14px', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 9999, background: 'rgba(16,185,129,0.06)', fontFamily: 'JetBrains Mono, monospace', backdropFilter: 'blur(8px)' }}>
            <span className="glow-dot" style={{ width: 6, height: 6 }} />
            Mainnet
          </span>
          {/* Brand — centered */}
          <a href="#hero" className="brand" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>AETHERIUS</a>
        </div>
      </nav>
    </>
  )
}

// === PLASMA BACKGROUND ===
function PlasmaBg() {
  return (
    <div className="plasma-bg">
      <div className="plasma-blob" style={{ width: 760, height: 760, background: 'radial-gradient(circle, rgba(168,85,247,0.35) 0%, transparent 70%)', top: '-12%', left: '-6%', animationDuration: '16s' }} />
      <div className="plasma-blob" style={{ width: 640, height: 640, background: 'radial-gradient(circle, rgba(217,70,239,0.30) 0%, transparent 70%)', top: '28%', right: '-12%', animationDuration: '13s', animationDelay: '-5s' }} />
      <div className="plasma-blob" style={{ width: 580, height: 580, background: 'radial-gradient(circle, rgba(236,72,153,0.28) 0%, transparent 70%)', bottom: '-6%', left: '18%', animationDuration: '15s', animationDelay: '-10s' }} />
      <div className="plasma-blob" style={{ width: 520, height: 520, background: 'radial-gradient(circle, rgba(6,182,212,0.22) 0%, transparent 70%)', top: '58%', left: '52%', animationDuration: '12s', animationDelay: '-3s' }} />
      <div className="plasma-blob" style={{ width: 460, height: 460, background: 'radial-gradient(circle, rgba(168,85,247,0.22) 0%, transparent 70%)', top: '8%', left: '42%', animationDuration: '17s', animationDelay: '-8s' }} />
      <div className="plasma-blob" style={{ width: 500, height: 500, background: 'radial-gradient(circle, rgba(232,121,249,0.20) 0%, transparent 70%)', top: '45%', right: '5%', animationDuration: '14s', animationDelay: '-6s' }} />
      <div className="grain-overlay" />
      <style>{`
        @keyframes plasmaFloat {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); }
          25% { transform: translate(95px, -65px) scale(1.16); }
          50% { transform: translate(-50px, 80px) scale(0.92) rotate(8deg); }
          75% { transform: translate(65px, 30px) scale(1.08); }
          100% { transform: translate(-35px, -50px) scale(1.02) rotate(-6deg); }
        }
        @keyframes auroraMorph {
          0%, 100% { border-radius: 42% 58% 63% 37% / 45% 42% 58% 55%; }
          33% { border-radius: 63% 37% 42% 58% / 55% 58% 42% 45%; }
          66% { border-radius: 37% 63% 55% 45% / 42% 55% 45% 58%; }
        }
      `}</style>
    </div>
  )
}

// === PLAYGROUND ===
const playgroundEndpoints = [
  { cat: 'x402 Intelligence', free: true, icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><path strokeLinejoin="round" strokeLinecap="round" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>, items: [
    { method: 'GET', path: '/v1/x402/base-stats', price: 'FREE', params: '{}' },
    { method: 'GET', path: '/v1/x402/gas', price: 'FREE', params: '{}' },
    { method: 'GET', path: '/v1/x402/market-pulse', price: 'FREE', params: '{}' },
    { method: 'GET', path: '/v1/x402/sentiment', price: 'FREE', params: '{}' },
    { method: 'GET', path: '/v1/x402/stablecoins', price: 'FREE', params: '{}' },
    { method: 'GET', path: '/v1/x402/whales', price: 'FREE', params: '{}' },
  ]},
  { cat: 'Crypto Market', free: false, icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><path strokeLinejoin="round" strokeLinecap="round" d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>, items: [
    { method: 'GET', path: '/v1/crypto/market', price: '$0.005', params: '{"token":"ETH"}' },
    { method: 'GET', path: '/v1/crypto/fear-greed', price: '$0.005', params: '{}' },
    { method: 'GET', path: '/v1/crypto/trending', price: '$0.01', params: '{}' },
    { method: 'GET', path: '/v1/crypto/ohlcv', price: '$0.01', params: '{"token":"ETH","interval":"1d"}' },
    { method: 'GET', path: '/v1/crypto/dominance', price: '$0.005', params: '{}' },
  ]},
  { cat: 'Token', free: false, icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><circle cx="12" cy="12" r="10"/><path strokeLinejoin="round" strokeLinecap="round" d="M12 6v12M8 10l4-4 4 4"/></svg>, items: [
    { method: 'GET', path: '/v1/token/price', price: '$0.005', params: '{"token":"ETH"}' },
    { method: 'GET', path: '/v1/token/analyze', price: '$0.01', params: '{"address":"0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"}' },
  ]},
  { cat: 'DeFi', free: false, icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><path strokeLinejoin="round" strokeLinecap="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>, items: [
    { method: 'GET', path: '/v1/defi/impermanent-loss', price: '$0.01', params: '{}' },
    { method: 'GET', path: '/v1/defi/staking-apy', price: '$0.005', params: '{"protocol":"lido","token":"ETH"}' },
  ]},
  { cat: 'News', free: false, icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><path strokeLinejoin="round" strokeLinecap="round" d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2"/><path strokeLinejoin="round" strokeLinecap="round" d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/></svg>, items: [
    { method: 'GET', path: '/v1/news/hackernews', price: '$0.01', params: '{}' },
    { method: 'GET', path: '/v1/news/reddit', price: '$0.01', params: '{"subreddit":"cryptocurrency"}' },
  ]},
  { cat: 'Data', free: false, icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><path strokeLinejoin="round" strokeLinecap="round" d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96" strokeLinejoin="round" strokeLinecap="round"/><line x1="12" y1="22.08" x2="12" y2="12" strokeLinecap="round"/></svg>, items: [
    { method: 'GET', path: '/v1/data/weather', price: '$0.005', params: '{"lat":"19.4326","lon":"-99.1332"}' },
    { method: 'GET', path: '/v1/data/ip', price: '$0.005', params: '{"ip":"8.8.8.8"}' },
    { method: 'GET', path: '/v1/data/uuid', price: '$0.001', params: '{}' },
    { method: 'GET', path: '/v1/data/hash', price: '$0.002', params: '{"input":"hello","algo":"sha256"}' },
    { method: 'GET', path: '/v1/data/qrcode', price: '$0.003', params: '{"text":"https://aetheriusx.io"}' },
    { method: 'POST', path: '/v1/data/translate', price: '$0.01', params: '{"text":"hello","target":"es"}' },
  ]},
  { cat: 'Web Tools', free: false, icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12" strokeLinecap="round"/><path strokeLinejoin="round" strokeLinecap="round" d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>, items: [
    { method: 'GET', path: '/v1/web/ssl', price: '$0.005', params: '{"domain":"example.com"}' },
    { method: 'GET', path: '/v1/web/whois', price: '$0.01', params: '{"domain":"example.com"}' },
    { method: 'GET', path: '/v1/web/headers', price: '$0.005', params: '{"url":"https://example.com"}' },
  ]},
]

function Playground() {
  const [selected, setSelected] = useState(playgroundEndpoints[0].items[0])
  const [params, setParams] = useState(playgroundEndpoints[0].items[0].params)
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)
  const [time, setTime] = useState(null)

  const selectEndpoint = useCallback((ep) => {
    setSelected(ep)
    setParams(ep.params)
    setResponse(null)
    setStatus(null)
    setTime(null)
  }, [])

  const sendRequest = useCallback(async () => {
    setLoading(true)
    setResponse(null)
    const start = performance.now()
    try {
      let parsed
      try { parsed = JSON.parse(params) } catch { parsed = {} }
      const qs = Object.entries(parsed).filter(([,v]) => v !== '').map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join('&')
      const url = `${API_BASE}${selected.path}${qs ? '?' + qs : ''}`
      const r = await fetch(url)
      const elapsed = Math.round(performance.now() - start)
      setStatus(`${r.status} ${r.statusText}`)
      setTime(`${elapsed}ms`)
      const data = await r.json()
      setResponse(JSON.stringify(data, null, 2))
    } catch (e) {
      setStatus('Error')
      setTime('')
      setResponse(e.message)
    }
    setLoading(false)
  }, [selected, params])

  const selectFromSidebar = useCallback((ep) => {
    selectEndpoint(ep)
  }, [selectEndpoint])

  return (
    <section id="playground" data-animate style={{ paddingTop: 40, position: 'relative', overflow: 'hidden' }}>
      {/* Nebula sutil de fondo para esta sección */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse at 20% 30%, rgba(168,85,247,0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(34,211,238,0.05) 0%, transparent 50%)',
        filter: 'blur(200px)',
        opacity: 0.5,
        animation: 'nebulaSectionPulse 40s ease-in-out infinite',
      }} />
      <style>{`
        @keyframes nebulaSectionPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(1.02); }
        }
      `}</style>
      <div className="inner" style={{ position: 'relative', zIndex: 1 }}>
        <div className="section-label">
          <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><polygon points="5 3 19 12 5 21 5 3" strokeLinejoin="round" strokeLinecap="round"/></svg>
          Live Playground
        </div>
        <h2 className="section-title">Try It Right Now</h2>
        <p className="section-desc" style={{ margin: '0 auto' }}>Select an endpoint and see real responses. Free endpoints work instantly.</p>

        <div data-animate-card style={{
          display: 'grid', gridTemplateColumns: '280px 1fr', gap: 0, marginTop: 56,
          background: 'rgba(10,10,20,0.5)', border: '1px solid rgba(168,85,247,0.08)',
          borderRadius: 20, overflow: 'hidden', height: 500, position: 'relative',
          boxShadow: '0 0 60px rgba(168,85,247,0.06), 0 0 120px rgba(217,70,239,0.03)',
          backdropFilter: 'blur(20px)',
        }}>
          {/* Sidebar — independent scroll */}
          <div className="noscroll" style={{ background: 'rgba(255,255,255,0.015)', borderRight: '1px solid rgba(255,255,255,0.04)', padding: 16, overflowY: 'auto', overscrollBehavior: 'contain', minHeight: 0 }}>
            {playgroundEndpoints.map(group => (
              <div key={group.cat} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', fontSize: '0.72rem', fontWeight: 700, color: group.free ? 'var(--green)' : 'var(--purple-light)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {group.icon}
                  {group.cat}
                  {group.free && <span style={{ fontSize: '0.6rem', padding: '2px 6px', borderRadius: 6, background: 'rgba(16,185,129,0.15)', color: 'var(--green)', marginLeft: 'auto' }}>FREE</span>}
                </div>
                {group.items.map(ep => (
                  <div key={ep.path} role="button" tabIndex={0}
                    onClick={() => selectFromSidebar(ep)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectFromSidebar(ep) } }}
                    style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10,
                    cursor: 'pointer', fontSize: '0.82rem', border: '1px solid transparent',
                    transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                    background: selected.path === ep.path ? 'rgba(168,85,247,0.07)' : 'transparent',
                    borderColor: selected.path === ep.path ? 'rgba(168,85,247,0.25)' : 'transparent',
                  }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: ep.method === 'POST' ? 'rgba(245,158,11,0.12)' : ep.price === 'FREE' ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.12)', color: ep.method === 'POST' ? 'var(--orange)' : 'var(--green)' }}>{ep.method}</span>
                    <span style={{ flex: 1, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-sec)', fontSize: '0.78rem' }}>{ep.path.replace('/v1/', '/')}</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: ep.price === 'FREE' ? 'var(--green)' : 'var(--magenta-light)' }}>{ep.price}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Main area */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.015)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', fontWeight: 600, padding: '4px 10px', borderRadius: 6, background: selected.method === 'POST' ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)', color: selected.method === 'POST' ? 'var(--orange)' : 'var(--green)' }}>{selected.method}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.88rem', color: 'var(--text)' }}>{selected.path}</span>
              </div>
              <button onClick={sendRequest} disabled={loading} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px',
                background: 'linear-gradient(135deg, var(--purple-deep), var(--magenta))',
                color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: '0.85rem',
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1,
                boxShadow: '0 4px 16px rgba(168,85,247,0.25)', transition: 'all 0.3s',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5"><polygon points="5 3 19 12 5 21 5 3" strokeLinejoin="round" strokeLinecap="round"/></svg>
                Send
              </button>
            </div>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Parameters</div>
              <textarea value={params} onChange={e => setParams(e.target.value)} style={{
                width: '100%', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem',
                padding: '12px 16px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: 10, color: 'var(--text)', minHeight: 44, outline: 'none', resize: 'vertical',
                transition: 'border-color 0.3s',
              }} onFocus={e => e.target.style.borderColor = 'rgba(168,85,247,0.3)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.04)'} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Response</span>
                {status && <span style={{ fontFamily: 'JetBrains Mono, monospace', padding: '2px 8px', borderRadius: 4, background: status.startsWith('2') ? 'rgba(16,185,129,0.12)' : status.startsWith('4') ? 'rgba(245,158,11,0.12)' : 'rgba(236,72,153,0.12)', color: status.startsWith('2') ? 'var(--green)' : status.startsWith('4') ? 'var(--orange)' : 'var(--pink)' }}>{status}</span>}
                {time && <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-sec)' }}>{time}</span>}
              </div>
              <div className="noscroll" style={{ flex: 1, padding: 20, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--text)', overflowY: 'auto', maxHeight: 300, background: 'rgba(0,0,0,0.1)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {loading ? <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Loading...</span> :
                 response || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Click "Send" to make a request...</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.015)', flexWrap: 'wrap' }}>
              {['x402 Payment Required', 'USDC on Base', 'Settled instantly'].map(b => (
                <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.08)', borderRadius: 9999, fontSize: '0.68rem', fontWeight: 500, color: 'var(--purple-light)' }}>{b}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 1024px) { #playground > .inner > div:last-child { grid-template-columns: 240px 1fr; } }
        @media (max-width: 768px) { #playground > .inner > div:last-child { grid-template-columns: 1fr !important; min-height: auto; } }
      `}</style>
    </section>
  )
}

// === X402 INTELLIGENCE ===
function X402Intelligence() {
  const cards = [
    { title: 'Brain Recommender', desc: 'Tell it what you need — "defi", "wallet", "gas" — and it recommends the best endpoints. AI-powered routing.', code: 'GET /v1/x402/brain?intent=defi', color: 'var(--purple-light)', bg: 'rgba(168,85,247,0.06)', iconBg: 'linear-gradient(135deg, rgba(168,85,247,0.06), rgba(217,70,239,0.08))', icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><circle cx="12" cy="12" r="10" strokeLinejoin="round" strokeLinecap="round"/><path strokeLinejoin="round" strokeLinecap="round" d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round"/></svg> },
    { title: 'Market Pulse', desc: 'Real-time Base conditions: gas, chain health, USDC activity, ETH price, bullish/bearish signal. One call.', code: 'GET /v1/x402/market-pulse', color: 'var(--green)', bg: 'rgba(16,185,129,0.06)', iconBg: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,182,212,0.08))', icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinejoin="round" strokeLinecap="round"/></svg> },
    { title: 'Wallet Intel', desc: 'Full wallet profile: USDC flow, risk score, counterparty analysis, ETH balance. Any address on Base.', code: 'GET /v1/x402/wallet-intel/{address}', color: 'var(--pink)', bg: 'rgba(236,72,153,0.06)', iconBg: 'linear-gradient(135deg, rgba(236,72,153,0.1), rgba(168,85,247,0.08))', icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><path strokeLinejoin="round" strokeLinecap="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4" strokeLinejoin="round" strokeLinecap="round"/></svg> },
    { title: 'Sentiment + Risk', desc: 'Fear & Greed Index + on-chain sentiment. Multi-factor risk scoring with detailed breakdown. Compliance indicators.', code: 'GET /v1/x402/sentiment · /risk-intel', color: 'var(--cyan)', bg: 'rgba(6,182,212,0.06)', iconBg: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(16,185,129,0.08))', icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><path strokeLinejoin="round" strokeLinecap="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg> },
  ]

  return (
    <section id="x402-intel" data-animate style={{ background: 'linear-gradient(180deg, rgba(168,85,247,0.05) 0%, transparent 100%)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      {/* Nebula sutil para la capa de inteligencia FREE */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse at 30% 20%, rgba(16,185,129,0.04) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(6,182,212,0.04) 0%, transparent 50%)',
        filter: 'blur(200px)',
        opacity: 0.5,
        animation: 'nebulaSectionPulse 38s ease-in-out infinite',
      }} />
      <style>{`
        @keyframes nebulaSectionPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(1.02); }
        }
      `}</style>
      <div className="inner" style={{ position: 'relative', zIndex: 1 }}>
        <div className="section-label">
          <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path strokeLinejoin="round" strokeLinecap="round" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          QuantumXBrain — FREE Intelligence Layer
        </div>
        <h2 className="section-title">20 Free Endpoints. Real On-Chain Intelligence.</h2>
        <p className="section-desc" style={{ margin: '0 auto' }}>We read Base Mainnet directly + CoinGecko + DefiLlama. No API keys. No accounts. The intelligence layer that NOBODY else offers — completely free.</p>
        <div className="intel-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 48 }}>
          {cards.map(c => (
            <div key={c.title} data-animate-card className="glass-card" style={{ padding: '36px 28px', textAlign: 'left' }}>
              <div style={{ width: 56, height: 56, background: c.iconBg, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, color: c.color }}>
                {c.icon}
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 10, color: 'var(--text)' }}>{c.title}</h3>
              <p style={{ color: 'var(--text-sec)', fontSize: '0.9rem', marginBottom: 16, lineHeight: 1.6 }}>{c.desc}</p>
              <div style={{ padding: '8px 12px', background: c.bg, borderRadius: 8, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: c.color }}>{c.code}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 22px', background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.08)', borderRadius: 12, backdropFilter: 'blur(8px)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="var(--purple-light)" strokeWidth="1.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" strokeLinejoin="round" strokeLinecap="round"/></svg>
            <span style={{ color: 'var(--purple-light)', fontWeight: 600, fontSize: '0.88rem' }}>20 endpoints · 100% FREE · X-AETHERIUS-Fingerprint header on every response</span>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 1024px) { #x402-intel .intel-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 768px) { #x402-intel .intel-grid { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  )
}

// === ARCHITECTURE — CLICK-TO-EXPLORE: 4 phases, horizontal steps ===
function HowItWorks() {
  const [activePhase, setActivePhase] = useState(0)

  const phases = [
    { icon: '\u26A1', title: 'Capture', desc: 'Every call, header, response, and latency signal is captured in real-time.' },
    { icon: '\uD83D\uDD0D', title: 'Normalize', desc: 'Raw signals are normalized into a universal schema across all providers.' },
    { icon: '\uD83E\uDDE0', title: 'Analyze', desc: 'Pattern matching and anomaly detection run continuously on normalized data.' },
    { icon: '\uD83D\uDE80', title: 'Route', desc: 'Optimal provider routing based on live performance, cost, and availability.' }
  ]

  return (
    <section id="how" data-animate style={{ textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div className="inner" style={{ position: 'relative', zIndex: 1 }}>
        <div className="section-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinejoin="round" strokeLinecap="round"/></svg>
          Architecture
        </div>
        <h2 className="section-title">How AETHERIUS Works</h2>
        <p className="section-desc" style={{ margin: '0 auto', maxWidth: 580 }}>
          Click each phase to explore the pipeline. From capture to delivery in real-time.
        </p>

        {/* Horizontal steps with connectors */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 0, marginTop: 56, marginBottom: 40 }}>
          {phases.map((phase, i) => {
            const isActive = activePhase === i
            return (
              <div key={phase.title} style={{ display: 'flex', alignItems: 'center' }}>
                {/* Step card */}
                <div
                  onClick={() => setActivePhase(i)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActivePhase(i) } }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                    padding: '24px 20px', borderRadius: 16, cursor: 'pointer',
                    minWidth: 140, maxWidth: 180, position: 'relative',
                    border: isActive ? '2px solid rgba(0,240,255,0.4)' : '1px solid rgba(255,255,255,0.06)',
                    background: isActive ? 'rgba(0,240,255,0.06)' : 'transparent',
                    boxShadow: isActive ? '0 0 20px rgba(0,240,255,0.15)' : 'none',
                    transform: isActive ? 'scale(1.02)' : 'scale(1)',
                    opacity: isActive ? 1 : 0.6,
                    transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: isActive ? 'rgba(0,240,255,0.1)' : 'rgba(255,255,255,0.04)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.4rem',
                    transition: 'all 0.35s ease',
                  }}>
                    {phase.icon}
                  </div>
                  {/* Title */}
                  <div style={{
                    fontWeight: 700, fontSize: '0.95rem',
                    color: isActive ? 'var(--text)' : 'var(--text-sec)',
                    transition: 'color 0.35s ease',
                  }}>
                    {phase.title}
                  </div>
                </div>

                {/* Connector arrow between steps */}
                {i < phases.length - 1 && (
                  <div style={{
                    width: 48, height: 2, position: 'relative',
                    margin: '0 -2px', alignSelf: 'center', marginTop: -40,
                  }}>
                    {/* Background line */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: 1,
                    }} />
                    {/* Filled portion */}
                    <div style={{
                      position: 'absolute', top: 0, left: 0, bottom: 0,
                      width: activePhase > i ? '100%' : '0%',
                      background: 'linear-gradient(90deg, rgba(0,240,255,0.4), rgba(0,240,255,0.2))',
                      borderRadius: 1,
                      transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)',
                    }} />
                    {/* Arrow head */}
                    <svg width="10" height="10" viewBox="0 0 10 10" style={{
                      position: 'absolute', right: -4, top: -4,
                      color: activePhase > i ? 'rgba(0,240,255,0.5)' : 'rgba(255,255,255,0.1)',
                      transition: 'color 0.4s ease',
                    }}>
                      <path d="M2 1l6 4-6 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Expanded description panel */}
        <div style={{
          background: 'rgba(0,240,255,0.04)',
          border: '1px solid rgba(0,240,255,0.12)',
          borderRadius: 16, padding: '28px 32px', maxWidth: 520, margin: '0 auto',
          transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: '1.6rem' }}>{phases[activePhase].icon}</span>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
              {phases[activePhase].title}
            </h3>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', fontWeight: 600,
              padding: '3px 8px', borderRadius: 6, background: 'rgba(0,240,255,0.1)',
              color: 'rgba(0,240,255,0.8)', marginLeft: 'auto',
            }}>
              Phase {activePhase + 1}/4
            </span>
          </div>
          <p style={{
            color: 'var(--text-sec)', fontSize: '0.92rem', lineHeight: 1.7, margin: 0,
          }}>
            {phases[activePhase].desc}
          </p>
        </div>
      </div>
    </section>
  )
}

// === FEATURES — compact accordion ===
function Features() {
  const [openFeature, setOpenFeature] = useState(null)

  const features = [
    { title: 'AI-Native Design', desc: 'Built for machines. No accounts, no UI, no human friction. Agents pay and use directly. Zero human in the loop.', color: 'var(--purple-light)', icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><path d="M12 2a4 4 0 014 4v2a4 4 0 01-8 0V6a4 4 0 014-4z"/><path d="M16 14v2a4 4 0 01-8 0v-2M12 18v4M8 22h8"/></svg> },
    { title: 'x402 Protocol', desc: 'HTTP 402 with crypto payments. The emerging standard for machine-to-machine commerce. Settled on Base L2.', color: 'var(--cyan)', icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.72-1.71"/></svg> },
    { title: 'USDC on Base', desc: 'Stablecoin payments on L2. Sub-cent fees, instant finality, global reach. No volatile tokens.', color: 'var(--magenta-light)', icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M8 10l4-4 4 4M8 14l4 4 4-4"/></svg> },
    { title: 'Permissionless', desc: 'No KYC, no subscriptions, no bank accounts. Connect wallet and use. That\'s it. True censorship resistance.', color: 'var(--green)', icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg> },
    { title: 'Global Access', desc: 'Anyone with a crypto wallet. No bank account needed. No borders. Built for the global agent economy.', color: 'var(--orange)', icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg> },
    { title: 'Instant Settlement', desc: 'Payments verified on-chain in seconds. No waiting, no intermediaries. On-chain proof included in every response.', color: 'var(--pink)', icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> },
  ]

  return (
    <section id="features" data-animate style={{ textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div className="inner" style={{ position: 'relative', zIndex: 1, maxWidth: 640 }}>
        <div className="section-label">
          <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path strokeLinejoin="round" strokeLinecap="round" d="M12 2L2 7l10 5 10-5-10-5z"/></svg>
          Features
        </div>
        <h2 className="section-title">Built for the Agent Economy</h2>
        <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {features.map((f, i) => {
            const isOpen = openFeature === i
            return (
              <div key={f.title} data-animate-card
                onClick={() => setOpenFeature(isOpen ? null : i)}
                style={{
                  background: isOpen ? `${f.color}08` : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isOpen ? `${f.color}25` : 'rgba(255,255,255,0.04)'}`,
                  borderRadius: 14, cursor: 'pointer', overflow: 'hidden', transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px' }}>
                  <div style={{ color: f.color, opacity: isOpen ? 1 : 0.5, transition: 'opacity 0.3s', flexShrink: 0 }}>{f.icon}</div>
                  <span style={{ flex: 1, textAlign: 'left', fontWeight: 600, fontSize: '0.92rem', color: isOpen ? 'var(--text)' : 'var(--text-sec)' }}>{f.title}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s', color: 'var(--text-muted)', flexShrink: 0 }}><polyline points="6 9 12 15 18 9" strokeLinejoin="round" strokeLinecap="round"/></svg>
                </div>
                {isOpen && (
                  <div style={{ padding: '0 20px 16px 48px', color: 'var(--text-sec)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                    {f.desc}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// === CODE SECTION — Typing Terminal ===
function CodeSection() {
  const [tab, setTab] = useState('py')
  const [typedLines, setTypedLines] = useState([])
  const [currentLine, setCurrentLine] = useState('')
  const [lineIdx, setLineIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [showCursor, setShowCursor] = useState(true)
  const [copied, setCopied] = useState(false)
  const typingRef = useRef(null)
  const containerRef = useRef(null)

  const codeBlocks = {
    py: [
      '# Install the SDK',
      '$ pip install aetheriusx',
      '',
      '# Initialize with your wallet',
      '$ python',
      '>>> from aetheriusx import Client',
      '>>> client = Client("0xYourWallet")',
      '',
      '# Call any API — payment is automatic',
      '>>> resp = client.get("/v1/crypto/price",',
      '...         params={"token": "ETH"})',
      '',
      '>>> print(resp.data)',
      '{"price": 2384.50, "change": 2.3}',
      '$  # That\'s it. Payment handled.',
    ],
    js: [
      '// Install the SDK',
      '$ npm install aetheriusx',
      '',
      '// Initialize with your wallet',
      "import { Client } from 'aetheriusx';",
      '',
      "const client = new Client('0xYourWallet');",
      '',
      '// Call any API — payment is automatic',
      "const resp = await client.get(",
      "  '/v1/crypto/price',",
      "  { params: { token: 'ETH' } }",
      ');',
      '',
      'console.log(resp.data);',
      '// { price: 2384.50, change: 2.3 }',
    ],
    curl: [
      '# Make a request with x402 payment',
      '$ curl -X GET \\',
      '  "https://api.aetheriusx.io/v1/crypto/price?token=ETH" \\',
      '  -H "X-PAYMENT: 0x...proof" \\',
      '  -H "Content-Type: application/json"',
      '',
      '# Response',
      '{',
      '  "data": {',
      '    "price": 2384.50,',
      '    "change_24h": 2.3',
      '  }',
      '}',
    ],
  }

  // Typing effect
  useEffect(() => {
    setTypedLines([])
    setCurrentLine('')
    setLineIdx(0)
    setCharIdx(0)
  }, [tab])

  useEffect(() => {
    const lines = codeBlocks[tab]
    if (lineIdx >= lines.length) return

    const line = lines[lineIdx]
    if (charIdx < line.length) {
      const speed = line.startsWith('$') || line.startsWith('#') || line.startsWith('//') ? 25 : 35
      typingRef.current = setTimeout(() => {
        setCurrentLine(line.slice(0, charIdx + 1))
        setCharIdx(charIdx + 1)
      }, speed)
    } else {
      // Line complete → move to next
      typingRef.current = setTimeout(() => {
        setTypedLines(prev => [...prev, line])
        setCurrentLine('')
        setLineIdx(lineIdx + 1)
        setCharIdx(0)
      }, line === '' ? 80 : 150)
    }
    return () => clearTimeout(typingRef.current)
  }, [lineIdx, charIdx, tab])

  // Cursor blink
  useEffect(() => {
    const iv = setInterval(() => setShowCursor(v => !v), 530)
    return () => clearInterval(iv)
  }, [])

  const handleCopy = () => {
    const code = codeBlocks[tab].join('\n')
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const renderLine = (text, isCurrent) => {
    if (!text) return <br />
    // Colorize based on content
    let color = 'var(--text)'
    if (text.startsWith('$') || text.startsWith('>>>') || text.startsWith('...')) color = 'var(--green)'
    else if (text.startsWith('#') || text.startsWith('//')) color = 'var(--text-muted)'
    else if (text.includes('"') || text.includes("'")) color = 'var(--magenta-light)'
    return <span style={{ color }}>{text}</span>
  }

  return (
    <section id="code" data-animate style={{ textAlign: 'center', background: 'linear-gradient(180deg, rgba(168,85,247,0.03) 0%, transparent 100%)' }}>
      <div className="inner">
        <div className="section-label">
          <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          For Developers
        </div>
        <h2 className="section-title">Integrate in Minutes</h2>
        <p className="section-desc" style={{ margin: '0 auto' }}>One SDK. Every API. Zero configuration.</p>
        <div data-animate-card style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 48, marginTop: 72, alignItems: 'start' }}>
          <div>
            <div style={{ background: '#0a0a14', border: '1px solid rgba(168,85,247,0.16)', borderRadius: 16, overflow: 'hidden', textAlign: 'left' }}>
              {/* Window chrome */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }} />
                <span style={{ marginLeft: 12, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>terminal</span>
              </div>
              {/* Tabs */}
              <div style={{ display: 'flex', gap: 2, padding: '0 16px', background: 'rgba(255,255,255,0.02)' }}>
                {[['py', 'Python'], ['js', 'JavaScript'], ['curl', 'cURL']].map(([key, label]) => (
                  <button key={key} onClick={() => setTab(key)} style={{
                    padding: '10px 16px', background: 'none', border: 'none', color: tab === key ? 'var(--purple-light)' : 'var(--text-muted)',
                    fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', cursor: 'pointer',
                    borderBottom: `2px solid ${tab === key ? 'var(--purple)' : 'transparent'}`, transition: 'all 0.3s',
                  }}>{label}</button>
                ))}
              </div>
              {/* Terminal content */}
              <div ref={containerRef} style={{ padding: 24, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem', lineHeight: 1.9, minHeight: 380, position: 'relative' }}>
                {/* Copy button */}
                <button onClick={handleCopy} style={{
                  position: 'absolute', top: 12, right: 12, padding: '6px 12px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(168,85,247,0.2)',
                  borderRadius: 8, color: 'var(--cyan)', fontSize: '0.72rem', fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace',
                  transition: 'all 0.3s', zIndex: 10,
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(168,85,247,0.1)'; e.currentTarget.style.borderColor = 'rgba(168,85,247,0.35)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(168,85,247,0.2)' }}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                {/* Completed lines */}
                {typedLines.map((line, i) => (
                  <div key={i}>{renderLine(line, false)}</div>
                ))}
                {/* Current typing line */}
                {lineIdx < codeBlocks[tab].length && (
                  <div>
                    {renderLine(currentLine, true)}
                    <span style={{
                      display: 'inline-block', width: 8, height: 16,
                      background: showCursor ? 'var(--purple)' : 'transparent',
                      marginLeft: 1, verticalAlign: 'text-bottom',
                      transition: 'background 0.1s',
                    }} />
                  </div>
                )}
                {/* Done indicator */}
                {lineIdx >= codeBlocks[tab].length && (
                  <div style={{ marginTop: 8 }}>
                    <span style={{ color: 'var(--green)' }}>$</span>
                    <span style={{
                      display: 'inline-block', width: 8, height: 16,
                      background: showCursor ? 'var(--green)' : 'transparent',
                      marginLeft: 4, verticalAlign: 'text-bottom',
                    }} />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 20 }}>One line of code.</h3>
            <p style={{ color: 'var(--text-sec)', marginBottom: 32, lineHeight: 1.7 }}>The SDK handles wallet connection, payment negotiation, request signing, and response parsing. Just import and call.</p>
            <ul style={{ listStyle: 'none' }}>
              {['Auto-negotiates payment via x402', 'Python + JavaScript SDKs, typed and tested', 'Type-safe with full IDE support', 'Built-in retry and error handling', 'Zero configuration needed'].map(item => (
                <li key={item} style={{ padding: '14px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14, color: 'var(--text-sec)' }}>
                  <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="var(--green)" strokeWidth="1.5" width="22" height="22"><polyline points="20 6 9 17 4 12"/></svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 1024px) { #code .inner > div:last-child { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  )
}

// === HEARTBEAT — Live pulsing bars + metrics ===
function Heartbeat() {
  const [latencies, setLatencies] = useState(() => Array(60).fill(0).map(() => Math.random() * 150 + 50))
  const [tick, setTick] = useState(0)
  const animRef = useRef(null)

  // Fetch real latency + animate bars
  useEffect(() => {
    let running = true
    const seed = async () => {
      try {
        const r = await fetch('https://34-156-149-38.sslip.io/aetherapi/v1/telemetry')
        const t = await r.json()
        const arr = t && Array.isArray(t.recent_latency_ms) ? t.recent_latency_ms : []
        if (arr.length && running) {
          const pad = Array(Math.max(0, 60 - arr.length)).fill(arr[0])
          setLatencies(pad.concat(arr).slice(-60))
        }
      } catch { /* keep defaults */ }
    }
    seed()
    const seedTimer = setInterval(seed, 15000)

    // Animate tick for bars
    let frame
    const animate = () => {
      if (!running) return
      setTick(t => t + 1)
      frame = requestAnimationFrame(animate)
    }
    // Only tick every 200ms for smooth but not janky
    const tickTimer = setInterval(() => { if (running) setTick(t => t + 1) }, 200)

    return () => { running = false; clearInterval(seedTimer); clearInterval(tickTimer); cancelAnimationFrame(frame) }
  }, [])

  const endpoints = [
    { name: '/v1/x402/market-pulse', latency: '~320ms', status: 'up' },
    { name: '/v1/x402/sentiment', latency: '~280ms', status: 'up' },
    { name: '/v1/x402/gas', latency: '~180ms', status: 'up' },
    { name: '/v1/x402/wallet-intel', latency: '~450ms', status: 'up' },
    { name: '/v1/crypto/price', latency: '~120ms', status: 'up' },
    { name: '/v1/health', latency: '~5ms', status: 'up' },
  ]

  const maxLat = Math.max(100, ...latencies)

  return (
    <section id="heartbeat" data-animate style={{ textAlign: 'center' }}>
      <div className="inner">
        <div className="section-label">
          <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path strokeLinejoin="round" strokeLinecap="round" d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          System Status
        </div>
        <h2 className="section-title">Live Infrastructure</h2>
        <p className="section-desc" style={{ margin: '0 auto' }}>Real-time health of every API endpoint.</p>
        <div data-animate-card style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 72 }}>
          {/* Animated bar chart */}
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', borderRadius: 24, padding: 36, textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
              <div style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="var(--green)" strokeWidth="1.5"><path strokeLinejoin="round" strokeLinecap="round" d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                Request Volume
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600, background: 'rgba(16,185,129,0.12)', color: 'var(--green)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor', boxShadow: '0 0 8px currentColor' }} />
                Live
              </div>
            </div>
            {/* Bar chart */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 120, marginBottom: 20 }}>
              {latencies.map((v, i) => {
                const h = Math.max(4, (v / maxLat) * 100)
                const isNew = i >= latencies.length - 1
                return (
                  <div key={i} style={{
                    flex: 1, height: `${h}%`,
                    background: isNew
                      ? 'linear-gradient(180deg, #a855f7, #7c3aed)'
                      : `linear-gradient(180deg, rgba(168,85,247,${0.3 + (v / maxLat) * 0.5}), rgba(168,85,247,${0.1 + (v / maxLat) * 0.2}))`,
                    borderRadius: 2,
                    transition: 'height 0.3s ease-out',
                    boxShadow: isNew ? '0 0 8px rgba(168,85,247,0.4)' : 'none',
                  }} />
                )
              })}
            </div>
            {/* Pulsing numbers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: 'var(--green)' }}>99.9%</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Uptime</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: 'var(--purple-light)' }}>~{Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)}ms</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Latency</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: 'var(--green)' }}>94.0%</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Success Rate</div>
              </div>
            </div>
          </div>
          {/* Endpoint Health */}
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', borderRadius: 24, padding: 36, textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
              <div style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="var(--purple-light)" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path strokeLinejoin="round" strokeLinecap="round" d="M12 6v6l4 2"/></svg>
                Endpoint Health
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {endpoints.map(ep => (
                <div key={ep.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem', fontWeight: 500 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px var(--green)' }} />
                    {ep.name}
                  </div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', color: 'var(--text-sec)' }}>{ep.latency}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 1024px) { #heartbeat .inner > div:last-child { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  )
}

// === FOUNDERS ===
function Founders() {
  const [calcCalls, setCalcCalls] = useState(10000)
  const [calcTokens, setCalcTokens] = useState(500)
  const [calcResult, setCalcResult] = useState(null)

  const perks = [
    { icon: '⟠', title: '50% Lifetime Discount', desc: 'Every endpoint. Every call. Forever. As long as the network exists, you pay half. This is not a promo — it is a protocol-level lock.', color: 'var(--purple-light)' },
    { icon: '⊘', title: 'Roadmap Vote', desc: 'You don\'t just request features — you vote on what ships next. Founders steer the direction of 100+ APIs. Direct governance.', color: 'var(--cyan)' },
    { icon: '⟡', title: 'Direct Line', desc: 'Priority support on X. When something breaks at 3am, you get a response. Not a ticket number — a builder who cares.', color: 'var(--magenta-light)' },
  ]

  return (
    <section id="founders" data-animate style={{ textAlign: 'center', padding: '40px 20px 80px', position: 'relative', overflow: 'hidden' }}>
      {/* Subtle gradient backdrop */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 30%, rgba(168,85,247,0.04) 0%, transparent 60%)', filter: 'blur(100px)' }} />
      <div className="inner" style={{ position: 'relative', zIndex: 1 }}>
        <div className="section-label">
          <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinejoin="round" strokeLinecap="round"/><circle cx="9" cy="7" r="4" strokeLinejoin="round" strokeLinecap="round"/><path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeLinejoin="round" strokeLinecap="round"/><path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinejoin="round" strokeLinecap="round"/></svg>
          Founding Agents
        </div>
        <h2 className="section-title">First 10 agents pay half, forever.</h2>
        <p className="section-desc" style={{ margin: '0 auto', maxWidth: 600 }}>
          The agent economy is being built right now. Founders don't just use it — they shape it. When the 10 spots are gone, they're gone.
        </p>

        {/* Perk cards — expanded */}
        <div data-animate-card style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 56, maxWidth: 960, margin: '56px auto 0' }}>
          {perks.map(p => (
            <div key={p.title} className="glass-card" style={{ padding: '32px 24px', textAlign: 'left', borderTop: `2px solid ${p.color}30`, transition: 'all 0.3s ease' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = '1px solid rgba(168,85,247,0.3)'; e.currentTarget.style.borderTop = `2px solid ${p.color}30`; e.currentTarget.querySelector('.perk-desc').style.opacity = '1' }}
              onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.borderColor = ''; e.currentTarget.style.borderTop = ''; e.currentTarget.querySelector('.perk-desc').style.opacity = '0.5' }}
            >
              <div style={{ fontSize: '1.8rem', marginBottom: 14, lineHeight: 1 }}>{p.icon}</div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>{p.title}</h3>
              <p className="perk-desc" style={{ color: 'var(--text-sec)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0, opacity: 0.5, transition: 'opacity 0.3s ease' }}>{p.desc}</p>
            </div>
          ))}
        </div>

        {/* Founder calculator */}
        <div data-animate-card style={{ maxWidth: 680, margin: '32px auto 0', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, backdropFilter: 'blur(12px)', padding: '28px 28px 24px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/></svg>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>Founder savings calculator</div>
              <div style={{ color: 'var(--text-sec)', fontSize: '0.82rem' }}>Estimate your monthly savings with 50% lifetime discount</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Monthly API calls</label>
              <input
                type="number"
                value={calcCalls}
                onChange={e => setCalcCalls(Number(e.target.value) || 0)}
                style={{
                  width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.25)',
                  border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10,
                  color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9rem',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Average tokens per call</label>
              <input
                type="number"
                value={calcTokens}
                onChange={e => setCalcTokens(Number(e.target.value) || 0)}
                style={{
                  width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.25)',
                  border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10,
                  color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9rem',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
          <button
            onClick={() => {
              const retail = calcCalls * 0.002
              const founder = calcCalls * 0.0008
              setCalcResult({ retail, founder, savings: retail - founder })
            }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px',
              background: 'linear-gradient(135deg, var(--purple-deep), var(--magenta))',
              color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: '0.85rem',
              cursor: 'pointer', boxShadow: '0 4px 16px rgba(168,85,247,0.25)', transition: 'all 0.3s',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/></svg>
            Calculate
          </button>
          {calcResult && (
            <div style={{
              marginTop: 20, padding: '16px 20px',
              background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.1)',
              borderRadius: 12, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem',
              lineHeight: 1.8,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Retail cost:</span>
                <span style={{ textDecoration: 'line-through', color: 'var(--text-sec)' }}>${calcResult.retail.toFixed(2)}/mo</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--purple-light)', fontWeight: 600 }}>
                <span>Founder cost:</span>
                <span>${calcResult.founder.toFixed(2)}/mo</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 10, borderTop: '1px solid rgba(168,85,247,0.12)' }}>
                <span style={{ fontWeight: 700, color: 'var(--text)' }}>You save:</span>
                <span style={{
                  fontWeight: 800, fontSize: '1rem',
                  background: 'linear-gradient(135deg, var(--purple), var(--magenta))',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>${calcResult.savings.toFixed(2)}/month</span>
              </div>
            </div>
          )}
        </div>

        {/* CTA row */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 36 }}>
          <a href="https://x.com/aetheriusxAPI" target="_blank" rel="noreferrer" className="btn btn-primary" style={{ fontSize: '0.9rem' }}>
            Claim founder spot
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
          <a href="https://t.me/aetheriusxAPI_global" target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ fontSize: '0.9rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            Telegram
          </a>
        </div>

      </div>
      <style>{`
        @media (max-width: 768px) { #founders .inner > div:nth-child(3) { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  )
}

// === CTA ===
function CTA() {
  return (
    <section id="cta" data-animate style={{ textAlign: 'center' }}>
      <div className="inner">
        <div style={{
          padding: '80px 60px', background: 'linear-gradient(135deg, rgba(168,85,247,0.06), rgba(217,70,239,0.06))',
          border: '1px solid rgba(168,85,247,0.14)', borderRadius: 32, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 50%, rgba(168,85,247,0.06), transparent 50%), radial-gradient(circle at 70% 50%, rgba(217,70,239,0.1), transparent 50%)' }} />
          <div className="section-label" style={{ justifyContent: 'center', position: 'relative', zIndex: 1 }}>
            <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            Get Started
          </div>
          <h2 className="section-title" style={{ position: 'relative', zIndex: 1 }}>
            Ready to Build the<br /><span className="grad">Agent Economy</span>?
          </h2>
          <p className="section-desc" style={{ margin: '0 auto 48px', position: 'relative', zIndex: 1 }}>Start building today. Health and telemetry free, forever.</p>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', position: 'relative', zIndex: 1 }}>
            <a href="https://x.com/aetheriusxAPI" target="_blank" rel="noreferrer" className="btn btn-primary">
              Follow on X
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5"><path strokeLinejoin="round" strokeLinecap="round" d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
            <a href="https://github.com/wilnowilx/aetheriusxapi" target="_blank" rel="noreferrer" className="btn btn-secondary">
              View GitHub
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5"><path strokeLinejoin="round" strokeLinecap="round" d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

// === FOOTER — Professional ===
function Footer() {
  const [year] = useState(new Date().getFullYear())
  return (
    <footer style={{ position: 'relative', borderTop: '1px solid rgba(168,85,247,0.08)' }}>
      {/* Top gradient line */}
      <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.2), transparent)' }} />

      <div className="inner" style={{ padding: '80px 0 40px' }}>
        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 48, marginBottom: 56 }}>
          {/* Brand */}
          <div>
            <a href="#hero" className="brand" style={{ marginRight: 0, fontSize: '1.1rem' }}>AETHERIUS</a>
            <p style={{ color: 'var(--text-sec)', fontSize: '0.9rem', marginTop: 16, lineHeight: 1.7, maxWidth: 300 }}>
              The operating system for AI agent commerce. Infrastructure for machines that pay for themselves.
            </p>
            {/* Stats row */}
            <div style={{ display: 'flex', gap: 20, marginTop: 24 }}>
              {[
                { val: '100+', label: 'APIs' },
                { val: '99.9%', label: 'Uptime' },
                { val: 'x402', label: 'Protocol' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: 'var(--purple-light)' }}>{s.val}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 20 }}>Product</h4>
            <ul style={{ listStyle: 'none' }}>
              {[
                ['#product', 'Product'],
                ['#system', 'System'],
                ['#join', 'Founders'],
                ['dashboard/', 'Dashboard'],
              ].map(([href, text]) => (
                <li key={text} style={{ marginBottom: 12 }}>
                  <a href={href} style={{ color: 'var(--text-sec)', textDecoration: 'none', fontSize: '0.88rem', transition: 'color 0.2s' }}>{text}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Developers */}
          <div>
            <h4 style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 20 }}>Developers</h4>
            <ul style={{ listStyle: 'none' }}>
              {[
                ['https://github.com/wilnowilx/aetheriusxapi/blob/main/docs/API.md', 'Documentation'],
                ['https://github.com/wilnowilx/aetheriusxapi', 'GitHub'],
                ['https://github.com/wilnowilx/aetheriusxapi/tree/main/sdks', 'SDKs'],
                ['https://docs.x402.org', 'x402 Protocol'],
              ].map(([href, text]) => (
                <li key={text} style={{ marginBottom: 12 }}>
                  <a href={href} target="_blank" rel="noreferrer" style={{ color: 'var(--text-sec)', textDecoration: 'none', fontSize: '0.88rem', transition: 'color 0.2s', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    {text}
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Network */}
          <div>
            <h4 style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 20 }}>Network</h4>
            <ul style={{ listStyle: 'none' }}>
              {[
                ['#system', 'System'],
                ['#join', 'Community'],
                ['https://x.com/aetheriusxAPI', 'X / Twitter'],
                ['https://t.me/aetheriusxAPI_global', 'Telegram'],
              ].map(([href, text]) => (
                <li key={text} style={{ marginBottom: 12 }}>
                  <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer' : undefined} style={{ color: 'var(--text-sec)', textDecoration: 'none', fontSize: '0.88rem', transition: 'color 0.2s' }}>{text}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 20 }}>Legal</h4>
            <ul style={{ listStyle: 'none' }}>
              {[
                ['MIT License', 'Open Source'],
                ['#heartbeat', 'System Status'],
              ].map(([text, sub]) => (
                <li key={text} style={{ marginBottom: 12 }}>
                  <span style={{ color: 'var(--text-sec)', fontSize: '0.88rem' }}>{text}</span>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)', marginBottom: 32 }} />

        {/* Bottom row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>&copy; {year} AETHERIUS. All rights reserved.</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: 'rgba(255,255,255,0.1)', padding: '4px 10px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 6 }}>
              Base Mainnet · USDC · 0x677B…7f61
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              ['https://x.com/aetheriusxAPI', <svg key="x" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>],
              ['https://github.com/wilnowilx/aetheriusxapi', <svg key="gh" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>],
              ['https://t.me/aetheriusxAPI_global', <svg key="tg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>],
            ].map(([href, icon]) => (
              <a key={href} href={href} target="_blank" rel="noreferrer" style={{
                width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.04)', borderRadius: 8, color: 'var(--text-sec)',
                transition: 'all 0.25s', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.05)',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(168,85,247,0.1)'; e.currentTarget.style.borderColor = 'rgba(168,85,247,0.2)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)' }}
              >{icon}</a>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 1100px) { footer .inner > div:first-child { grid-template-columns: 1.5fr 1fr 1fr !important; } }
        @media (max-width: 768px) { footer .inner > div:first-child { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 480px) { footer .inner > div:first-child { grid-template-columns: 1fr !important; } }
      `}</style>
    </footer>
  )
}

// === ERROR BOUNDARY (a crashing section must never blank the page) ===
class SectionBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { crashed: false }
  }
  static getDerivedStateFromError() {
    return { crashed: true }
  }
  componentDidCatch(err) {
    if (typeof console !== 'undefined') console.error('[AETHERIUS] section crashed:', err)
  }
  render() {
    if (this.state.crashed) {
      return this.props.fallback || null
    }
    return this.props.children
  }
}

// === DOT NAV (restored slide traction — IO highlight, click to glide) ===
const DOT_SECTIONS = [
  ['hero', 'Vision'], ['product', 'Product'], ['system', 'System'], ['join', 'Join'],
]

function DotNav() {
  const [active, setActive] = useState('hero')

  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) })
    }, { rootMargin: '-30% 0px -50% 0px' })
    DOT_SECTIONS.forEach(([id]) => {
      const el = document.getElementById(id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [])

  const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div className="dot-nav" aria-hidden="true">
      {DOT_SECTIONS.map(([id, label]) => (
        <button key={id} title={label} onClick={() => go(id)}
          className={active === id ? 'dot active' : 'dot'} />
      ))}
      <style>{`
        .dot-nav {
          position: fixed; right: 22px; top: 50%; transform: translateY(-50%);
          display: flex; flex-direction: column; gap: 8px; z-index: 900;
        }
        .dot-nav .dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: rgba(255,255,255,0.18); border: none; cursor: pointer;
          padding: 0; transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
        }
        .dot-nav .dot:hover { background: rgba(192,132,252,0.7); transform: scale(1.3); }
        .dot-nav .dot.active {
          background: var(--magenta-light);
          box-shadow: 0 0 10px var(--magenta), 0 0 20px rgba(217,70,239,0.4);
          transform: scale(1.35);
        }
        @media (max-width: 1100px) { .dot-nav { display: none; } }
      `}</style>
    </div>
  )
}

// === SCREEN 1: THE VISION ===
function VisionScreen({ children }) {
  // Hero already renders its own <section id="hero"> — no wrapping <section> needed.
  return <>{children}</>
}

// === SCREEN 2: THE PRODUCT — X402 Dashboard ===
function ProductScreen({ children }) {
  // children = [X402Intelligence, Playground, HowItWorks]
  // Layout: full-width dashboard, 3-column on desktop
  return (
    <section id="product" style={{ scrollSnapAlign: 'start', minHeight: 'auto', padding: '80px 0', position: 'relative', overflow: 'hidden' }}>
      {/* Ambient nebula */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse at 20% 30%, rgba(168,85,247,0.05) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(34,211,238,0.04) 0%, transparent 50%)', filter: 'blur(200px)' }} />
      <div className="inner" style={{ position: 'relative', zIndex: 1 }}>
        {/* Dashboard header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="section-label">
              <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              X402 Intelligence Dashboard
            </div>
            <h2 className="section-title" style={{ margin: '8px 0 0' }}>Explore the Platform</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 9999 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 8px var(--green)' }} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', fontWeight: 600, color: 'var(--green)' }}>100+ APIs Live</span>
          </div>
        </div>
        {/* 3-column dashboard grid */}
        <div className="product-dashboard" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
          {children}
        </div>
      </div>
      <style>{`
        @media (min-width: 1024px) { .product-dashboard { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  )
}

// === SCREEN 3: THE SYSTEM — Developer Console ===
function SystemScreen({ children }) {
  // children = [CodeSection, Heartbeat, Features]
  return (
    <section id="system" style={{ scrollSnapAlign: 'start', minHeight: 'auto', padding: '80px 0', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, background: 'linear-gradient(180deg, rgba(168,85,247,0.03) 0%, transparent 100%)' }} />
      <div className="inner" style={{ position: 'relative', zIndex: 1 }}>
        {/* Console header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="section-label">
              <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              Developer Console
            </div>
            <h2 className="section-title" style={{ margin: '8px 0 0' }}>Built for Developers</h2>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['Python', 'JavaScript', 'cURL'].map(lang => (
              <span key={lang} style={{ padding: '6px 14px', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.12)', color: 'var(--purple-light)' }}>{lang}</span>
            ))}
          </div>
        </div>
        <div className="system-console" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
          {children}
        </div>
      </div>
    </section>
  )
}

// === SCREEN 4: JOIN — Founding ===
function JoinScreen({ children }) {
  // children = [Founders, CTA]
  return (
    <section id="join" style={{ scrollSnapAlign: 'start', minHeight: 'auto', padding: '80px 0', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse at 50% 30%, rgba(168,85,247,0.04) 0%, transparent 60%)', filter: 'blur(100px)' }} />
      <div className="inner" style={{ position: 'relative', zIndex: 1 }}>
        {/* Urgency header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="section-label" style={{ justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinejoin="round" strokeLinecap="round"/><circle cx="9" cy="7" r="4" strokeLinejoin="round" strokeLinecap="round"/><path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeLinejoin="round" strokeLinecap="round"/><path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinejoin="round" strokeLinecap="round"/></svg>
            Founding Agents
          </div>
          <h2 className="section-title" style={{ margin: '12px 0 8px' }}>First 10 agents pay half, forever.</h2>
          <p style={{ color: 'var(--text-sec)', fontSize: '1rem', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
            The agent economy is being built right now. Founders don't just use it — they shape it. When the 10 spots are gone, they're gone.
          </p>
          {/* Urgency progress bar */}
          <div style={{ maxWidth: 280, margin: '24px auto 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: '50%', height: '100%', background: 'linear-gradient(90deg, var(--purple), var(--magenta))', borderRadius: 4, transition: 'width 1s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <span style={{ color: 'var(--text-sec)', fontSize: '0.82rem' }}>5/10 spots taken</span>
              <span style={{ color: 'var(--purple-light)', fontSize: '0.75rem', fontWeight: 600 }}>Only 5 remaining</span>
            </div>
          </div>
        </div>
        {children}
      </div>
    </section>
  )
}

// === APP ===
function App() {
  const appRef = useRef(null)
  useScrollAnimations()
  useSmoothScroll()

  useEffect(() => {
    window.scrollTo(0, 0)
    const handler = () => { if (!window.location.hash) window.scrollTo(0, 0) }
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])

  return (
    <div ref={appRef}>
      <PlasmaBg />
      <Nav />
      <NetworkStatus />

      {/* Screen 1: The Vision — Hero + Globe */}
      <SectionBoundary fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#06060e', color: '#a855f7', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>Loading vision…</div>}>
        <VisionScreen>
          <Hero />
        </VisionScreen>
      </SectionBoundary>

      {/* Screen 2: The OS — Live Desktop Environment */}
      <SectionBoundary fallback={<div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#06060e', color: '#d946ef', fontFamily: 'JetBrains Mono, monospace', gap: 16 }}>
        <span style={{ fontSize: 32, opacity: 0.5 }}>◈</span>
        <span style={{ fontSize: '0.8rem' }}>AETHERIUS OS</span>
        <span style={{ fontSize: '0.65rem', color: '#8a8a9a' }}>Initializing…</span>
      </div>}>
        <AetheriusOS />
      </SectionBoundary>

      <Footer />
    </div>
  )
}

export default App
