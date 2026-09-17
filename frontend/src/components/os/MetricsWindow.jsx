import { useState, useEffect, useMemo } from 'react';
import { apiFetch, fmtUptime } from './api';
import WaveGraph from './WaveGraph';

/* === SHARED HOOK: fetch telemetry === */
function useTelemetry() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const { data: t } = await apiFetch('/v1/telemetry');
        if (alive) { setData(t); setError(null); }
      } catch (e) {
        if (alive) setError('VM unreachable');
      }
    }
    load();
    const iv = setInterval(load, 10000);
    return () => { alive = false; clearInterval(iv); };
  }, []);
  return { data, error };
}

function AppError({ error, hint }) {
  return (
    <div className="ae-metrics ae-app-error">
      <span className="ae-app-error-icon">⊘</span>
      <p>{error}</p>
      <p className="ae-muted">{hint || 'Check VM status.'}</p>
    </div>
  );
}

function Loading() {
  return <div className="ae-loading">Loading telemetry…</div>;
}

/* === Mini stat row for inline display === */
function MiniStat({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
      <span style={{ fontSize: 12, color: '#8a8a9a' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: color || 'var(--text)' }}>{value}</span>
    </div>
  );
}

/* === Progress bar === */
function ProgressBar({ value, max, color = '#a855f7' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)' }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   1. LIVE METRICS — full server dashboard
   ═══════════════════════════════════════════════════════════════════ */
function LiveMetrics({ data }) {
  const T = data.totals || {};
  const uptime = fmtUptime(data.uptime_s);
  const calls = T.calls ?? 0;
  const ok = T.ok_200 ?? 0;
  const ch = T.challenges_402 ?? 0;
  const err = T.errors ?? 0;
  const vol = T.volume_usdc ?? 0;
  const wallets = data.wallets_seen ?? 0;
  const avg = T.avg_latency_ms ?? 0;
  const lat = data.recent_latency_ms || [];
  const evts = data.recent_events || [];
  const errRate = calls > 0 ? ((err / calls) * 100).toFixed(2) : '0.00';
  const okRate = calls > 0 ? ((ok / calls) * 100).toFixed(1) : '100.0';

  return (
    <div className="ae-metrics">
      <div className="ae-metrics-status"><span className="ae-dot-on" /> LIVE · VM Connected</div>
      <div className="ae-metrics-grid">
        <div className="ae-metric-card"><span className="ae-metric-label">Uptime</span><span className="ae-metric-value">{uptime}</span></div>
        <div className="ae-metric-card"><span className="ae-metric-label">Total Calls</span><span className="ae-metric-value">{calls.toLocaleString()}</span></div>
        <div className="ae-metric-card"><span className="ae-metric-label">200 OK</span><span className="ae-metric-value ae-green">{ok.toLocaleString()}</span></div>
        <div className="ae-metric-card"><span className="ae-metric-label">402 Challenges</span><span className="ae-metric-value ae-amber">{ch.toLocaleString()}</span></div>
        <div className="ae-metric-card"><span className="ae-metric-label">Errors</span><span className="ae-metric-value ae-red">{err.toLocaleString()}</span></div>
        <div className="ae-metric-card"><span className="ae-metric-label">Volume</span><span className="ae-metric-value">${vol.toFixed(4)}</span></div>
        <div className="ae-metric-card"><span className="ae-metric-label">Wallets</span><span className="ae-metric-value">{wallets.toLocaleString()}</span></div>
        <div className="ae-metric-card"><span className="ae-metric-label">Avg Latency</span><span className="ae-metric-value">{avg.toFixed(1)} ms</span></div>
      </div>
      {/* Latency waveform */}
      {lat.length > 0 && (
        <div className="ae-latency-section">
          <span className="ae-section-title">Latency Pulse</span>
          <WaveGraph data={lat} color="#a855f7" secondaryColor="#d946ef" height={80} />
        </div>
      )}
      {/* Health breakdown */}
      <div className="ae-activity-section" style={{ marginTop: 14 }}>
        <span className="ae-section-title">Health</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 6, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, color: '#8a8a9a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Success Rate</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#22c55e', fontFamily: "'JetBrains Mono', monospace" }}>{okRate}%</div>
            <ProgressBar value={ok} max={calls} color="#22c55e" />
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 6, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, color: '#8a8a9a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Error Rate</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#ef4444', fontFamily: "'JetBrains Mono', monospace" }}>{errRate}%</div>
            <ProgressBar value={err} max={calls} color="#ef4444" />
          </div>
        </div>
      </div>
      {/* Recent activity */}
      <div className="ae-activity-section">
        <span className="ae-section-title">Recent Activity</span>
        <div className="ae-activity-list">
          {evts.length === 0 && <div className="ae-muted">No API calls yet — try Explorer.</div>}
          {evts.slice(0, 12).map((e, i) => (
            <div key={i} className="ae-activity-item">
              <span className={`ae-activity-status ${e.status < 300 ? 'ok' : e.status < 500 ? 'warn' : 'bad'}`}>{e.status}</span>
              <span className="ae-activity-route">{e.route}</span>
              <span className="ae-activity-latency">{e.latency_ms} ms</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   2. NETWORK HEALTH — quality indicator + waveform + diagnostics
   ═══════════════════════════════════════════════════════════════════ */
function NetworkHealth({ data }) {
  const T = data.totals || {};
  const uptime = fmtUptime(data.uptime_s);
  const avg = T.avg_latency_ms ?? 0;
  const calls = T.calls ?? 0;
  const err = T.errors ?? 0;
  const ok = T.ok_200 ?? 0;
  const ch = T.challenges_402 ?? 0;
  const lat = data.recent_latency_ms || [];
  const errRate = calls > 0 ? ((err / calls) * 100).toFixed(2) : '0.00';
  const okRate = calls > 0 ? ((ok / calls) * 100).toFixed(1) : '100.0';
  const quality = avg < 200 ? 'EXCELLENT' : avg < 500 ? 'GOOD' : avg < 1000 ? 'FAIR' : 'POOR';
  const qColor = avg < 200 ? '#22c55e' : avg < 500 ? '#00f0ff' : avg < 1000 ? '#f59e0b' : '#ef4444';
  const maxLat = lat.length > 0 ? Math.max(...lat) : 0;
  const minLat = lat.length > 0 ? Math.min(...lat) : 0;
  const p95 = lat.length > 0 ? lat.slice().sort((a, b) => a - b)[Math.floor(lat.length * 0.95)] || 0 : 0;

  return (
    <div className="ae-metrics">
      <div className="ae-metrics-status"><span className="ae-dot-on" /> LIVE · Network Health</div>
      {/* Quality hero */}
      <div style={{ textAlign: 'center', padding: '12px 0 6px' }}>
        <div style={{ fontSize: '2.6rem', fontWeight: 800, color: qColor, letterSpacing: '0.12em', fontFamily: "'JetBrains Mono', monospace", textShadow: `0 0 20px ${qColor}40` }}>{quality}</div>
        <div style={{ fontSize: 10, color: '#8a8a9a', letterSpacing: '0.1em' }}>CONNECTION QUALITY</div>
      </div>
      {/* Waveform */}
      {lat.length > 0 && (
        <div className="ae-latency-section">
          <span className="ae-section-title">Live Pulse</span>
          <WaveGraph data={lat} color="#22d3ee" secondaryColor="#0052FF" height={75} />
        </div>
      )}
      <div className="ae-metrics-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 10 }}>
        <div className="ae-metric-card"><span className="ae-metric-label">Avg Latency</span><span className="ae-metric-value">{avg.toFixed(1)} ms</span></div>
        <div className="ae-metric-card"><span className="ae-metric-label">Uptime</span><span className="ae-metric-value">{uptime}</span></div>
        <div className="ae-metric-card"><span className="ae-metric-label">Error Rate</span><span className="ae-metric-value ae-red">{errRate}%</span></div>
        <div className="ae-metric-card"><span className="ae-metric-label">Success Rate</span><span className="ae-metric-value ae-green">{okRate}%</span></div>
        <div className="ae-metric-card"><span className="ae-metric-label">Total Calls</span><span className="ae-metric-value">{calls.toLocaleString()}</span></div>
        <div className="ae-metric-card"><span className="ae-metric-label">Errors</span><span className="ae-metric-value ae-red">{err.toLocaleString()}</span></div>
      </div>
      {/* Latency diagnostics */}
      <div className="ae-activity-section">
        <span className="ae-section-title">Latency Diagnostics</span>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 6, padding: 10 }}>
          <MiniStat label="Minimum" value={`${minLat.toFixed(0)} ms`} color="#22c55e" />
          <MiniStat label="Average" value={`${avg.toFixed(1)} ms`} color="#22d3ee" />
          <MiniStat label="P95" value={`${p95.toFixed(0)} ms`} color="#f59e0b" />
          <MiniStat label="Maximum" value={`${maxLat.toFixed(0)} ms`} color="#ef4444" />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   3. DEFI INTEL — volume hero + payment flow + recent x402s
   ═══════════════════════════════════════════════════════════════════ */
function DefiIntel({ data }) {
  const T = data.totals || {};
  const vol = T.volume_usdc ?? 0;
  const ch = T.challenges_402 ?? 0;
  const ok = T.ok_200 ?? 0;
  const calls = T.calls ?? 0;
  const wallets = data.wallets_seen ?? 0;
  const evts = data.recent_events || [];
  const payRate = calls > 0 ? (((ok + ch) / calls) * 100).toFixed(1) : '0.0';
  const paidEvts = evts.filter(e => e.status === 402);
  const avgPerChallenge = ch > 0 ? vol / ch : 0;
  const lat = data.recent_latency_ms || [];

  return (
    <div className="ae-metrics">
      <div className="ae-metrics-status"><span className="ae-dot-on" /> LIVE · DeFi Intel</div>
      {/* Volume hero */}
      <div style={{ textAlign: 'center', padding: '12px 0 6px' }}>
        <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#f59e0b', fontFamily: "'JetBrains Mono', monospace", textShadow: '0 0 20px rgba(245,158,11,0.25)' }}>${vol.toFixed(4)}</div>
        <div style={{ fontSize: 10, color: '#8a8a9a', letterSpacing: '0.1em' }}>TOTAL USDC VOLUME</div>
      </div>
      {/* Payment flow waveform */}
      {lat.length > 0 && (
        <div className="ae-latency-section">
          <span className="ae-section-title">Request Flow</span>
          <WaveGraph data={lat} color="#f59e0b" secondaryColor="#d946ef" height={65} />
        </div>
      )}
      <div className="ae-metrics-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 10 }}>
        <div className="ae-metric-card"><span className="ae-metric-label">402 Challenges</span><span className="ae-metric-value ae-amber">{ch.toLocaleString()}</span></div>
        <div className="ae-metric-card"><span className="ae-metric-label">Payment Rate</span><span className="ae-metric-value ae-green">{payRate}%</span></div>
        <div className="ae-metric-card"><span className="ae-metric-label">Wallets Active</span><span className="ae-metric-value">{wallets.toLocaleString()}</span></div>
        <div className="ae-metric-card"><span className="ae-metric-label">200 OK</span><span className="ae-metric-value ae-green">{ok.toLocaleString()}</span></div>
        <div className="ae-metric-card"><span className="ae-metric-label">Avg/Challenge</span><span className="ae-metric-value">${avgPerChallenge.toFixed(4)}</span></div>
        <div className="ae-metric-card"><span className="ae-metric-label">Total Calls</span><span className="ae-metric-value">{calls.toLocaleString()}</span></div>
      </div>
      {/* Revenue breakdown */}
      <div className="ae-activity-section">
        <span className="ae-section-title">Revenue Breakdown</span>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 6, padding: 10 }}>
          <MiniStat label="Free (200 OK)" value={`${ok.toLocaleString()} calls`} color="#22c55e" />
          <MiniStat label="Paid (402)" value={`${ch.toLocaleString()} challenges`} color="#f59e0b" />
          <MiniStat label="Errors (5xx)" value={`${(data.totals?.errors ?? 0).toLocaleString()}`} color="#ef4444" />
          <MiniStat label="Revenue/Call" value={calls > 0 ? `$${(vol / calls).toFixed(6)}` : '$0.00'} color="#d946ef" />
        </div>
      </div>
      {/* Recent x402 events */}
      <div className="ae-activity-section">
        <span className="ae-section-title">Recent x402 Payments</span>
        <div className="ae-activity-list">
          {paidEvts.length === 0 && <div className="ae-muted">No payment challenges yet.</div>}
          {paidEvts.slice(0, 8).map((e, i) => (
            <div key={i} className="ae-activity-item">
              <span className="ae-activity-status warn">402</span>
              <span className="ae-activity-route">{e.route}</span>
              <span className="ae-activity-latency">{e.latency_ms} ms</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   4. WALLET INTEL — wallet count hero + traffic heatmap + top routes
   ═══════════════════════════════════════════════════════════════════ */
function WalletIntel({ data }) {
  const wallets = data.wallets_seen ?? 0;
  const evts = data.recent_events || [];
  const calls = data.totals?.calls ?? 0;
  const vol = data.totals?.volume_usdc ?? 0;
  const lat = data.recent_latency_ms || [];
  const routeMap = {};
  evts.forEach(e => {
    if (!routeMap[e.route]) routeMap[e.route] = { count: 0, totalMs: 0, statuses: [] };
    routeMap[e.route].count++;
    routeMap[e.route].totalMs += e.latency_ms;
    routeMap[e.route].statuses.push(e.status);
  });
  const topRoutes = Object.entries(routeMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10);
  const maxCount = topRoutes.length > 0 ? topRoutes[0][1].count : 1;

  return (
    <div className="ae-metrics">
      <div className="ae-metrics-status"><span className="ae-dot-on" /> LIVE · Wallet Intel</div>
      {/* Wallet count hero */}
      <div style={{ textAlign: 'center', padding: '12px 0 6px' }}>
        <div style={{ fontSize: '3rem', fontWeight: 800, color: '#d946ef', fontFamily: "'JetBrains Mono', monospace", textShadow: '0 0 20px rgba(217,70,239,0.25)' }}>{wallets}</div>
        <div style={{ fontSize: 10, color: '#8a8a9a', letterSpacing: '0.1em' }}>UNIQUE WALLETS</div>
      </div>
      {/* Traffic waveform */}
      {lat.length > 0 && (
        <div className="ae-latency-section">
          <span className="ae-section-title">Traffic Flow</span>
          <WaveGraph data={lat} color="#d946ef" secondaryColor="#a855f7" height={65} />
        </div>
      )}
      <div className="ae-metrics-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 10 }}>
        <div className="ae-metric-card"><span className="ae-metric-label">Total Calls</span><span className="ae-metric-value">{calls.toLocaleString()}</span></div>
        <div className="ae-metric-card"><span className="ae-metric-label">Volume</span><span className="ae-metric-value">${vol.toFixed(4)}</span></div>
        <div className="ae-metric-card"><span className="ae-metric-label">Calls/Wallet</span><span className="ae-metric-value">{wallets > 0 ? (calls / wallets).toFixed(1) : '0'}</span></div>
      </div>
      {/* Top endpoints as heatmap */}
      <div className="ae-activity-section">
        <span className="ae-section-title">Endpoint Traffic Heatmap</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {topRoutes.length === 0 && <div className="ae-muted">No traffic data yet.</div>}
          {topRoutes.map(([route, info], i) => (
            <div key={i} style={{ position: 'relative', overflow: 'hidden', borderRadius: 4, background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ position: 'absolute', inset: 0, width: `${(info.count / maxCount) * 100}%`, background: 'rgba(217,70,239,0.06)', transition: 'width 0.6s ease' }} />
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', fontSize: 12 }}>
                <span style={{ color: '#d946ef', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, minWidth: 24 }}>{info.count}×</span>
                <span style={{ flex: 1, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#c8c8d8' }}>{route}</span>
                <span style={{ fontSize: 10, color: '#8a8a9a' }}>{(info.totalMs / info.count).toFixed(0)} ms</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   5. QUANTUMBRAIN — pattern analysis + status pie + route graph
   ═══════════════════════════════════════════════════════════════════ */
function QuantumBrain({ data }) {
  const evts = data.recent_events || [];
  const calls = data.totals?.calls ?? 0;
  const err = data.totals?.errors ?? 0;
  const ok = data.totals?.ok_200 ?? 0;
  const ch = data.totals?.challenges_402 ?? 0;
  const lat = data.recent_latency_ms || [];
  const routes = [...new Set(evts.map(e => e.route))];
  const fast = lat.filter(v => v < 200).length;
  const medium = lat.filter(v => v >= 200 && v < 500).length;
  const slow = lat.filter(v => v >= 500).length;
  const total = fast + medium + slow || 1;

  return (
    <div className="ae-metrics">
      <div className="ae-metrics-status"><span className="ae-dot-on" /> LIVE · QuantumXBrain</div>
      {/* Overview */}
      <div style={{ textAlign: 'center', padding: '10px 0 4px' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d946ef', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em' }}>NEURAL PATTERN</div>
        <div style={{ fontSize: 10, color: '#8a8a9a', letterSpacing: '0.08em' }}>{routes.length} ROUTES · {calls.toLocaleString()} REQUESTS</div>
      </div>
      {/* Latency waveform */}
      {lat.length > 0 && (
        <div className="ae-latency-section">
          <span className="ae-section-title">Neural Signal</span>
          <WaveGraph data={lat} color="#d946ef" secondaryColor="#ec4899" height={70} />
        </div>
      )}
      {/* Status distribution with bars */}
      <div className="ae-activity-section">
        <span className="ae-section-title">Status Distribution</span>
        <div style={{ display: 'flex', gap: 6, padding: '6px 0' }}>
          {[{ label: '2xx', count: ok, color: '#22c55e' }, { label: '4xx', count: ch, color: '#f59e0b' }, { label: '5xx', count: err, color: '#ef4444' }].map(s => {
            const pct = calls > 0 ? (s.count / calls) * 100 : 0;
            return (
              <div key={s.label} style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 6, padding: '10px 8px' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.count.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: '#8a8a9a', marginBottom: 4 }}>{s.label}</div>
                <ProgressBar value={s.count} max={calls} color={s.color} />
                <div style={{ fontSize: 8, color: '#55556a', marginTop: 2 }}>{pct.toFixed(1)}%</div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Latency buckets */}
      <div className="ae-activity-section">
        <span className="ae-section-title">Latency Buckets</span>
        <div style={{ display: 'flex', gap: 6, padding: '6px 0' }}>
          {[{ label: '<200ms', count: fast, color: '#22d3ee' }, { label: '200-500ms', count: medium, color: '#f59e0b' }, { label: '500ms+', count: slow, color: '#ef4444' }].map(b => (
            <div key={b.label} style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 6, padding: '10px 8px' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: b.color, fontFamily: "'JetBrains Mono', monospace" }}>{b.count}</div>
              <div style={{ fontSize: 10, color: '#8a8a9a', marginBottom: 4 }}>{b.label}</div>
              <ProgressBar value={b.count} max={total} color={b.color} />
            </div>
          ))}
        </div>
      </div>
      {/* Active routes */}
      <div className="ae-activity-section">
        <span className="ae-section-title">Active Neural Routes ({routes.length})</span>
        <div className="ae-activity-list">
          {routes.slice(0, 8).map((r, i) => (
            <div key={i} className="ae-activity-item">
              <span style={{ color: '#d946ef', fontSize: 9, fontWeight: 600 }}>→</span>
              <span className="ae-activity-route">{r}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════════════════ */
export default function MetricsWindow({ sub }) {
  const { data, error } = useTelemetry();
  if (error && !data) return <AppError error={error} hint="Check VM status or set backend URL in Explorer." />;
  if (!data) return <Loading />;
  switch (sub) {
    case 'network': return <NetworkHealth data={data} />;
    case 'defi':    return <DefiIntel data={data} />;
    case 'wallet':  return <WalletIntel data={data} />;
    case 'brain':   return <QuantumBrain data={data} />;
    default:        return <LiveMetrics data={data} />;
  }
}
