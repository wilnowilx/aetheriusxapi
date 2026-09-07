import React, { useEffect, useRef, useState, useCallback } from 'react'
import Hero from './components/Hero'
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

  return (
    <>
      <nav className={scrolled ? 'scrolled' : ''}>
        <div className="nav-wrap">
          <a
            href="#hero"
            className="brand"
            aria-hidden={!pastHero}
            style={{
              opacity: pastHero ? 1 : 0,
              transform: pastHero ? 'none' : 'translateY(-8px)',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
              pointerEvents: pastHero ? 'auto' : 'none',
            }}
          >
            AETHERIUS
          </a>
          <div className="nav-links">
            <a href="#playground">Playground</a>
            <a href="#categories">APIs</a>
            <a href="#how">How It Works</a>
            <a href="#heartbeat">Status</a>
            <a href="#telemetry">Telemetry</a>
            <a href="dashboard/">Dashboard</a>
            <a href="#cta" className="btn-nav">Get Started</a>
          </div>
          <button className="mobile-toggle" onClick={() => setMobileOpen(true)}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
        </div>
      </nav>
      {mobileOpen && (
        <div className="mobile-nav open">
          <button className="close-btn" onClick={() => setMobileOpen(false)}>×</button>
          <a href="#playground" onClick={() => setMobileOpen(false)}>Playground</a>
          <a href="#categories" onClick={() => setMobileOpen(false)}>APIs</a>
          <a href="#how" onClick={() => setMobileOpen(false)}>How It Works</a>
          <a href="#features" onClick={() => setMobileOpen(false)}>Features</a>
          <a href="#code" onClick={() => setMobileOpen(false)}>Code</a>
          <a href="#heartbeat" onClick={() => setMobileOpen(false)}>Status</a>
          <a href="#telemetry" onClick={() => setMobileOpen(false)}>Telemetry</a>
          <a href="#limits" onClick={() => setMobileOpen(false)}>Rate Limits</a>
          <a href="#cta" className="btn btn-primary" onClick={() => setMobileOpen(false)}>Get Started</a>
        </div>
      )}
    </>
  )
}

// === PLASMA BACKGROUND ===
function PlasmaBg() {
  return (
    <div className="plasma-bg">
      <div className="plasma-blob" style={{ width: 700, height: 700, background: 'radial-gradient(circle, rgba(168,85,247,0.55) 0%, transparent 70%)', top: '-10%', left: '-5%', animationDuration: '16s' }} />
      <div className="plasma-blob" style={{ width: 580, height: 580, background: 'radial-gradient(circle, rgba(217,70,239,0.48) 0%, transparent 70%)', top: '30%', right: '-10%', animationDuration: '13s', animationDelay: '-5s' }} />
      <div className="plasma-blob" style={{ width: 520, height: 520, background: 'radial-gradient(circle, rgba(236,72,153,0.42) 0%, transparent 70%)', bottom: '-5%', left: '20%', animationDuration: '15s', animationDelay: '-10s' }} />
      <div className="plasma-blob" style={{ width: 460, height: 460, background: 'radial-gradient(circle, rgba(6,182,212,0.34) 0%, transparent 70%)', top: '60%', left: '50%', animationDuration: '12s', animationDelay: '-3s' }} />
      <div className="plasma-blob" style={{ width: 400, height: 400, background: 'radial-gradient(circle, rgba(168,85,247,0.34) 0%, transparent 70%)', top: '10%', left: '40%', animationDuration: '17s', animationDelay: '-8s' }} />
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
  { cat: 'Maps', icon: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z', items: [
    { method: 'GET', path: '/v1/maps/search', price: '$0.01', params: '{"query":"coffee shop","location":"Mexico City"}' },
    { method: 'GET', path: '/v1/maps/reviews', price: '$0.02', params: '{"place_id":"ChIJN1t_tDeuEmsRUsoyG83frY4"}' },
  ]},
  { cat: 'Crypto', icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6', items: [
    { method: 'GET', path: '/v1/token/price', price: '$0.005', params: '{"token":"ETH"}' },
    { method: 'GET', path: '/v1/token/analyze', price: '$0.01', params: '{"address":"0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"}' },
  ]},
  { cat: 'Crypto Market', icon: 'M22 12h-4l-3 9L9 3l-3 9H2', items: [
    { method: 'GET', path: '/v1/crypto/market', price: '$0.005', params: '{"token":"ETH"}' },
    { method: 'GET', path: '/v1/crypto/fear-greed', price: '$0.005', params: '{}' },
    { method: 'GET', path: '/v1/crypto/trending', price: '$0.01', params: '{}' },
    { method: 'GET', path: '/v1/crypto/ohlcv', price: '$0.01', params: '{"token":"ETH","interval":"1d"}' },
    { method: 'GET', path: '/v1/crypto/dominance', price: '$0.005', params: '{}' },
  ]},
  { cat: 'Web', icon: 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z', items: [
    { method: 'GET', path: '/v1/web/scrape', price: '$0.01', params: '{"url":"https://example.com"}' },
  ]},
  { cat: 'Data', icon: 'M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z', items: [
    { method: 'GET', path: '/v1/data/weather', price: '$0.005', params: '{"lat":"19.4326","lon":"-99.1332"}' },
    { method: 'GET', path: '/v1/email/validate', price: '$0.005', params: '{"email":"test@example.com"}' },
  ]},
  { cat: 'Web Tools', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', items: [
    { method: 'GET', path: '/v1/web/whois', price: '$0.01', params: '{"domain":"example.com"}' },
    { method: 'GET', path: '/v1/web/headers', price: '$0.005', params: '{"url":"https://example.com"}' },
    { method: 'GET', path: '/v1/web/ssl-check', price: '$0.005', params: '{"domain":"example.com"}' },
  ]},
  { cat: 'Data Tools', icon: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z', items: [
    { method: 'GET', path: '/v1/data/ip-geo', price: '$0.005', params: '{"ip":"8.8.8.8"}' },
    { method: 'GET', path: '/v1/data/ua-parser', price: '$0.002', params: '{"ua":"Mozilla/5.0"}' },
    { method: 'GET', path: '/v1/data/hash', price: '$0.002', params: '{"input":"hello","algo":"sha256"}' },
    { method: 'GET', path: '/v1/data/uuid', price: '$0.001', params: '{}' },
    { method: 'GET', path: '/v1/data/qr-code', price: '$0.003', params: '{"text":"https://aetheriusx.io"}' },
    { method: 'POST', path: '/v1/data/translate', price: '$0.01', params: '{"text":"hello","target":"es"}' },
    { method: 'POST', path: '/v1/data/summarize', price: '$0.02', params: '{"text":"Long article text..."}' },
  ]},
  { cat: 'News', icon: 'M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2', items: [
    { method: 'GET', path: '/v1/news/reddit', price: '$0.005', params: '{"subreddit":"cryptocurrency"}' },
    { method: 'GET', path: '/v1/news/devto', price: '$0.005', params: '{"tag":"javascript"}' },
  ]},
  { cat: 'DeFi & Token', icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6', items: [
    { method: 'GET', path: '/v1/defi/il-calculator', price: '$0.01', params: '{"pair":"ETH/USDC","range":"30d"}' },
    { method: 'GET', path: '/v1/defi/staking-apy', price: '$0.005', params: '{"protocol":"lido","token":"ETH"}' },
    { method: 'GET', path: '/v1/token/nft-metadata', price: '$0.01', params: '{"contract":"0x...","tokenId":"1"}' },
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
    <section id="playground" data-animate style={{ paddingTop: 40 }}>
      <div className="inner">
        <div className="section-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Live Playground
        </div>
        <h2 className="section-title">Try It Right Now</h2>
        <p className="section-desc" style={{ margin: '0 auto' }}>Select an endpoint and see real responses. No signup required.</p>

        <div data-animate-card style={{
          display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, marginTop: 56,
          background: 'rgba(10,10,20,0.6)', border: '1px solid rgba(168,85,247,0.25)',
          borderRadius: 20, overflow: 'hidden', minHeight: 500, position: 'relative',
          boxShadow: '0 0 60px rgba(168,85,247,0.08), 0 0 120px rgba(217,70,239,0.04)',
        }}>
          {/* Sidebar */}
          <div style={{ background: 'rgba(255,255,255,0.02)', borderRight: '1px solid var(--border)', padding: 16, overflowY: 'auto', maxHeight: 500 }}>
            {playgroundEndpoints.map(group => (
              <div key={group.cat} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--purple-light)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={group.icon}/></svg>
                  {group.cat}
                </div>
                {group.items.map(ep => (
                  <div key={ep.path} role="button" tabIndex={0}
                    onClick={() => selectFromSidebar(ep)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectFromSidebar(ep) } }}
                    style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8,
                    cursor: 'pointer', fontSize: '0.82rem', border: '1px solid transparent',
                    transition: 'all 0.25s', background: selected.path === ep.path ? 'rgba(168,85,247,0.15)' : 'transparent',
                    borderColor: selected.path === ep.path ? 'rgba(168,85,247,0.35)' : 'transparent',
                  }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: ep.method === 'POST' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)', color: ep.method === 'POST' ? 'var(--orange)' : 'var(--green)' }}>{ep.method}</span>
                    <span style={{ flex: 1, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text)' }}>{ep.path.replace('/v1/', '/')}</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: 'var(--magenta-light)' }}>{ep.price}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Main area */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', fontWeight: 600, padding: '4px 10px', borderRadius: 6, background: selected.method === 'POST' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)', color: selected.method === 'POST' ? 'var(--orange)' : 'var(--green)' }}>{selected.method}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9rem', color: 'var(--text)' }}>{selected.path}</span>
              </div>
              <button onClick={sendRequest} disabled={loading} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px',
                background: 'linear-gradient(135deg, var(--purple-deep), var(--magenta))',
                color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: '0.85rem',
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1,
                boxShadow: '0 4px 16px rgba(168,85,247,0.3)', transition: 'all 0.3s',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Send
              </button>
            </div>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Parameters</div>
              <textarea value={params} onChange={e => setParams(e.target.value)} style={{
                width: '100%', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem',
                padding: '12px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)',
                borderRadius: 10, color: 'var(--text)', minHeight: 44, outline: 'none', resize: 'vertical',
              }} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Response</span>
                {status && <span style={{ fontFamily: 'JetBrains Mono, monospace', padding: '2px 8px', borderRadius: 4, background: 'rgba(16,185,129,0.15)', color: 'var(--green)' }}>{status}</span>}
                {time && <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-sec)' }}>{time}</span>}
              </div>
              <div style={{ flex: 1, padding: 20, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--text)', overflowY: 'auto', maxHeight: 300, background: 'rgba(0,0,0,0.15)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {loading ? <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Loading...</span> :
                 response || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Click "Send" to make a request...</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, padding: '12px 20px', borderTop: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', flexWrap: 'wrap' }}>
              {['x402 Payment Required', 'USDC on Base', 'Settled instantly'].map(b => (
                <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: 9999, fontSize: '0.72rem', fontWeight: 500, color: 'var(--purple-light)' }}>{b}</div>
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

// === CATEGORIES ===
function Categories() {
  const cats = [
    { title: 'Maps & Location', count: '5 live', icon: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z' },
    { title: 'Crypto & DeFi', count: '19 live', icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
    { title: 'Web & Scraping', count: '4 live', icon: 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z' },
    { title: 'AI & ML', count: 'soon', icon: 'M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z', soon: true },
    { title: 'Finance', count: '3 live', icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
    { title: 'Communication', count: '1 live', icon: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z' },
    { title: 'Weather', count: '3 live', icon: 'M17 18a5 5 0 0 0-10 0' },
    { title: 'News & Media', count: '6 live', icon: 'M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2' },
    { title: 'Security', count: 'soon', icon: 'M3 11h18M7 11V7a5 5 0 0 1 10 0v4', soon: true },
    { title: 'Data & Analytics', count: '8 live', icon: 'M21.21 15.89A10 10 0 1 1 8 2.83' },
    { title: 'Crypto Market Data', count: '5 live', icon: 'M22 12h-4l-3 9L9 3l-3 9H2' },
    { title: 'Web Tools', count: '3 live', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' },
    { title: 'Data Tools', count: '7 live', icon: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' },
    { title: 'Gaming', count: 'soon', icon: 'M2 6h20M6 12h4M14 12h4', soon: true },
    { title: 'Health & Science', count: 'soon', icon: 'M22 12h-4l-3 9L9 3l-3 9H2', soon: true },
  ]

  return (
    <section id="categories" data-animate style={{ textAlign: 'center' }}>
      <div className="inner">
        <div className="section-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          API Categories
        </div>
        <h2 className="section-title">100+ Live Endpoints, More Weekly</h2>
        <p className="section-desc" style={{ margin: '0 auto' }}>Production APIs across maps, DeFi, web, data, forex and news — new verticals shipping weekly.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 48 }}>
          {cats.map(cat => (
            <div key={cat.title} data-animate-card style={{
              padding: '16px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 12, textAlign: 'center', cursor: 'pointer', transition: 'all 0.5s',
            }}>
              <div style={{ width: 36, height: 36, margin: '0 auto 8px', background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(217,70,239,0.1))', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--purple-light)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={cat.icon}/></svg>
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: 4 }}>{cat.title}</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: cat.soon ? 'var(--text-muted)' : 'var(--magenta-light)' }}>{cat.count}</div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 1024px) { #categories .inner > div:last-child { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 768px) { #categories .inner > div:last-child { grid-template-columns: 1fr 1fr; } }
      `}</style>
    </section>
  )
}

// === X402 INTELLIGENCE ===
function X402Intelligence() {
  const cards = [
    { title: 'Brain Recommender', desc: 'Tell it what you need — "defi", "wallet", "gas" — and it recommends the best endpoints. AI-powered routing.', code: 'GET /v1/x402/brain?intent=defi', color: 'var(--purple-light)', bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.3)', iconBg: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(217,70,239,0.12))', icon: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>' },
    { title: 'Market Pulse', desc: 'Real-time Base conditions: gas, chain health, USDC activity, ETH price, bullish/bearish signal. One call.', code: 'GET /v1/x402/market-pulse', color: 'var(--green)', bg: 'rgba(16,185,129,0.1)', border: 'rgba(168,85,247,0.3)', iconBg: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(6,182,212,0.12))', icon: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>' },
    { title: 'Wallet Intel', desc: 'Full wallet profile: USDC flow, risk score, counterparty analysis, ETH balance. Any address on Base.', code: 'GET /v1/x402/wallet-intel/{address}', color: 'var(--pink)', bg: 'rgba(236,72,153,0.1)', border: 'rgba(168,85,247,0.3)', iconBg: 'linear-gradient(135deg, rgba(236,72,153,0.12), rgba(168,85,247,0.12))', icon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>' },
    { title: 'Sentiment + Risk', desc: 'Fear & Greed Index + on-chain sentiment. Multi-factor risk scoring with detailed breakdown. Compliance indicators.', code: 'GET /v1/x402/sentiment · /risk-intel', color: 'var(--cyan)', bg: 'rgba(6,182,212,0.1)', border: 'rgba(168,85,247,0.3)', iconBg: 'linear-gradient(135deg, rgba(6,182,212,0.12), rgba(16,185,129,0.12))', icon: '<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>' },
  ]

  return (
    <section id="x402-intel" data-animate style={{ background: 'linear-gradient(180deg, rgba(168,85,247,0.08) 0%, transparent 100%)', textAlign: 'center' }}>
      <div className="inner">
        <div className="section-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          QUANTUMXBrain — FREE Intelligence Layer
        </div>
        <h2 className="section-title">20 Free Endpoints. Real On-Chain Intelligence.</h2>
        <p className="section-desc" style={{ margin: '0 auto' }}>We read Base Mainnet directly + CoinGecko + DefiLlama. No API keys. No accounts. The intelligence layer that NOBODY else offers — completely free.</p>
        <div className="intel-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 48 }}>
          {cards.map(c => (
            <div key={c.title} data-animate-card style={{
              padding: '44px 36px', background: 'var(--bg-card)', border: `1px solid ${c.border}`,
              borderRadius: 24, textAlign: 'left', transition: 'all 0.5s',
            }}>
              <div style={{ width: 64, height: 64, background: c.iconBg, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, color: c.color }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="30" height="30" dangerouslySetInnerHTML={{ __html: c.icon }} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 12 }}>{c.title}</h3>
              <p style={{ color: 'var(--text-sec)', fontSize: '0.95rem', marginBottom: 16 }}>{c.desc}</p>
              <div style={{ padding: '8px 12px', background: c.bg, borderRadius: 8, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: c.color }}>{c.code}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 24, padding: '20px 36px', background: 'var(--bg-card)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 24, textAlign: 'left' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 8 }}>+ 16 More Free Endpoints</h3>
          <p style={{ color: 'var(--text-sec)', fontSize: '0.82rem' }}>Gas Intelligence · Token Discovery · Whale Clustering · DeFi Yield · Tx Patterns · Wallet Compare · Leaderboard · Contract Intel · Velocity · History · Search · Network Health · Stablecoin Flow</p>
        </div>
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '16px 24px', background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: 12 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--purple-light)" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            <span style={{ color: 'var(--purple-light)', fontWeight: 600 }}>20 endpoints · 100% FREE · X-AETHERIUS-Fingerprint header on every response</span>
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

// === HOW IT WORKS ===
function HowItWorks() {
  const steps = [
    { num: '1', title: 'Connect Wallet', desc: 'Your crypto wallet is your identity. No signup, no KYC.', icon: 'M3 11h18M7 11V7a5 5 0 0 1 10 0v4' },
    { num: '2', title: 'Choose API', desc: 'Browse 100+ live endpoints. Pick what your agent needs.', icon: 'M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16z' },
    { num: '3', title: 'Pay Per Request', desc: 'x402 handles payment. USDC on Base. Sub-cent fees.', icon: 'M1 4h22v16H1z' },
    { num: '4', title: 'Get Data', desc: 'Instant response. The agent gets exactly what it needs.', icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
  ]

  return (
    <section id="how" data-animate style={{ textAlign: 'center' }}>
      <div className="inner">
        <div className="section-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
          How It Works
        </div>
        <h2 className="section-title">Four Steps to Autonomous Access</h2>
        <p className="section-desc" style={{ margin: '0 auto' }}>From zero to API access in under a minute.</p>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 0, marginTop: 72 }}>
          {steps.map((step, i) => (
            <React.Fragment key={step.num}>
              <div data-animate-card style={{ flex: 1, maxWidth: 260, textAlign: 'center', padding: '0 16px' }}>
                <div style={{ width: 80, height: 80, margin: '0 auto 24px', background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(217,70,239,0.08))', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--purple-light)', position: 'relative' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="36" height="36"><path d={step.icon}/></svg>
                  <span style={{ position: 'absolute', top: -6, right: -6, width: 28, height: 28, background: 'linear-gradient(135deg, var(--purple), var(--magenta))', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, color: 'white' }}>{step.num}</span>
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 10 }}>{step.title}</div>
                <div style={{ color: 'var(--text-sec)', fontSize: '0.88rem', maxWidth: 200, margin: '0 auto', lineHeight: 1.5 }}>{step.desc}</div>
              </div>
              {i < steps.length - 1 && (
                <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', paddingTop: 36, color: 'var(--purple)', opacity: 0.4 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) { #how .inner > div:last-child { flex-direction: column; align-items: center; gap: 24px; } }
      `}</style>
    </section>
  )
}

// === FEATURES ===
function Features() {
  const features = [
    { title: 'AI-Native Design', desc: 'Built for machines. No accounts, no UI, no human friction. Agents pay and use directly.', icon: 'M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z' },
    { title: 'x402 Protocol', desc: 'HTTP 402 with crypto payments. The emerging standard for machine-to-machine commerce.', icon: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71' },
    { title: 'USDC on Base', desc: 'Stablecoin payments on L2. Sub-cent fees, instant finality, global reach.', icon: 'M1 4h22v16H1z' },
    { title: 'Permissionless', desc: 'No KYC, no subscriptions. Connect wallet and use. That\'s it.', icon: 'M3 11h18M7 11V7a5 5 0 0 1 10 0v4' },
    { title: 'Global Access', desc: 'Anyone with a crypto wallet. No bank account needed. No borders.', icon: 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z' },
    { title: 'Instant Settlement', desc: 'Payments verified on-chain in seconds. No waiting, no intermediaries.', icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
  ]

  return (
    <section id="features" data-animate style={{ textAlign: 'center' }}>
      <div className="inner">
        <div className="section-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M12 2L2 7l10 5 10-5-10-5z"/></svg>
          Features
        </div>
        <h2 className="section-title">Built for the Agent Economy</h2>
        <p className="section-desc" style={{ margin: '0 auto' }}>Every feature designed for machine-to-machine commerce.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 72 }}>
          {features.map(f => (
            <div key={f.title} data-animate-card style={{
              padding: '44px 36px', background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 24, textAlign: 'left', transition: 'all 0.5s',
            }}>
              <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(217,70,239,0.12))', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, color: 'var(--purple-light)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="30" height="30"><path d={f.icon}/></svg>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 12 }}>{f.title}</h3>
              <p style={{ color: 'var(--text-sec)', fontSize: '0.95rem' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 1024px) { #features .inner > div:last-child { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 768px) { #features .inner > div:last-child { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  )
}

// === CODE SECTION ===
function CodeSection() {
  const [tab, setTab] = useState('py')

  const codeBlocks = {
    py: `<span style="color:var(--text-muted)"># Install the SDK</span>\n<span style="color:var(--green)">$</span> <span style="color:var(--text)">pip install aetheriusx</span>\n\n<span style="color:var(--text-muted)"># Initialize with your wallet</span>\n<span style="color:var(--green)">$</span> <span style="color:var(--text)">python</span>\n<span style="color:var(--purple-light)">&gt;&gt;&gt; from</span> aetheriusx <span style="color:var(--purple-light)">import</span> <span style="color:var(--pink)">Client</span>\n<span style="color:var(--purple-light)">&gt;&gt;&gt; client</span> = <span style="color:var(--pink)">Client</span>(<span style="color:var(--magenta-light)">"0xYourWallet"</span>)\n\n<span style="color:var(--text-muted)"># Call any API — payment is automatic</span>\n<span style="color:var(--purple-light)">&gt;&gt;&gt; resp</span> = client.<span style="color:var(--pink)">get</span>(<span style="color:var(--magenta-light)">"/v1/crypto/price"</span>,\n        params={<span style="color:var(--magenta-light)">"token"</span>: <span style="color:var(--magenta-light)">"ETH"</span>})\n\n<span style="color:var(--purple-light)">&gt;&gt;&gt; print</span>(resp.data)\n<span style="color:var(--text-sec)">{</span><span style="color:var(--magenta-light)">"price"</span>: <span style="color:var(--orange)">2384.50</span>, <span style="color:var(--magenta-light)">"change"</span>: <span style="color:var(--orange)">2.3</span><span style="color:var(--text-sec)">}</span>\n<span style="color:var(--green)">$</span> <span style="color:var(--text-muted)"># That's it. Payment handled.</span>`,
    js: `<span style="color:var(--text-muted)">// Install the SDK</span>\n<span style="color:var(--green)">$</span> <span style="color:var(--text)">npm install aetheriusx</span>\n\n<span style="color:var(--text-muted)">// Initialize with your wallet</span>\n<span style="color:var(--purple-light)">import</span> { <span style="color:var(--pink)">Client</span> } <span style="color:var(--purple-light)">from</span> <span style="color:var(--magenta-light)">'aetheriusx'</span>;\n\n<span style="color:var(--purple-light)">const</span> client = <span style="color:var(--purple-light)">new</span> <span style="color:var(--pink)">Client</span>(<span style="color:var(--magenta-light)">'0xYourWallet'</span>);\n\n<span style="color:var(--text-muted)">// Call any API — payment is automatic</span>\n<span style="color:var(--purple-light)">const</span> resp = <span style="color:var(--purple-light)">await</span> client.<span style="color:var(--pink)">get</span>(\n  <span style="color:var(--magenta-light)">'/v1/crypto/price'</span>,\n  { params: { token: <span style="color:var(--magenta-light)">'ETH'</span> } }\n);\n\nconsole.<span style="color:var(--pink)">log</span>(resp.data);\n<span style="color:var(--text-sec)">// { price: 2384.50, change: 2.3 }</span>`,
    curl: `<span style="color:var(--text-muted)"># Make a request with x402 payment</span>\n<span style="color:var(--green)">$</span> <span style="color:var(--text)">curl</span> <span style="color:var(--cyan)">-X GET</span> \\\n  <span style="color:var(--magenta-light)">"https://api.aetheriusx.io/v1/crypto/price?token=ETH"</span> \\\n  <span style="color:var(--cyan)">-H</span> <span style="color:var(--magenta-light)">"X-PAYMENT: 0x...proof"</span> \\\n  <span style="color:var(--cyan)">-H</span> <span style="color:var(--magenta-light)">"Content-Type: application/json"</span>\n\n<span style="color:var(--text-muted)"># Response</span>\n<span style="color:var(--text-sec)">{</span>\n  <span style="color:var(--magenta-light)">"data"</span>: <span style="color:var(--text-sec)">{</span>\n    <span style="color:var(--magenta-light)">"price"</span>: <span style="color:var(--orange)">2384.50</span>,\n    <span style="color:var(--magenta-light)">"change_24h"</span>: <span style="color:var(--orange)">2.3</span>\n  <span style="color:var(--text-sec)">}</span>\n<span style="color:var(--text-sec)">}</span>`,
  }

  return (
    <section id="code" data-animate style={{ textAlign: 'center', background: 'linear-gradient(180deg, rgba(168,85,247,0.03) 0%, transparent 100%)' }}>
      <div className="inner">
        <div className="section-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          For Developers
        </div>
        <h2 className="section-title">Integrate in Minutes</h2>
        <p className="section-desc" style={{ margin: '0 auto' }}>One SDK. Every API. Zero configuration.</p>
        <div data-animate-card style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 48, marginTop: 72, alignItems: 'start' }}>
          <div>
            <div style={{ background: '#0c0c14', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 16, overflow: 'hidden', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }} />
                <span style={{ marginLeft: 12, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>terminal</span>
              </div>
              <div style={{ display: 'flex', gap: 2, padding: '0 16px', background: 'rgba(255,255,255,0.02)' }}>
                {[['py', 'Python'], ['js', 'JavaScript'], ['curl', 'cURL']].map(([key, label]) => (
                  <button key={key} onClick={() => setTab(key)} style={{
                    padding: '10px 16px', background: 'none', border: 'none', color: tab === key ? 'var(--purple-light)' : 'var(--text-muted)',
                    fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', cursor: 'pointer',
                    borderBottom: `2px solid ${tab === key ? 'var(--purple)' : 'transparent'}`, transition: 'all 0.3s',
                  }}>{label}</button>
                ))}
              </div>
              <div style={{ padding: 24, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem', lineHeight: 1.9, minHeight: 300 }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: codeBlocks[tab] }} />
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 20 }}>One line of code.</h3>
            <p style={{ color: 'var(--text-sec)', marginBottom: 32, lineHeight: 1.7 }}>The SDK handles wallet connection, payment negotiation, request signing, and response parsing. Just import and call.</p>
            <ul style={{ listStyle: 'none' }}>
              {['Auto-negotiates payment via x402', 'Python + JavaScript SDKs, typed and tested', 'Type-safe with full IDE support', 'Built-in retry and error handling', 'Zero configuration needed'].map(item => (
                <li key={item} style={{ padding: '14px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14, color: 'var(--text-sec)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" width="22" height="22"><polyline points="20 6 9 17 4 12"/></svg>
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

// === WAITLIST ===
function Waitlist() {
  const [email, setEmail] = useState('')
  const [wallet, setWallet] = useState('')

  const timeline = [
    { date: 'Aug 2026', title: 'Project Started', desc: 'x402 research, architecture design', status: 'done' },
    { date: 'Sep 5, 2026', title: 'Mainnet Launch', desc: '80 endpoints live on Base Mainnet with real USDC', status: 'done' },
    { date: 'Sep 2026', title: 'x402 Intelligence', desc: '20 exclusive on-chain analytics endpoints + grants', status: 'current' },
    { date: 'Q4 2026', title: 'Scale', desc: '120+ endpoints, Go/Rust SDKs, 100 agent-wallets', status: '' },
  ]

  return (
    <section id="waitlist" data-animate style={{ textAlign: 'center' }}>
      <div className="inner">
        <div className="section-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          Early Access
        </div>
        <h2 className="section-title">Join the Agent Economy</h2>
        <p className="section-desc" style={{ margin: '0 auto' }}>We're live on Base Mainnet. Start building with 100+ APIs today. Get early access to new endpoints and exclusive analytics.</p>
        <div data-animate-card style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 72, textAlign: 'left' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 24, padding: 40, backdropFilter: 'blur(20px)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
              {[{ val: '0', label: 'On Waitlist' }, { val: '80+', label: 'Live APIs' }, { val: 'x402', label: 'Protocol' }].map(s => (
                <div key={s.label} style={{ textAlign: 'center', padding: 16, background: 'rgba(168,85,247,0.06)', borderRadius: 12 }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', background: 'linear-gradient(135deg, var(--purple), var(--magenta))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.val}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" style={{ flex: 1, padding: '14px 18px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', fontSize: '0.95rem', outline: 'none' }} />
                <button type="button" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>Join Waitlist <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></button>
              </div>
              <input type="text" value={wallet} onChange={e => setWallet(e.target.value)} placeholder="0x... (optional — for founder perks)" style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['Early mainnet access', 'Priority support', 'Founder pricing locked'].map(p => (
                <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem', color: 'var(--text-sec)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  {p}
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 24, padding: 40, backdropFilter: 'blur(20px)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 32 }}>Launch Roadmap</h3>
            <div style={{ position: 'relative', paddingLeft: 28 }}>
              <div style={{ position: 'absolute', left: 8, top: 8, bottom: 8, width: 2, background: 'var(--border)' }} />
              {timeline.map((t, i) => (
                <div key={i} style={{ position: 'relative', paddingBottom: 32 }}>
                  <div style={{ position: 'absolute', left: -24, top: 6, width: 14, height: 14, borderRadius: '50%', background: t.status === 'done' ? 'var(--green)' : t.status === 'current' ? 'var(--purple)' : 'var(--bg)', border: `2px solid ${t.status === 'done' ? 'var(--green)' : t.status === 'current' ? 'var(--purple)' : 'var(--border)'}`, boxShadow: t.status === 'current' ? '0 0 12px rgba(168,85,247,0.5)' : 'none' }} />
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>{t.date}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>{t.title}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-sec)' }}>{t.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 1024px) { #waitlist .inner > div:last-child { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  )
}

// === SOCIAL PROOF ===
function SocialProof() {
  return (
    <section id="social" data-animate style={{ minHeight: 'auto', padding: '80px 0' }}>
      <div className="inner" style={{ padding: '0 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 48, flexWrap: 'wrap' }}>
          {[
            { stat: 'Open Source', label: 'MIT License' },
            { stat: '80+', label: 'Live Endpoints' },
            { stat: '60/60', label: 'Tests Passing' },
            { stat: 'x402', label: 'Native Protocol' },
            { stat: 'Bilingual', label: 'EN / ES' },
          ].map((item, i) => (
            <div key={i} data-animate-card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>{item.stat}</div>
              <div style={{ fontSize: '0.75rem' }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// === HEARTBEAT ===
function Heartbeat() {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const dataRef = useRef(Array(60).fill(0))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let running = true

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect()
      canvas.width = rect.width * 2
      canvas.height = rect.height * 2
      ctx.scale(2, 2)
    }
    resize()
    window.addEventListener('resize', resize)

    // Seed + refresh from REAL server latency (no fake random data)
    const seed = async () => {
      try {
        const r = await fetch('https://34-156-149-38.sslip.io/aetherapi/v1/telemetry')
        const t = await r.json()
        const arr = t && Array.isArray(t.recent_latency_ms) ? t.recent_latency_ms : []
        if (arr.length && running) {
          const pad = Array(Math.max(0, 60 - arr.length)).fill(arr[0])
          dataRef.current = pad.concat(arr).slice(-60)
        }
      } catch (e) { /* keep last data when offline */ }
    }
    seed()
    const seedTimer = setInterval(seed, 15000)

    const draw = () => {
      if (!running) return
      const w = canvas.width / 2
      const h = canvas.height / 2
      ctx.clearRect(0, 0, w, h)

      // Draw grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'
      ctx.lineWidth = 1
      for (let y = 0; y < h; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
      }

      // Draw line (dynamic scale from real ms values)
      const data = dataRef.current
      const max = Math.max(100, ...data)
      const step = w / (data.length - 1)
      ctx.beginPath()
      ctx.strokeStyle = '#a855f7'
      ctx.lineWidth = 2
      data.forEach((v, i) => {
        const x = i * step
        const y = h - (v / max) * h * 0.9 - h * 0.05
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      })
      ctx.stroke()

      // Gradient fill
      const grad = ctx.createLinearGradient(0, 0, 0, h)
      grad.addColorStop(0, 'rgba(168,85,247,0.15)')
      grad.addColorStop(1, 'rgba(168,85,247,0)')
      ctx.lineTo(w, h)
      ctx.lineTo(0, h)
      ctx.fillStyle = grad
      ctx.fill()
    }

    const frame = (ts) => {
      if (!running) return
      draw(ts)
      animRef.current = requestAnimationFrame(frame)
    }
    animRef.current = requestAnimationFrame(frame)

    return () => {
      running = false
      clearInterval(seedTimer)
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  const endpoints = [
    { name: '/api/v1/maps/search', latency: '~120ms', status: 'up' },
    { name: '/api/v1/token/analyze', latency: '~80ms', status: 'up' },
    { name: '/api/v1/email/validate', latency: '~40ms', status: 'up' },
    { name: '/api/v1/web/scrape', latency: '~150ms', status: 'up' },
    { name: '/api/v1/maps/reviews', latency: '~200ms', status: 'up' },
    { name: '/api/v1/health', latency: '~5ms', status: 'up' },
  ]

  return (
    <section id="heartbeat" data-animate style={{ textAlign: 'center' }}>
      <div className="inner">
        <div className="section-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          System Status
        </div>
        <h2 className="section-title">Live Infrastructure</h2>
        <p className="section-desc" style={{ margin: '0 auto' }}>Real-time health of every API endpoint.</p>
        <div data-animate-card style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 72 }}>
          {/* Request Volume */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 24, padding: 36, textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
              <div style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                Request Volume
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600, background: 'rgba(16,185,129,0.12)', color: 'var(--green)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor', boxShadow: '0 0 8px currentColor' }} />
                Live
              </div>
            </div>
            <div style={{ width: '100%', height: 120, marginBottom: 20 }}>
              <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: 'var(--green)' }}>99.9%</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Uptime</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: 'var(--purple-light)' }}>~549ms</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Latency</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: 'var(--green)' }}>94.0%</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Success Rate</div></div>
            </div>
          </div>
          {/* Endpoint Health */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 24, padding: 36, textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
              <div style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--purple-light)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                Endpoint Health
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {endpoints.map(ep => (
                <div key={ep.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid var(--border)' }}>
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

// === TELEMETRY ===
function Telemetry() {
  return (
    <section id="telemetry" data-animate style={{ background: 'linear-gradient(180deg, rgba(168,85,247,0.04), transparent 55%)' }}>
      <div className="inner">
        <div className="section-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M3 12h4l2-8 4 16 2-8h6"/></svg>
          Distributed Telemetry
        </div>
        <h2 className="section-title">See the system between requests.</h2>
        <p className="section-desc">NATS carries internal events across the runtime. Aetherius exposes the useful proof: health, latency, volume, and cross-layer drift.</p>
        <div data-animate-card style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr', gap: 18, alignItems: 'stretch', maxWidth: 980, margin: '64px auto 28px' }}>
          {[
            { idx: '01', title: 'Your agent calls', desc: 'Any endpoint. No signup, no keys.' },
            { idx: '02', title: 'Payment settles', desc: 'x402 + USDC on Base. NATS moves internal events.' },
            { idx: '03', title: 'You see the proof', desc: 'Health, latency and volume — live.' },
          ].map((node, i) => (
            <React.Fragment key={i}>
              {i > 0 && <div style={{ color: 'var(--magenta-light)', fontFamily: 'JetBrains Mono, monospace', fontSize: '1.7rem', display: 'flex', alignItems: 'center' }}>→</div>}
              <div data-animate-card style={{ padding: 26, textAlign: 'left', background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border)', borderRadius: 16, transition: 'all 0.35s' }}>
                <span style={{ display: 'block', color: 'var(--purple-light)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', marginBottom: 24 }}>{node.idx}</span>
                <strong style={{ display: 'block', fontSize: '1.15rem', marginBottom: 8 }}>{node.title}</strong>
                <small style={{ color: 'var(--text-sec)', fontSize: '0.82rem' }}>{node.desc}</small>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div data-animate-card style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--text-sec)', fontSize: '0.8rem' }}>
          <span>NATS stays private. Observability becomes a product.</span>
          <a href="dashboard/" style={{ color: 'var(--purple-light)', marginLeft: 12, textDecoration: 'none' }}>Inspect control room ↗</a>
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) { #telemetry .inner > div:nth-child(4) { grid-template-columns: 1fr !important; gap: 12px !important; } }
      `}</style>
    </section>
  )
}

// === DOCS ===
function Docs() {
  const docs = [
    { title: 'Getting Started', desc: 'Quick start guide. From zero to first request in 5 minutes.', link: 'Read guide', href: 'https://github.com/wilnowilx/aetheriusxapi/blob/main/docs/API.md' },
    { title: 'API Reference', desc: 'Complete endpoint documentation with parameters and responses.', link: 'Explore APIs', href: 'https://github.com/wilnowilx/aetheriusxapi/blob/main/docs/API.md' },
    { title: 'Guides & Tutorials', desc: 'Tutorials for DeFi bots, data aggregators, and AI agents.', link: 'View tutorials', href: 'https://github.com/wilnowilx/aetheriusxapi/tree/main/docs/tutorials' },
  ]

  return (
    <section id="docs" data-animate style={{ textAlign: 'center' }}>
      <div className="inner">
        <div className="section-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
          Documentation
        </div>
        <h2 className="section-title">Everything You Need</h2>
        <p className="section-desc" style={{ margin: '0 auto' }}>Complete guides, references, and examples. <a href="https://github.com/wilnowilx/aetheriusxapi/tree/main/docs/tutorials" target="_blank" rel="noreferrer" style={{ color: 'var(--purple-light)', textDecoration: 'none', borderBottom: '1px dashed rgba(168,85,247,0.4)' }}>Tutoriales en español → docs/tutorials</a></p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 72 }}>
          {docs.map(d => (
            <a key={d.title} href={d.href} target="_blank" rel="noreferrer" data-animate-card style={{
              padding: '40px 32px', background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 24, textAlign: 'left', transition: 'all 0.5s', textDecoration: 'none', color: 'inherit', display: 'block',
            }}>
              <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(6,182,212,0.1))', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, color: 'var(--cyan)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 12, color: 'var(--text)' }}>{d.title}</h3>
              <p style={{ color: 'var(--text-sec)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 20 }}>{d.desc}</p>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--purple-light)', fontWeight: 600, fontSize: '0.9rem' }}>
                {d.link}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </span>
            </a>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 1024px) { #docs .inner > div:last-child { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 768px) { #docs .inner > div:last-child { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  )
}

// === RATE LIMITS ===
function Limits() {
  return (
    <section id="limits" data-animate style={{ textAlign: 'center' }}>
      <div className="inner">
        <div className="section-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          Rate Limits
        </div>
        <h2 className="section-title">Fair Use, Transparent Limits</h2>
        <p className="section-desc" style={{ margin: '0 auto' }}>Every tier has clear limits. No hidden throttling.</p>
        <div data-animate-card style={{ marginTop: 64, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', textAlign: 'left' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', padding: '18px 28px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', fontWeight: 700 }}>
            <span>Tier</span><span>Requests / min</span><span>Requests / day</span><span>Burst</span>
          </div>
          {[
            { tier: 'Free', cls: 'tier-free', rpm: '10', rpd: '100', burst: '20' },
            { tier: 'Pro', cls: 'tier-pro', rpm: '100', rpd: '10,000', burst: '200' },
            { tier: 'Enterprise', cls: 'tier-ent', rpm: '1,000', rpd: 'Unlimited', burst: 'Custom' },
          ].map(row => (
            <div key={row.tier} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', padding: '18px 28px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
              <div><span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600, background: row.cls === 'tier-free' ? 'rgba(255,255,255,0.08)' : row.cls === 'tier-pro' ? 'rgba(168,85,247,0.15)' : 'rgba(217,70,239,0.15)', color: row.cls === 'tier-free' ? 'var(--text-sec)' : row.cls === 'tier-pro' ? 'var(--purple-light)' : 'var(--magenta-light)' }}>{row.tier}</span></div>
              <span>{row.rpm}</span><span>{row.rpd}</span><span>{row.burst}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// === FOUNDERS ===
function Founders() {
  return (
    <section id="founders" data-animate style={{ textAlign: 'center', padding: '40px 20px 80px' }}>
      <div className="inner">
        <div className="section-label">Founding Agents</div>
        <h2 className="section-title">First 10 agents pay half, forever.</h2>
        <p className="section-desc" style={{ margin: '0 auto' }}>Founding agents lock lifetime 50% off every endpoint, vote the roadmap, and get a direct line. When the 10 are gone, they're gone.</p>
        <div data-animate-card style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', margin: '48px auto', maxWidth: 900 }}>
          {[{ val: '50% lifetime', sub: 'every call, forever' }, { val: 'Vote roadmap', sub: 'you steer what ships' }, { val: 'Direct line', sub: 'priority support on X' }].map(p => (
            <div key={p.val} style={{ flex: '1 1 200px', background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border)', borderRadius: 16, padding: 26 }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{p.val}</div>
              <div style={{ color: 'var(--text-sec)', fontSize: '0.85rem', marginTop: 6 }}>{p.sub}</div>
            </div>
          ))}
        </div>
        <div data-animate-card style={{ maxWidth: 640, margin: '8px auto 0', background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, textAlign: 'left' }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Founder math — what would YOU pay?</div>
          <p style={{ color: 'var(--text-sec)', fontSize: '0.82rem', marginBottom: 8 }}>Own an API? We turn it into a paid x402 API for you (white-label). <a href="https://x.com/aetheriusxAPI" target="_blank" rel="noreferrer" style={{ color: 'var(--purple-light)' }}>Talk to us ↗</a></p>
        </div>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 32 }}>
          <a href="https://x.com/aetheriusxAPI" target="_blank" rel="noreferrer" className="btn btn-primary">Claim founder spot →</a>
          <a href="https://t.me/aetheriusxAPI" target="_blank" rel="noreferrer" className="btn btn-secondary">Join Telegram</a>
        </div>
        <p style={{ color: 'var(--text-sec)', fontSize: '0.8rem', marginTop: 16 }}>Cohort: <strong>0 / 10 claimed</strong> — updated live as wallets join.</p>
      </div>
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
          border: '1px solid rgba(168,85,247,0.2)', borderRadius: 32, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 50%, rgba(168,85,247,0.1), transparent 50%), radial-gradient(circle at 70% 50%, rgba(217,70,239,0.1), transparent 50%)' }} />
          <div className="section-label" style={{ justifyContent: 'center', position: 'relative', zIndex: 1 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            Get Started
          </div>
          <h2 className="section-title" style={{ position: 'relative', zIndex: 1 }}>
            Ready to Build the<br /><span className="grad">Agent Economy</span>?
          </h2>
          <p className="section-desc" style={{ margin: '0 auto 48px', position: 'relative', zIndex: 1 }}>Start building today. Health and telemetry free, forever.</p>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', position: 'relative', zIndex: 1 }}>
            <a href="https://x.com/aetheriusxAPI" target="_blank" rel="noreferrer" className="btn btn-primary">
              Follow on X
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
            <a href="https://github.com/wilnowilx/aetheriusxapi" target="_blank" rel="noreferrer" className="btn btn-secondary">
              View GitHub
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

// === TRUSTED BY ===
function TrustedBy() {
  return (
    <section id="trusted" data-animate style={{ padding: '80px 0', textAlign: 'center', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)' }}>
      <div className="inner" style={{ padding: '0 40px' }}>
        <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: 48, fontWeight: 600 }}>Built in the open for builders on</h3>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 72, flexWrap: 'wrap', maxWidth: 900, margin: '0 auto' }}>
          {['Base', 'Ethereum', 'x402', 'Coinbase', 'USDC'].map(name => (
            <div key={name} style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-muted)', opacity: 0.3, letterSpacing: '-0.02em' }}>{name}</div>
          ))}
        </div>
      </div>
    </section>
  )
}

// === DONATEX ===
function DonateX() {
  return (
    <section id="donatex" data-animate style={{ minHeight: 'auto', padding: '60px 0', textAlign: 'center' }}>
      <div className="inner" style={{ maxWidth: 600, margin: '0 auto', padding: '0 40px' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(168,85,247,0.08) 0%, rgba(217,70,239,0.05) 100%)',
          border: '1px solid rgba(168,85,247,0.15)', borderRadius: 16, padding: '40px 32px'
        }}>
          <div className="section-label" style={{ justifyContent: 'center', marginBottom: 8 }}>DonateX</div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 8 }}>
            <span className="grad">Support Open-Source</span>
          </h3>
          <p style={{ color: 'var(--text-sec)', fontSize: '0.9rem', marginBottom: 20 }}>
            Every donation fuels more open-source infrastructure for the agent economy.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="https://www.coinbase.com/earn/x402/spend?recipient=0x677B483128D0399bCD0A5AB36eE990C0246d7f61&asset=USDC&network=base&amount=5" target="_blank" rel="noreferrer" className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              Donate $5 USDC
            </a>
            <a href="https://www.coinbase.com/earn/x402/spend?recipient=0x677B483128D0399bCD0A5AB36eE990C0246d7f61&asset=USDC&network=base&amount=25" target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              Donate $25 USDC
            </a>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: 16, fontFamily: 'JetBrains Mono, monospace' }}>
            Base Mainnet · USDC · 0x677B…7f61
          </p>
        </div>
      </div>
    </section>
  )
}

// === FOOTER ===
function Footer() {
  return (
    <footer style={{ minHeight: 'auto', padding: '80px 0 40px', borderTop: '1px solid var(--border)' }}>
      <div className="inner">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 48 }}>
          <div>
            <a href="#hero" className="brand" style={{ marginRight: 0 }}>AETHERIUS</a>
            <p style={{ color: 'var(--text-sec)', fontSize: '0.95rem', marginTop: 16, lineHeight: 1.7 }}>The operating system for AI agent commerce. Infrastructure for machines that pay for themselves.</p>
          </div>
          <div>
            <h4 style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 20 }}>Product</h4>
            <ul style={{ listStyle: 'none' }}>
              {[['#categories', 'APIs'], ['#limits', 'Rate Limits'], ['#heartbeat', 'Status']].map(([href, text]) => (
                <li key={text} style={{ marginBottom: 12 }}><a href={href} style={{ color: 'var(--text-sec)', textDecoration: 'none', fontSize: '0.9rem' }}>{text}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 20 }}>Developers</h4>
            <ul style={{ listStyle: 'none' }}>
              {[['https://docs.x402.org', 'x402 Docs'], ['https://github.com/wilnowilx/aetheriusxapi', 'GitHub'], ['https://github.com/wilnowilx/aetheriusxapi/tree/main/sdks', 'SDKs']].map(([href, text]) => (
                <li key={text} style={{ marginBottom: 12 }}><a href={href} target="_blank" rel="noreferrer" style={{ color: 'var(--text-sec)', textDecoration: 'none', fontSize: '0.9rem' }}>{text}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 20 }}>Community</h4>
            <ul style={{ listStyle: 'none' }}>
              {[['https://x.com/aetheriusxAPI', 'X / Twitter'], ['https://t.me/aetheriusxAPI_global', 'Telegram']].map(([href, text]) => (
                <li key={text} style={{ marginBottom: 12 }}><a href={href} target="_blank" rel="noreferrer" style={{ color: 'var(--text-sec)', textDecoration: 'none', fontSize: '0.9rem' }}>{text}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 32, borderTop: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>&copy; 2026 AETHERIUS. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 12 }}>
            <a href="https://x.com/aetheriusxAPI" target="_blank" rel="noreferrer" style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: 10, color: 'var(--text-sec)', transition: 'all 0.3s', textDecoration: 'none' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="https://github.com/wilnowilx/aetheriusxapi" target="_blank" rel="noreferrer" style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: 10, color: 'var(--text-sec)', transition: 'all 0.3s', textDecoration: 'none' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            </a>
            <a href="https://t.me/aetheriusxAPI_global" target="_blank" rel="noreferrer" style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: 10, color: 'var(--text-sec)', transition: 'all 0.3s', textDecoration: 'none' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            </a>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 1024px) { footer .inner > div:first-child { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 768px) { footer .inner > div:first-child { grid-template-columns: 1fr; } }
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

// === APP ===
function App() {
  const appRef = useRef(null)
  useScrollAnimations()
  useSmoothScroll()

  return (
    <div ref={appRef}>
      <PlasmaBg />
      <Nav />
      <SectionBoundary fallback={<div style={{ minHeight: '60vh' }} />}>
        <Hero />
      </SectionBoundary>
      <SectionBoundary><Playground /></SectionBoundary>
      <SectionBoundary><Categories /></SectionBoundary>
      <SectionBoundary><X402Intelligence /></SectionBoundary>
      <SectionBoundary><HowItWorks /></SectionBoundary>
      <SectionBoundary><Features /></SectionBoundary>
      <SectionBoundary><CodeSection /></SectionBoundary>
      <SectionBoundary><Waitlist /></SectionBoundary>
      <SectionBoundary><SocialProof /></SectionBoundary>
      <SectionBoundary><Heartbeat /></SectionBoundary>
      <SectionBoundary><Telemetry /></SectionBoundary>
      <SectionBoundary><Docs /></SectionBoundary>
      <SectionBoundary><Limits /></SectionBoundary>
      <SectionBoundary><Founders /></SectionBoundary>
      <SectionBoundary><CTA /></SectionBoundary>
      <SectionBoundary><TrustedBy /></SectionBoundary>
      <SectionBoundary><DonateX /></SectionBoundary>
      <Footer />
    </div>
  )
}

export default App
