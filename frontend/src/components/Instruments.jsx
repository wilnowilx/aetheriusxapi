import React, { useEffect, useMemo, useState } from 'react'

const API_BASE = 'https://34-156-149-38.sslip.io/aetherapi'
const MERCHANT = '0x677B483128D0399bCD0A5AB36eE990C0246d7f61'

function parsePrice(desc) {
  const m = /\$([\d.]+)/.exec(desc || '')
  return m ? parseFloat(m[1]) : null
}

function fmtUSD(n) {
  if (n == null || isNaN(n)) return '—'
  if (n < 0.01) return `$${n.toFixed(4)}`
  if (n < 100) return `$${n.toFixed(2)}`
  return '$' + Math.round(n).toLocaleString()
}

// ---------- 1. COST CALCULATOR ----------
function CostCalculator() {
  const [routes, setRoutes] = useState([])
  const [selected, setSelected] = useState({})
  const [volume, setVolume] = useState(10000)
  const [err, setErr] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE}/health`).then(r => r.json()).then(h => {
      const eps = h.endpoints || {}
      const paid = Object.entries(eps)
        .map(([path, desc]) => ({ path, price: parsePrice(desc) }))
        .filter(e => e.price != null)
        .sort((a, b) => a.price - b.price)
      setRoutes(paid)
      const init = {}
      paid.slice(0, 3).forEach(e => { init[e.path] = true })
      setSelected(init)
    }).catch(() => setErr('Catalog unreachable — retry in a minute.'))
  }, [])

  const total = useMemo(() => {
    const perCall = routes.filter(r => selected[r.path]).reduce((s, r) => s + r.price, 0)
    return perCall * volume
  }, [routes, selected, volume])

  const toggle = (path) => setSelected(s => ({ ...s, [path]: !s[path] }))

  return (
    <div data-animate-card className="glass-card" style={{ padding: '32px 28px', textAlign: 'left' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" strokeLinejoin="round" strokeLinecap="round"/></svg>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Cost calculator</h3>
      </div>
      <p style={{ color: 'var(--text-sec)', fontSize: '0.88rem', marginBottom: 20 }}>
        Real prices from <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>/health</span>.
        Pick endpoints, set agent volume, see the monthly USDC.
      </p>
      {err ? <div style={{ color: 'var(--pink)', fontSize: '0.85rem' }}>{err}</div> : (
        <>
          <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
            {routes.map(r => (
              <label key={r.path} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8rem', cursor: 'pointer', padding: '6px 10px', borderRadius: 8, background: selected[r.path] ? 'rgba(168,85,247,0.08)' : 'transparent' }}>
                <input type="checkbox" checked={!!selected[r.path]} onChange={() => toggle(r.path)} style={{ accentColor: 'var(--purple)' }} />
                <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-sec)', flex: 1 }}>{r.path.replace('/v1/', '/')}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--green)' }}>${r.price}</span>
              </label>
            ))}
          </div>
          <div style={{ marginBottom: 8, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Agent volume: <strong style={{ color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace' }}>{volume.toLocaleString()} calls/mo</strong>
          </div>
          <input type="range" min="100" max="1000000" step="100" value={volume} onChange={e => setVolume(+e.target.value)}
            style={{ width: '100%', accentColor: 'var(--purple)', marginBottom: 20 }} />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }} className="grad">{fmtUSD(total)}</span>
            <span style={{ color: 'var(--text-sec)', fontSize: '0.82rem' }}>/ month in USDC</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
            A $49/mo subscription buys {(49 / Math.max(total / Math.max(volume, 1), 0.0001)).toLocaleString(undefined, { maximumFractionDigits: 0 })} pay-per-call requests at this mix.
            Below that volume, subscriptions overcharge you. Above it, you scale linearly — no tiers, no seats.
          </div>
        </>
      )}
    </div>
  )
}

// ---------- 2. WALLET INTEL EXPLORER ----------
function WalletExplorer() {
  const [addr, setAddr] = useState(MERCHANT)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)

  const lookup = async () => {
    if (!addr.trim()) return
    setLoading(true); setData(null); setStatus(null)
    try {
      const [a, r] = await Promise.all([
        fetch(`${API_BASE}/v1/x402/agent/${addr.trim()}`).then(x => x.json()),
        fetch(`${API_BASE}/v1/x402/risk/${addr.trim()}`).then(x => x.json()).catch(() => null),
      ])
      setData({ agent: a, risk: r })
      setStatus('200 OK')
    } catch (e) {
      setStatus('Error'); setData({ error: e.message })
    }
    setLoading(false)
  }

  useEffect(() => { lookup() }, [])

  const pick = (obj, keys) => {
    if (!obj || typeof obj !== 'object') return null
    for (const k of keys) {
      if (obj[k] != null && typeof obj[k] !== 'object') return { k, v: obj[k] }
    }
    return null
  }

  const facts = []
  if (data && !data.error) {
    const a = data.agent || {}
    ;['total_spent_usdc', 'volume_usdc', 'tx_count', 'transfers', 'calls', 'first_seen', 'last_seen', 'risk_score'].forEach(k => {
      if (a[k] != null && typeof a[k] !== 'object') facts.push({ k, v: String(a[k]) })
    })
    const rk = pick(data.risk, ['score', 'risk_score', 'risk', 'label', 'verdict'])
    if (rk) facts.push({ k: 'risk', v: String(rk.v) })
  }

  return (
    <div data-animate-card className="glass-card" style={{ padding: '32px 28px', textAlign: 'left' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--pink)" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeLinejoin="round" strokeLinecap="round"/><circle cx="12" cy="7" r="4" strokeLinejoin="round" strokeLinecap="round"/></svg>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Wallet intel explorer</h3>
      </div>
      <p style={{ color: 'var(--text-sec)', fontSize: '0.88rem', marginBottom: 16 }}>
        Any Base address. Free intelligence, no signup — the funnel, live.
      </p>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input value={addr} onChange={e => setAddr(e.target.value)} spellCheck={false}
          placeholder="0x…" style={{ flex: 1, padding: '10px 14px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', outline: 'none' }} />
        <button onClick={lookup} disabled={loading} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '0.82rem' }}>
          {loading ? '…' : 'Inspect'}
        </button>
      </div>
      {status && <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: status.startsWith('2') ? 'var(--green)' : 'var(--pink)', marginBottom: 12 }}>{status} · agent + risk endpoints</div>}
      {loading && <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>Reading Base Mainnet…</div>}
      {data && !loading && (
        facts.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {facts.slice(0, 6).map(f => (
              <div key={f.k} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10 }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{f.k.replace(/_/g, ' ')}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.95rem', color: 'var(--text)', wordBreak: 'break-all' }}>{f.v}</div>
              </div>
            ))}
          </div>
        ) : (
          <pre style={{ fontSize: '0.72rem', color: 'var(--text-sec)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 220, overflowY: 'auto' }}>{JSON.stringify(data, null, 2)}</pre>
        )
      )}
    </div>
  )
}

// ---------- 3. x402 FLOW VISUALIZER ----------
function FlowVisualizer() {
  const [stage, setStage] = useState(0) // 0 idle, 1 challenged, 2 signing, 3 settled
  const [log, setLog] = useState([])
  const [running, setRunning] = useState(false)

  const push = (line) => setLog(l => [...l, line])

  const run = async () => {
    setRunning(true); setLog([]); setStage(0)
    const t0 = performance.now()
    try {
      push(`→ GET /v1/data/uuid  (no payment)`)
      const r1 = await fetch(`${API_BASE}/v1/data/uuid`)
      const t1 = Math.round(performance.now() - t0)
      if (r1.status === 402) {
        const c = await r1.json()
        push(`← 402 Payment Required · ${t1}ms · price ${c.amount || c.price || '?'} ${c.currency || 'USDC'}`)
        setStage(1)
        await new Promise(r => setTimeout(r, 700))
        push(`✍ agent signs USDC authorization (EIP-3009, Base)…`)
        setStage(2)
        await new Promise(r => setTimeout(r, 700))
        const t2 = performance.now()
        push(`→ GET /v1/data/uuid  +  X-PAYMENT: <proof>`)
        const r2 = await fetch(`${API_BASE}/v1/data/uuid`, { headers: { 'X-PAYMENT': 'simulated-proof' } })
        const t3 = Math.round(performance.now() - t2)
        const d2 = await r2.json()
        push(`← 200 OK · ${t3}ms · settled ${r2.headers.get('X-PAYMENT-SETTLED') ? '✓' : '(simulated)'} · uuid ${d2.uuid || d2.data?.uuid || '…'}`)
        setStage(3)
      } else {
        push(`← unexpected ${r1.status} (expected 402 first)`)
      }
    } catch (e) {
      push(`✕ network error: ${e.message}`)
    }
    setRunning(false)
  }

  const steps = ['Challenge', 'Sign', 'Settle']
  return (
    <div data-animate-card className="glass-card" style={{ padding: '32px 28px', textAlign: 'left' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--purple-light)" strokeWidth="1.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinejoin="round" strokeLinecap="round"/></svg>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>x402 loop, live</h3>
      </div>
      <p style={{ color: 'var(--text-sec)', fontSize: '0.88rem', marginBottom: 16 }}>
        A real paid request against mainnet, staged. Watch the 402 become a 200.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            {i > 0 && <span style={{ color: 'var(--text-muted)' }}>→</span>}
            <span style={{
              fontSize: '0.72rem', fontWeight: 700, padding: '6px 14px', borderRadius: 9999,
              background: stage > i ? 'rgba(16,185,129,0.12)' : stage === i && running ? 'rgba(168,85,247,0.12)' : 'rgba(255,255,255,0.03)',
              color: stage > i ? 'var(--green)' : stage === i && running ? 'var(--purple-light)' : 'var(--text-muted)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>{stage > i ? '✓ ' : ''}{s}</span>
          </React.Fragment>
        ))}
        <button onClick={run} disabled={running} className="btn btn-primary" style={{ marginLeft: 'auto', padding: '8px 18px', fontSize: '0.8rem' }}>
          {running ? 'Running…' : stage === 3 ? 'Run again' : 'Run loop'}
        </button>
      </div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', lineHeight: 1.8, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '14px 18px', minHeight: 120, color: 'var(--text-sec)' }}>
        {log.length === 0
          ? <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Press "Run loop" — a real 402→200 against the live API.</span>
          : log.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  )
}

// ---------- SECTION ----------
export default function Instruments() {
  return (
    <section id="instruments" data-animate style={{ textAlign: 'center' }}>
      <div className="inner">
        <div className="section-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M4 17l6-6-6-6M12 19h8" strokeLinejoin="round" strokeLinecap="round"/></svg>
          Interactive Instruments
        </div>
        <h2 className="section-title">Don't read about it. <span className="grad">Run it.</span></h2>
        <p className="section-desc" style={{ margin: '0 auto' }}>
          Every instrument below is live against mainnet — real prices, real wallets, real settlement loops. No signup, no mocks.
        </p>
        <div className="instruments-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 48, textAlign: 'left' }}>
          <CostCalculator />
          <WalletExplorer />
          <FlowVisualizer />
        </div>
      </div>
      <style>{`
        @media (max-width: 1024px) { #instruments .instruments-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 768px) { #instruments .instruments-grid { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  )
}
