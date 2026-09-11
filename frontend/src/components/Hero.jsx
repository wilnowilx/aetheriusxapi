import React, { useState, useEffect, useRef, Suspense } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const GlobeScene = React.lazy(() => import('./GlobeScene'))

class GlobeBoundary extends React.Component {
  constructor(props) { super(props); this.state = { crashed: false } }
  static getDerivedStateFromError() { return { crashed: true } }
  componentDidCatch(err) { if (typeof console !== 'undefined') console.error('[AETHERIUS] globe crashed:', err) }
  render() {
    if (this.state.crashed) return <div style={{ position: 'absolute', inset: '10%', background: 'radial-gradient(circle, rgba(168,85,247,0.3) 0%, rgba(217,70,239,0.15) 45%, transparent 70%)', borderRadius: '50%' }} />
    return this.props.children
  }
}

// === COSMIC VOID ===
function CosmicVoid() {
  return (
    <div className="cosmos-void" aria-hidden="true">
      <div className="void-stars void-stars--far" />
      <div className="void-stars void-stars--mid" />
      <div className="void-stars void-stars--near" />
      <div className="void-aurora void-aurora--1" />
      <div className="void-aurora void-aurora--2" />
      <div className="void-aurora void-aurora--3" />
      <div className="void-rays">
        <div className="void-ray void-ray--1" />
        <div className="void-ray void-ray--2" />
        <div className="void-ray void-ray--3" />
        <div className="void-ray void-ray--4" />
      </div>
      <div className="void-nebula void-nebula--1" />
      <div className="void-nebula void-nebula--2" />
      <div className="void-nebula void-nebula--3" />
      <div className="void-vignette" />
      <div className="void-dust" />

      <style>{`
        .cosmos-void {
          position: fixed; inset: 0; z-index: -2;
          pointer-events: none; overflow: hidden;
          background: radial-gradient(ellipse at 50% 55%,
            rgba(8,4,22,1) 0%, rgba(4,2,14,1) 30%,
            rgba(2,1,8,1) 60%, rgba(1,0,5,1) 100%);
        }
        .void-stars { position: absolute; inset: 0; background-repeat: repeat; }
        .void-stars--far {
          background-image:
            radial-gradient(0.8px 0.8px at 12% 18%, rgba(255,255,255,0.3) 0%, transparent 100%),
            radial-gradient(0.8px 0.8px at 34% 62%, rgba(255,255,255,0.25) 0%, transparent 100%),
            radial-gradient(0.8px 0.8px at 56% 14%, rgba(255,255,255,0.28) 0%, transparent 100%),
            radial-gradient(0.8px 0.8px at 78% 48%, rgba(255,255,255,0.2) 0%, transparent 100%),
            radial-gradient(0.8px 0.8px at 91% 82%, rgba(255,255,255,0.3) 0%, transparent 100%),
            radial-gradient(0.8px 0.8px at 24% 91%, rgba(255,255,255,0.22) 0%, transparent 100%),
            radial-gradient(0.8px 0.8px at 67% 34%, rgba(255,255,255,0.28) 0%, transparent 100%),
            radial-gradient(0.8px 0.8px at 43% 76%, rgba(255,255,255,0.2) 0%, transparent 100%);
          background-size: 280px 280px;
          animation: voidDrift 120s linear infinite;
        }
        .void-stars--mid {
          background-image:
            radial-gradient(1.2px 1.2px at 18% 32%, rgba(168,85,247,0.5) 0%, transparent 100%),
            radial-gradient(1.2px 1.2px at 52% 71%, rgba(34,211,238,0.35) 0%, transparent 100%),
            radial-gradient(1.2px 1.2px at 74% 22%, rgba(217,70,239,0.4) 0%, transparent 100%),
            radial-gradient(1.2px 1.2px at 38% 58%, rgba(168,85,247,0.35) 0%, transparent 100%),
            radial-gradient(1.2px 1.2px at 86% 64%, rgba(236,72,153,0.3) 0%, transparent 100%);
          background-size: 400px 400px;
          animation: voidDrift 200s linear infinite reverse;
        }
        .void-stars--near {
          background-image:
            radial-gradient(2px 2px at 28% 42%, rgba(34,211,238,0.5) 0%, transparent 100%),
            radial-gradient(2.5px 2.5px at 68% 28%, rgba(168,85,247,0.55) 0%, transparent 100%),
            radial-gradient(2px 2px at 48% 78%, rgba(217,70,239,0.4) 0%, transparent 100%),
            radial-gradient(1.8px 1.8px at 14% 62%, rgba(236,72,153,0.35) 0%, transparent 100%);
          background-size: 600px 600px;
          animation: voidTwinkle 8s ease-in-out infinite alternate, voidDrift 300s linear infinite;
        }
        @keyframes voidDrift { from { transform: translateY(0); } to { transform: translateY(-200px); } }
        @keyframes voidTwinkle { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }

        .void-aurora {
          position: absolute; width: 130%; height: 40%; left: -15%;
          filter: blur(90px); mix-blend-mode: screen; opacity: 0;
          animation: auroraBreath 20s ease-in-out infinite;
        }
        .void-aurora--1 {
          top: 8%;
          background: linear-gradient(135deg, transparent 0%,
            rgba(168,85,247,0.12) 20%, rgba(217,70,239,0.15) 45%,
            rgba(34,211,238,0.08) 65%, transparent 100%);
          animation-delay: 0s; animation-duration: 24s;
        }
        .void-aurora--2 {
          top: 18%;
          background: linear-gradient(225deg, transparent 0%,
            rgba(34,211,238,0.08) 25%, rgba(168,85,247,0.12) 50%,
            rgba(236,72,153,0.06) 75%, transparent 100%);
          animation-delay: -8s; animation-duration: 28s;
        }
        .void-aurora--3 {
          top: 2%; height: 30%;
          background: linear-gradient(180deg,
            rgba(217,70,239,0.06) 0%, rgba(168,85,247,0.04) 35%, transparent 65%);
          animation-delay: -16s; animation-duration: 34s;
        }
        @keyframes auroraBreath {
          0%, 100% { opacity: 0.3; transform: translateX(-4%) scaleY(1); }
          25% { opacity: 0.65; transform: translateX(3%) scaleY(1.12); }
          50% { opacity: 0.45; transform: translateX(-2%) scaleY(0.88); }
          75% { opacity: 0.75; transform: translateX(5%) scaleY(1.08); }
        }

        .void-rays {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 100%; height: 100%; pointer-events: none;
        }
        .void-ray {
          position: absolute; top: 50%; left: 50%;
          width: 1.5px; height: 55vh;
          transform-origin: top center;
          filter: blur(25px); opacity: 0;
          animation: rayPulse 14s ease-in-out infinite;
        }
        .void-ray--1 {
          background: linear-gradient(180deg, rgba(168,85,247,0.2) 0%, transparent 100%);
          transform: translate(-50%, 0) rotate(-22deg); animation-delay: 0s;
        }
        .void-ray--2 {
          background: linear-gradient(180deg, rgba(34,211,238,0.15) 0%, transparent 100%);
          transform: translate(-50%, 0) rotate(12deg); animation-delay: -3s;
        }
        .void-ray--3 {
          background: linear-gradient(180deg, rgba(217,70,239,0.14) 0%, transparent 100%);
          transform: translate(-50%, 0) rotate(-6deg); animation-delay: -7s;
        }
        .void-ray--4 {
          background: linear-gradient(180deg, rgba(236,72,153,0.12) 0%, transparent 100%);
          transform: translate(-50%, 0) rotate(28deg); animation-delay: -10s;
        }
        @keyframes rayPulse {
          0%, 100% { opacity: 0; }
          25% { opacity: 0.5; }
          50% { opacity: 0.2; }
          75% { opacity: 0.6; }
        }

        .void-nebula {
          position: absolute; border-radius: 50%;
          filter: blur(120px); mix-blend-mode: screen;
          opacity: 0; animation: nebulaPulse 22s ease-in-out infinite;
        }
        .void-nebula--1 {
          width: 900px; height: 550px; top: -12%; left: -8%;
          background: radial-gradient(ellipse, rgba(168,85,247,0.12) 0%, rgba(217,70,239,0.08) 40%, transparent 70%);
          animation-delay: 0s; animation-duration: 26s;
        }
        .void-nebula--2 {
          width: 700px; height: 480px; top: 20%; right: -8%;
          background: radial-gradient(ellipse, rgba(34,211,238,0.08) 0%, rgba(168,85,247,0.06) 45%, transparent 70%);
          animation-delay: -9s; animation-duration: 22s;
        }
        .void-nebula--3 {
          width: 600px; height: 400px; bottom: 8%; left: 15%;
          background: radial-gradient(ellipse, rgba(236,72,153,0.08) 0%, rgba(217,70,239,0.04) 50%, transparent 70%);
          animation-delay: -15s; animation-duration: 30s;
        }
        @keyframes nebulaPulse {
          0%, 100% { opacity: 0.3; transform: scale(1) translate(0, 0); }
          33% { opacity: 0.6; transform: scale(1.05) translate(10px, -6px); }
          66% { opacity: 0.4; transform: scale(0.97) translate(-6px, 5px); }
        }

        .void-vignette {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 50% 50%,
            transparent 25%, rgba(1,0,5,0.3) 55%,
            rgba(1,0,5,0.7) 80%, rgba(1,0,5,0.92) 100%);
        }
        .void-dust {
          position: absolute; inset: 0; opacity: 0.04;
          mix-blend-mode: soft-light;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
        }
      `}</style>
    </div>
  )
}

const API_BASE = 'https://34-156-149-38.sslip.io/aetherapi'

// === LIVE DATA HOOK — fetches real x402 metrics ===
function useLiveData() {
  const [data, setData] = useState({
    block: '—', gas: '—', volume: '$0.00',
    endpoints: '100+', freeEndpoints: '40',
    latency: '—', status: 'connecting',
  })

  useEffect(() => {
    const ping = async () => {
      const start = performance.now()
      try {
        const r = await fetch(`${API_BASE}/v1/x402/base-stats`)
        const elapsed = Math.round(performance.now() - start)
        const d = await r.json()
        setData({
          block: d.block_number || d.block || '—',
          gas: d.gas_price_gwei || d.gas_price || '—',
          volume: d.total_volume_usdc != null ? `$${d.total_volume_usdc.toFixed(2)}` : '$0.00',
          endpoints: '100+',
          freeEndpoints: '40',
          latency: `${elapsed}ms`,
          status: elapsed < 600 ? 'live' : 'slow',
        })
      } catch {
        setData(p => ({ ...p, status: 'retry' }))
      }
    }
    const t1 = setTimeout(ping, 1500)
    const iv = setInterval(ping, 6000)
    return () => { clearTimeout(t1); clearInterval(iv) }
  }, [])

  return data
}

// === MAIN HERO ===
function Hero() {
  const liveData = useLiveData()
  const [globePaused, setGlobePaused] = useState(false)
  const heroRef = useRef(null)

  // IntersectionObserver: pause globe when hero scrolls off-screen
  useEffect(() => {
    if (!heroRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => setGlobePaused(!entry.isIntersecting),
      { threshold: 0.05 }
    )
    observer.observe(heroRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let tween
    try {
      gsap.registerPlugin(ScrollTrigger)
      tween = gsap.to('#hero .hero-fade', {
        y: -50, opacity: 0.05, ease: 'none',
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom 30%', scrub: 0.8 },
      })
    } catch {}
    return () => { try { tween?.scrollTrigger?.kill(); tween?.kill() } catch {} }
  }, [])

  return (
    <section id="hero" ref={heroRef} style={{
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      position: 'relative', overflow: 'hidden',
      padding: '80px 0 60px',
      isolation: 'isolate', zIndex: 0,
    }}>
      <CosmicVoid />

      {/* Globe — the living core */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute', width: '100%', height: '100%',
          background: 'radial-gradient(circle at 50% 48%, rgba(168,85,247,0.06) 0%, rgba(217,70,239,0.04) 20%, rgba(34,211,238,0.02) 40%, transparent 60%)',
          filter: 'blur(60px)',
          animation: 'holoPulse 8s ease-in-out infinite alternate',
        }} />

        <GlobeBoundary>
          <Suspense fallback={
            <div style={{ width: 280, height: 280, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)',
              animation: 'pulse 3s ease-in-out infinite' }} />
          }>
            <div style={{ position: 'absolute', inset: '-12%', pointerEvents: 'none' }}>
              <GlobeScene liveData={liveData} paused={globePaused} />
            </div>
          </Suspense>
        </GlobeBoundary>
      </div>

      {/* Content — light inscription */}
      <div className="hero-fade" style={{
        position: 'relative', zIndex: 10,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', textAlign: 'center',
        padding: '0 24px', gap: 0,
      }}>
        {/* x402 badge — protocol identity */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 16px', borderRadius: 20,
          background: 'rgba(168,85,247,0.08)',
          border: '1px solid rgba(168,85,247,0.15)',
          marginBottom: 20,
          backdropFilter: 'blur(10px)',
        }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.72rem', fontWeight: 700,
            color: 'var(--purple-light)',
            letterSpacing: '0.08em',
          }}>x402</span>
          <span style={{
            width: 1, height: 12, background: 'rgba(168,85,247,0.3)',
          }} />
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.6rem',
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: '0.1em',
          }}>PROTOCOL</span>
        </div>

        {/* Title — light inscription */}
        <h1 style={{
          fontSize: 'clamp(2.2rem, 7.5vw, 6.5rem)',
          lineHeight: 0.92, letterSpacing: '-0.04em',
          fontWeight: 300, color: 'rgba(255,255,255,0.9)', margin: 0,
          textShadow: '0 0 80px rgba(168,85,247,0.12), 0 0 40px rgba(34,211,238,0.06)',
          fontFamily: "'Inter', sans-serif",
        }}>The Marketplace<br/>That Lives</h1>

        <div style={{
          fontSize: 'clamp(0.85rem, 1.8vw, 1.3rem)',
          marginTop: 16, fontWeight: 300,
          color: 'rgba(255,255,255,0.35)',
          letterSpacing: '0.02em',
        }}>API infrastructure for AI agents that pay</div>

        {/* Live metrics — subtle, below title */}
        <div style={{
          display: 'flex', gap: 24, marginTop: 32,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.65rem',
          color: 'rgba(255,255,255,0.25)',
          letterSpacing: '0.06em',
        }}>
          <span>{liveData.endpoints} endpoints</span>
          <span style={{ color: 'rgba(168,85,247,0.4)' }}>·</span>
          <span>{liveData.freeEndpoints} free</span>
          <span style={{ color: 'rgba(168,85,247,0.4)' }}>·</span>
          <span style={{ color: liveData.status === 'live' ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.25)' }}>
            {liveData.latency}
          </span>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="hero-cue" role="button" tabIndex={0}
        onClick={() => document.getElementById('playground')?.scrollIntoView({ behavior: 'smooth' })}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') document.getElementById('playground')?.scrollIntoView({ behavior: 'smooth' }) }}
        style={{
          position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          cursor: 'pointer', zIndex: 5,
        }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.5rem', letterSpacing: '0.35em',
          color: 'rgba(168,85,247,0.3)',
        }}>SCROLL</span>
        <svg className="cue-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(168,85,247,0.25)" strokeWidth="1.5"><path d="M6 9l6 6 6-6" strokeLinejoin="round" strokeLinecap="round"/></svg>
      </div>

      <style>{`
        @keyframes holoPulse {
          0% { opacity: 0.4; transform: scale(0.97); }
          100% { opacity: 1; transform: scale(1.03); }
        }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        .hero-cue .cue-chev { animation: cueDrop 2s ease-in-out infinite; }
        @keyframes cueDrop {
          0%, 100% { transform: translateY(0); opacity: 0.2; }
          50% { transform: translateY(6px); opacity: 0.6; }
        }
        @media (max-width: 768px) {
          #hero { padding: 80px 0 36px !important; }
        }
      `}</style>
    </section>
  )
}

export default Hero
