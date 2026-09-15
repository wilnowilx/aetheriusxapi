import { useState, useEffect } from 'react';
import { apiFetch, fmtUptime } from './api';

/* Live Metrics — real server telemetry, auto-refreshes every 10s */
export default function MetricsWindow() {
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

  if (error && !data) return (
    <div className="ae-metrics ae-app-error">
      <span className="ae-app-error-icon">⊘</span>
      <p>{error}</p>
      <p className="ae-muted">Check VM status or set backend URL in Explorer.</p>
    </div>
  );

  if (!data) return <div className="ae-loading">Loading telemetry…</div>;

  const T = data.totals || {};
  const uptime = fmtUptime(data.uptime_s);
  const calls = T.calls ?? 0;
  const ok = T.ok_200 ?? 0;
  const challenges = T.challenges_402 ?? 0;
  const errors = T.errors ?? 0;
  const volume = T.volume_usdc ?? 0;
  const wallets = data.wallets_seen ?? 0;
  const avgLatency = T.avg_latency_ms ?? 0;
  const latencySamples = data.recent_latency_ms || [];
  const events = data.recent_events || [];

  const mx = Math.max(...latencySamples, 1);

  return (
    <div className="ae-metrics">
      {/* Status row */}
      <div className="ae-metrics-status">
        <span className="ae-dot-on" /> LIVE · VM Connected
      </div>

      {/* Grid of metric cards */}
      <div className="ae-metrics-grid">
        <div className="ae-metric-card">
          <span className="ae-metric-label">Uptime</span>
          <span className="ae-metric-value">{uptime}</span>
        </div>
        <div className="ae-metric-card">
          <span className="ae-metric-label">Total Calls</span>
          <span className="ae-metric-value">{calls.toLocaleString()}</span>
        </div>
        <div className="ae-metric-card">
          <span className="ae-metric-label">200 OK</span>
          <span className="ae-metric-value ae-green">{ok.toLocaleString()}</span>
        </div>
        <div className="ae-metric-card">
          <span className="ae-metric-label">402 Challenges</span>
          <span className="ae-metric-value ae-amber">{challenges.toLocaleString()}</span>
        </div>
        <div className="ae-metric-card">
          <span className="ae-metric-label">Errors</span>
          <span className="ae-metric-value ae-red">{errors.toLocaleString()}</span>
        </div>
        <div className="ae-metric-card">
          <span className="ae-metric-label">Volume</span>
          <span className="ae-metric-value">${volume.toFixed(4)}</span>
        </div>
        <div className="ae-metric-card">
          <span className="ae-metric-label">Wallets Seen</span>
          <span className="ae-metric-value">{wallets.toLocaleString()}</span>
        </div>
        <div className="ae-metric-card">
          <span className="ae-metric-label">Avg Latency</span>
          <span className="ae-metric-value">{avgLatency.toFixed(1)} ms</span>
        </div>
      </div>

      {/* Latency histogram */}
      {latencySamples.length > 0 && (
        <div className="ae-latency-section">
          <span className="ae-section-title">Latency Distribution</span>
          <div className="ae-latency-bars">
            {latencySamples.map((v, i) => (
              <div
                key={i}
                className="ae-latency-bar"
                style={{ height: `${Math.max(8, Math.round((v / mx) * 100))}%` }}
                title={`${v} ms`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent events */}
      <div className="ae-activity-section">
        <span className="ae-section-title">Recent Activity</span>
        <div className="ae-activity-list">
          {events.length === 0 && <div className="ae-muted">No API calls yet — try Explorer.</div>}
          {events.slice(0, 15).map((e, i) => (
            <div key={i} className="ae-activity-item">
              <span className={`ae-activity-status ${e.status < 300 ? 'ok' : e.status < 500 ? 'warn' : 'bad'}`}>
                {e.status}
              </span>
              <span className="ae-activity-route">{e.route}</span>
              <span className="ae-activity-latency">{e.latency_ms} ms</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
