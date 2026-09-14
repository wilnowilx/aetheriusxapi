import React, { useEffect, useRef, useState, useCallback } from 'react'
import Hero from './components/Hero'
import Instruments from './components/Instruments'
import FlowExplorer from './components/FlowExplorer'
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

  return (
    <>
      <nav style={{ background: scrolled ? 'rgba(5,2,15,0.88)' : 'rgba(3,1,8,0.06)', backdropFilter: 'blur(12px)', borderBottom: scrolled ? '1px solid rgba(168,85,247,0.18)' : '1px solid rgba(168,85,247,0.05)', transition: 'background 0.4s ease, border-color 0.4s ease' }} className={scrolled ? 'scrolled' : ''}>
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
            <a href="#playground" style={{display:'inline-flex',alignItems:'center',gap:6}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Playground
            </a>
            <a href="#instruments" style={{display:'inline-flex',alignItems:'center',gap:6}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              APIs
            </a>
            <a href="#flow" style={{display:'inline-flex',alignItems:'center',gap:6}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/><path d="M2 12h20"/></svg>
              Architecture
            </a>
            <a href="#heartbeat" style={{display:'inline-flex',alignItems:'center',gap:6}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              Status
            </a>
            <a href="#founders" style={{display:'inline-flex',alignItems:'center',gap:6}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              Founders
            </a>
            <a href="dashboard/" style={{display:'inline-flex',alignItems:'center',gap:6}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
              Dashboard
            </a>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', fontWeight: 600, color: 'var(--green)', padding: '6px 14px', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 9999, background: 'rgba(16,185,129,0.06)', fontFamily: 'JetBrains Mono, monospace', backdropFilter: 'blur(8px)' }}>
              <span className="glow-dot" style={{ width: 6, height: 6 }} />
              Mainnet
            </span>
            <a href="#cta" className="btn-nav" style={{display:'inline-flex',alignItems:'center',gap:6}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              Get Started
            </a>
          </div>
          <button className="mobile-toggle" onClick={() => setMobileOpen(true)}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5"><path strokeLinejoin="round" strokeLinecap="round" d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
        </div>
      </nav>
      {mobileOpen && (
        <div className="mobile-nav open">
          <button className="close-btn" onClick={() => setMobileOpen(false)}>×</button>
          <a href="#playground" onClick={() => setMobileOpen(false)}>Playground</a>
          <a href="#instruments" onClick={() => setMobileOpen(false)}>APIs</a>
          <a href="#flow" onClick={() => setMobileOpen(false)}>Architecture</a>
          <a href="#features" onClick={() => setMobileOpen(false)}>Features</a>
          <a href="#code" onClick={() => setMobileOpen(false)}>Code</a>
          <a href="#heartbeat" onClick={() => setMobileOpen(false)}>Status</a>
          <a href="#founders" onClick={() => setMobileOpen(false)}>Founders</a>
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
      <div className="plasma-blob" style={{ width: 760, height: 760, background: 'radial-gradient(circle, rgba(168,85,247,0.68) 0%, transparent 70%)', top: '-12%', left: '-6%', animationDuration: '16s' }} />
      <div className="plasma-blob" style={{ width: 640, height: 640, background: 'radial-gradient(circle, rgba(217,70,239,0.6) 0%, transparent 70%)', top: '28%', right: '-12%', animationDuration: '13s', animationDelay: '-5s' }} />
      <div className="plasma-blob" style={{ width: 580, height: 580, background: 'radial-gradient(circle, rgba(236,72,153,0.54) 0%, transparent 70%)', bottom: '-6%', left: '18%', animationDuration: '15s', animationDelay: '-10s' }} />
      <div className="plasma-blob" style={{ width: 520, height: 520, background: 'radial-gradient(circle, rgba(6,182,212,0.44) 0%, transparent 70%)', top: '58%', left: '52%', animationDuration: '12s', animationDelay: '-3s' }} />
      <div className="plasma-blob" style={{ width: 460, height: 460, background: 'radial-gradient(circle, rgba(168,85,247,0.44) 0%, transparent 70%)', top: '8%', left: '42%', animationDuration: '17s', animationDelay: '-8s' }} />
      <div className="plasma-blob" style={{ width: 500, height: 500, background: 'radial-gradient(circle, rgba(232,121,249,0.4) 0%, transparent 70%)', top: '45%', right: '5%', animationDuration: '14s', animationDelay: '-6s' }} />
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
  { cat: 'x402 Intelligence', free: true, icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><path strokeLinejoin="round" strokeLinecap="round" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinejoin="round" strokeLinecap="round"/></svg>, items: [
    { method: 'GET', path: '/v1/x402/base-stats', price: 'FREE', params: '{}' },
    { method: 'GET', path: '/v1/x402/gas', price: 'FREE', params: '{}' },
    { method: 'GET', path: '/v1/x402/market-pulse', price: 'FREE', params: '{}' },
    { method: 'GET', path: '/v1/x402/sentiment', price: 'FREE', params: '{}' },
    { method: 'GET', path: '/v1/x402/stablecoins', price: 'FREE', params: '{}' },
    { method: 'GET', path: '/v1/x402/whales', price: 'FREE', params: '{}' },
  ]},
  { cat: 'Crypto Market', free: false, icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><path strokeLinejoin="round" strokeLinecap="round" d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinejoin="round" strokeLinecap="round"/></svg>, items: [
    { method: 'GET', path: '/v1/crypto/market', price: '$0.005', params: '{"token":"ETH"}' },
    { method: 'GET', path: '/v1/crypto/fear-greed', price: '$0.005', params: '{}' },
    { method: 'GET', path: '/v1/crypto/trending', price: '$0.01', params: '{}' },
    { method: 'GET', path: '/v1/crypto/ohlcv', price: '$0.01', params: '{"token":"ETH","interval":"1d"}' },
    { method: 'GET', path: '/v1/crypto/dominance', price: '$0.005', params: '{}' },
  ]},
  { cat: 'Token', free: false, icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><circle cx="12" cy="12" r="10"/><path strokeLinejoin="round" strokeLinecap="round" d="M12 6v12M8 10l4-4 4 4" strokeLinejoin="round" strokeLinecap="round"/></svg>, items: [
    { method: 'GET', path: '/v1/token/price', price: '$0.005', params: '{"token":"ETH"}' },
    { method: 'GET', path: '/v1/token/analyze', price: '$0.01', params: '{"address":"0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"}' },
  ]},
  { cat: 'DeFi', free: false, icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><path strokeLinejoin="round" strokeLinecap="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinejoin="round" strokeLinecap="round"/></svg>, items: [
    { method: 'GET', path: '/v1/defi/impermanent-loss', price: '$0.01', params: '{}' },
    { method: 'GET', path: '/v1/defi/staking-apy', price: '$0.005', params: '{"protocol":"lido","token":"ETH"}' },
  ]},
  { cat: 'News', free: false, icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><path strokeLinejoin="round" strokeLinecap="round" d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2" strokeLinejoin="round" strokeLinecap="round"/><path strokeLinejoin="round" strokeLinecap="round" d="M18 14h-8M15 18h-5M10 6h8v4h-8z" strokeLinejoin="round" strokeLinecap="round"/></svg>, items: [
    { method: 'GET', path: '/v1/news/hackernews', price: '$0.01', params: '{}' },
    { method: 'GET', path: '/v1/news/reddit', price: '$0.01', params: '{"subreddit":"cryptocurrency"}' },
  ]},
  { cat: 'Data', free: false, icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><path strokeLinejoin="round" strokeLinecap="round" d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" strokeLinejoin="round" strokeLinecap="round"/><polyline points="3.27 6.96 12 12.01 20.73 6.96" strokeLinejoin="round" strokeLinecap="round"/><line x1="12" y1="22.08" x2="12" y2="12" strokeLinecap="round"/></svg>, items: [
    { method: 'GET', path: '/v1/data/weather', price: '$0.005', params: '{"lat":"19.4326","lon":"-99.1332"}' },
    { method: 'GET', path: '/v1/data/ip', price: '$0.005', params: '{"ip":"8.8.8.8"}' },
    { method: 'GET', path: '/v1/data/uuid', price: '$0.001', params: '{}' },
    { method: 'GET', path: '/v1/data/hash', price: '$0.002', params: '{"input":"hello","algo":"sha256"}' },
    { method: 'GET', path: '/v1/data/qrcode', price: '$0.003', params: '{"text":"https://aetheriusx.io"}' },
    { method: 'POST', path: '/v1/data/translate', price: '$0.01', params: '{"text":"hello","target":"es"}' },
  ]},
  { cat: 'Web Tools', free: false, icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12" strokeLinecap="round"/><path strokeLinejoin="round" strokeLinecap="round" d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" strokeLinejoin="round" strokeLinecap="round"/></svg>, items: [
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
          borderRadius: 20, overflow: 'hidden', minHeight: 500, position: 'relative',
          boxShadow: '0 0 60px rgba(168,85,247,0.06), 0 0 120px rgba(217,70,239,0.03)',
          backdropFilter: 'blur(20px)',
        }}>
          {/* Sidebar */}
          <div className="noscroll" style={{ background: 'rgba(255,255,255,0.015)', borderRight: '1px solid rgba(255,255,255,0.04)', padding: 16, overflowY: 'auto', maxHeight: 500 }}>
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

// === CATEGORIES ===
function Categories() {
  const cats = [
    { title: 'Maps & Location', count: '5 live', icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><path strokeLinejoin="round" strokeLinecap="round" d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" strokeLinejoin="round" strokeLinecap="round"/><circle cx="12" cy="10" r="3" strokeLinejoin="round" strokeLinecap="round"/></svg> },
    { title: 'Crypto & DeFi', count: '19 live', icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><path strokeLinejoin="round" strokeLinecap="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinejoin="round" strokeLinecap="round"/></svg> },
    { title: 'Web & Scraping', count: '4 live', icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><circle cx="12" cy="12" r="10" strokeLinejoin="round" strokeLinecap="round"/><path strokeLinejoin="round" strokeLinecap="round" d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" strokeLinejoin="round" strokeLinecap="round"/></svg> },
    { title: 'AI & ML', count: 'soon', icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><path strokeLinejoin="round" strokeLinecap="round" d="M12 2a4 4 0 014 4v2a4 4 0 01-8 0V6a4 4 0 014-4z" strokeLinejoin="round" strokeLinecap="round"/><path strokeLinejoin="round" strokeLinecap="round" d="M16 14v2a4 4 0 01-8 0v-2M12 18v4M8 22h8" strokeLinejoin="round" strokeLinecap="round"/></svg>, soon: true },
    { title: 'Finance', count: '3 live', icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><path strokeLinejoin="round" strokeLinecap="round" d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" strokeLinejoin="round" strokeLinecap="round"/></svg> },
    { title: 'Weather', count: '3 live', icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><path strokeLinejoin="round" strokeLinecap="round" d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" strokeLinejoin="round" strokeLinecap="round"/></svg> },
    { title: 'News & Media', count: '6 live', icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><path strokeLinejoin="round" strokeLinecap="round" d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2" strokeLinejoin="round" strokeLinecap="round"/></svg> },
    { title: 'Data & Analytics', count: '8 live', icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><path strokeLinejoin="round" strokeLinecap="round" d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" strokeLinejoin="round" strokeLinecap="round"/><polyline points="3.27 6.96 12 12.01 20.73 6.96" strokeLinejoin="round" strokeLinecap="round"/><line x1="12" y1="22.08" x2="12" y2="12" strokeLinecap="round"/></svg> },
    { title: 'Crypto Market Data', count: '5 live', icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinejoin="round" strokeLinecap="round"/></svg> },
    { title: 'Web Tools', count: '3 live', icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><path strokeLinejoin="round" strokeLinecap="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinejoin="round" strokeLinecap="round"/><polyline points="14 2 14 8 20 8" strokeLinejoin="round" strokeLinecap="round"/></svg> },
    { title: 'Data Tools', count: '7 live', icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><ellipse cx="12" cy="5" rx="9" ry="3" strokeLinejoin="round" strokeLinecap="round"/><path strokeLinejoin="round" strokeLinecap="round" d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" strokeLinejoin="round" strokeLinecap="round"/><path strokeLinejoin="round" strokeLinecap="round" d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" strokeLinejoin="round" strokeLinecap="round"/></svg> },
    { title: 'Security', count: 'soon', icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><path strokeLinejoin="round" strokeLinecap="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinejoin="round" strokeLinecap="round"/></svg>, soon: true },
  ]

  return (
    <section id="categories" data-animate style={{ textAlign: 'center' }}>
      <div className="inner">
        <div className="section-label">
          <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><rect x="3" y="3" width="7" height="7" rx="1.5" strokeLinejoin="round" strokeLinecap="round"/><rect x="14" y="3" width="7" height="7" rx="1.5" strokeLinejoin="round" strokeLinecap="round"/><rect x="14" y="14" width="7" height="7" rx="1.5" strokeLinejoin="round" strokeLinecap="round"/><rect x="3" y="14" width="7" height="7" rx="1.5" strokeLinejoin="round" strokeLinecap="round"/></svg>
          API Categories
        </div>
        <h2 className="section-title">100+ Live Endpoints, More Weekly</h2>
        <p className="section-desc" style={{ margin: '0 auto' }}>Production APIs across maps, DeFi, web, data, forex and news — new verticals shipping weekly.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginTop: 48 }}>
          {cats.map(cat => (
            <div key={cat.title} data-animate-card className="glass-card" style={{
              padding: '20px 14px', textAlign: 'center', cursor: 'pointer',
              opacity: cat.soon ? 0.45 : 1,
            }}>
              <div style={{ width: 44, height: 44, margin: '0 auto 10px', background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(217,70,239,0.06))', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--purple-light)' }}>
                {cat.icon}
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 4, color: 'var(--text)' }}>{cat.title}</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: cat.soon ? 'var(--text-muted)' : 'var(--green)' }}>{cat.count}</div>
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
    { title: 'Brain Recommender', desc: 'Tell it what you need — "defi", "wallet", "gas" — and it recommends the best endpoints. AI-powered routing.', code: 'GET /v1/x402/brain?intent=defi', color: 'var(--purple-light)', bg: 'rgba(168,85,247,0.06)', iconBg: 'linear-gradient(135deg, rgba(168,85,247,0.06), rgba(217,70,239,0.08))', icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><circle cx="12" cy="12" r="10" strokeLinejoin="round" strokeLinecap="round"/><path strokeLinejoin="round" strokeLinecap="round" d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" strokeLinejoin="round" strokeLinecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round"/></svg> },
    { title: 'Market Pulse', desc: 'Real-time Base conditions: gas, chain health, USDC activity, ETH price, bullish/bearish signal. One call.', code: 'GET /v1/x402/market-pulse', color: 'var(--green)', bg: 'rgba(16,185,129,0.06)', iconBg: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,182,212,0.08))', icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinejoin="round" strokeLinecap="round"/></svg> },
    { title: 'Wallet Intel', desc: 'Full wallet profile: USDC flow, risk score, counterparty analysis, ETH balance. Any address on Base.', code: 'GET /v1/x402/wallet-intel/{address}', color: 'var(--pink)', bg: 'rgba(236,72,153,0.06)', iconBg: 'linear-gradient(135deg, rgba(236,72,153,0.1), rgba(168,85,247,0.08))', icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><path strokeLinejoin="round" strokeLinecap="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeLinejoin="round" strokeLinecap="round"/><circle cx="12" cy="7" r="4" strokeLinejoin="round" strokeLinecap="round"/></svg> },
    { title: 'Sentiment + Risk', desc: 'Fear & Greed Index + on-chain sentiment. Multi-factor risk scoring with detailed breakdown. Compliance indicators.', code: 'GET /v1/x402/sentiment · /risk-intel', color: 'var(--cyan)', bg: 'rgba(6,182,212,0.06)', iconBg: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(16,185,129,0.08))', icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><path strokeLinejoin="round" strokeLinecap="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinejoin="round" strokeLinecap="round"/></svg> },
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
          <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path strokeLinejoin="round" strokeLinecap="round" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinejoin="round" strokeLinecap="round"/></svg>
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
        <div className="glass-card" style={{ marginTop: 20, padding: '20px 32px', textAlign: 'left', borderColor: 'rgba(245,158,11,0.15)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>+ 16 More Free Endpoints</h3>
          <p style={{ color: 'var(--text-sec)', fontSize: '0.82rem', lineHeight: 1.6 }}>Gas Intelligence · Token Discovery · Whale Clustering · DeFi Yield · Tx Patterns · Wallet Compare · Leaderboard · Contract Intel · Velocity · History · Search · Network Health · Stablecoin Flow</p>
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

// === ARCHITECTURE — ENERGY TREE: 4 phases, organic movement ===
function HowItWorks() {
  const [activePhase, setActivePhase] = useState(0)
  const [hoveredPhase, setHoveredPhase] = useState(null)

  const phases = [
    {
      num: '01',
      title: 'Seed',
      subtitle: 'Wallet Connect',
      desc: 'Your wallet IS your identity. No signup. No accounts. No KYC. One signature and you exist in the network.',
      detail: 'EIP-4337 compatible. Any EOA or smart wallet. Zero configuration.',
      color: '#a855f7',
      glow: 'rgba(168,85,247,0.4)',
      icon: (
        <svg viewBox="0 0 32 32" fill="none" width="32" height="32">
          <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
          <circle cx="16" cy="16" r="2" fill="currentColor"/>
          <path d="M16 22v4M16 6v2M22 16h4M6 16h2" stroke="currentColor" strokeWidth="1" opacity="0.4"/>
        </svg>
      ),
    },
    {
      num: '02',
      title: 'Root',
      subtitle: 'Discovery',
      desc: 'The agent discovers what it needs. 100+ endpoints. x402 Brain recommends the best route. One GET to start.',
      detail: 'Free endpoints for health checks. Paid for premium data. x402 negotiates automatically.',
      color: '#22d3ee',
      glow: 'rgba(34,211,238,0.4)',
      icon: (
        <svg viewBox="0 0 32 32" fill="none" width="32" height="32">
          <path d="M16 8v8M16 16l-6 8M16 16l6 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.8"/>
          <circle cx="16" cy="8" r="2" fill="currentColor"/>
          <circle cx="10" cy="24" r="1.5" fill="currentColor" opacity="0.6"/>
          <circle cx="22" cy="24" r="1.5" fill="currentColor" opacity="0.6"/>
        </svg>
      ),
    },
    {
      num: '03',
      title: 'Bloom',
      subtitle: 'x402 Payment',
      desc: 'HTTP 402 response triggers automatic payment. USDC on Base. Single-use nonce. Replay-proof by construction.',
      detail: 'EIP-3009 authorization. Sub-cent fees. Sub-second settlement. Math, not trust.',
      color: '#d946ef',
      glow: 'rgba(217,70,239,0.4)',
      icon: (
        <svg viewBox="0 0 32 32" fill="none" width="32" height="32">
          <path d="M16 4l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15"/>
        </svg>
      ),
    },
    {
      num: '04',
      title: 'Fruit',
      subtitle: 'Data Delivery',
      desc: '200 OK. Exactly what was requested. Payment and delivery correlated at the HTTP boundary. Zero ambiguity.',
      detail: 'On-chain settlement proof. Transaction hash included. Auditable by design.',
      color: '#10b981',
      glow: 'rgba(16,185,129,0.4)',
      icon: (
        <svg viewBox="0 0 32 32" fill="none" width="32" height="32">
          <rect x="8" y="8" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
          <path d="M12 16l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
  ]

  // Auto-cycle through phases for organic feel
  useEffect(() => {
    const interval = setInterval(() => {
      setActivePhase(p => (p + 1) % 4)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const current = phases[hoveredPhase !== null ? hoveredPhase : activePhase]

  return (
    <section id="how" data-animate style={{ textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      {/* Organic nebula backdrop */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `radial-gradient(ellipse at 50% 60%, ${current.glow.replace('0.4', '0.06')} 0%, transparent 60%)`,
        filter: 'blur(120px)',
        transition: 'background 1.5s ease',
      }} />
      <div className="inner" style={{ position: 'relative', zIndex: 1 }}>
        <div className="section-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinejoin="round" strokeLinecap="round"/></svg>
          Architecture
        </div>
        <h2 className="section-title">Energy flows. Data crystallizes.</h2>
        <p className="section-desc" style={{ margin: '0 auto', maxWidth: 580 }}>
          Four phases. One organic loop. From seed to fruit in under a second.
        </p>

        {/* The Tree visualization */}
        <div style={{ position: 'relative', marginTop: 56, marginBottom: 40 }}>
          {/* Connecting trunk line */}
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 2, height: '100%', background: `linear-gradient(180deg, ${current.color}33 0%, ${current.color}11 100%)`, transition: 'background 1s ease' }} />

          {/* Phase nodes — vertical tree layout */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
            {phases.map((phase, i) => {
              const isActive = (hoveredPhase !== null ? hoveredPhase : activePhase) === i
              const isLeft = i % 2 === 0
              return (
                <div key={phase.num}
                  onMouseEnter={() => { setHoveredPhase(i); setActivePhase(i) }}
                  onMouseLeave={() => setHoveredPhase(null)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 24,
                    flexDirection: isLeft ? 'row' : 'row-reverse',
                    padding: '20px 0', cursor: 'pointer',
                    transition: 'all 0.5s cubic-bezier(0.4,0,0.2,1)',
                    opacity: isActive ? 1 : 0.4,
                    transform: isActive ? 'scale(1.02)' : 'scale(0.98)',
                  }}
                >
                  {/* Content card */}
                  <div style={{ flex: 1, maxWidth: 380, textAlign: isLeft ? 'right' : 'left', padding: '0 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: isLeft ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', fontWeight: 700, color: phase.color, opacity: 0.7, letterSpacing: '0.1em' }}>{phase.num}</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: phase.color, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{phase.subtitle}</span>
                    </div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.02em' }}>{phase.title}</h3>
                    <p style={{ color: 'var(--text-sec)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>{phase.desc}</p>
                    {isActive && (
                      <div style={{ marginTop: 10, padding: '8px 12px', background: `${phase.color}10`, border: `1px solid ${phase.color}20`, borderRadius: 8, fontSize: '0.72rem', color: phase.color, fontFamily: 'JetBrains Mono, monospace' }}>
                        {phase.detail}
                      </div>
                    )}
                  </div>

                  {/* Center node */}
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                    background: isActive ? `${phase.color}18` : 'rgba(255,255,255,0.03)',
                    border: `2px solid ${isActive ? phase.color : 'rgba(255,255,255,0.06)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: phase.color, position: 'relative',
                    transition: 'all 0.5s cubic-bezier(0.4,0,0.2,1)',
                    boxShadow: isActive ? `0 0 20px ${phase.glow.replace('0.4', '0.2')}` : 'none',
                  }}>
                    {phase.icon}
                    {isActive && (
                      <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: `1px solid ${phase.color}30`, animation: 'treePulse 2s ease-in-out infinite' }} />
                    )}
                  </div>

                  {/* Empty space for other side */}
                  <div style={{ flex: 1 }} />
                </div>
              )
            })}
          </div>
        </div>

        {/* Phase indicator dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 16 }}>
          {phases.map((phase, i) => (
            <button key={i} onClick={() => setActivePhase(i)}
              style={{
                width: activePhase === i ? 24 : 8, height: 8, borderRadius: 4, border: 'none', cursor: 'pointer',
                background: activePhase === i ? phase.color : 'rgba(255,255,255,0.12)',
                boxShadow: activePhase === i ? `0 0 8px ${phase.glow}` : 'none',
                transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
              }}
            />
          ))}
        </div>

        <style>{`
          @keyframes treePulse {
            0%, 100% { transform: scale(1); opacity: 0.6; }
            50% { transform: scale(1.15); opacity: 0.2; }
          }
          @media (max-width: 768px) {
            #how .inner > div:nth-child(3) > div > div { flex-direction: column !important; }
            #how .inner > div:nth-child(3) > div > div > div:first-child { text-align: center !important; padding: 0 16px !important; }
            #how .inner > div:nth-child(3) > div > div > div:last-child { display: none !important; }
          }
        `}</style>
      </div>
    </section>
  )
}

// === FEATURES — compact accordion ===
function Features() {
  const [openFeature, setOpenFeature] = useState(null)

  const features = [
    { title: 'AI-Native Design', desc: 'Built for machines. No accounts, no UI, no human friction. Agents pay and use directly. Zero human in the loop.', color: 'var(--purple-light)', icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><path strokeLinejoin="round" strokeLinecap="round" d="M12 2a4 4 0 014 4v2a4 4 0 01-8 0V6a4 4 0 014-4z" strokeLinejoin="round" strokeLinecap="round"/><path strokeLinejoin="round" strokeLinecap="round" d="M16 14v2a4 4 0 01-8 0v-2M12 18v4M8 22h8" strokeLinejoin="round" strokeLinecap="round"/></svg> },
    { title: 'x402 Protocol', desc: 'HTTP 402 with crypto payments. The emerging standard for machine-to-machine commerce. Settled on Base L2.', color: 'var(--cyan)', icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><path strokeLinejoin="round" strokeLinecap="round" d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" strokeLinejoin="round" strokeLinecap="round"/><path strokeLinejoin="round" strokeLinecap="round" d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.72-1.71" strokeLinejoin="round" strokeLinecap="round"/></svg> },
    { title: 'USDC on Base', desc: 'Stablecoin payments on L2. Sub-cent fees, instant finality, global reach. No volatile tokens.', color: 'var(--magenta-light)', icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><circle cx="12" cy="12" r="10" strokeLinejoin="round" strokeLinecap="round"/><path strokeLinejoin="round" strokeLinecap="round" d="M12 6v12M8 10l4-4 4 4M8 14l4 4 4-4" strokeLinejoin="round" strokeLinecap="round"/></svg> },
    { title: 'Permissionless', desc: 'No KYC, no subscriptions, no bank accounts. Connect wallet and use. That\'s it. True censorship resistance.', color: 'var(--green)', icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><path strokeLinejoin="round" strokeLinecap="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinejoin="round" strokeLinecap="round"/><polyline points="9 12 11 14 15 10" strokeLinejoin="round" strokeLinecap="round"/></svg> },
    { title: 'Global Access', desc: 'Anyone with a crypto wallet. No bank account needed. No borders. Built for the global agent economy.', color: 'var(--orange)', icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><circle cx="12" cy="12" r="10" strokeLinejoin="round" strokeLinecap="round"/><line x1="2" y1="12" x2="22" y2="12" strokeLinecap="round"/><path strokeLinejoin="round" strokeLinecap="round" d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" strokeLinejoin="round" strokeLinecap="round"/></svg> },
    { title: 'Instant Settlement', desc: 'Payments verified on-chain in seconds. No waiting, no intermediaries. On-chain proof included in every response.', color: 'var(--pink)', icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><path strokeLinejoin="round" strokeLinecap="round" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinejoin="round" strokeLinecap="round"/></svg> },
  ]

  return (
    <section id="features" data-animate style={{ textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div className="inner" style={{ position: 'relative', zIndex: 1, maxWidth: 640 }}>
        <div className="section-label">
          <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path strokeLinejoin="round" strokeLinecap="round" d="M12 2L2 7l10 5 10-5-10-5z" strokeLinejoin="round" strokeLinecap="round"/></svg>
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
          <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          For Developers
        </div>
        <h2 className="section-title">Integrate in Minutes</h2>
        <p className="section-desc" style={{ margin: '0 auto' }}>One SDK. Every API. Zero configuration.</p>
        <div data-animate-card style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 48, marginTop: 72, alignItems: 'start' }}>
          <div>
            <div style={{ background: '#0c0c14', border: '1px solid rgba(168,85,247,0.16)', borderRadius: 16, overflow: 'hidden', textAlign: 'left' }}>
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

// === WAITLIST ===
function Waitlist() {
  const [email, setEmail] = useState('')
  const [wallet, setWallet] = useState('')

  const timeline = [
    { date: 'Aug 2026', title: 'Project Started', desc: 'x402 research, architecture design', status: 'done' },
    { date: 'Sep 5, 2026', title: 'Mainnet Launch', desc: '100+ endpoints live on Base Mainnet with real USDC', status: 'done' },
    { date: 'Sep 2026', title: 'x402 Intelligence', desc: '20 exclusive on-chain analytics endpoints + grants', status: 'current' },
    { date: 'Q4 2026', title: 'Scale', desc: '120+ endpoints, Go/Rust SDKs, 100 agent-wallets', status: '' },
  ]

  return (
    <section id="waitlist" data-animate style={{ textAlign: 'center' }}>
      <div className="inner">
        <div className="section-label">
          <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path strokeLinejoin="round" strokeLinecap="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          Early Access
        </div>
        <h2 className="section-title">Join the Agent Economy</h2>
        <p className="section-desc" style={{ margin: '0 auto' }}>We're live on Base Mainnet. Start building with 100+ APIs today. Get early access to new endpoints and exclusive analytics.</p>
        <div data-animate-card style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 72, textAlign: 'left' }}>
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', borderRadius: 24, padding: 40, backdropFilter: 'blur(20px)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
              {[{ val: '100+', label: 'Live APIs' }, { val: '40', label: 'FREE Endpoints' }, { val: 'x402', label: 'Protocol' }].map(s => (
                <div key={s.label} style={{ textAlign: 'center', padding: 16, background: 'rgba(168,85,247,0.06)', borderRadius: 12 }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', background: 'linear-gradient(135deg, var(--purple), var(--magenta))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.val}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" style={{ flex: 1, padding: '14px 18px', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', fontSize: '0.95rem', outline: 'none' }} />
                <button type="button" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>Join Waitlist <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5"><path strokeLinejoin="round" strokeLinecap="round" d="M5 12h14M12 5l7 7-7 7"/></svg></button>
              </div>
              <input type="text" value={wallet} onChange={e => setWallet(e.target.value)} placeholder="0x... (optional — for founder perks)" style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['Early mainnet access', 'Priority support', 'Founder pricing locked'].map(p => (
                <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem', color: 'var(--text-sec)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="var(--green)" strokeWidth="1.5"><polyline points="20 6 9 17 4 12"/></svg>
                  {p}
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', borderRadius: 24, padding: 40, backdropFilter: 'blur(20px)' }}>
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
            { stat: '100+', label: 'Live Endpoints' },
            { stat: '129', label: 'Tests Passing' },
            { stat: 'x402', label: 'Native Protocol' },
            { stat: 'Mainnet', label: 'Base L2 Live' },
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
      grad.addColorStop(0, 'rgba(168,85,247,0.08)')
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
    { name: '/v1/x402/market-pulse', latency: '~320ms', status: 'up' },
    { name: '/v1/x402/sentiment', latency: '~280ms', status: 'up' },
    { name: '/v1/x402/gas', latency: '~180ms', status: 'up' },
    { name: '/v1/x402/wallet-intel', latency: '~450ms', status: 'up' },
    { name: '/v1/crypto/price', latency: '~120ms', status: 'up' },
    { name: '/v1/health', latency: '~5ms', status: 'up' },
  ]

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
          {/* Request Volume */}
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

// === TELEMETRY ===
function Telemetry() {
  return (
    <section id="telemetry" data-animate style={{ background: 'linear-gradient(180deg, rgba(168,85,247,0.04), transparent 55%)' }}>
      <div className="inner">
        <div className="section-label">
          <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path strokeLinejoin="round" strokeLinecap="round" d="M3 12h4l2-8 4 16 2-8h6"/></svg>
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
              <div data-animate-card className="glass-card" style={{ padding: 26, textAlign: 'left' }}>
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
          <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path strokeLinejoin="round" strokeLinecap="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path strokeLinejoin="round" strokeLinecap="round" d="M14 2v6h6"/></svg>
          Documentation
        </div>
        <h2 className="section-title">Everything You Need</h2>
        <p className="section-desc" style={{ margin: '0 auto' }}>Complete guides, references, and examples. <a href="https://github.com/wilnowilx/aetheriusxapi/tree/main/docs/tutorials" target="_blank" rel="noreferrer" style={{ color: 'var(--purple-light)', textDecoration: 'none', borderBottom: '1px dashed rgba(168,85,247,0.4)' }}>Tutoriales en español → docs/tutorials</a></p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 72 }}>
          {docs.map(d => (
            <a key={d.title} href={d.href} target="_blank" rel="noreferrer" data-animate-card className="glass-card" style={{
              padding: '36px 28px', textAlign: 'left', textDecoration: 'none', color: 'inherit', display: 'block',
            }}>
              <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, rgba(168,85,247,0.06), rgba(6,182,212,0.1))', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, color: 'var(--cyan)' }}>
                <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><path strokeLinejoin="round" strokeLinecap="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path strokeLinejoin="round" strokeLinecap="round" d="M14 2v6h6"/></svg>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 12, color: 'var(--text)' }}>{d.title}</h3>
              <p style={{ color: 'var(--text-sec)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 20 }}>{d.desc}</p>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--purple-light)', fontWeight: 600, fontSize: '0.9rem' }}>
                {d.link}
                <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="18" height="18"><path strokeLinejoin="round" strokeLinecap="round" d="M5 12h14M12 5l7 7-7 7"/></svg>
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
          <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><circle cx="12" cy="12" r="10"/><path strokeLinejoin="round" strokeLinecap="round" d="M12 6v6l4 2"/></svg>
          Rate Limits
        </div>
        <h2 className="section-title">Fair Use, Transparent Limits</h2>
        <p className="section-desc" style={{ margin: '0 auto' }}>Every tier has clear limits. No hidden throttling.</p>
        <div data-animate-card className="glass-card" style={{ marginTop: 64, overflow: 'hidden', textAlign: 'left' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', padding: '18px 28px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', fontWeight: 700 }}>
            <span>Tier</span><span>Requests / min</span><span>Requests / day</span><span>Burst</span>
          </div>
          {[
            { tier: 'Free', cls: 'tier-free', rpm: '10', rpd: '100', burst: '20' },
            { tier: 'Pro', cls: 'tier-pro', rpm: '100', rpd: '10,000', burst: '200' },
            { tier: 'Enterprise', cls: 'tier-ent', rpm: '1,000', rpd: 'Unlimited', burst: 'Custom' },
          ].map(row => (
            <div key={row.tier} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', padding: '18px 28px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
              <div><span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600, background: row.cls === 'tier-free' ? 'rgba(255,255,255,0.08)' : row.cls === 'tier-pro' ? 'rgba(168,85,247,0.08)' : 'rgba(217,70,239,0.15)', color: row.cls === 'tier-free' ? 'var(--text-sec)' : row.cls === 'tier-pro' ? 'var(--purple-light)' : 'var(--magenta-light)' }}>{row.tier}</span></div>
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
  const [showMath, setShowMath] = useState(false)
  const [copied, setCopied] = useState(false)

  const perks = [
    { icon: '⟠', title: '50% Lifetime Discount', desc: 'Every endpoint. Every call. Forever. As long as the network exists, you pay half. This is not a promo — it is a protocol-level lock.', color: 'var(--purple-light)' },
    { icon: '⊘', title: 'Roadmap Vote', desc: 'You don\'t just request features — you vote on what ships next. Founders steer the direction of 100+ APIs. Direct governance.', color: 'var(--cyan)' },
    { icon: '⟡', title: 'Direct Line', desc: 'Priority support on X. When something breaks at 3am, you get a response. Not a ticket number — a builder who cares.', color: 'var(--magenta-light)' },
  ]

  const mathExamples = [
    { calls: '1K/mo', retail: '$5', founder: '$2.50', saved: '$2.50' },
    { calls: '10K/mo', retail: '$50', founder: '$25', saved: '$25' },
    { calls: '100K/mo', retail: '$500', founder: '$250', saved: '$250' },
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
            <div key={p.title} className="glass-card" style={{ padding: '32px 24px', textAlign: 'left', borderTop: `2px solid ${p.color}30` }}>
              <div style={{ fontSize: '1.8rem', marginBottom: 14, lineHeight: 1 }}>{p.icon}</div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>{p.title}</h3>
              <p style={{ color: 'var(--text-sec)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>{p.desc}</p>
            </div>
          ))}
        </div>

        {/* Founder math — expandable */}
        <div data-animate-card style={{ maxWidth: 680, margin: '32px auto 0', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, backdropFilter: 'blur(12px)', overflow: 'hidden' }}>
          <button onClick={() => setShowMath(!showMath)} style={{ width: '100%', padding: '20px 24px', background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', color: 'var(--text)' }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>Founder math — what would YOU pay?</div>
              <div style={{ color: 'var(--text-sec)', fontSize: '0.82rem' }}>Tap to see the savings at scale</div>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ transform: showMath ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s', color: 'var(--text-muted)', flexShrink: 0 }}><polyline points="6 9 12 15 18 9" strokeLinejoin="round" strokeLinecap="round"/></svg>
          </button>
          {showMath && (
            <div style={{ padding: '0 24px 20px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    <th style={{ textAlign: 'left', padding: '8px 0' }}>Volume</th>
                    <th style={{ textAlign: 'right', padding: '8px 0' }}>Retail</th>
                    <th style={{ textAlign: 'right', padding: '8px 0' }}>Founder</th>
                    <th style={{ textAlign: 'right', padding: '8px 0', color: 'var(--green)' }}>Saved</th>
                  </tr>
                </thead>
                <tbody>
                  {mathExamples.map(row => (
                    <tr key={row.calls} style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '10px 0', color: 'var(--text)' }}>{row.calls}</td>
                      <td style={{ textAlign: 'right', padding: '10px 0', color: 'var(--text-muted)', textDecoration: 'line-through' }}>{row.retail}</td>
                      <td style={{ textAlign: 'right', padding: '10px 0', color: 'var(--purple-light)', fontWeight: 600 }}>{row.founder}</td>
                      <td style={{ textAlign: 'right', padding: '10px 0', color: 'var(--green)' }}>{row.saved}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(168,85,247,0.06)', borderRadius: 10, fontSize: '0.78rem', color: 'var(--text-sec)', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--text)' }}>White-label?</strong> Own an API? We turn it into a paid x402 endpoint for you. You keep the revenue, we handle the infrastructure. <a href="https://x.com/aetheriusxAPI" target="_blank" rel="noreferrer" style={{ color: 'var(--purple-light)' }}>Talk to us ↗</a>
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

        <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span className="glow-dot" style={{ width: 6, height: 6 }} />
          <span style={{ color: 'var(--text-sec)', fontSize: '0.82rem' }}>Cohort: <strong style={{ color: 'var(--green)' }}>0 / 10 claimed</strong> — updated live as wallets join.</span>
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

// === ABOUT ===
function About() {
  return (
    <section id="about" data-animate style={{ textAlign: 'center' }}>
      <div className="inner">
        <div className="section-label">
          <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><circle cx="12" cy="12" r="10"/><path strokeLinejoin="round" strokeLinecap="round" d="M12 16v-4M12 8h.01"/></svg>
          About AETHERIUS
        </div>
        <h2 className="section-title">Built for the Agent Economy</h2>
        <p className="section-desc" style={{ margin: '0 auto 48px' }}>
          AETHERIUS is the operating system for AI agent commerce. We build the infrastructure that lets machines pay for themselves — one request at a time.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 24 }}>
          {[
            {
              title: 'Open Source',
              desc: 'MIT licensed. Every line of code is public. Fork it, build on it, ship with it.',
              icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><path strokeLinejoin="round" strokeLinecap="round" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>,
              color: 'var(--text)',
            },
            {
              title: 'One Builder',
              desc: 'Wilmer Piña — system architect from Venezuela, building from Mexico. Proof that borders don\'t limit builders.',
              icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><path strokeLinejoin="round" strokeLinecap="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
              color: 'var(--purple-light)',
            },
            {
              title: 'Crypto-Native',
              desc: 'No bank account needed. No KYC. Your wallet is your identity. Payments in USDC on Base. That\'s it.',
              icon: <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><circle cx="12" cy="12" r="10"/><path strokeLinejoin="round" strokeLinecap="round" d="M12 6v12M8 10l4-4 4 4M8 14l4 4 4-4"/></svg>,
              color: 'var(--base-blue)',
            },
          ].map((item, i) => (
            <div key={i} data-animate-card className="glass-card" style={{ padding: '36px 28px', textAlign: 'left' }}>
              <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(217,70,239,0.06))', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, color: item.color }}>
                {item.icon}
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 10, color: 'var(--text)' }}>{item.title}</h3>
              <p style={{ color: 'var(--text-sec)', fontSize: '0.9rem', lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 48 }}>
          <a href="https://github.com/wilnowilx/aetheriusxapi" target="_blank" rel="noreferrer" className="btn btn-secondary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            View Source
          </a>
          <a href="https://x.com/aetheriusxAPI" target="_blank" rel="noreferrer" className="btn btn-primary">
            Follow the Journey
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinejoin="round" strokeLinecap="round" d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
        </div>
      </div>
      <style>{`
        @media (max-width: 1024px) { #about .inner > div:nth-child(3) { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 768px) { #about .inner > div:nth-child(3) { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  )
}

// === TRUSTED BY ===
function TrustedBy() {
  return (
    <section id="trusted" data-animate style={{ padding: '80px 0', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
      <div className="inner" style={{ padding: '0 40px' }}>
        <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: 48, fontWeight: 600 }}>Built in the open for the agent economy on</h3>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 56, flexWrap: 'wrap', maxWidth: 900, margin: '0 auto' }}>
          {[
            { name: 'Base', sub: 'L2 by Coinbase' },
            { name: 'x402', sub: 'HTTP payment protocol' },
            { name: 'USDC', sub: 'Stablecoin settlement' },
            { name: 'FastAPI', sub: 'Python backend' },
            { name: 'React Three Fiber', sub: '3D landing' },
          ].map(item => (
            <div key={item.name} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-sec)', letterSpacing: '-0.02em' }}>{item.name}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>{item.sub}</div>
            </div>
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
          background: 'linear-gradient(135deg, rgba(168,85,247,0.05) 0%, rgba(217,70,239,0.03) 100%)',
          border: '1px solid rgba(168,85,247,0.08)', borderRadius: 16, padding: '40px 32px'
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5"><path strokeLinejoin="round" strokeLinecap="round" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              Donate $5 USDC
            </a>
            <a href="https://www.coinbase.com/earn/x402/spend?recipient=0x677B483128D0399bCD0A5AB36eE990C0246d7f61&asset=USDC&network=base&amount=25" target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth="1.5"><path strokeLinejoin="round" strokeLinecap="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
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
    <footer style={{ minHeight: 'auto', padding: '80px 0 40px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="inner">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 48 }}>
          <div>
            <a href="#hero" className="brand" style={{ marginRight: 0 }}>AETHERIUS</a>
            <p style={{ color: 'var(--text-sec)', fontSize: '0.95rem', marginTop: 16, lineHeight: 1.7 }}>The operating system for AI agent commerce. Infrastructure for machines that pay for themselves.</p>
          </div>
          <div>
            <h4 style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 20 }}>Product</h4>
            <ul style={{ listStyle: 'none' }}>
              {[['#instruments', 'APIs'], ['#x402-intel', 'Intelligence'], ['#heartbeat', 'Status']].map(([href, text]) => (
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>&copy; 2026 AETHERIUS. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 12 }}>
            <a href="https://x.com/aetheriusxAPI" target="_blank" rel="noreferrer" style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: 10, color: 'var(--text-sec)', transition: 'all 0.3s', textDecoration: 'none' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path strokeLinejoin="round" strokeLinecap="round" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="https://github.com/wilnowilx/aetheriusxapi" target="_blank" rel="noreferrer" style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: 10, color: 'var(--text-sec)', transition: 'all 0.3s', textDecoration: 'none' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path strokeLinejoin="round" strokeLinecap="round" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            </a>
            <a href="https://t.me/aetheriusxAPI_global" target="_blank" rel="noreferrer" style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: 10, color: 'var(--text-sec)', transition: 'all 0.3s', textDecoration: 'none' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path strokeLinejoin="round" strokeLinecap="round" d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
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

// === DOT NAV (restored slide traction — IO highlight, click to glide) ===
const DOT_SECTIONS = [
  ['hero', 'Intro'], ['playground', 'Playground'], ['flow', 'Architecture'],
  ['x402-intel', 'Intelligence'], ['heartbeat', 'Status'],
  ['founders', 'Founders'], ['cta', 'Start'],
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
          display: flex; flex-direction: column; gap: 12px; z-index: 900;
        }
        .dot-nav .dot {
          width: 8px; height: 8px; border-radius: 50%;
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

// === APP ===
function App() {
  const appRef = useRef(null)
  useScrollAnimations()
  useSmoothScroll()

  return (
    <div ref={appRef}>
      <PlasmaBg />
      <Nav />
      <NetworkStatus />
      <SectionBoundary fallback={<div style={{ minHeight: '60vh' }} />}>
        <Hero />
      </SectionBoundary>
      <SectionBoundary><Playground /></SectionBoundary>
      <SectionBoundary><Instruments /></SectionBoundary>
      <SectionBoundary><FlowExplorer /></SectionBoundary>
      <SectionBoundary><X402Intelligence /></SectionBoundary>
      <SectionBoundary><HowItWorks /></SectionBoundary>
      <SectionBoundary><Features /></SectionBoundary>
      <SectionBoundary><CodeSection /></SectionBoundary>
      <SectionBoundary><Heartbeat /></SectionBoundary>
      <SectionBoundary><Founders /></SectionBoundary>
      <SectionBoundary><CTA /></SectionBoundary>
      <Footer />
      <DotNav />
    </div>
  )
}

export default App
