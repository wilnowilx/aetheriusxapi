import { useState, useEffect, useMemo } from 'react';
import { apiFetch, fmtUptime } from './api';

/* === PULSE WAVE GRAPH — SVG line with glow === */
function PulseGraph({ data, color = '#a855f7', height = 60 }) {
  const points = useMemo(() => {
    if (!data || data.length === 0) return '';
    const mx = Math.max(...data, 1);
    const w = 100; // viewBox width
    const h = 100; // viewBox height
    const step = w / Math.max(data.length - 1, 1);
    return data.map((v, i) => {
      const x = i * step;
      const y = h - (v / mx) * (h * 0.85) - 5;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }, [data]);

  const fillPath = useMemo(() => {
    if (!points) return '';
    return points + ` L100,100 L0,100 Z`;
  }, [points]);

  if (!data || data.length === 0) return null;

  return (
    <div className="ae-pulse-graph" style={{ height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`pulse-grad-${color.replace('#','')}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="50%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id={`pulse-fill-${color.replace('#','')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Glow layer */}
        <path d={points} className="ae-pulse-glow" style={{ stroke: color, opacity: 0.15 }} />
        {/* Fill */}
        <path d={fillPath} fill={`url(#pulse-fill-${color.replace('#','')})`} />
        {/* Main line */}
        <path d={points} stroke={`url(#pulse-grad-${color.replace('#','')})`} fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

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

/* === Error/Loading states === */
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

/* ═══════════════════════════════════════════════════════════════════
   1. LIVE METRICS — full server dashboard (default)
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
        <div className="ae-metric-card"><span className="ae-metric-label">Wallets Seen</span><span className="ae-metric-value">{wallets.toLocaleString()}</span></div>
        <div className="ae-metric-card"><span className="ae-metric-label">Avg Latency</span><span className="ae-metric-value">{avg.toFixed(1)} ms</span></div>
      </div>
      {lat.length > 0 && (
        <div className="ae-latency-section">
          <span className="ae-section-title">Latency Pulse</span>
          <PulseGraph data={lat} color="#a855f7" height={60} />
        </div>
      )}
      <div className="ae-activity-section">
        <span className="ae-section-title">Recent Activity</span>
        <div className="ae-activity-list">
          {evts.length === 0 && <div className="ae-muted">No API calls yet — try Explorer.</div>}
          {evts.slice(0, 15).map((e, i) => (
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
   2. NETWORK HEALTH — latency, uptime, error rates, connection quality
   ═══════════════════════════════════════════════════════════════════ */
function NetworkHealth({ data }) {
  const T = data.totals || {};
  const uptime = fmtUptime(data.uptime_s);
  const avg = T.avg_latency_ms ?? 0;
  const calls = T.calls ?? 0;
  const err = T.errors ?? 0;
  const ok = T.ok_200 ?? 0;
  const lat = data.recent_latency_ms || [];
  const errRate = calls > 0 ? ((err / calls) * 100).toFixed(2) : '0.00';
  const okRate = calls > 0 ? ((ok / calls) * 100).toFixed(1) : '100.0';
  // Connection quality
  const quality = avg < 200 ? 'EXCELLENT' : avg < 500 ? 'GOOD' : avg < 1000 ? 'FAIR' : 'POOR';
  const qColor = avg < 200 ? '#22c55e' : avg < 500 ? '#00f0ff' : avg < 1000 ? '#f59e0b' : '#ef4444';

  return (
    <div className="ae-metrics">
      <div className="ae-metrics-status"><span className="ae-dot-on" /> LIVE · Network Health</div>
      {/* Big quality indicator */}
      <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
        <div style={{ fontSize: '2rem', fontWeight: 800, color: qColor, letterSpacing: '0.1em', fontFamily: 'JetBrains Mono, monospace' }}>{quality}</div>
        <div style={{ fontSize: '0.7rem', color: '#8a8a9a', letterSpacing: '0.08em' }}>CONNECTION QUALITY</div>
      </div>
      <div className="ae-metrics-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="ae-metric-card"><span className="ae-metric-label">Avg Latency</span><span className="ae-metric-value">{avg.toFixed(1)} ms</span></div>
        <div className="ae-metric-card"><span className="ae-metric-label">Uptime</span><span className="ae-metric-value">{uptime}</span></div>
        <div className="ae-metric-card"><span className="ae-metric-label">Error Rate</span><span className="ae-metric-value ae-red">{errRate}%</span></div>
        <div className="ae-metric-card"><span className="ae-metric-label">Success Rate</span><span className="ae-metric-value ae-green">{okRate}%</span></div>
        <div className="ae-metric-card"><span className="ae-metric-label">Total Calls</span><span className="ae-metric-value">{calls.toLocaleString()}</span></div>
        <div className="ae-metric-card"><span className="ae-metric-label">Errors</span><span className="ae-metric-value ae-red">{err.toLocaleString()}</span></div>
      </div>
      {lat.length > 0 && (
        <div className="ae-latency-section">
          <span className="ae-section-title">Latency Waveform</span>
          <PulseGraph data={lat} color="#22d3ee" height={60} />
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   3. DEFI INTEL — volume, USDC flow, challenges, payment success
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
  // Filter events that involve 402 challenges
  const paidEvts = evts.filter(e => e.status === 402);

  return (
    <div className="ae-metrics">
      <div className="ae-metrics-status"><span className="ae-dot-on" /> LIVE · DeFi Intel</div>
      {/* Big volume display */}
      <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b', fontFamily: 'JetBrains Mono, monospace' }}>${vol.toFixed(4)}</div>
        <div style={{ fontSize: '0.7rem', color: '#8a8a9a', letterSpacing: '0.08em' }}>TOTAL USDC VOLUME</div>
      </div>
      <div className="ae-metrics-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="ae-metric-card"><span className="ae-metric-label">402 Challenges</span><span className="ae-metric-value ae-amber">{ch.toLocaleString()}</span></div>
        <div className="ae-metric-card"><span className="ae-metric-label">Payment Rate</span><span className="ae-metric-value ae-green">{payRate}%</span></div>
        <div className="ae-metric-card"><span className="ae-metric-label">Wallets Active</span><span className="ae-metric-value">{wallets.toLocaleString()}</span></div>
        <div className="ae-metric-card"><span className="ae-metric-label">200 OK</span><span className="ae-metric-value ae-green">{ok.toLocaleString()}</span></div>
        <div className="ae-metric-card"><span className="ae-metric-label">Total Volume</span><span className="ae-metric-value">${vol.toFixed(4)}</span></div>
        <div className="ae-metric-card"><span className="ae-metric-label">Avg/Challenge</span><span className="ae-metric-value">{ch > 0 ? (vol / ch).toFixed(4) : '$0.00'}</span></div>
      </div>
      {/* Recent 402 events */}
      <div className="ae-activity-section">
        <span className="ae-section-title">Recent x402 Payments</span>
        <div className="ae-activity-list">
          {paidEvts.length === 0 && <div className="ae-muted">No payment challenges recorded yet.</div>}
          {paidEvts.slice(0, 10).map((e, i) => (
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
   4. WALLET INTEL — wallets seen, recent calls, wallet activity
   ═══════════════════════════════════════════════════════════════════ */
function WalletIntel({ data }) {
  const wallets = data.wallets_seen ?? 0;
  const evts = data.recent_events || [];
  const calls = data.totals?.calls ?? 0;
  const vol = data.totals?.volume_usdc ?? 0;
  // Group events by route to show which endpoints wallets hit
  const routeMap = {};
  evts.forEach(e => {
    if (!routeMap[e.route]) routeMap[e.route] = { count: 0, totalMs: 0 };
    routeMap[e.route].count++;
    routeMap[e.route].totalMs += e.latency_ms;
  });
  const topRoutes = Object.entries(routeMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8);

  return (
    <div className="ae-metrics">
      <div className="ae-metrics-status"><span className="ae-dot-on" /> LIVE · Wallet Intel</div>
      {/* Big wallet count */}
      <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
        <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#d946ef', fontFamily: 'JetBrains Mono, monospace' }}>{wallets}</div>
        <div style={{ fontSize: '0.7rem', color: '#8a8a9a', letterSpacing: '0.08em' }}>UNIQUE WALLETS SEEN</div>
      </div>
      <div className="ae-metrics-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="ae-metric-card"><span className="ae-metric-label">Total Calls</span><span className="ae-metric-value">{calls.toLocaleString()}</span></div>
        <div className="ae-metric-card"><span className="ae-metric-label">Volume</span><span className="ae-metric-value">${vol.toFixed(4)}</span></div>
        <div className="ae-metric-card"><span className="ae-metric-label">Calls/Wallet</span><span className="ae-metric-value">{wallets > 0 ? (calls / wallets).toFixed(1) : '0'}</span></div>
      </div>
      {/* Top endpoints by wallet traffic */}
      <div className="ae-activity-section">
        <span className="ae-section-title">Top Endpoints by Traffic</span>
        <div className="ae-activity-list">
          {topRoutes.length === 0 && <div className="ae-muted">No traffic data yet.</div>}
          {topRoutes.map(([route, info], i) => (
            <div key={i} className="ae-activity-item">
              <span style={{ color: '#d946ef', fontWeight: 600, fontSize: '10px', minWidth: 20 }}>{info.count}×</span>
              <span className="ae-activity-route">{route}</span>
              <span className="ae-activity-latency">{(info.totalMs / info.count).toFixed(0)} ms avg</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   5. QUANTUMBRAIN — API patterns, agent behavior, route analysis
   ═══════════════════════════════════════════════════════════════════ */
function QuantumBrain({ data }) {
  const evts = data.recent_events || [];
  const calls = data.totals?.calls ?? 0;
  const err = data.totals?.errors ?? 0;
  const ok = data.totals?.ok_200 ?? 0;
  const ch = data.totals?.challenges_402 ?? 0;
  // Analyze patterns: status distribution, route frequency, latency buckets
  const statusDist = { '2xx': ok, '4xx': ch, '5xx': err };
  const lat = data.recent_latency_ms || [];
  const fast = lat.filter(v => v < 200).length;
  const medium = lat.filter(v => v >= 200 && v < 500).length;
  const slow = lat.filter(v => v >= 500).length;
  const latDist = { 'FAST <200ms': fast, 'MED 200-500ms': medium, 'SLOW 500ms+': slow };
  // Unique routes hit
  const routes = [...new Set(evts.map(e => e.route))];

  return (
    <div className="ae-metrics">
      <div className="ae-metrics-status"><span className="ae-dot-on" /> LIVE · QuantumXBrain</div>
      {/* Agent overview */}
      <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#d946ef', fontFamily: 'JetBrains Mono, monospace' }}>PATTERN ANALYSIS</div>
        <div style={{ fontSize: '0.7rem', color: '#8a8a9a', letterSpacing: '0.08em' }}>{routes.length} UNIQUE ROUTES · {calls} TOTAL REQUESTS</div>
      </div>
      {/* Status distribution */}
      <div className="ae-activity-section">
        <span className="ae-section-title">Status Distribution</span>
        <div style={{ display: 'flex', gap: 8, padding: '8px 16px' }}>
          {Object.entries(statusDist).map(([label, count]) => {
            const pct = calls > 0 ? (count / calls) * 100 : 0;
            const color = label === '2xx' ? '#22c55e' : label === '4xx' ? '#f59e0b' : '#ef4444';
            return (
              <div key={label} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace' }}>{count.toLocaleString()}</div>
                <div style={{ fontSize: '0.6rem', color: '#8a8a9a' }}>{label}</div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: '0.55rem', color: '#55556a', marginTop: 2 }}>{pct.toFixed(1)}%</div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Latency buckets */}
      <div className="ae-activity-section">
        <span className="ae-section-title">Latency Buckets</span>
        <div style={{ display: 'flex', gap: 8, padding: '8px 16px' }}>
          {Object.entries(latDist).map(([label, count]) => {
            const total = fast + medium + slow || 1;
            const pct = (count / total) * 100;
            const color = label.includes('FAST') ? '#22d3ee' : label.includes('MED') ? '#f59e0b' : '#ef4444';
            return (
              <div key={label} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace' }}>{count}</div>
                <div style={{ fontSize: '0.6rem', color: '#8a8a9a' }}>{label}</div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Routes hit */}
      <div className="ae-activity-section">
        <span className="ae-section-title">Active Routes ({routes.length})</span>
        <div className="ae-activity-list">
          {routes.slice(0, 10).map((r, i) => (
            <div key={i} className="ae-activity-item">
              <span style={{ color: '#d946ef', fontSize: '10px' }}>→</span>
              <span className="ae-activity-route">{r}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT — routes to sub-view
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
