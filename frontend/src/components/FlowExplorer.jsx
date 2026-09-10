import React, { useEffect, useMemo, useRef, useState, Suspense } from 'react'
import { STAGES } from './flowStages'

const FlowScene = React.lazy(() => import('./FlowScene'))
const API_BASE = 'https://34-156-149-38.sslip.io/aetherapi'

class FlowBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { crashed: false }
  }
  static getDerivedStateFromError() {
    return { crashed: true }
  }
  componentDidCatch(err) {
    if (typeof console !== 'undefined') console.error('[AETHERIUS] flow explorer crashed:', err)
  }
  render() {
    if (this.state.crashed) {
      return (
        <div style={{
          position: 'absolute', inset: '15%',
          background: 'radial-gradient(ellipse, rgba(168,85,247,0.25) 0%, transparent 70%)',
          borderRadius: '50%'
        }} />
      )
    }
    return this.props.children
  }
}

const STAGE_COPY = [
  { title: 'The Agent', desc: 'An autonomous process with a wallet and a job. No signup, no session — it discovers a route and asks for data.' },
  { title: 'The Challenge', desc: 'The API answers 402 with machine-readable terms: price, currency, network, payee. The handshake, not a paywall.' },
  { title: 'The Signature', desc: 'The agent signs a USDC authorization (EIP-3009). Single-use nonce, expiry, exact amount — replay-proof by construction.' },
  { title: 'The Settlement', desc: 'The facilitator verifies and settles on Base. Sub-second finality, sub-cent cost. Math, not trust.' },
  { title: 'The Data', desc: '200 OK with exactly what was requested. Payment and delivery correlated at the HTTP boundary.' },
]

async function fetchStage(i, signal) {
  const get = async (path, headers) => {
    const r = await fetch(`${API_BASE}${path}`, { headers, signal })
    const text = await r.text()
    let body
    try { body = JSON.stringify(JSON.parse(text), null, 2).slice(0, 2000) }
    catch { body = text.slice(0, 2000) }
    return `${r.status} ${r.statusText}\n${body}`
  }
  switch (i) {
    case 0: return get('/v1/telemetry')
    case 1: return get('/v1/data/uuid')
    case 2: return get('/v1/x402/gas')
    case 3: return get('/v1/x402/market-pulse')
    case 4: return get('/v1/data/uuid', { 'X-PAYMENT': `flow-explorer-demo-${Date.now()}` })
    default: return ''
  }
}

function FlowExplorer() {
  const sectionRef = useRef(null)
  const [selected, setSelected] = useState(1)
  const [stageData, setStageData] = useState('Select a stage — live data loads here.')
  const [loading, setLoading] = useState(false)
  const [running, setRunning] = useState(false)
  const [visible, setVisible] = useState(true)
  const [log, setLog] = useState([])
  const flow = useMemo(() => ({ explode: 0, active: false, hover: -1 }), [])
  const abortRef = useRef(null)

  // Scroll-driven explode (writes straight into the mutable flow object — no re-renders)
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const el = sectionRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight
      const progress = 1 - Math.min(Math.max((rect.bottom - vh * 0.15) / (rect.height + vh * 0.5), 0), 1)
      flow.explode += (progress - flow.explode) * 0.12
      if (Math.abs(progress - flow.explode) > 0.0005) {
        raf = requestAnimationFrame(update)
      }
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(update) }
    kick()
    window.addEventListener('scroll', kick, { passive: true })
    window.addEventListener('resize', kick)
    return () => {
      window.removeEventListener('scroll', kick)
      window.removeEventListener('resize', kick)
      cancelAnimationFrame(raf)
    }
  }, [flow])

  // Pause rendering offscreen (two WebGL canvases share the page with the hero globe)
  useEffect(() => {
    const el = sectionRef.current
    if (!el || !('IntersectionObserver' in window)) return
    const obs = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.02 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Load live data on stage select
  useEffect(() => {
    if (abortRef.current) abortRef.current.abort()
    const ctl = new AbortController()
    abortRef.current = ctl
    setLoading(true)
    fetchStage(selected, ctl.signal)
      .then(d => { if (!ctl.signal.aborted) { setStageData(d); setLoading(false) } })
      .catch(() => { if (!ctl.signal.aborted) { setStageData('Request failed — the API may be unreachable. Retry in a minute.'); setLoading(false) } })
    return () => ctl.abort()
  }, [selected])

  const runLoop = async () => {
    if (running) return
    setRunning(true)
    setLog([])
    flow.active = true
    const say = (line) => setLog(l => [...l, line])
    try {
      setSelected(1)
      say('→ GET /v1/data/uuid (no payment)')
      const t0 = performance.now()
      const r1 = await fetch(`${API_BASE}/v1/data/uuid`)
      const c1 = await r1.json().catch(() => ({}))
      say(`← 402 · ${Math.round(performance.now() - t0)}ms · $${c1.amount || c1.price || '?'} ${c1.currency || 'USDC'} → ${STAGES[1].label}`)
      await new Promise(r => setTimeout(r, 650))
      setSelected(2)
      say('✍ EIP-3009 authorization signed (single-use nonce, expiry)')
      await new Promise(r => setTimeout(r, 650))
      setSelected(3)
      say('→ retry + X-PAYMENT · facilitator settles on Base')
      const t2 = performance.now()
      const r2 = await fetch(`${API_BASE}/v1/data/uuid`, { headers: { 'X-PAYMENT': `flow-explorer-loop-${Date.now()}` } })
      const d2 = await r2.json().catch(() => ({}))
      say(`← 200 · ${Math.round(performance.now() - t2)}ms · settled${r2.headers.get('X-PAYMENT-SETTLED') ? ' ✓' : ' (simulated)'}`)
      await new Promise(r => setTimeout(r, 450))
      setSelected(4)
      say(`✓ uuid ${d2.uuid || d2.data?.uuid || 'delivered'} — agent got exactly what it paid for`)
    } catch (e) {
      say(`✕ ${e.message}`)
    }
    setRunning(false)
    setTimeout(() => { flow.active = false }, 2500)
  }

  return (
    <section id="flow" data-animate style={{ textAlign: 'center', overflow: 'visible' }}>
      <div className="inner">
        <div className="section-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><circle cx="5" cy="12" r="2.5" strokeLinejoin="round" strokeLinecap="round"/><circle cx="19" cy="6" r="2.5" strokeLinejoin="round" strokeLinecap="round"/><circle cx="19" cy="18" r="2.5" strokeLinejoin="round" strokeLinecap="round"/><path d="M7.3 10.8l9.4-3.6M7.3 13.2l9.4 3.6" strokeLinejoin="round" strokeLinecap="round"/></svg>
          Flow Explorer
        </div>
        <h2 className="section-title">Pull the loop <span className="grad">apart.</span></h2>
        <p className="section-desc" style={{ margin: '0 auto' }}>
          The x402 payment loop as an exploded system — five stages, live against mainnet.
          Scroll to separate it, click a stage to inspect real data, run the loop to watch value move.
        </p>

        <div data-animate-card className="glass-card" style={{ marginTop: 48, overflow: 'hidden', textAlign: 'left' }}>
          <div className="flow-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', minHeight: 520 }}>
            <div ref={sectionRef} style={{ position: 'relative', minHeight: 420, overflow: 'visible' }}>
              <FlowBoundary>
                <Suspense fallback={<div style={{ position: 'absolute', inset: '20%', background: 'radial-gradient(ellipse, rgba(168,85,247,0.2) 0%, transparent 70%)' }} />}>
                  <FlowScene flow={flow} selected={selected} onSelect={setSelected} frameloop={visible ? 'always' : 'never'} />
                </Suspense>
              </FlowBoundary>
              <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6, pointerEvents: 'none' }}>
                {STAGES.map((s, i) => (
                  <span key={s.id} style={{ width: 26, height: 4, borderRadius: 2, background: selected === i ? s.color : 'rgba(255,255,255,0.12)', transition: 'background 0.3s', boxShadow: selected === i ? `0 0 8px ${s.color}` : 'none' }} />
                ))}
              </div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', padding: '28px 26px', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: STAGES[selected].color, boxShadow: `0 0 10px ${STAGES[selected].color}` }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{STAGE_COPY[selected].title}</h3>
              </div>
              <p style={{ color: 'var(--text-sec)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 16 }}>{STAGE_COPY[selected].desc}</p>
              <div className="noscroll" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', lineHeight: 1.6, color: 'var(--text-sec)', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', maxHeight: 230, minHeight: 120, overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: 14 }}>
                {loading ? <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Loading live data…</span> : stageData}
              </div>
              {log.length > 0 && (
                <div className="noscroll" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', lineHeight: 1.7, color: 'var(--text)', background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.15)', borderRadius: 10, padding: '12px 14px', maxHeight: 150, overflowY: 'auto', marginBottom: 14 }}>
                  {log.map((l, i) => <div key={i}>{l}</div>)}
                </div>
              )}
              <button onClick={runLoop} disabled={running} className="btn btn-primary" style={{ marginTop: 'auto', justifyContent: 'center', opacity: running ? 0.6 : 1 }}>
                {running ? 'Loop running…' : '▶ Run live loop'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 1024px) { #flow .flow-grid { grid-template-columns: 1fr !important; } #flow .flow-grid > div:last-child { border-left: none !important; border-top: 1px solid rgba(255,255,255,0.05); } }
      `}</style>
    </section>
  )
}

export default FlowExplorer
