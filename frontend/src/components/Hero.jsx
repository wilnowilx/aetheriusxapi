import React, { useState, useEffect, useRef, Suspense } from 'react'

// Lazy: three.js (~700KB) loads AFTER first paint, never blocks the page
const GlobeScene = React.lazy(() => import('./GlobeScene'))

// Local boundary: a WebGL/globe crash must never kill the hero text
class GlobeBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { crashed: false }
  }
  static getDerivedStateFromError() {
    return { crashed: true }
  }
  componentDidCatch(err) {
    if (typeof console !== 'undefined') console.error('[AETHERIUS] globe crashed:', err)
  }
  render() {
    if (this.state.crashed) {
      return (
        <div style={{
          position: 'absolute', inset: '10%',
          background: 'radial-gradient(circle, rgba(168,85,247,0.5) 0%, rgba(217,70,239,0.2) 45%, transparent 70%)',
          borderRadius: '50%'
        }} />
      )
    }
    return this.props.children
  }
}

// === AMBIENT PARTICLES (fx.js ported to React) ===
function AmbientParticles() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    let W = 0, H = 0
    let running = true
    let animId

    function size() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = window.innerWidth; H = window.innerHeight
      cv.width = W * dpr; cv.height = H * dpr
      cv.style.width = W + 'px'; cv.style.height = H + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    size()
    window.addEventListener('resize', size)

    const hues = [268, 285, 300, 320]
    function spawn(anywhere) {
      const hot = Math.random() < 0.12
      return {
        x: Math.random() * W, y: anywhere ? Math.random() * H : H + 6,
        r: (0.6 + Math.random() * 2.2) * (hot ? 2.2 : 1),
        vy: -((0.08 + Math.random() * 0.3) * 3),
        vx: (Math.random() - 0.5) * 0.15,
        a: (0.15 + Math.random() * 0.5) * (hot ? 1.7 : 1),
        h: hues[(Math.random() * hues.length) | 0],
        tw: Math.random() * 6.28
      }
    }

    const P = []
    for (let i = 0; i < 70; i++) P.push(spawn(true))
    const rings = []

    function tick() {
      if (!running) return
      ctx.clearRect(0, 0, W, H)
      for (let j = 0; j < P.length; j++) {
        const p = P[j]
        p.y += p.vy; p.x += p.vx; p.tw += 0.03
        if (p.y < -6) { p.y = H + 6; p.x = Math.random() * W }
        if (p.x < -6) p.x = W + 6; if (p.x > W + 6) p.x = -6
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283)
        ctx.fillStyle = 'hsla(' + p.h + ',90%,70%,' +
          (p.a * (0.6 + 0.4 * Math.sin(p.tw))).toFixed(3) + ')'
        ctx.fill()
      }
      for (let j = rings.length - 1; j >= 0; j--) {
        const g = rings[j]; g.r += 1.1; g.a -= 0.006
        if (g.a <= 0) { rings.splice(j, 1); continue }
        ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, 6.283)
        ctx.strokeStyle = 'hsla(' + g.h + ',90%,72%,' + g.a.toFixed(3) + ')'
        ctx.lineWidth = 1.2; ctx.stroke()
      }
      animId = requestAnimationFrame(tick)
    }

    const ringInterval = setInterval(() => {
      if (!running || !P.length) return
      const p = P[(Math.random() * P.length) | 0]
      rings.push({ x: p.x, y: p.y, r: 2, a: 0.35, h: p.h })
      if (rings.length > 8) rings.shift()
    }, 2600)

    const visHandler = () => { running = !document.hidden; if (running) animId = requestAnimationFrame(tick) }
    document.addEventListener('visibilitychange', visHandler)
    animId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(animId)
      clearInterval(ringInterval)
      document.removeEventListener('visibilitychange', visHandler)
      window.removeEventListener('resize', size)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0, zIndex: -1,
        pointerEvents: 'none', width: '100%', height: '100%'
      }}
    />
  )
}

const API_BASE = 'https://34-156-149-38.sslip.io/aetherapi'

const liveLabels = [
  { text: '100+ endpoints live', type: 'network' },
  { text: 'x402 micropayments', type: 'protocol' },
  { text: 'Base Mainnet (8453)', type: 'network' },
  { text: 'USDC on-chain payments', type: 'protocol' },
  { text: 'Gas: ~$0.0003/tx', type: 'price' },
  { text: '2s block time', type: 'network' },
  { text: 'No signup required', type: 'protocol' },
  { text: 'Open-source MIT', type: 'network' },
  { text: 'Python SDK v2.0', type: 'endpoint' },
  { text: 'Instant finality (L2)', type: 'network' },
  { text: '40 FREE endpoints', type: 'price' },
  { text: 'Agent-to-agent commerce', type: 'protocol' },
  { text: 'Real USDC payments', type: 'price' },
  { text: 'x402 protocol', type: 'endpoint' },
  { text: 'QuantumXBrain AI', type: 'endpoint' },
]

const labelPositions = [
  { x: -5, y: 5 }, { x: 62, y: -5 }, { x: 72, y: 20 }, { x: -5, y: 45 },
  { x: 62, y: 65 }, { x: 15, y: -5 }, { x: 45, y: 88 }, { x: -5, y: 25 },
  { x: 70, y: 42 }, { x: 25, y: 5 }, { x: 0, y: 68 }, { x: 68, y: 8 },
  { x: 8, y: 40 }, { x: 55, y: 58 }, { x: 68, y: 72 },
]

function Hero() {
  const [labelIdx, setLabelIdx] = useState(0)
  const [stats, setStats] = useState({ volume: '—', agents: '—', payments: '—', health: '—' })
  const [labels, setLabels] = useState(liveLabels)

  // Rotating labels
  useEffect(() => {
    const interval = setInterval(() => {
      setLabelIdx(prev => (prev + 1) % labels.length)
    }, 1800)
    return () => clearInterval(interval)
  }, [labels.length])

  // LIVE labels via QuantumXBrain (null-safe: only overwrite on real values)
  useEffect(() => {
    const put = (i, text) => {
      if (!text) return
      setLabels(prev => prev.map((l, j) => (j === i ? { ...l, text } : l)))
    }
    const refresh = async () => {
      try {
        const g = await fetch(`${API_BASE}/v1/x402/gas`).then(r => r.json()).catch(() => null)
        if (g && g.current_gwei != null) {
          put(4, `Gas: ${g.current_gwei} gwei`)
          if (g.cost_estimates && g.cost_estimates.simple_transfer_usd != null) {
            put(12, `$${g.cost_estimates.simple_transfer_usd}/tx`)
          }
        }
      } catch { /* keep static truth */ }
      try {
        const m = await fetch(`${API_BASE}/v1/x402/market-pulse`).then(r => r.json()).catch(() => null)
        if (m) {
          if (m.signal && m.signal.label) put(1, `Signal: ${m.signal.label}`)
          if (m.chain && m.chain.block) put(5, `Block #${Number(m.chain.block).toLocaleString()}`)
          if (m.market && m.market.eth_usd != null) put(3, `ETH $${Math.round(m.market.eth_usd).toLocaleString()}`)
        }
      } catch { /* keep static truth */ }
      try {
        const s = await fetch(`${API_BASE}/v1/x402/sentiment`).then(r => r.json()).catch(() => null)
        if (s) {
          if (s.fear_greed_index && s.fear_greed_index.value != null) {
            put(13, `F&G: ${s.fear_greed_index.value} ${s.fear_greed_index.label || ''}`.trim())
          }
          if (s.market && s.market.btc_usd != null) {
            put(14, `BTC $${Math.round(s.market.btc_usd).toLocaleString()}`)
          }
        }
      } catch { /* keep static truth */ }
    }
    refresh()
    const interval = setInterval(refresh, 30000)
    return () => clearInterval(interval)
  }, [])

  // Fetch live stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const r = await fetch(`${API_BASE}/v1/telemetry`)
        const t = await r.json()
        if (t && t.totals) {
          const calls = t.totals.calls || 0
          setStats({
            volume: t.totals.volume_usdc != null ? '$' + t.totals.volume_usdc.toFixed(2) : '—',
            agents: calls > 0 ? ((t.totals.ok_200 || 0) / calls * 100).toFixed(1) + '%' : '—',
            payments: t.wallets_seen != null ? String(t.wallets_seen) : '—',
            health: t.totals.avg_latency_ms != null ? t.totals.avg_latency_ms.toFixed(0) + 'ms' : '—'
          })
        }
      } catch (e) { /* offline */ }
    }
    fetchStats()
    const interval = setInterval(fetchStats, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section id="hero" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'visible', paddingTop: '120px', isolation: 'isolate', zIndex: 0 }}>
      <AmbientParticles />
      <div className="inner" style={{ width: '100%', overflow: 'visible' }}>
        {/* Top: badges + GIANT headline, full width */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', justifyContent: 'center', alignItems: 'center' }}>
          <div className="section-label" style={{ fontSize: '0.78rem', padding: '6px 14px', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 9999, background: 'rgba(16,185,129,0.08)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            Base Mainnet LIVE
          </div>
          <div className="section-label" style={{ fontSize: '0.78rem', padding: '6px 14px', border: '1px solid rgba(168,85,247,0.35)', borderRadius: 9999, background: 'rgba(168,85,247,0.08)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#a855f7', display: 'inline-block' }} />
            x402 Intelligence
          </div>
        </div>

        <h1 className="section-title" style={{ textAlign: 'center', position: 'relative', zIndex: 3, pointerEvents: 'none', margin: '0 0 8px' }}>
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0' }}>
            <span style={{
              fontSize: 'clamp(0.9rem, 1.8vw, 1.4rem)',
              letterSpacing: '0.5em',
              color: 'var(--text-sec)',
              fontWeight: 500,
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: 'uppercase',
              marginBottom: '-8px'
            }}>THE</span>
            <span style={{
              fontSize: 'clamp(3rem, 8.5vw, 7.5rem)',
              lineHeight: 1.0,
              letterSpacing: '-0.03em',
              fontWeight: 900,
              background: 'linear-gradient(135deg, #f0f0f5 0%, #c084fc 50%, #a855f7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>INFRASTRUCTURE</span>
          </span>
          <span className="grad-flow" style={{ display: 'block', fontSize: 'clamp(1.8rem, 4.5vw, 3.6rem)', marginTop: '6px', fontWeight: 800 }}>for Agents That Pay</span>
        </h1>

        {/* Row: sub + actions + stats (left) / globe (right) */}
        <div className="hero-row" style={{ display: 'flex', alignItems: 'center', gap: '32px', marginTop: '-20px' }}>
        <div style={{ flex: '1 1 42%', zIndex: 2 }}>
          <p className="section-desc" style={{ marginBottom: '28px', fontSize: '1.1rem', lineHeight: 1.7 }}>
            100+ live APIs your agents can pay for in USDC on Base. 40 FREE QuantumXBrain intelligence endpoints.
            No accounts, no subscriptions. The operating system for machine-to-machine commerce.
          </p>

          <div style={{ display: 'flex', gap: '14px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <a href="#cta" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '1rem', fontWeight: 700, boxShadow: '0 8px 32px rgba(168,85,247,0.45), 0 2px 8px rgba(217,70,239,0.35)' }}>
              Start Building
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
            <a href="#code" className="btn btn-secondary" style={{ padding: '14px 32px', fontSize: '1rem', fontWeight: 600 }}>
              View Docs
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
            </a>
          </div>

          {/* Terminal one-liner */}
          <div className="hero-terminal" style={{
            display: 'inline-flex', alignItems: 'center', gap: '12px',
            background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(168,85,247,0.2)',
            borderRadius: 10, padding: '10px 18px', marginBottom: '28px',
            fontFamily: "'JetBrains Mono', monospace", fontSize: '0.82rem',
            cursor: 'pointer', transition: 'border-color 0.3s',
            backdropFilter: 'blur(8px)'
          }}
          onClick={() => { navigator.clipboard?.writeText('pip install aetherius') }}
          title="Click to copy"
          >
            <span style={{ color: 'var(--green)' }}>$</span>
            <span style={{ color: 'var(--text)' }}>pip install aetherius</span>
            <span style={{
              fontSize: '0.7rem', padding: '2px 8px', borderRadius: 6,
              background: 'rgba(168,85,247,0.15)', color: 'var(--purple-light)',
              border: '1px solid rgba(168,85,247,0.25)'
            }}>copy</span>
          </div>

          {/* Stats */}
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {[
              { value: stats.volume, label: 'USDC settled' },
              { value: stats.agents, label: 'Success rate' },
              { value: stats.payments, label: 'Wallets seen' },
              { value: stats.health, label: 'Avg latency' },
            ].map((stat, i) => (
              <div key={i} style={{
                border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px',
                background: 'rgba(255,255,255,0.02)',
                transition: 'border-color 0.3s'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", display: 'flex', alignItems: 'center', gap: 6 }}>
                  {stat.value}
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} />
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-sec)', marginTop: 2 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: 3D Globe — bigger, fluid, bleeds outside */}
        <div style={{
          flex: '1 1 58%', position: 'relative', overflow: 'visible',
          minHeight: '520px', maxHeight: '680px',
          background: 'transparent', border: 'none', outline: 'none',
          zIndex: 1, isolation: 'isolate',
          marginLeft: '-10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {/* Globe glow — circular, extends beyond container */}
          <div style={{
            position: 'absolute',
            width: '160%', height: '160%',
            top: '-30%', left: '-30%',
            background: 'radial-gradient(circle, rgba(168,85,247,0.25) 0%, rgba(217,70,239,0.12) 30%, rgba(236,72,153,0.06) 50%, transparent 70%)',
            borderRadius: '50%', pointerEvents: 'none', zIndex: -1,
            animation: 'globeGlow 5s ease-in-out infinite alternate'
          }} />

          <GlobeBoundary>
            <Suspense fallback={<div style={{ position: 'absolute', inset: 0 }} />}>
              <GlobeScene />
            </Suspense>
          </GlobeBoundary>

          {/* Floating labels */}
          <div style={{ position: 'absolute', inset: '-10%', pointerEvents: 'none', zIndex: 2 }}>
            {labels.slice(0, Math.min(labelIdx + 3, labels.length)).map((label, i) => {
              const pos = labelPositions[i % labelPositions.length]
              return (
                <div
                  key={`${label.text}-${i}`}
                  style={{
                    position: 'absolute',
                    left: `${pos.x}%`, top: `${pos.y}%`,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.62rem',
                    padding: '3px 9px',
                    borderRadius: 7,
                    whiteSpace: 'nowrap',
                    opacity: 0,
                    animation: 'labelPulse 6s ease-in-out forwards',
                    backdropFilter: 'blur(8px)',
                    color: label.type === 'price' ? '#10b981' :
                           label.type === 'endpoint' ? '#a855f7' :
                           label.type === 'network' ? '#06b6d4' : '#d946ef',
                    background: label.type === 'price' ? 'rgba(16,185,129,0.12)' :
                                label.type === 'endpoint' ? 'rgba(168,85,247,0.12)' :
                                label.type === 'network' ? 'rgba(6,182,212,0.12)' : 'rgba(217,70,239,0.12)',
                    border: `1px solid ${label.type === 'price' ? 'rgba(16,185,129,0.25)' :
                              label.type === 'endpoint' ? 'rgba(168,85,247,0.25)' :
                              label.type === 'network' ? 'rgba(6,182,212,0.25)' : 'rgba(217,70,239,0.25)'}`
                  }}
                >
                  {label.text}
                </div>
              )
            })}
          </div>
        </div>
        </div>
      </div>

      <style>{`
        @keyframes globeGlow {
          0% { opacity: 0.5; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes labelPulse {
          0% { opacity: 0; transform: translateY(8px); }
          12% { opacity: 1; transform: translateY(0); }
          88% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-8px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .hero-terminal:hover {
          border-color: rgba(168,85,247,0.45) !important;
          box-shadow: 0 0 20px rgba(168,85,247,0.15);
        }
        @media (max-width: 768px) {
          #hero .hero-row { flex-direction: column !important; gap: 24px !important; margin-top: -10px !important; }
          #hero .hero-row > div { flex: none !important; width: 100% !important; margin-left: 0 !important; }
          #hero .hero-row > div:last-child { min-height: 340px !important; max-height: 400px !important; }
          #hero .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .hero-terminal { width: 100% !important; justify-content: center !important; }
        }
      `}</style>
    </section>
  )
}

export default Hero
