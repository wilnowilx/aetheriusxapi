import React, { useEffect, useRef, useState } from 'react'
import Hero from './components/Hero'
import AetheriusOS from './components/os/AetheriusOS'
import NetworkStatus from './components/NetworkStatus'
import { useScrollAnimations } from './hooks/useScrollAnimations'
import { useSmoothScroll } from './hooks/useSmoothScroll'

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

// === FOOTER ===
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
                ['https://x.com/aetheriusxAPI', 'X / Twitter'],
                ['https://t.me/aetheriusxAPI_global', 'Telegram'],
              ].map(([href, text]) => (
                <li key={text} style={{ marginBottom: 12 }}>
                  <a href={href} target="_blank" rel="noreferrer" style={{ color: 'var(--text-sec)', textDecoration: 'none', fontSize: '0.88rem', transition: 'color 0.2s' }}>{text}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 20 }}>Legal</h4>
            <ul style={{ listStyle: 'none' }}>
              <li style={{ marginBottom: 12 }}>
                <span style={{ color: 'var(--text-sec)', fontSize: '0.88rem' }}>MIT License</span>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>Open Source</div>
              </li>
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

// === ERROR BOUNDARY ===
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

// === SCREEN 1: THE VISION ===
function VisionScreen({ children }) {
  return <>{children}</>
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
