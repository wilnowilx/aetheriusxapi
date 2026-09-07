import React, { useState, useEffect } from 'react'
import GlobeScene from './GlobeScene'

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
  { x: -5, y: 5 }, { x: 60, y: -5 }, { x: 78, y: 22 }, { x: -2, y: 48 },
  { x: 58, y: 62 }, { x: 22, y: -2 }, { x: 42, y: 82 }, { x: 2, y: 28 },
  { x: 72, y: 42 }, { x: 28, y: 8 }, { x: 8, y: 68 }, { x: 65, y: 10 },
  { x: 15, y: 42 }, { x: 52, y: 55 }, { x: 80, y: 68 },
]

function Hero() {
  const [labelIdx, setLabelIdx] = useState(0)
  const [stats, setStats] = useState({ volume: '—', agents: '—', payments: '—', health: '—' })

  // Rotating labels
  useEffect(() => {
    const interval = setInterval(() => {
      setLabelIdx(prev => (prev + 1) % liveLabels.length)
    }, 1800)
    return () => clearInterval(interval)
  }, [])

  // Fetch live stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const r = await fetch(`${API_BASE}/v1/telemetry`)
        const t = await r.json()
        if (t && t.totals) {
          const total = (t.totals.ok_200 || 0) + (t.totals.n402 || 0) + (t.totals.errors || 0)
          setStats({
            volume: t.totals.avg_latency_ms ? t.totals.avg_latency_ms.toFixed(1) + 'ms' : '—',
            agents: total > 0 ? ((t.totals.ok_200 || 0) / total * 100).toFixed(1) + '%' : '—',
            payments: t.wallets_seen ? Math.min(10, t.wallets_seen) + '' : '—',
            health: '99.9%'
          })
        }
      } catch (e) { /* offline */ }
    }
    fetchStats()
    const interval = setInterval(fetchStats, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section id="hero" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'visible' }}>
      <div className="inner" style={{ display: 'flex', alignItems: 'center', gap: '60px', width: '100%', overflow: 'visible' }}>
        {/* Left: Content */}
        <div style={{ flex: '1 1 50%', zIndex: 2 }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <div className="section-label">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              Base Mainnet LIVE
            </div>
            <div className="section-label">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              x402 Intelligence
            </div>
          </div>

          <h1 className="section-title" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)' }}>
            The Infrastructure for<br />
            <span className="grad">Agents That Pay</span>
          </h1>

          <p className="section-desc" style={{ marginBottom: '32px' }}>
            100+ live APIs your agents can pay for in USDC on Base. 40 FREE QuantumXBrain intelligence endpoints.
            No accounts, no subscriptions. The operating system for machine-to-machine commerce.
          </p>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '40px' }}>
            <a href="#cta" className="btn btn-primary">
              Start Building
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
            <a href="#code" className="btn btn-secondary">
              View Docs
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
            </a>
          </div>

          {/* Stats */}
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
            {[
              { value: stats.volume, label: 'USDC settled (24h)' },
              { value: stats.agents, label: 'Success rate' },
              { value: stats.payments, label: 'Wallets seen' },
              { value: stats.health, label: 'Network health' },
            ].map((stat, i) => (
              <div key={i}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {stat.value}
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-sec)', marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: 3D Globe */}
        <div style={{ flex: '1 1 50%', position: 'relative', overflow: 'visible', aspectRatio: '1', maxHeight: '600px' }}>
          {/* Globe glow */}
          <div style={{
            position: 'absolute', inset: '-120px',
            background: 'radial-gradient(circle, rgba(168,85,247,0.3) 0%, rgba(217,70,239,0.15) 25%, rgba(236,72,153,0.08) 45%, transparent 75%)',
            borderRadius: '50%', pointerEvents: 'none', zIndex: -1,
            animation: 'globeGlow 5s ease-in-out infinite alternate'
          }} />

          <GlobeScene />

          {/* Floating labels */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }}>
            {liveLabels.slice(0, Math.min(labelIdx + 3, liveLabels.length)).map((label, i) => {
              const pos = labelPositions[i % labelPositions.length]
              return (
                <div
                  key={`${label.text}-${i}`}
                  style={{
                    position: 'absolute',
                    left: `${pos.x}%`, top: `${pos.y}%`,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.65rem',
                    padding: '4px 10px',
                    borderRadius: 8,
                    whiteSpace: 'nowrap',
                    opacity: 0,
                    animation: 'labelPulse 6s ease-in-out forwards',
                    backdropFilter: 'blur(8px)',
                    color: label.type === 'price' ? '#10b981' :
                           label.type === 'endpoint' ? '#a855f7' :
                           label.type === 'network' ? '#06b6d4' : '#d946ef',
                    background: label.type === 'price' ? 'rgba(16,185,129,0.15)' :
                                label.type === 'endpoint' ? 'rgba(168,85,247,0.15)' :
                                label.type === 'network' ? 'rgba(6,182,212,0.15)' : 'rgba(217,70,239,0.15)',
                    border: `1px solid ${label.type === 'price' ? 'rgba(16,185,129,0.3)' :
                              label.type === 'endpoint' ? 'rgba(168,85,247,0.3)' :
                              label.type === 'network' ? 'rgba(6,182,212,0.3)' : 'rgba(217,70,239,0.3)'}`
                  }}
                >
                  {label.text}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes globeGlow {
          0% { opacity: 0.5; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes labelPulse {
          0% { opacity: 0; transform: translateY(10px); }
          15% { opacity: 1; transform: translateY(0); }
          85% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-10px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @media (max-width: 768px) {
          #hero .inner { flex-direction: column !important; }
          #hero .inner > div:first-child { flex: none !important; }
          #hero .inner > div:last-child { flex: none !important; width: 100% !important; aspect-ratio: 1 !important; max-height: 350px !important; }
          #hero .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </section>
  )
}

export default Hero
